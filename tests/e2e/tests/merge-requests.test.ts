import { initApp, routes } from '../setup';
import { createMr } from '../fixtures';

describe('Merge Requests', () => {
	const mr = createMr();

	it('loads pending reviews', async () => {
		const { factory, store } = initApp([
			routes.user(),
			{
				match: (url) => url.includes('/merge_requests'),
				handler: () => ({ status: 200, statusText: 'OK', body: [mr] }),
			},
			routes.graphQL(),
		]);

		await factory.setCredentials('https://gitlab.example.com', 'test-token');
		await store.loadPending();

		expect(store.pendingMergeRequests).toHaveLength(1);
		expect(store.pendingMergeRequests[0].iid).toBe(42);
	});

	it('caches merge requests — second load does not refetch', async () => {
		let mrRequests = 0;
		const { factory, store } = initApp([
			routes.user(),
			{
				match: (url) => {
					if (url.includes('/merge_requests')) mrRequests++;
					return url.includes('/merge_requests');
				},
				handler: () => ({ status: 200, statusText: 'OK', body: [mr] }),
			},
			routes.graphQL(),
		]);

		await factory.setCredentials('https://gitlab.example.com', 'test-token');
		await store.loadPending();
		const afterFirst = mrRequests;

		await store.loadPending();
		expect(mrRequests).toBe(afterFirst);
	});

	it('refresh clears cache and reloads', async () => {
		let mrRequests = 0;
		const { factory, store } = initApp([
			routes.user(),
			{
				match: (url) => {
					if (url.includes('/merge_requests')) mrRequests++;
					return url.includes('/merge_requests');
				},
				handler: () => ({ status: 200, statusText: 'OK', body: [mr] }),
			},
			routes.graphQL(),
		]);

		await factory.setCredentials('https://gitlab.example.com', 'test-token');
		await store.loadPending();
		const afterFirst = mrRequests;

		store.refresh();
		await store.loadPending();
		expect(mrRequests).toBeGreaterThan(afterFirst);
	});
});