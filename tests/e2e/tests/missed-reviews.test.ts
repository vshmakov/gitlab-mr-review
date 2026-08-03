import { initApp, routes } from '../setup';
import { createMr } from '../fixtures';

describe('Missed Reviews', () => {
	it('finds merged MRs without user approval', async () => {
		const mergedMr = createMr({ state: 'merged', merged_at: '2024-02-01T00:00:00.000Z' });

		const { factory, store } = initApp([
			routes.user(),
			{
				match: (url) => url.includes('/merge_requests'),
				handler: () => ({ status: 200, statusText: 'OK', body: [mergedMr] }),
			},
			{
				match: () => true,
				handler: () => ({
					status: 200,
					statusText: 'OK',
					body: {
						data: {
							mr0: {
								project: { fullPath: 'group/project' },
								approvedBy: { nodes: [{ username: 'someone-else' }] },
								reviewers: { nodes: [] },
							},
						},
					},
				}),
			},
		]);

		await factory.setCredentials('https://gitlab.example.com', 'test-token');
		await store.loadMissedReview();

		expect(store.missedMergeRequests).toHaveLength(1);
	});

	it('excludes merged MRs approved by the user', async () => {
		const mergedMr = createMr({ state: 'merged', merged_at: '2024-02-01T00:00:00.000Z' });

		const { factory, store } = initApp([
			routes.user(),
			{
				match: (url) => url.includes('/merge_requests'),
				handler: () => ({ status: 200, statusText: 'OK', body: [mergedMr] }),
			},
			{
				match: () => true,
				handler: () => ({
					status: 200,
					statusText: 'OK',
					body: {
						data: {
							mr0: {
								project: { fullPath: 'group/project' },
								approvedBy: { nodes: [{ username: 'testuser' }] },
								reviewers: { nodes: [] },
							},
						},
					},
				}),
			},
		]);

		await factory.setCredentials('https://gitlab.example.com', 'test-token');
		await store.loadMissedReview();

		expect(store.missedMergeRequests).toHaveLength(0);
	});

	it('returns empty when no merged MRs', async () => {
		const { factory, store } = initApp([
			routes.user(),
			{
				match: (url) => url.includes('/merge_requests'),
				handler: () => ({ status: 200, statusText: 'OK', body: [] }),
			},
		]);

		await factory.setCredentials('https://gitlab.example.com', 'test-token');
		await store.loadMissedReview();

		expect(store.missedMergeRequests).toHaveLength(0);
	});
});