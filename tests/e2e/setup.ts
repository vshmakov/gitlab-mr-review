import { createMockHttpClient, MockRoute } from './mocks/mock-http-client';
import { createMockEnvironment, MockNotifier } from './mocks/mock-environment';
import { GitLabClientFactory } from '../../src/domain/client/GitLabClientFactory';
import { MergeRequestsStore } from '../../src/domain/store/MergeRequestsStore';

export interface E2EContext {
	env: ReturnType<typeof createMockEnvironment>;
	notifier: MockNotifier;
	factory: GitLabClientFactory;
	store: MergeRequestsStore;
}

export function initApp(routes: MockRoute[]): E2EContext {
	const http = createMockHttpClient(routes);
	const env = createMockEnvironment(http as any);
	const notifier = env.notifier as MockNotifier;
	const factory = new GitLabClientFactory(
		env.secrets, env.config, env.notifier,
		env.input, env.commands, http as any,
	);
	const store = new MergeRequestsStore(factory, env.notifier);

	return { env, notifier, factory, store };
}

// Common HTTP route handlers
export const routes = {
	user: () => ({
		match: (url: string) => url.includes('/user'),
		handler: () => ({ status: 200, statusText: 'OK', body: { id: 1, username: 'testuser', name: 'Test User' } }),
	}),
	graphQL: (data: unknown = {}) => ({
		match: () => true,
		handler: () => ({ status: 200, statusText: 'OK', body: { data } }),
	}),
};