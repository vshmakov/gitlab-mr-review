import { GitLabCommandRegistrar } from '../../../../src/domain/service/GitLabCommandRegistrar';

function createMocks(): any {
	const handlers: Record<string, Function> = {};
	const commands = {
		register: jest.fn((name: string, handler: Function) => {
			handlers[name] = handler;
			return { dispose: jest.fn() };
		}),
		execute: jest.fn(),
	};
	const notifier = { showError: jest.fn(), showInfo: jest.fn(), showWarning: jest.fn() };
	const input = { showInputBox: jest.fn(), showWarningMessage: jest.fn() };
	const documents = { activeDocument: null as { languageId: string } | null, activeCursorLine: null };
	const comments = { addComment: jest.fn(), findCommentableLine: jest.fn(), getContext: jest.fn() };
	const treeProvider = { refresh: jest.fn(), refreshFile: jest.fn(), refreshMR: jest.fn() };
	const auth = { authenticate: jest.fn(), logout: jest.fn() };
	const fileOpener = { openMergeRequest: jest.fn(), openFilePatch: jest.fn() };
	const clientFactory = { create: jest.fn(), clear: jest.fn(), createNoteClient: jest.fn() };
	const store = {
		refresh: jest.fn(),
		reviewed: { markAsReviewed: jest.fn(), unmarkAsReviewed: jest.fn(), isReviewed: jest.fn() },
	};
	const reviewedPersistence = { save: jest.fn() };
	return { commands, handlers, notifier, input, documents, comments, treeProvider, auth, fileOpener, clientFactory, store, reviewedPersistence };
}

