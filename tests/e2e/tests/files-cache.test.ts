import { initApp, routes } from '../setup';
import { createMr } from '../fixtures';

describe('Files Cache', () => {
	const mr = createMr();

	it('caches files — second load does not refetch', async () => {
		let diffRequests = 0;
		const { factory, store } = initApp([
			routes.user(),
			{
				match: (url) => {
					if (url.includes('/diffs')) diffRequests++;
					return url.includes('/diffs');
				},
				handler: () => ({
					status: 200,
					statusText: 'OK',
					body: [{
						new_path: 'src/app.ts', old_path: 'src/app.ts',
						a_path: 'src/app.ts', b_path: 'src/app.ts',
						diff: '@@ -1 +1 @@\n old\n+new',
						renamed_file: false, deleted_file: false, new_file: false,
					}],
				}),
			},
		]);

		await factory.setCredentials('https://gitlab.example.com', 'test-token');
		await store.loadFiles(mr);
		const afterFirst = diffRequests;

		await store.loadFiles(mr);
		expect(diffRequests).toBe(afterFirst);
	});

	it('refresh clears files cache', async () => {
		let diffRequests = 0;
		const { factory, store } = initApp([
			routes.user(),
			{
				match: (url) => {
					if (url.includes('/diffs')) diffRequests++;
					return url.includes('/diffs');
				},
				handler: () => ({
					status: 200,
					statusText: 'OK',
					body: [{
						new_path: 'src/app.ts', old_path: 'src/app.ts',
						a_path: 'src/app.ts', b_path: 'src/app.ts',
						diff: '@@ -1 +1 @@\n old\n+new',
						renamed_file: false, deleted_file: false, new_file: false,
					}],
				}),
			},
		]);

		await factory.setCredentials('https://gitlab.example.com', 'test-token');
		await store.loadFiles(mr);
		const afterFirst = diffRequests;

		store.refresh();
		await store.loadFiles(mr);
		expect(diffRequests).toBeGreaterThan(afterFirst);
	});

	it('returns undefined when files not loaded', async () => {
		const { factory, store } = initApp([
			routes.user(),
		]);

		await factory.setCredentials('https://gitlab.example.com', 'test-token');
		const files = store.files.getFiles(mr);
		expect(files).toBeUndefined();
	});
});