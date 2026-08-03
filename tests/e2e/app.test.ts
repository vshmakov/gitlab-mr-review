import { createMockHttpClient } from './mock-http-client';
import { createMockEnvironment, MockNotifier } from './mock-environment';
import { TEST_USER, TEST_BASE_URL, TEST_TOKEN, createMr } from './fixtures';
import { GitLabClientFactory } from '../../src/domain/client/GitLabClientFactory';
import { MergeRequestsStore } from '../../src/domain/store/MergeRequestsStore';

describe('E2E: Application Flow', () => {
	let env: ReturnType<typeof createMockEnvironment>;
	let notifier: MockNotifier;
	let factory: GitLabClientFactory;
	let store: MergeRequestsStore;

	function initApp(handlers: Array<{ match: (url: string, opts?: unknown) => boolean; handler: (url: string, opts?: unknown) => { status: number; statusText: string; body: unknown } }>) {
		const http = createMockHttpClient(handlers);
		env = createMockEnvironment(http as any);
		notifier = env.notifier as MockNotifier;
		factory = new GitLabClientFactory(
			env.secrets, env.config, env.notifier,
			env.input, env.commands, http as any,
		);
		store = new MergeRequestsStore(factory, env.notifier);
	}

	describe('Authentication', () => {
		it('sets credentials and creates client', async () => {
			initApp([
				{
					match: (url) => url.includes('/api/v4/user'),
					handler: () => ({ status: 200, statusText: 'OK', body: TEST_USER }),
				},
			]);

			const ok = await factory.setCredentials(TEST_BASE_URL, TEST_TOKEN);
			expect(ok).toBe(true);

			const client = await factory.create();
			expect(client).toBeDefined();

			const user = await client!.getCurrentUser();
			expect(user.username).toBe('testuser');
		});

		it('rejects invalid credentials', async () => {
			initApp([
				{
					match: () => true,
					handler: () => ({ status: 401, statusText: 'Unauthorized', body: { message: '401 Unauthorized' } }),
				},
			]);

			const ok = await factory.setCredentials(TEST_BASE_URL, 'bad-token');
			expect(ok).toBe(false);
			expect(notifier.shown.some((s) => s.type === 'error')).toBe(true);
		});
	});

	describe('Load Merge Requests', () => {
		const mr = createMr();

		it('loads pending reviews', async () => {
			initApp([
				{
					match: (url) => url.includes('/user'),
					handler: () => ({ status: 200, statusText: 'OK', body: TEST_USER }),
				},
				{
					match: (url) => url.includes('/merge_requests'),
					handler: () => ({ status: 200, statusText: 'OK', body: [mr] }),
				},
				{
					match: () => true,
					handler: () => ({ status: 200, statusText: 'OK', body: { data: {} } }),
				},
			]);

			await factory.setCredentials(TEST_BASE_URL, TEST_TOKEN);
			await store.loadPending();

			const mrs = store.pendingMergeRequests;
			expect(mrs).toHaveLength(1);
			expect(mrs[0].iid).toBe(42);
		});

		it('caches merge requests — second load does not refetch', async () => {
			let mrRequests = 0;
			initApp([
				{
					match: (url) => url.includes('/user'),
					handler: () => ({ status: 200, statusText: 'OK', body: TEST_USER }),
				},
				{
					match: (url) => {
						if (url.includes('/merge_requests')) mrRequests++;
						return url.includes('/merge_requests');
					},
					handler: () => ({ status: 200, statusText: 'OK', body: [mr] }),
				},
				{
					match: () => true,
					handler: () => ({ status: 200, statusText: 'OK', body: { data: {} } }),
				},
			]);

			await factory.setCredentials(TEST_BASE_URL, TEST_TOKEN);
			await store.loadPending();
			const afterFirst = mrRequests;

			await store.loadPending();
			expect(mrRequests).toBe(afterFirst);
		});

		it('refresh clears cache and reloads', async () => {
			let mrRequests = 0;
			initApp([
				{
					match: (url) => url.includes('/user'),
					handler: () => ({ status: 200, statusText: 'OK', body: TEST_USER }),
				},
				{
					match: (url) => {
						if (url.includes('/merge_requests')) mrRequests++;
						return url.includes('/merge_requests');
					},
					handler: () => ({ status: 200, statusText: 'OK', body: [mr] }),
				},
				{
					match: () => true,
					handler: () => ({ status: 200, statusText: 'OK', body: { data: {} } }),
				},
			]);

			await factory.setCredentials(TEST_BASE_URL, TEST_TOKEN);
			await store.loadPending();
			const afterFirst = mrRequests;

			store.refresh();
			await store.loadPending();
			expect(mrRequests).toBeGreaterThan(afterFirst);
		});
	});

	describe('Load Files', () => {
		const mr = createMr();

		it('loads files for a merge request', async () => {
			initApp([
				{
					match: (url) => url.includes('/user'),
					handler: () => ({ status: 200, statusText: 'OK', body: TEST_USER }),
				},
				{
					match: (url) => url.includes('/diffs'),
					handler: () => ({
						status: 200,
						statusText: 'OK',
						body: [
							{
								new_path: 'src/index.ts',
								old_path: 'src/index.ts',
								a_path: 'src/index.ts',
								b_path: 'src/index.ts',
								diff: '@@ -1,3 +1,4 @@\n line1\n+added\n line3',
								renamed_file: false,
								deleted_file: false,
								new_file: false,
							},
						],
					}),
				},
			]);

			await factory.setCredentials(TEST_BASE_URL, TEST_TOKEN);
			await store.loadFiles(mr);

			const files = store.files.getFiles(mr);
			expect(files).toBeDefined();
			expect(files!.length).toBe(1);
			expect(files![0].path).toBe('src/index.ts');
		});
	});

	describe('Full Flow', () => {
		it('completes: authenticate -> load MR -> load files', async () => {
			const mr = createMr();
			const calls: string[] = [];

			initApp([
				{
					match: (url, opts) => {
						const label = `${(opts as { method?: string })?.method ?? 'GET'} ${url}`;
						calls.push(label);
						return url.includes('/user');
					},
					handler: () => ({ status: 200, statusText: 'OK', body: TEST_USER }),
				},
				{
					match: (url) => url.includes('/merge_requests') && !url.includes('/diffs'),
					handler: () => ({ status: 200, statusText: 'OK', body: [mr] }),
				},
				{
					match: (url) => url.includes('/diffs'),
					handler: () => ({
						status: 200, statusText: 'OK',
						body: [{
							new_path: 'src/app.ts', old_path: 'src/app.ts',
							a_path: 'src/app.ts', b_path: 'src/app.ts',
							diff: '@@ -1,2 +1,3 @@\n old\n+new\n kept',
							renamed_file: false, deleted_file: false, new_file: false,
						}],
					}),
				},
				{
					match: () => true,
					handler: () => ({ status: 200, statusText: 'OK', body: { data: {} } }),
				},
			]);

			// 1. Authenticate
			const authOk = await factory.setCredentials(TEST_BASE_URL, TEST_TOKEN);
			expect(authOk).toBe(true);

			// 2. Load pending MRs
			await store.loadPending();
			expect(store.pendingMergeRequests.length).toBeGreaterThanOrEqual(1);

			// 3. Load files
			await store.loadFiles(mr);
			const files = store.files.getFiles(mr);
			expect(files).toBeDefined();
			expect(files![0].path).toBe('src/app.ts');

			// 4. No errors
			expect(notifier.shown.filter((s) => s.type === 'error').length).toBe(0);
		});
	});
});