describe('GitLabCommandRegistrar', () => {
	it('register returns disposables', () => {
		const mocks = createMocks();
		const registrar = new GitLabCommandRegistrar(
			mocks.commands, mocks.notifier, mocks.input, mocks.documents,
			mocks.comments, mocks.treeProvider, mocks.auth, mocks.fileOpener,
			mocks.clientFactory, mocks.store, mocks.reviewedPersistence,
		);
		const disposables = registrar.register();
		expect(disposables.length).toBe(9);
	});

	it('approve shows error when item is undefined', async () => {
		const mocks = createMocks();
		new GitLabCommandRegistrar(
			mocks.commands, mocks.notifier, mocks.input, mocks.documents,
			mocks.comments, mocks.treeProvider, mocks.auth, mocks.fileOpener,
			mocks.clientFactory, mocks.store, mocks.reviewedPersistence,
		).register();
		await mocks.handlers['gitlabMrReview.approve'](undefined);
		expect(mocks.notifier.showError).toHaveBeenCalledWith('No MR selected');
	});

	it('markAsReviewed shows warning when item is undefined', async () => {
		const mocks = createMocks();
		new GitLabCommandRegistrar(
			mocks.commands, mocks.notifier, mocks.input, mocks.documents,
			mocks.comments, mocks.treeProvider, mocks.auth, mocks.fileOpener,
			mocks.clientFactory, mocks.store, mocks.reviewedPersistence,
		).register();
		await mocks.handlers['gitlabMrReview.markAsReviewed'](undefined);
		expect(mocks.notifier.showWarning).toHaveBeenCalledWith('No file selected');
	});

	it('unmarkAsReviewed shows warning when item is undefined', async () => {
		const mocks = createMocks();
		new GitLabCommandRegistrar(
			mocks.commands, mocks.notifier, mocks.input, mocks.documents,
			mocks.comments, mocks.treeProvider, mocks.auth, mocks.fileOpener,
			mocks.clientFactory, mocks.store, mocks.reviewedPersistence,
		).register();
		await mocks.handlers['gitlabMrReview.unmarkAsReviewed'](undefined);
		expect(mocks.notifier.showWarning).toHaveBeenCalledWith('No file selected');
	});

	it('markAsReviewed calls store and persistence', async () => {
		const mocks = createMocks();
		new GitLabCommandRegistrar(
			mocks.commands, mocks.notifier, mocks.input, mocks.documents,
			mocks.comments, mocks.treeProvider, mocks.auth, mocks.fileOpener,
			mocks.clientFactory, mocks.store, mocks.reviewedPersistence,
		).register();
		const item = { mergeRequest: { id: 1, iid: 1 }, file: { path: 'src/a.ts' } };
		await mocks.handlers['gitlabMrReview.markAsReviewed'](item);

		expect(mocks.store.reviewed.markAsReviewed).toHaveBeenCalled();
		expect(mocks.reviewedPersistence.save).toHaveBeenCalled();
		expect(mocks.notifier.showInfo).toHaveBeenCalledWith('Marked as reviewed: a.ts');
		expect(mocks.treeProvider.refreshFile).toHaveBeenCalledWith(item);
	});

	it('unmarkAsReviewed calls store and persistence', async () => {
		const mocks = createMocks();
		new GitLabCommandRegistrar(
			mocks.commands, mocks.notifier, mocks.input, mocks.documents,
			mocks.comments, mocks.treeProvider, mocks.auth, mocks.fileOpener,
			mocks.clientFactory, mocks.store, mocks.reviewedPersistence,
		).register();
		const item = { mergeRequest: { id: 1, iid: 1 }, file: { path: 'src/a.ts' } };
		await mocks.handlers['gitlabMrReview.unmarkAsReviewed'](item);

		expect(mocks.store.reviewed.unmarkAsReviewed).toHaveBeenCalled();
		expect(mocks.reviewedPersistence.save).toHaveBeenCalled();
		expect(mocks.notifier.showInfo).toHaveBeenCalledWith('Marked as unreviewed: a.ts');
	});

	it('addComment shows warning when no active document', async () => {
		const mocks = createMocks();
		new GitLabCommandRegistrar(
			mocks.commands, mocks.notifier, mocks.input, mocks.documents,
			mocks.comments, mocks.treeProvider, mocks.auth, mocks.fileOpener,
			mocks.clientFactory, mocks.store, mocks.reviewedPersistence,
		).register();
		await mocks.handlers['gitlabMrReview.addComment']();
		expect(mocks.notifier.showWarning).toHaveBeenCalledWith('Нет активного редактора');
	});

	it('addComment shows warning when document is not diff', async () => {
		const mocks = createMocks();
		mocks.documents.activeDocument = { languageId: 'typescript' };
		new GitLabCommandRegistrar(
			mocks.commands, mocks.notifier, mocks.input, mocks.documents,
			mocks.comments, mocks.treeProvider, mocks.auth, mocks.fileOpener,
			mocks.clientFactory, mocks.store, mocks.reviewedPersistence,
		).register();
		await mocks.handlers['gitlabMrReview.addComment']();
		expect(mocks.notifier.showWarning).toHaveBeenCalledWith('Комментирование доступно только в дифф-файлах');
	});

	it('addComment returns when input is cancelled', async () => {
		const mocks = createMocks();
		mocks.documents.activeDocument = { languageId: 'diff' };
		mocks.input.showInputBox.mockResolvedValue(undefined);
		new GitLabCommandRegistrar(
			mocks.commands, mocks.notifier, mocks.input, mocks.documents,
			mocks.comments, mocks.treeProvider, mocks.auth, mocks.fileOpener,
			mocks.clientFactory, mocks.store, mocks.reviewedPersistence,
		).register();
		await mocks.handlers['gitlabMrReview.addComment']();
		expect(mocks.comments.addComment).not.toHaveBeenCalled();
	});

	it('addComment uses findCommentableLine from cursor position', async () => {
		const mocks = createMocks();
		mocks.documents.activeDocument = { languageId: 'diff' };
		mocks.documents.activeCursorLine = 5;
		mocks.input.showInputBox.mockResolvedValue('comment');
		mocks.comments.findCommentableLine.mockReturnValue(0);
		mocks.comments.addComment.mockResolvedValue(true);
		mocks.comments.getContext.mockReturnValue({
			mergeRequest: { project_id: 10, iid: 5, baseSha: 'abc', startSha: 'def', headSha: 'ghi' },
			file: { path: 'a.ts', oldPath: 'a.ts', newPath: 'a.ts' },
			lines: [{ commentable: true, oldLine: 1, newLine: 2, documentLine: 3 }],
		});
		mocks.clientFactory.createNoteClient.mockResolvedValue({
			createDraftNote: jest.fn().mockResolvedValue({ id: 99 }),
		});
		new GitLabCommandRegistrar(
			mocks.commands, mocks.notifier, mocks.input, mocks.documents,
			mocks.comments, mocks.treeProvider, mocks.auth, mocks.fileOpener,
			mocks.clientFactory, mocks.store, mocks.reviewedPersistence,
		).register();
		await mocks.handlers['gitlabMrReview.addComment']();
		expect(mocks.comments.findCommentableLine).toHaveBeenCalledWith(
			mocks.documents.activeDocument, 5,
		);
		expect(mocks.comments.addComment).toHaveBeenCalledWith(
			mocks.documents.activeDocument, 0, 'comment',
		);
		expect(mocks.notifier.showInfo).toHaveBeenCalledWith('Комментарий добавлен');
	});

	it('addComment shows warning when no context', async () => {
		const mocks = createMocks();
		mocks.documents.activeDocument = { languageId: 'diff' };
		mocks.input.showInputBox.mockResolvedValue('comment');
		mocks.comments.findCommentableLine.mockReturnValue(0);
		mocks.comments.getContext.mockReturnValue(null);
		new GitLabCommandRegistrar(
			mocks.commands, mocks.notifier, mocks.input, mocks.documents,
			mocks.comments, mocks.treeProvider, mocks.auth, mocks.fileOpener,
			mocks.clientFactory, mocks.store, mocks.reviewedPersistence,
		).register();
		await mocks.handlers['gitlabMrReview.addComment']();
		expect(mocks.notifier.showWarning).toHaveBeenCalledWith('Нет контекста комментария');
	});

	it('addComment shows error when noteClient unavailable', async () => {
		const mocks = createMocks();
		mocks.documents.activeDocument = { languageId: 'diff' };
		mocks.input.showInputBox.mockResolvedValue('comment');
		mocks.comments.findCommentableLine.mockReturnValue(0);
		mocks.comments.getContext.mockReturnValue({
			mergeRequest: { project_id: 10, iid: 5 },
			file: { path: 'a.ts', oldPath: 'a.ts', newPath: 'a.ts' },
			lines: [{ commentable: true }],
		});
		mocks.clientFactory.createNoteClient.mockResolvedValue(undefined);
		new GitLabCommandRegistrar(
			mocks.commands, mocks.notifier, mocks.input, mocks.documents,
			mocks.comments, mocks.treeProvider, mocks.auth, mocks.fileOpener,
			mocks.clientFactory, mocks.store, mocks.reviewedPersistence,
		).register();
		await mocks.handlers['gitlabMrReview.addComment']();
		expect(mocks.notifier.showError).toHaveBeenCalledWith('Не удалось создать клиент GitLab');
	});

	
	it('addComment shows warning when no commentable line found', async () => {
		const mocks = createMocks();
		mocks.documents.activeDocument = { languageId: 'diff' };
		mocks.input.showInputBox.mockResolvedValue('comment');
		mocks.comments.findCommentableLine.mockReturnValue(null);
		new GitLabCommandRegistrar(
			mocks.commands, mocks.notifier, mocks.input, mocks.documents,
			mocks.comments, mocks.treeProvider, mocks.auth, mocks.fileOpener,
			mocks.clientFactory, mocks.store, mocks.reviewedPersistence,
		).register();
		await mocks.handlers['gitlabMrReview.addComment']();
		expect(mocks.notifier.showWarning).toHaveBeenCalledWith('Нет комментируемых строк рядом');
		expect(mocks.comments.addComment).not.toHaveBeenCalled();
	});

	it('refresh calls treeProvider refresh', async () => {
		const mocks = createMocks();
		new GitLabCommandRegistrar(
			mocks.commands, mocks.notifier, mocks.input, mocks.documents,
			mocks.comments, mocks.treeProvider, mocks.auth, mocks.fileOpener,
			mocks.clientFactory, mocks.store, mocks.reviewedPersistence,
		).register();
		await mocks.handlers['gitlabMrReview.refresh']();
		expect(mocks.treeProvider.refresh).toHaveBeenCalled();
	});

	it('openFilePatch opens first then marks as reviewed when file is not reviewed', async () => {
		const mocks = createMocks();
		mocks.store.reviewed.isReviewed.mockReturnValue(false);
		mocks.fileOpener.openFilePatch = jest.fn().mockResolvedValue(undefined);
		new GitLabCommandRegistrar(
			mocks.commands, mocks.notifier, mocks.input, mocks.documents,
			mocks.comments, mocks.treeProvider, mocks.auth, mocks.fileOpener,
			mocks.clientFactory, mocks.store, mocks.reviewedPersistence,
		).register();

		const item = { mergeRequest: { id: 1, iid: 5, project_id: 10 }, file: { path: 'src/a.ts' } };
		await mocks.handlers['gitlabMrReview.openFilePatch'](item);

		expect(mocks.fileOpener.openFilePatch).toHaveBeenCalledWith({ mergeRequest: item.mergeRequest, file: item.file });
		expect(mocks.store.reviewed.isReviewed).toHaveBeenCalledWith(
			item.mergeRequest, item.file,
		);
		expect(mocks.store.reviewed.markAsReviewed).toHaveBeenCalledWith(
			item.mergeRequest, item.file,
		);
		expect(mocks.reviewedPersistence.save).toHaveBeenCalledWith(mocks.store.reviewed);
		expect(mocks.notifier.showInfo).toHaveBeenCalledWith('Marked as reviewed: a.ts');
		expect(mocks.treeProvider.refreshFile).toHaveBeenCalledWith(item);
	});

	it('openFilePatch skips marking when file is already reviewed', async () => {
		const mocks = createMocks();
		mocks.store.reviewed.isReviewed.mockReturnValue(true);
		mocks.fileOpener.openFilePatch = jest.fn().mockResolvedValue(undefined);
		new GitLabCommandRegistrar(
			mocks.commands, mocks.notifier, mocks.input, mocks.documents,
			mocks.comments, mocks.treeProvider, mocks.auth, mocks.fileOpener,
			mocks.clientFactory, mocks.store, mocks.reviewedPersistence,
		).register();

		const item = { mergeRequest: { id: 1, iid: 5, project_id: 10 }, file: { path: 'src/a.ts' } };
		await mocks.handlers['gitlabMrReview.openFilePatch'](item);

		expect(mocks.store.reviewed.isReviewed).toHaveBeenCalledWith(
			item.mergeRequest, item.file,
		);
		expect(mocks.store.reviewed.markAsReviewed).not.toHaveBeenCalled();
		expect(mocks.reviewedPersistence.save).not.toHaveBeenCalled();
		expect(mocks.notifier.showInfo).not.toHaveBeenCalled();
		expect(mocks.treeProvider.refreshFile).not.toHaveBeenCalled();
		expect(mocks.fileOpener.openFilePatch).toHaveBeenCalledWith({ mergeRequest: item.mergeRequest, file: item.file });
	});

	it('openFilePatch opens without marking when mergeRequest is null', async () => {
		const mocks = createMocks();
		mocks.fileOpener.openFilePatch = jest.fn().mockResolvedValue(undefined);
		new GitLabCommandRegistrar(
			mocks.commands, mocks.notifier, mocks.input, mocks.documents,
			mocks.comments, mocks.treeProvider, mocks.auth, mocks.fileOpener,
			mocks.clientFactory, mocks.store, mocks.reviewedPersistence,
		).register();

		const item = { mergeRequest: null, file: { path: 'src/a.ts' } };
		await mocks.handlers['gitlabMrReview.openFilePatch'](item);

		expect(mocks.store.reviewed.isReviewed).not.toHaveBeenCalled();
		expect(mocks.store.reviewed.markAsReviewed).not.toHaveBeenCalled();
		expect(mocks.reviewedPersistence.save).not.toHaveBeenCalled();
		expect(mocks.notifier.showInfo).not.toHaveBeenCalled();
		expect(mocks.treeProvider.refreshFile).not.toHaveBeenCalled();
		expect(mocks.fileOpener.openFilePatch).toHaveBeenCalledWith({ mergeRequest: item.mergeRequest, file: item.file });
	});
});