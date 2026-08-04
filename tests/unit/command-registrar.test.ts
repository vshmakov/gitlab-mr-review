import { GitLabCommandRegistrar } from '../../src/domain/service/GitLabCommandRegistrar';

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
	const documents = { activeDocument: null as { languageId: string } | null };
	const comments = { addComment: jest.fn() };
	const treeProvider = { refresh: jest.fn(), refreshFile: jest.fn(), refreshMR: jest.fn() };
	const auth = { authenticate: jest.fn(), logout: jest.fn() };
	const fileOpener = { openMergeRequest: jest.fn(), openFilePatch: jest.fn() };
	const clientFactory = { create: jest.fn(), clear: jest.fn() };
	const store = {
		refresh: jest.fn(),
		reviewed: { markAsReviewed: jest.fn(), unmarkAsReviewed: jest.fn() },
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
		expect(mocks.notifier.showInfo).toHaveBeenCalledWith('Marked as reviewed: src/a.ts');
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
		expect(mocks.notifier.showInfo).toHaveBeenCalledWith('Marked as unreviewed: src/a.ts');
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
});