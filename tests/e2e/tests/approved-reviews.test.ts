import { initApp, routes } from '../setup';
import { createMr } from '../fixtures';

describe('Approved Reviews', () => {
	const mr = createMr();

	it('loads MRs approved by the user', async () => {
		const { factory, store } = initApp([
			routes.user(),
			{
				match: (url) => url.includes('/merge_requests'),
				handler: () => ({ status: 200, statusText: 'OK', body: [mr] }),
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
		await store.loadApproved();

		expect(store.approvedMergeRequests).toHaveLength(1);
		expect(store.approvedMergeRequests[0].iid).toBe(42);
	});

	it('excludes MRs not approved by the user', async () => {
		const { factory, store } = initApp([
			routes.user(),
			{
				match: (url) => url.includes('/merge_requests'),
				handler: () => ({ status: 200, statusText: 'OK', body: [mr] }),
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
		await store.loadApproved();

		expect(store.approvedMergeRequests).toHaveLength(0);
	});
});