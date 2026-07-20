import { GitLabGraphQLClient } from './GitLabGraphQLClient';
import { GitLabRestClient } from './GitLabRestClient';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import {
	GitLabMergeRequestDiffResponse,
	GitLabMergeRequestFile,
} from '../model/GitLabMergeRequestFile';
import { GitLabUser } from '../model/GitLabUser';
import { PendingReviewService } from '../review/PendingReviewService';

export {
	GitLabMergeRequest,
} from '../model/GitLabMergeRequest';

export {
	GitLabMergeRequestFile,
} from '../model/GitLabMergeRequestFile';

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

	public async getMergeRequestFiles(
		mergeRequest: GitLabMergeRequest,
	): Promise<GitLabMergeRequestFile[]> {
		const path = this.createMergeRequestDiffsPath(
			mergeRequest,
		);

		const diffs =
			await this.restClient.get<
				GitLabMergeRequestDiffResponse[]
			>(path);

		return diffs.map(
			diff => this.mapMergeRequestFile(diff),
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

	private createMergeRequestDiffsPath(
	mergeRequest: GitLabMergeRequest,
): string {
	const query = new URLSearchParams({
		per_page: '100',
	}).toString();

	return (
		`/api/v4/projects/` +
		`${mergeRequest.project_id}/` +
		`merge_requests/${mergeRequest.iid}/diffs?${query}`
	);
}

	private mapMergeRequestFile(
	diff: GitLabMergeRequestDiffResponse,
): GitLabMergeRequestFile {
	return {
		path: diff.deleted_file
			? diff.old_path
			: diff.new_path,
		oldPath: diff.old_path,
		newPath: diff.new_path,
		diff: diff.diff,
		added: diff.new_file,
		deleted: diff.deleted_file,
		renamed: diff.renamed_file,
	};
}
}