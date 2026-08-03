import { initApp, routes } from '../setup';
import { createMr } from '../fixtures';

describe('Pending Review Service', () => {
	const mr = createMr();

	it('filters pending reviews — excludes approved and requestedChanges', async () => {
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
		await store.loadPending();

		// MR approved by user — should NOT be in pending
		expect(store.pendingMergeRequests).toHaveLength(0);
	});

	it('includes MR when user has not approved or requested changes', async () => {
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
								approvedBy: { nodes: [] },
								reviewers: { nodes: [] },
							},
						},
					},
				}),
			},
		]);

		await factory.setCredentials('https://gitlab.example.com', 'test-token');
		await store.loadPending();

		expect(store.pendingMergeRequests).toHaveLength(1);
	});

	it('excludes MR when user requested changes', async () => {
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
								approvedBy: { nodes: [] },
								reviewers: {
									nodes: [
										{
											username: 'testuser',
											mergeRequestInteraction: {
												reviewState: 'REQUESTED_CHANGES',
											},
										},
									],
								},
							},
						},
					},
				}),
			},
		]);

		await factory.setCredentials('https://gitlab.example.com', 'test-token');
		await store.loadPending();

		expect(store.pendingMergeRequests).toHaveLength(0);
	});
});