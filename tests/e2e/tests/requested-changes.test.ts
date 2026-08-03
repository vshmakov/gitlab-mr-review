import { initApp, routes } from '../setup';
import { createMr } from '../fixtures';

describe('Requested Changes', () => {
	const mr = createMr();

	it('loads MRs where user requested changes', async () => {
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
		await store.loadRequestedChanges();

		expect(store.requestedChangesMergeRequests).toHaveLength(1);
	});

	it('excludes MRs where user did not request changes', async () => {
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
		await store.loadRequestedChanges();

		expect(store.requestedChangesMergeRequests).toHaveLength(0);
	});
});