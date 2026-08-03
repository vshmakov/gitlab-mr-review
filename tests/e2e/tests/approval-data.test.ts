import { initApp, routes } from '../setup';
import { createMr } from '../fixtures';

describe('Approval Data', () => {
	const mr = createMr();

	it('loads and caches approval data for a merge request', async () => {
		const { factory, store } = initApp([
			routes.user(),
			{
				match: () => true,
				handler: () => ({
					status: 200,
					statusText: 'OK',
					body: {
						data: {
							mr: {
								reviewers: {
									nodes: [
										{
											username: 'reviewer1',
											name: 'Reviewer One',
											mergeRequestInteraction: { reviewState: 'APPROVED' },
										},
										{
											username: 'reviewer2',
											name: 'Reviewer Two',
											mergeRequestInteraction: { reviewState: 'REQUESTED_CHANGES' },
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
		await store.loadApprovalData(mr);

		const data = store.getApprovalData(mr);
		expect(data).toBeDefined();
		expect(data!.approvedBy).toHaveLength(1);
		expect(data!.approvedBy[0].username).toBe('reviewer1');
		expect(data!.requestedChanges).toHaveLength(1);
		expect(data!.requestedChanges[0].username).toBe('reviewer2');
	});

	it('refresh clears approval data cache', async () => {
		const { factory, store } = initApp([
			routes.user(),
			{
				match: () => true,
				handler: () => ({
					status: 200,
					statusText: 'OK',
					body: {
						data: {
							mr: {
								reviewers: {
									nodes: [
										{
											username: 'reviewer1',
											name: 'Reviewer One',
											mergeRequestInteraction: { reviewState: 'APPROVED' },
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
		await store.loadApprovalData(mr);
		expect(store.getApprovalData(mr)).toBeDefined();

		store.refresh();
		expect(store.getApprovalData(mr)).toBeUndefined();
	});
});