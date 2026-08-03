import { initApp, routes } from '../setup';
import { createMr } from '../fixtures';

describe('Files', () => {
	const mr = createMr();

	it('loads files for a merge request', async () => {
		const { factory, store } = initApp([
			routes.user(),
			{
				match: (url) => url.includes('/diffs'),
				handler: () => ({
					status: 200,
					statusText: 'OK',
					body: [{
						new_path: 'src/index.ts',
						old_path: 'src/index.ts',
						a_path: 'src/index.ts',
						b_path: 'src/index.ts',
						diff: '@@ -1,3 +1,4 @@\n line1\n+added\n line3',
						renamed_file: false,
						deleted_file: false,
						new_file: false,
					}],
				}),
			},
		]);

		await factory.setCredentials('https://gitlab.example.com', 'test-token');
		await store.loadFiles(mr);

		const files = store.files.getFiles(mr);
		expect(files).toBeDefined();
		expect(files!.length).toBe(1);
		expect(files![0].path).toBe('src/index.ts');
	});
});