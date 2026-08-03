import { initApp, routes } from '../setup';
import { createMr } from '../fixtures';

describe('GraphQL Batching', () => {
	it('splits MRs into batches of 10', async () => {
		const mrs = Array.from({ length: 25 }, (_, i) =>
			createMr({ id: 100 + i, iid: 42 + i, project_id: 10 + (i % 3) }),
		);

		let graphQLCalls = 0;
		const { factory, store } = initApp([
			routes.user(),
			{
				match: (url) => url.includes('/merge_requests'),
				handler: () => ({ status: 200, statusText: 'OK', body: mrs }),
			},
			{
				match: () => {
					graphQLCalls++;
					return true;
				},
				handler: () => {
					// Return approval data for all MRs in the batch
					return {
						status: 200,
						statusText: 'OK',
						body: {
							data: Object.fromEntries(
								Array.from({ length: 10 }, (_, i) => [
									`mr${i}`,
									{
										project: { fullPath: `group/project${i}` },
										approvedBy: { nodes: [] },
										reviewers: { nodes: [] },
									},
								]),
							),
						},
					};
				},
			},
		]);

		await factory.setCredentials('https://gitlab.example.com', 'test-token');
		await store.loadPending();

		// 25 MRs = 3 batches (10 + 10 + 5)
		expect(graphQLCalls).toBe(3);
		expect(store.pendingMergeRequests).toHaveLength(25);
	});

	it('handles empty batch gracefully', async () => {
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
});