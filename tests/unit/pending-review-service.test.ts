import { PendingReviewService } from '../../src/domain/service/PendingReviewService';

function createMockGraphQLClient(): any {
	return {
		request: jest.fn(),
		getBaseUrl: jest.fn(),
	};
}

const mockUser = { id: 1, username: 'alice', name: 'Alice' };

describe('PendingReviewService', () => {
	it('filterPendingReviews excludes approved MRs', async () => {
		const client = createMockGraphQLClient();
		client.request.mockResolvedValue({
			mr0: {
				project: { fullPath: 'g/p' },
				approvedBy: { nodes: [{ username: 'alice' }] },
				reviewers: { nodes: [] },
			},
		});
		const service = new PendingReviewService(client);
		const mrs = [{ id: 1, iid: 1, project_id: 10, project_path: 'g/p' }];

		const result = await service.filterPendingReviews(mrs as any, mockUser as any);

		expect(result).toHaveLength(0);
	});

	it('filterPendingReviews excludes requested changes MRs', async () => {
		const client = createMockGraphQLClient();
		client.request.mockResolvedValue({
			mr0: {
				project: { fullPath: 'g/p' },
				approvedBy: { nodes: [] },
				reviewers: { nodes: [{ username: 'alice', mergeRequestInteraction: { reviewState: 'REQUESTED_CHANGES' } }] },
			},
		});
		const service = new PendingReviewService(client);
		const mrs = [{ id: 1, iid: 1, project_id: 10, project_path: 'g/p' }];

		const result = await service.filterPendingReviews(mrs as any, mockUser as any);

		expect(result).toHaveLength(0);
	});

	it('filterPendingReviews includes MRs with no interaction', async () => {
		const client = createMockGraphQLClient();
		client.request.mockResolvedValue({
			mr0: {
				project: { fullPath: 'g/p' },
				approvedBy: { nodes: [] },
				reviewers: { nodes: [] },
			},
		});
		const service = new PendingReviewService(client);
		const mrs = [{ id: 1, iid: 1, project_id: 10, project_path: 'g/p' }];

		const result = await service.filterPendingReviews(mrs as any, mockUser as any);

		expect(result).toHaveLength(1);
	});

	it('filterApprovedReviews includes only approved MRs', async () => {
		const client = createMockGraphQLClient();
		client.request.mockResolvedValue({
			mr0: {
				project: { fullPath: 'g/p' },
				approvedBy: { nodes: [{ username: 'alice' }] },
				reviewers: { nodes: [] },
			},
		});
		const service = new PendingReviewService(client);
		const mrs = [{ id: 1, iid: 1, project_id: 10, project_path: 'g/p' }];

		const result = await service.filterApprovedReviews(mrs as any, mockUser as any);

		expect(result).toHaveLength(1);
	});

	it('filterRequestedChangesReviews includes only requested changes', async () => {
		const client = createMockGraphQLClient();
		client.request.mockResolvedValue({
			mr0: {
				project: { fullPath: 'g/p' },
				approvedBy: { nodes: [] },
				reviewers: { nodes: [{ username: 'alice', mergeRequestInteraction: { reviewState: 'REQUESTED_CHANGES' } }] },
			},
		});
		const service = new PendingReviewService(client);
		const mrs = [{ id: 1, iid: 1, project_id: 10, project_path: 'g/p' }];

		const result = await service.filterRequestedChangesReviews(mrs as any, mockUser as any);

		expect(result).toHaveLength(1);
	});

	it('splits MRs into batches of 10', async () => {
		const client = createMockGraphQLClient();
		client.request.mockResolvedValue({});
		const service = new PendingReviewService(client);
		const mrs = Array.from({ length: 25 }, (_, i) => ({
			id: i + 1, iid: i + 1, project_id: 10, project_path: 'g/p',
		}));

		await service.filterPendingReviews(mrs as any, mockUser as any);

		expect(client.request).toHaveBeenCalledTimes(3);
	});

	it('returns empty when no MRs', async () => {
		const client = createMockGraphQLClient();
		const service = new PendingReviewService(client);

		const result = await service.filterPendingReviews([], mockUser as any);

		expect(result).toHaveLength(0);
		expect(client.request).not.toHaveBeenCalled();
	});

	it('handles null state in GraphQL response', async () => {
		const client = createMockGraphQLClient();
		client.request.mockResolvedValue({
			mr0: null,
		});
		const service = new PendingReviewService(client);
		const mrs = [{ id: 1, iid: 1, project_id: 10, project_path: 'g/p' }];

		const result = await service.filterPendingReviews(mrs as any, mockUser as any);

		expect(result).toHaveLength(1);
	});

	it('batch boundary at exactly 10 items', async () => {
		const client = createMockGraphQLClient();
		client.request.mockResolvedValue({});
		const service = new PendingReviewService(client);
		const mrs = Array.from({ length: 10 }, (_, i) => ({
			id: i + 1, iid: i + 1, project_id: 10, project_path: 'g/p',
		}));

		await service.filterPendingReviews(mrs as any, mockUser as any);

		expect(client.request).toHaveBeenCalledTimes(1);
	});

	it('enriches project_path from GraphQL response', async () => {
		const client = createMockGraphQLClient();
		client.request.mockResolvedValue({
			mr0: {
				project: { fullPath: 'enriched/path' },
				approvedBy: { nodes: [] },
				reviewers: { nodes: [] },
			},
		});
		const service = new PendingReviewService(client);
		const mrs = [{ id: 1, iid: 1, project_id: 10, project_path: 'old/path' }];

		const result = await service.filterPendingReviews(mrs as any, mockUser as any);

		expect(result[0].project_path).toBe('enriched/path');
	});
});