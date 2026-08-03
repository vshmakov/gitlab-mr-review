import { createMockHttpClient } from '../mocks/mock-http-client';
import { createMockEnvironment, MockCommandRegistry, MockNotifier } from '../mocks/mock-environment';
import { GitLabCommandRegistrar } from '../../../src/domain/service/GitLabCommandRegistrar';
import { GitLabClientFactory } from '../../../src/domain/client/GitLabClientFactory';
import { GitLabMergeRequest } from '../../../src/domain/model/GitLabMergeRequest';

describe('GitLabCommandRegistrar', () => {
	it('registers all commands', async () => {
		const http = createMockHttpClient([
			{ match: () => true, handler: () => ({ status: 200, statusText: 'OK', body: { data: {} } }) },
		]);
		const env = createMockEnvironment(http as any);
		const commands = env.commands as MockCommandRegistry;
		const notifier = env.notifier as MockNotifier;

		const factory = new GitLabClientFactory(
			env.secrets, env.config, env.notifier,
			env.input, env.commands, http as any,
		);

		const treeProvider = { refresh: jest.fn() };
		const registrar = new GitLabCommandRegistrar(
			commands, notifier, env.input, env.documents,
			env.comments, treeProvider, {} as any, {} as any, factory,
		);

		const disposables = registrar.register();
		expect(disposables.length).toBeGreaterThan(0);

		// Verify refresh command works
		await commands.execute('gitlabMrReview.refresh');
		expect(treeProvider.refresh).toHaveBeenCalled();

		disposables.forEach(d => d.dispose());
	});

	it('shows error when approving without MR', async () => {
		const http = createMockHttpClient([
			{ match: () => true, handler: () => ({ status: 200, statusText: 'OK', body: { data: {} } }) },
		]);
		const env = createMockEnvironment(http as any);
		const commands = env.commands as MockCommandRegistry;
		const notifier = env.notifier as MockNotifier;

		const factory = new GitLabClientFactory(
			env.secrets, env.config, env.notifier,
			env.input, env.commands, http as any,
		);

		const registrar = new GitLabCommandRegistrar(
			commands, notifier, env.input, env.documents,
			env.comments, {} as any, {} as any, {} as any, factory,
		);

		registrar.register();

		// Execute approve without MR
		await commands.execute('gitlabMrReview.approve', undefined);

		expect(notifier.shown.some(s => s.type === 'error' && s.message.includes('No MR'))).toBe(true);
	});
});