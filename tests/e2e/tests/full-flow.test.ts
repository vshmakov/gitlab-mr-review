import { initApp, routes } from '../setup';
import { createMr } from '../fixtures';

describe('Full Flow', () => {
	it('completes: authenticate -> load MR -> load files', async () => {
		const mr = createMr();

		const { factory, store, notifier } = initApp([
			routes.user(),
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
			routes.graphQL(),
		]);

		// 1. Authenticate
		const authOk = await factory.setCredentials('https://gitlab.example.com', 'test-token');
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