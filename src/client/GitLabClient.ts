import { GitLabGraphQLClient } from './GitLabGraphQLClient';
import { GitLabRestClient } from './GitLabRestClient';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { GitLabUser } from '../model/GitLabUser';
import { PendingReviewService } from '../review/PendingReviewService';

export {
	GitLabMergeRequest,
} from '../model/GitLabMergeRequest';

export {
	GitLabUser,
} from '../model/GitLabUser';

export class GitLabClient {
	private readonly restClient: GitLabRestClient;

	private readonly pendingReviewService:
		PendingReviewService;

	public constructor(
		baseUrl: string,
		token: string,
	) {
		this.restClient = new GitLabRestClient(
			baseUrl,
			token,
		);

		const graphQLClient = new GitLabGraphQLClient(
			baseUrl,
			token,
		);

		this.pendingReviewService =
			new PendingReviewService(graphQLClient);
	}

	public async getCurrentUser(): Promise<GitLabUser> {
		return this.restClient.get<GitLabUser>(
			'/api/v4/user',
		);
	}

	public async getMergeRequestsForReviewer(
		reviewerId: number,
	): Promise<GitLabMergeRequest[]> {
		const query = this.createReviewerQuery(
			reviewerId,
		);

		return this.restClient.get<GitLabMergeRequest[]>(
			`/api/v4/merge_requests?${query}`,
		);
	}

	public async getPendingReviews(
		user: GitLabUser,
	): Promise<GitLabMergeRequest[]> {
		const mergeRequests =
			await this.getMergeRequestsForReviewer(
				user.id,
			);

		if (mergeRequests.length === 0) {
			return [];
		}

		return this.pendingReviewService
			.filterPendingReviews(
				mergeRequests,
				user,
			);
	}

	private createReviewerQuery(
		reviewerId: number,
	): string {
		return new URLSearchParams({
			scope: 'all',
			state: 'opened',
			reviewer_id: reviewerId.toString(),
			order_by: 'updated_at',
			sort: 'desc',
			per_page: '100',
		}).toString();
	}
}