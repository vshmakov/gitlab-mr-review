import { GitLabRestClient } from './GitLabRestClient';
import { GitLabNoteClient } from './GitLabNoteClient';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import {
	GitLabMergeRequestDiffResponse,
	GitLabMergeRequestFile,
} from '../model/GitLabMergeRequestFile';
import { GitLabUser } from '../model/GitLabUser';
import { PendingReviewService } from '../review/PendingReviewService';

export class GitLabClient {
	private readonly restClient: GitLabRestClient;

	private readonly noteClient: GitLabNoteClient;

	private readonly pendingReviewService:
		PendingReviewService;

	public constructor(
		restClient: GitLabRestClient,
		noteClient: GitLabNoteClient,
		pendingReviewService: PendingReviewService,
	) {
		this.restClient = restClient;
		this.noteClient = noteClient;
		this.pendingReviewService = pendingReviewService;
	}

	public getNoteClient(): GitLabNoteClient {
		return this.noteClient;
	}

	public async getCurrentUser(): Promise<GitLabUser> {
		return this.restClient.get<GitLabUser>('/api/v4/user');
	}

	public async getMergeRequestsForReviewer(
		reviewerId: number,
	): Promise<GitLabMergeRequest[]> {
		const query = this.createReviewerQuery(reviewerId);

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

	public async getPendingReviews(
		user: GitLabUser,
	): Promise<GitLabMergeRequest[]> {
		const mergeRequests =
			await this.getMergeRequestsForReviewer(user.id);

		if (mergeRequests.length === 0) {
			return [];
		}

		return this.pendingReviewService.filterPendingReviews(
			mergeRequests,
			user,
		);
	}

	public async getApprovedReviews(
		user: GitLabUser,
	): Promise<GitLabMergeRequest[]> {
		const mergeRequests =
			await this.getMergeRequestsForReviewer(user.id);

		if (mergeRequests.length === 0) {
			return [];
		}

		return this.pendingReviewService.filterApprovedReviews(
			mergeRequests,
			user,
		);
	}

	public async getRequestedChangesReviews(
		user: GitLabUser,
	): Promise<GitLabMergeRequest[]> {
		const mergeRequests =
			await this.getMergeRequestsForReviewer(user.id);

		if (mergeRequests.length === 0) {
			return [];
		}

		return this.pendingReviewService.filterRequestedChangesReviews(
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

		return diffs.map(diff =>
			this.mapMergeRequestFile(diff),
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