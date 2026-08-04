import { GitLabClient } from '../../src/domain/client/GitLabClient';

function createMocks(): any {
	const restClient = {
		get: jest.fn(),
		post: jest.fn(),
		getBaseUrl: jest.fn(),
	};
	const graphQLClient = {
		request: jest.fn(),
	};
	const pendingReviewService = {
		filterPendingReviews: jest.fn(),
		filterApprovedReviews: jest.fn(),
		filterRequestedChangesReviews: jest.fn(),
	};
	return { restClient, graphQLClient, pendingReviewService };
}

describe('GitLabClient', () => {
	it('getCurrentUser caches result', async () => {
		const { restClient, graphQLClient, pendingReviewService } = createMocks();
		restClient.get.mockResolvedValue({ id: 1, username: 'alice' });
		const client = new GitLabClient(restClient, graphQLClient, pendingReviewService);

		await client.getCurrentUser();
		await client.getCurrentUser();

		expect(restClient.get).toHaveBeenCalledTimes(1);
	});

	it('getMergeRequestsForReviewer builds correct query', async () => {
		const { restClient, graphQLClient, pendingReviewService } = createMocks();
		restClient.get.mockResolvedValue([]);
		const client = new GitLabClient(restClient, graphQLClient, pendingReviewService);

		await client.getMergeRequestsForReviewer(1);

		const path = restClient.get.mock.calls[0][0];
		expect(path).toContain('reviewer_id=1');
		expect(path).toContain('state=opened');
		expect(path).toContain('per_page=100');
	});

	it('getMergeRequestDetails merges diff_refs', async () => {
		const { restClient, graphQLClient, pendingReviewService } = createMocks();
		restClient.get.mockImplementation((path: string) => {
			if (path.includes('merge_requests/42')) {
				return Promise.resolve({ diff_refs: { base_sha: 'b', start_sha: 's', head_sha: 'h' } });
			}
			return Promise.resolve([]);
		});
		const client = new GitLabClient(restClient, graphQLClient, pendingReviewService);
		const mr = { project_id: 10, iid: 42, title: 'Fix' };

		const result = await client.getMergeRequestDetails(mr as any);

		expect(result.baseSha).toBe('b');
		expect(result.startSha).toBe('s');
		expect(result.headSha).toBe('h');
	});

	it('getMergeRequestFiles maps diffs', async () => {
		const { restClient, graphQLClient, pendingReviewService } = createMocks();
		restClient.get.mockResolvedValue([
			{ old_path: 'a.ts', new_path: 'a.ts', diff: '+x', new_file: false, deleted_file: false, renamed_file: false },
		]);
		const client = new GitLabClient(restClient, graphQLClient, pendingReviewService);
		const mr = { project_id: 10, iid: 42 };

		const files = await client.getMergeRequestFiles(mr as any);

		expect(files).toHaveLength(1);
		expect(files[0].path).toBe('a.ts');
	});

	it('approveMergeRequest posts to correct path', async () => {
		const { restClient, graphQLClient, pendingReviewService } = createMocks();
		restClient.post.mockResolvedValue(undefined);
		const client = new GitLabClient(restClient, graphQLClient, pendingReviewService);
		const mr = { project_id: 10, iid: 42 };

		await client.approveMergeRequest(mr as any);

		expect(restClient.post).toHaveBeenCalledWith('/api/v4/projects/10/merge_requests/42/approve');
	});

	it('getApprovalData calls graphql', async () => {
		const { restClient, graphQLClient, pendingReviewService } = createMocks();
		graphQLClient.request.mockResolvedValue({
			mr: { reviewers: { nodes: [] } },
		});
		const client = new GitLabClient(restClient, graphQLClient, pendingReviewService);
		const mr = { id: 1, iid: 42, project_id: 10, project_path: 'g/p' };

		await client.getApprovalData(mr as any);

		expect(graphQLClient.request).toHaveBeenCalled();
	});

	it('getPendingReviews delegates to pendingReviewService', async () => {
		const { restClient, graphQLClient, pendingReviewService } = createMocks();
		const mrs = [{ id: 1, iid: 1, project_id: 10, project_path: 'g/p' }];
		restClient.get.mockImplementation((path: string) => {
			if (path.includes('/user')) return Promise.resolve({ id: 1, username: 'alice' });
			return Promise.resolve(mrs);
		});
		pendingReviewService.filterPendingReviews.mockResolvedValue(mrs);
		const client = new GitLabClient(restClient, graphQLClient, pendingReviewService);

		const result = await client.getPendingReviews();

		expect(pendingReviewService.filterPendingReviews).toHaveBeenCalled();
		expect(result).toHaveLength(1);
	});

	it('getMyMergeRequests uses author query', async () => {
		const { restClient, graphQLClient, pendingReviewService } = createMocks();
		restClient.get.mockImplementation((path: string) => {
			if (path.includes('/user')) {
				return Promise.resolve({ id: 1, username: 'alice' });
			}
			return Promise.resolve([]);
		});
		const client = new GitLabClient(restClient, graphQLClient, pendingReviewService);

		await client.getMyMergeRequests();

		const calls = restClient.get.mock.calls;
		const mrCall = calls.find((c: any) => c[0].includes('merge_requests'));
		expect(mrCall[0]).toContain('author_id=1');
	});

	it('getMissedReviews fetches merged and filters pending', async () => {
		const { restClient, graphQLClient, pendingReviewService } = createMocks();
		const mrs = [{ id: 1, iid: 1, project_id: 10, project_path: 'g/p', state: 'merged' }];
		restClient.get.mockImplementation((path: string) => {
			if (path.includes('/user')) return Promise.resolve({ id: 1, username: 'alice' });
			return Promise.resolve(mrs);
		});
		pendingReviewService.filterPendingReviews.mockResolvedValue(mrs);
		const client = new GitLabClient(restClient, graphQLClient, pendingReviewService);

		const result = await client.getMissedReviews();

		expect(pendingReviewService.filterPendingReviews).toHaveBeenCalled();
		expect(result).toHaveLength(1);
	});

	it('getApprovedReviews delegates to pendingReviewService', async () => {
		const { restClient, graphQLClient, pendingReviewService } = createMocks();
		const mrs = [{ id: 1, iid: 1, project_id: 10, project_path: 'g/p' }];
		restClient.get.mockImplementation((path: string) => {
			if (path.includes('/user')) return Promise.resolve({ id: 1, username: 'alice' });
			return Promise.resolve(mrs);
		});
		pendingReviewService.filterApprovedReviews.mockResolvedValue(mrs);
		const client = new GitLabClient(restClient, graphQLClient, pendingReviewService);

		const result = await client.getApprovedReviews();

		expect(pendingReviewService.filterApprovedReviews).toHaveBeenCalled();
		expect(result).toHaveLength(1);
	});

	it('getRequestedChangesReviews delegates to pendingReviewService', async () => {
		const { restClient, graphQLClient, pendingReviewService } = createMocks();
		const mrs = [{ id: 1, iid: 1, project_id: 10, project_path: 'g/p' }];
		restClient.get.mockImplementation((path: string) => {
			if (path.includes('/user')) return Promise.resolve({ id: 1, username: 'alice' });
			return Promise.resolve(mrs);
		});
		pendingReviewService.filterRequestedChangesReviews.mockResolvedValue(mrs);
		const client = new GitLabClient(restClient, graphQLClient, pendingReviewService);

		const result = await client.getRequestedChangesReviews();

		expect(pendingReviewService.filterRequestedChangesReviews).toHaveBeenCalled();
		expect(result).toHaveLength(1);
	});
});