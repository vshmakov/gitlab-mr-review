import { GitLabFileOpener } from '../../../../src/domain/service/GitLabFileOpener';
import { UnifiedDiffParser } from '../../../../src/domain/diff/unified-diff-parser';
import { Notifier } from '../../../../src/domain/interfaces/notifier';
import { DocumentService, TextDocument } from '../../../../src/domain/interfaces/document-service';
import { UriOpener } from '../../../../src/domain/interfaces/uri-opener';
import { CommentManager } from '../../../../src/domain/interfaces/comment-manager';

function createMockNotifier(): Notifier {
	return {
		showInfo: jest.fn(),
		showError: jest.fn(),
		showWarning: jest.fn(),
	};
}

function createMockDocumentService(): DocumentService {
	const doc: TextDocument = {
		uri: 'mock://diff',
		languageId: 'diff',
		fileName: 'diff',
		lineCount: 10,
		lineAt: () => ({ text: '' }),
	};

	return {
		activeDocument: null,
		activeCursorLine: null,
		openVirtualDocument: jest.fn().mockResolvedValue(doc),
		showDocument: jest.fn(),
		onDidCloseDocument: jest.fn().mockReturnValue({ dispose: jest.fn() }),
	};
}

function createMockUriOpener(): UriOpener {
	return {
		openExternal: jest.fn(),
	};
}

function createMockCommentManager(): CommentManager {
	return {
		setContext: jest.fn(),
		getContext: jest.fn(),
		onDocumentOpened: jest.fn(),
		findCommentableLine: jest.fn(),
		addComment: jest.fn().mockResolvedValue(false),
		dispose: jest.fn(),
	};
}

describe('GitLabFileOpener', () => {
	let opener: GitLabFileOpener;
	let notifier: ReturnType<typeof createMockNotifier>;
	let documents: ReturnType<typeof createMockDocumentService>;
	let uri: ReturnType<typeof createMockUriOpener>;
	let comments: ReturnType<typeof createMockCommentManager>;

	beforeEach(() => {
		notifier = createMockNotifier();
		documents = createMockDocumentService();
		uri = createMockUriOpener();
		comments = createMockCommentManager();
		opener = new GitLabFileOpener(uri, notifier, documents, new UnifiedDiffParser(), comments);
	});

	describe('openMergeRequest', () => {
		it('opens the MR web URL', async () => {
			const mr = { web_url: 'https://gitlab.example.com/group/project/-/merge_requests/42' };
			await opener.openMergeRequest(mr as any);

			expect(uri.openExternal).toHaveBeenCalledWith('https://gitlab.example.com/group/project/-/merge_requests/42');
		});
	});

	describe('openFilePatch', () => {
		it('opens a virtual diff document', async () => {
			const args = {
				mergeRequest: { id: 100, iid: 42, project_id: 10 },
				file: {
					path: 'src/app.ts',
					oldPath: 'src/app.ts',
					newPath: 'src/app.ts',
					diff: '@@ -1,2 +1,3 @@\n old\n+new\n kept',
					added: false,
					deleted: false,
					renamed: false,
				},
			};

			await opener.openFilePatch(args as any);

			expect(documents.openVirtualDocument).toHaveBeenCalled();
			expect(documents.showDocument).toHaveBeenCalled();
		});

		it('shows info when file has no diff', async () => {
			const args = {
				mergeRequest: { id: 100, iid: 42, project_id: 10 },
				file: {
					path: 'src/empty.ts',
					oldPath: 'src/empty.ts',
					newPath: 'src/empty.ts',
					diff: '',
					added: false,
					deleted: false,
					renamed: false,
				},
			};

			await opener.openFilePatch(args as any);

			expect(notifier.showInfo).toHaveBeenCalledWith(
				expect.stringContaining('патч отсутствует'),
			);
			expect(documents.openVirtualDocument).not.toHaveBeenCalled();
		});

		it('constructs proper diff content with headers', async () => {
			const args = {
				mergeRequest: { id: 100, iid: 42, project_id: 10 },
				file: {
					path: 'src/app.ts',
					oldPath: 'src/old.ts',
					newPath: 'src/app.ts',
					diff: '@@ -1 +1 @@\n old\n+new',
					added: false,
					deleted: false,
					renamed: true,
				},
			};

			await opener.openFilePatch(args as any);

			const callArgs = (documents.openVirtualDocument as jest.Mock).mock.calls[0];
			const content = callArgs[0];
			expect(content).toContain('diff --git a/src/old.ts b/src/app.ts');
			expect(content).toContain('--- a/src/old.ts');
			expect(content).toContain('+++ b/src/app.ts');
		});

		it('sets comment context when mergeRequest is present', async () => {
			const args = {
				mergeRequest: { id: 100, iid: 42, project_id: 10 },
				file: {
					path: 'src/app.ts',
					oldPath: 'src/app.ts',
					newPath: 'src/app.ts',
					diff: '@@ -1,2 +1,3 @@\n old\n+new\n kept',
					added: false,
					deleted: false,
					renamed: false,
				},
			};

			await opener.openFilePatch(args as any);

			expect(comments.setContext).toHaveBeenCalled();
			const ctx = (comments.setContext as jest.Mock).mock.calls[0][1];
			expect(ctx.mergeRequest.project_id).toBe(10);
			expect(ctx.mergeRequest.iid).toBe(42);
			expect(ctx.file.path).toBe('src/app.ts');
		});

		it('skips comment context when mergeRequest is null', async () => {
			const args = {
				mergeRequest: null,
				file: {
					path: 'src/app.ts',
					oldPath: 'src/app.ts',
					newPath: 'src/app.ts',
					diff: '@@ -1,2 +1,3 @@\n old\n+new\n kept',
					added: false,
					deleted: false,
					renamed: false,
				},
			};

			await opener.openFilePatch(args as any);

			expect(comments.setContext).not.toHaveBeenCalled();
		});
	});
});