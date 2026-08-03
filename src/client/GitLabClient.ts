import {
	REVIEW_APPROVED,
	REVIEW_REQUESTED_CHANGES,
	buildApprovalDataQuery,
} from './graphql-queries';
import { GitLabRestClient } from './GitLabRestClient';
import { GitLabGraphQLClient } from './GitLabGraphQLClient';
import { GitLabNoteClient } from './GitLabNoteClient';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import {
	GitLabMergeRequestDiffResponse,
	GitLabMergeRequestFile,
} from '../model/GitLabMergeRequestFile';
import { GitLabUser } from '../model/GitLabUser';
import { GitLabApprovalData } from '../model/GitLabApprovalData';
import { PendingReviewService } from '../review/PendingReviewService';

export class GitLabClient {
	private readonly restClient: GitLabRestClient;

	private readonly graphQLClient: GitLabGraphQLClient;

	private readonly noteClient: GitLabNoteClient;

	private readonly pendingReviewService:
		PendingReviewService;

	private _currentUser: GitLabUser | null = null;

	public constructor(
		restClient: GitLabRestClient,
		graphQLClient: GitLabGraphQLClient,
		noteClient: GitLabNoteClient,
		pendingReviewService: PendingReviewService,
	) {
		this.restClient = restClient;
		this.graphQLClient = graphQLClient;
		this.noteClient = noteClient;
		this.pendingReviewService = pendingReviewService;
	}

	public getNoteClient(): GitLabNoteClient {
		return this.noteClient;
	}

	public async getCurrentUser(): Promise<GitLabUser> {
		if (this._currentUser) {
			return this._currentUser;
		}

		this._currentUser =
			await this.restClient.get<GitLabUser>('/api/v4/user');
		return this._currentUser;
	}

	public async getMergeRequestsForReviewer(
		reviewerId: number,
	): Promise<GitLabMergeRequest[]> {
		const query = this.createReviewerQuery(reviewerId);

		return this.restClient.get<GitLabMergeRequest[]>(
			`/api/v4/merge_requests?${query}`,
		);
	}

	private async getMergedRequestsForReviewer(
		reviewerId: number,
	): Promise<GitLabMergeRequest[]> {
		const query =
			this.createReviewerQuery(reviewerId, 'merged', 20);

		return this.restClient.get<GitLabMergeRequest[]>(
			`/api/v4/merge_requests?${query}`,
		);
	}

	public async getMergeRequestDetails(
		mergeRequest: GitLabMergeRequest,
	): Promise<GitLabMergeRequest> {
		const path =
			`/api/v4/projects/${mergeRequest.project_id}/` +
			`merge_requests/${mergeRequest.iid}`;

		const details =
			await this.restClient.get<GitLabMergeRequest>(path);

		return {
			...mergeRequest,
			...details,
			baseSha: details.diff_refs?.base_sha,
			startSha: details.diff_refs?.start_sha,
			headSha: details.diff_refs?.head_sha,
		};
	}

	public async getPendingReviews():
		Promise<GitLabMergeRequest[]> {
		const user = await this.getCurrentUser();
		return this.filterReviewsByState(
			user,
			(mr, u) =>
				this.pendingReviewService.filterPendingReviews(
					mr,
					u,
				),
		);
	}

	public async getApprovedReviews():
		Promise<GitLabMergeRequest[]> {
		const user = await this.getCurrentUser();
		return this.filterReviewsByState(
			user,
			(mr, u) =>
				this.pendingReviewService.filterApprovedReviews(
					mr,
					u,
				),
		);
	}

	public async getRequestedChangesReviews():
		Promise<GitLabMergeRequest[]> {
		const user = await this.getCurrentUser();
		return this.filterReviewsByState(
			user,
			(mr, u) =>
				this.pendingReviewService
					.filterRequestedChangesReviews(mr, u),
		);
	}

	public async getMissedReviews():
		Promise<GitLabMergeRequest[]> {
		const user = await this.getCurrentUser();
		const mergeRequests =
			await this.getMergedRequestsForReviewer(
				user.id,
			);

		if (mergeRequests.length === 0) {
			return [];
		}

		return this.pendingReviewService.filterPendingReviews(
			mergeRequests,
			user,
		);
	}

	public async getMyMergeRequests():
		Promise<GitLabMergeRequest[]> {
		const user = await this.getCurrentUser();
		return this.restClient.get<GitLabMergeRequest[]>(
			`/api/v4/merge_requests?${this.createAuthorQuery(user.id)}`,
		);
	}

	private async filterReviewsByState(
		user: GitLabUser,
		filterFn: (
			mr: GitLabMergeRequest[],
			u: GitLabUser,
		) => Promise<GitLabMergeRequest[]>,
	): Promise<GitLabMergeRequest[]> {
		const mergeRequests =
			await this.getMergeRequestsForReviewer(user.id);

		if (mergeRequests.length === 0) {
			return [];
		}

		return filterFn(mergeRequests, user);
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

		return diffs.map(diff =>
			this.mapMergeRequestFile(diff),
		);
	}

	public async approveMergeRequest(
		mergeRequest: GitLabMergeRequest,
	): Promise<void> {
		const path =
			`/api/v4/projects/${mergeRequest.project_id}/` +
			`merge_requests/${mergeRequest.iid}/approve`;

		await this.restClient.post(path);
	}

	public async getApprovalData(
		mergeRequest: GitLabMergeRequest,
	): Promise<GitLabApprovalData> {
		const globalId =
			`gid://gitlab/MergeRequest/${mergeRequest.id}`;

		const query = buildApprovalDataQuery(globalId);

		const data = await this.graphQLClient.request<{
			mr: {
				reviewers: { nodes: {
					username: string;
						name: string;
					mergeRequestInteraction?: {
						reviewState: string;
					};
				}[] };
			};
		}>(query);

		const reviewers = data.mr.reviewers?.nodes ?? [];
		return {
			approvedBy: reviewers
				.filter(n => n.mergeRequestInteraction?.reviewState === REVIEW_APPROVED)
				.map(n => ({ name: n.name, username: n.username })),
			requestedChanges: reviewers
				.filter(n => n.mergeRequestInteraction?.reviewState === REVIEW_REQUESTED_CHANGES)
				.map(n => ({ name: n.name, username: n.username })),
		};
	}

	private createReviewerQuery(
		reviewerId: number,
		state: string = 'opened',
		perPage: number = 100,
	): string {
		return new URLSearchParams({
			scope: 'all',
			state,
			reviewer_id: reviewerId.toString(),
			order_by: 'updated_at',
			sort: 'desc',
			per_page: perPage.toString(),
		}).toString();
	}

	private createAuthorQuery(
		authorId: number,
	): string {
		return new URLSearchParams({
			scope: 'all',
			state: 'opened',
			author_id: authorId.toString(),
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