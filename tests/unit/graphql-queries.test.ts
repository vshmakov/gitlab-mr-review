import { fetchApprovalData, REVIEW_APPROVED, REVIEW_REQUESTED_CHANGES } from '../../src/domain/client/graphql-queries';

function createMockGraphQLClient() {
	return {
		request: jest.fn(),
	};
}

describe('fetchApprovalData', () => {
	it('filters reviewers into approvedBy', async () => {
		const client = createMockGraphQLClient();
		client.request.mockResolvedValue({
			mr: {
				reviewers: {
					nodes: [
						{ username: 'alice', name: 'Alice', mergeRequestInteraction: { reviewState: 'APPROVED' } },
					],
				},
			},
		});
		const mr = { id: 1, iid: 1, project_id: 10, project_path: 'g/p' };

		const result = await fetchApprovalData(mr as any, client as any);

		expect(result.approvedBy).toEqual([{ name: 'Alice', username: 'alice' }]);
		expect(result.requestedChanges).toEqual([]);
	});

	it('filters reviewers into requestedChanges', async () => {
		const client = createMockGraphQLClient();
		client.request.mockResolvedValue({
			mr: {
				reviewers: {
					nodes: [
						{ username: 'bob', name: 'Bob', mergeRequestInteraction: { reviewState: 'REQUESTED_CHANGES' } },
					],
				},
			},
		});
		const mr = { id: 1, iid: 1, project_id: 10, project_path: 'g/p' };

		const result = await fetchApprovalData(mr as any, client as any);

		expect(result.approvedBy).toEqual([]);
		expect(result.requestedChanges).toEqual([{ name: 'Bob', username: 'bob' }]);
	});

	it('handles missing mergeRequestInteraction', async () => {
		const client = createMockGraphQLClient();
		client.request.mockResolvedValue({
			mr: {
				reviewers: {
					nodes: [
						{ username: 'charlie', name: 'Charlie' },
					],
				},
			},
		});
		const mr = { id: 1, iid: 1, project_id: 10, project_path: 'g/p' };

		const result = await fetchApprovalData(mr as any, client as any);

		expect(result.approvedBy).toEqual([]);
		expect(result.requestedChanges).toEqual([]);
	});

	it('handles empty reviewers', async () => {
		const client = createMockGraphQLClient();
		client.request.mockResolvedValue({
			mr: {
				reviewers: { nodes: [] },
			},
		});
		const mr = { id: 1, iid: 1, project_id: 10, project_path: 'g/p' };

		const result = await fetchApprovalData(mr as any, client as any);

		expect(result.approvedBy).toEqual([]);
		expect(result.requestedChanges).toEqual([]);
	});

	it('builds correct globalId', async () => {
		const client = createMockGraphQLClient();
		client.request.mockResolvedValue({
			mr: { reviewers: { nodes: [] } },
		});
		const mr = { id: 42, iid: 1, project_id: 10, project_path: 'g/p' };

		await fetchApprovalData(mr as any, client as any);

		const query = client.request.mock.calls[0][0];
		expect(query).toContain('gid://gitlab/MergeRequest/42');
	});
});