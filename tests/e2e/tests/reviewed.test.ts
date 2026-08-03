import { initApp, routes } from '../setup';
import { createMr } from '../fixtures';

describe('Reviewed Files', () => {
	const mr = createMr();

	it('marks a file as reviewed and filters it from changes', async () => {
		const { factory, store } = initApp([
			routes.user(),
			{
				match: (url) => url.includes('/diffs'),
				handler: () => ({
					status: 200,
					statusText: 'OK',
					body: [
						{
							new_path: 'src/a.ts',
							old_path: 'src/a.ts',
							a_path: 'src/a.ts',
							b_path: 'src/a.ts',
							diff: '@@ -1 +1 @@\n+added',
							renamed_file: false,
							deleted_file: false,
							new_file: false,
						},
						{
							new_path: 'src/b.ts',
							old_path: 'src/b.ts',
							a_path: 'src/b.ts',
							b_path: 'src/b.ts',
							diff: '@@ -1 +1 @@\n+added2',
							renamed_file: false,
							deleted_file: false,
							new_file: false,
						},
					],
				}),
			},
		]);

		await factory.setCredentials('https://gitlab.example.com', 'test-token');
		await store.loadFiles(mr);

		const files = store.files.getFiles(mr)!;
		expect(files).toHaveLength(2);

		// Mark first file as reviewed
		store.reviewed.markAsReviewed(mr, files[0]);

		expect(store.reviewed.isReviewed(mr, files[0])).toBe(true);
		expect(store.reviewed.isReviewed(mr, files[1])).toBe(false);

		const reviewed = store.reviewed.getReviewedFiles(mr, files);
		const unreviewed = store.reviewed.getUnreviewedFiles(mr, files);

		expect(reviewed).toHaveLength(1);
		expect(reviewed[0].path).toBe('src/a.ts');
		expect(unreviewed).toHaveLength(1);
		expect(unreviewed[0].path).toBe('src/b.ts');
	});

	it('unmarks a file as reviewed', async () => {
		const { factory, store } = initApp([
			routes.user(),
			{
				match: (url) => url.includes('/diffs'),
				handler: () => ({
					status: 200,
					statusText: 'OK',
					body: [{
						new_path: 'src/a.ts',
						old_path: 'src/a.ts',
						a_path: 'src/a.ts',
						b_path: 'src/a.ts',
						diff: '@@ -1 +1 @@\n+added',
						renamed_file: false,
						deleted_file: false,
						new_file: false,
					}],
				}),
			},
		]);

		await factory.setCredentials('https://gitlab.example.com', 'test-token');
		await store.loadFiles(mr);

		const file = store.files.getFiles(mr)![0];
		store.reviewed.markAsReviewed(mr, file);
		expect(store.reviewed.isReviewed(mr, file)).toBe(true);

		store.reviewed.unmarkAsReviewed(mr, file);
		expect(store.reviewed.isReviewed(mr, file)).toBe(false);
	});

	it('detects file change via diff hash', async () => {
		const { factory, store } = initApp([
			routes.user(),
			{
				match: (url) => url.includes('/diffs'),
				handler: () => ({
					status: 200,
					statusText: 'OK',
					body: [{
						new_path: 'src/a.ts',
						old_path: 'src/a.ts',
						a_path: 'src/a.ts',
						b_path: 'src/a.ts',
						diff: '@@ -1 +1 @@\n+original',
						renamed_file: false,
						deleted_file: false,
						new_file: false,
					}],
				}),
			},
		]);

		await factory.setCredentials('https://gitlab.example.com', 'test-token');
		await store.loadFiles(mr);

		const file = store.files.getFiles(mr)![0];
		store.reviewed.markAsReviewed(mr, file);
		expect(store.reviewed.isReviewed(mr, file)).toBe(true);

		// Simulate file change
		const changedFile = { ...file, diff: '@@ -1 +1 @@\n+changed' };
		expect(store.reviewed.isReviewed(mr, changedFile)).toBe(false);
	});
});