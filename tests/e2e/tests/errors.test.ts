import { initApp, routes } from '../setup';
import { createMr } from '../fixtures';

describe('Error Handling', () => {
	it('reports error on authentication failure', async () => {
		const { factory, notifier } = initApp([
			{
				match: () => true,
				handler: () => ({ status: 401, statusText: 'Unauthorized', body: { message: '401 Unauthorized' } }),
			},
		]);

		const ok = await factory.setCredentials('https://gitlab.example.com', 'bad-token');
		expect(ok).toBe(false);
		expect(notifier.shown.some((s) => s.type === 'error')).toBe(true);
	});

	it('handles empty merge request list', async () => {
		const { factory, store } = initApp([
			routes.user(),
			{
				match: (url) => url.includes('/merge_requests'),
				handler: () => ({ status: 200, statusText: 'OK', body: [] }),
			},
		]);

		await factory.setCredentials('https://gitlab.example.com', 'test-token');
		await store.loadPending();

		expect(store.pendingMergeRequests).toHaveLength(0);
	});

	it('stores error when API fails', async () => {
		const { factory, store } = initApp([
			routes.user(),
			{
				match: (url) => url.includes('/merge_requests'),
				handler: () => ({ status: 500, statusText: 'Internal Server Error', body: { message: 'Server error' } }),
			},
		]);

		await factory.setCredentials('https://gitlab.example.com', 'test-token');
		await store.loadPending();

		expect(store.error).toBeDefined();
	});
});