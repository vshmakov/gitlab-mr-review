import { GitLabClientFactory } from '../../src/domain/client/GitLabClientFactory';
import { TOKEN_SECRET_KEY } from '../../src/domain/client/constants';

function createMocks() {
	const secrets = {
		get: jest.fn(),
		store: jest.fn(),
		delete: jest.fn(),
	};
	const config = {
		get: jest.fn(),
		update: jest.fn(),
	};
	const notifier = { showError: jest.fn(), showInfo: jest.fn(), showWarning: jest.fn() };
	const input = { showWarningMessage: jest.fn(), showInputBox: jest.fn() };
	const commands = { execute: jest.fn(), register: jest.fn() };
	const http = { request: jest.fn() };
	return { secrets, config, notifier, input, commands, http };
}

describe('GitLabClientFactory', () => {
	it('returns cached client on second create', async () => {
		const { secrets, config, notifier, input, commands, http } = createMocks();
		config.get.mockReturnValue('https://gitlab.com');
		secrets.get.mockResolvedValue('token123');
		http.request.mockResolvedValue({ ok: true, json: () => ({ id: 1 }) });
		const factory = new GitLabClientFactory(secrets, config, notifier, input, commands, http);

		const c1 = await factory.create();
		const c2 = await factory.create();

		expect(c1).toBe(c2);
	});

	it('returns undefined when no baseUrl', async () => {
		const { secrets, config, notifier, input, commands, http } = createMocks();
		config.get.mockReturnValue('');
		const factory = new GitLabClientFactory(secrets, config, notifier, input, commands, http);

		const result = await factory.create();

		expect(result).toBeUndefined();
	});

	it('returns undefined when no token', async () => {
		const { secrets, config, notifier, input, commands, http } = createMocks();
		config.get.mockReturnValue('https://gitlab.com');
		secrets.get.mockResolvedValue(undefined);
		const factory = new GitLabClientFactory(secrets, config, notifier, input, commands, http);

		const result = await factory.create();

		expect(result).toBeUndefined();
	});

	it('setCredentials validates by calling getCurrentUser', async () => {
		const { secrets, config, notifier, input, commands, http } = createMocks();
		http.request.mockResolvedValue({ ok: true, json: () => ({ id: 1 }) });
		const factory = new GitLabClientFactory(secrets, config, notifier, input, commands, http);

		const result = await factory.setCredentials('https://gitlab.com', 'token123');

		expect(result).toBe(true);
	});

	it('setCredentials returns false on failure', async () => {
		const { secrets, config, notifier, input, commands, http } = createMocks();
		http.request.mockResolvedValue({ ok: false, status: 401, statusText: 'Unauthorized', text: () => 'Access denied' });
		const factory = new GitLabClientFactory(secrets, config, notifier, input, commands, http);

		const result = await factory.setCredentials('https://gitlab.com', 'wrong-token');

		expect(result).toBe(false);
	});

	it('clear removes cached client', async () => {
		const { secrets, config, notifier, input, commands, http } = createMocks();
		config.get.mockReturnValue('https://gitlab.com');
		secrets.get.mockResolvedValue('token123');
		http.request.mockResolvedValue({ ok: true, json: () => ({ id: 1 }) });
		const factory = new GitLabClientFactory(secrets, config, notifier, input, commands, http);

		await factory.create();
		factory.clear();

		expect(factory['client']).toBeUndefined();
	});

	it('createNoteClient returns undefined when no credentials', async () => {
		const { secrets, config, notifier, input, commands, http } = createMocks();
		config.get.mockReturnValue('');
		const factory = new GitLabClientFactory(secrets, config, notifier, input, commands, http);

		const result = await factory.createNoteClient();

		expect(result).toBeUndefined();
	});

	it('normalizes baseUrl', async () => {
		const { secrets, config, notifier, input, commands, http } = createMocks();
		config.get.mockReturnValue('https://gitlab.com/');
		secrets.get.mockResolvedValue('token123');
		const factory = new GitLabClientFactory(secrets, config, notifier, input, commands, http);

		await factory.create();

		expect(factory['client']).toBeDefined();
	});
});