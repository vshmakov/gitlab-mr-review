import { initApp, routes } from '../setup';
import { createMr } from '../fixtures';

describe('My Merge Requests', () => {
	it('loads MRs created by the user', async () => {
		const mr = createMr();
		const { factory, store } = initApp([
			routes.user(),
			{
				match: (url) => url.includes('/merge_requests') && url.includes('author_id'),
				handler: () => ({ status: 200, statusText: 'OK', body: [mr] }),
			},
		]);

		await factory.setCredentials('https://gitlab.example.com', 'test-token');
		await store.loadMyMergeRequests();

		expect(store.myMergeRequests).toHaveLength(1);
		expect(store.myMergeRequests[0].iid).toBe(42);
	});

	it('returns empty when user has no MRs', async () => {
		const { factory, store } = initApp([
			routes.user(),
			{
				match: (url) => url.includes('/merge_requests'),
				handler: () => ({ status: 200, statusText: 'OK', body: [] }),
			},
		]);

		await factory.setCredentials('https://gitlab.example.com', 'test-token');
		await store.loadMyMergeRequests();

		expect(store.myMergeRequests).toHaveLength(0);
	});
});