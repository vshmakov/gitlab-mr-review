import { GitLabAuthenticationService } from '../../../../src/domain/service/GitLabAuthenticationService';
import { TOKEN_SECRET_KEY } from '../../../../src/domain/client/constants';

function createMocks(): any {
	const secrets = { get: jest.fn(), store: jest.fn(), delete: jest.fn() };
	const config = { get: jest.fn(), update: jest.fn() };
	const notifier = { showError: jest.fn(), showInfo: jest.fn(), showWarning: jest.fn() };
	const input = { showInputBox: jest.fn(), showWarningMessage: jest.fn() };
	const progress = { withProgress: jest.fn(async (fn) => fn()) };
	const treeProvider = {
		refresh: jest.fn(),
		refreshFile: jest.fn(),
		changeEmitter: { event: jest.fn(() => () => {}) },
		onDidChangeTreeData: jest.fn(() => () => {}),
		categoryItems: new Map(),
		store: { refresh: jest.fn(), onDidChange: jest.fn(() => () => {}) },
		getTreeItem: jest.fn(),
		getChildren: jest.fn(),
	};
	const clientFactory = {
		create: jest.fn(),
		clear: jest.fn(),
		setCredentials: jest.fn(),
	};
	return { secrets, config, notifier, input, progress, treeProvider, clientFactory };
}

describe('GitLabAuthenticationService', () => {
	it('logout deletes secret, clears factory, refreshes tree', async () => {
		const mocks = createMocks();
		const service = new GitLabAuthenticationService(
			mocks.secrets, mocks.config, mocks.notifier, mocks.input,
			mocks.progress, mocks.treeProvider, mocks.clientFactory,
		);
		await service.logout();
		expect(mocks.secrets.delete).toHaveBeenCalledWith(TOKEN_SECRET_KEY);
		expect(mocks.clientFactory.clear).toHaveBeenCalled();
		expect(mocks.treeProvider.refresh).toHaveBeenCalled();
		expect(mocks.notifier.showInfo).toHaveBeenCalledWith('Выход из GitLab выполнен.');
	});

	it('authenticate returns when url is cancelled', async () => {
		const mocks = createMocks();
		mocks.input.showInputBox.mockResolvedValueOnce(undefined);
		const service = new GitLabAuthenticationService(
			mocks.secrets, mocks.config, mocks.notifier, mocks.input,
			mocks.progress, mocks.treeProvider, mocks.clientFactory,
		);
		await service.authenticate();
		expect(mocks.progress.withProgress).not.toHaveBeenCalled();
	});

	it('authenticate returns when token is empty', async () => {
		const mocks = createMocks();
		mocks.input.showInputBox.mockResolvedValueOnce('https://gitlab.com');
		mocks.input.showInputBox.mockResolvedValueOnce('  ');
		const service = new GitLabAuthenticationService(
			mocks.secrets, mocks.config, mocks.notifier, mocks.input,
			mocks.progress, mocks.treeProvider, mocks.clientFactory,
		);
		await service.authenticate();
		expect(mocks.progress.withProgress).not.toHaveBeenCalled();
	});

	it('authenticate shows error on failure', async () => {
		const mocks = createMocks();
		mocks.input.showInputBox.mockResolvedValueOnce('https://gitlab.com');
		mocks.input.showInputBox.mockResolvedValueOnce('token123');
		mocks.clientFactory.setCredentials.mockResolvedValue(false);
		const service = new GitLabAuthenticationService(
			mocks.secrets, mocks.config, mocks.notifier, mocks.input,
			mocks.progress, mocks.treeProvider, mocks.clientFactory,
		);
		await service.authenticate();
		expect(mocks.notifier.showError).toHaveBeenCalledWith('Ошибка аутентификации GitLab: Неверный URL или токен.');
	});

	it('authenticate saves credentials on success', async () => {
		const mocks = createMocks();
		mocks.input.showInputBox.mockResolvedValueOnce('https://gitlab.com');
		mocks.input.showInputBox.mockResolvedValueOnce('token123');
		mocks.clientFactory.setCredentials.mockResolvedValue(true);
		mocks.clientFactory.create.mockResolvedValue({
			getCurrentUser: () => Promise.resolve({ id: 1, name: 'Alice', username: 'alice' }),
		});
		const service = new GitLabAuthenticationService(
			mocks.secrets, mocks.config, mocks.notifier, mocks.input,
			mocks.progress, mocks.treeProvider, mocks.clientFactory,
		);
		await service.authenticate();
		expect(mocks.config.update).toHaveBeenCalledWith('gitlabMrReview', 'url', 'https://gitlab.com');
		expect(mocks.secrets.store).toHaveBeenCalledWith(TOKEN_SECRET_KEY, 'token123');
		expect(mocks.notifier.showInfo).toHaveBeenCalledWith('GitLab: выполнен вход как Alice (@alice).');
	});

	it('normalizeUrl trims and removes trailing slash', () => {
		const mocks = createMocks();
		const service = new GitLabAuthenticationService(
			mocks.secrets, mocks.config, mocks.notifier, mocks.input,
			mocks.progress, mocks.treeProvider, mocks.clientFactory,
		);
		// @ts-ignore
		expect(service.normalizeUrl('  https://gitlab.com/  ')).toBe('https://gitlab.com');
	});

	it('normalizeUrl returns undefined for empty', () => {
		const mocks = createMocks();
		const service = new GitLabAuthenticationService(
			mocks.secrets, mocks.config, mocks.notifier, mocks.input,
			mocks.progress, mocks.treeProvider, mocks.clientFactory,
		);
		// @ts-ignore
		expect(service.normalizeUrl('')).toBeUndefined();
		// @ts-ignore
		expect(service.normalizeUrl('   ')).toBeUndefined();
		// @ts-ignore
		expect(service.normalizeUrl(undefined)).toBeUndefined();
	});
});