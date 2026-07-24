import { GitLabGraphQLClient } from '../client/GitLabGraphQLClient';
import {
	GitLabApprovalState,
	GitLabApprovalStatesQuery,
} from '../model/GitLabApprovalState';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { GitLabUser } from '../model/GitLabUser';

export class PendingReviewService {
	private static readonly GRAPHQL_BATCH_SIZE = 10;

	public constructor(
		private readonly graphQLClient:
			GitLabGraphQLClient,
	) {}

	public async filterPendingReviews(
		mergeRequests: GitLabMergeRequest[],
		user: GitLabUser,
	): Promise<GitLabMergeRequest[]> {
		return this.filterByState(
			mergeRequests,
			user,
			(state, username) => this.isPendingReview(state, username),
		);
	}

	private async filterByState(
		mergeRequests: GitLabMergeRequest[],
		user: GitLabUser,
		predicate: (
			state: GitLabApprovalState | null,
			username: string,
		) => boolean,
	): Promise<GitLabMergeRequest[]> {
		const result: GitLabMergeRequest[] = [];

		for (
			let offset = 0;
			offset < mergeRequests.length;
			offset +=
				PendingReviewService.GRAPHQL_BATCH_SIZE
		) {
			const batch = mergeRequests.slice(
				offset,
				offset +
					PendingReviewService
						.GRAPHQL_BATCH_SIZE,
			);

			const batchResult =
				await this.filterBatch(
					batch,
					user.username,
					predicate,
				);

			result.push(...batchResult);
		}

		return result;
	}

	private async filterBatch(
		mergeRequests: GitLabMergeRequest[],
		username: string,
		predicate: (
			state: GitLabApprovalState | null,
			username: string,
		) => boolean,
	): Promise<GitLabMergeRequest[]> {
		const approvalStates =
			await this.getApprovalStates(mergeRequests);

		const result: GitLabMergeRequest[] = [];

		for (let i = 0; i < mergeRequests.length; i++) {
			const mr = mergeRequests[i];
			const state = approvalStates[`mr${i}`];

			if (predicate(state, username)) {
				result.push({
					...mr,
					project_path: state?.project?.fullPath || mr.project_path,
				});
			}
		}

		return result;
	}

	private async getApprovalStates(
		mergeRequests: GitLabMergeRequest[],
	): Promise<GitLabApprovalStatesQuery> {
		const query =
			this.createApprovalStatesQuery(mergeRequests);

		return this.graphQLClient
			.request<GitLabApprovalStatesQuery>(query);
	}

	private createApprovalStatesQuery(
		mergeRequests: GitLabMergeRequest[],
	): string {
		const fields = mergeRequests.map(
			(mergeRequest, index) =>
				this.createMergeRequestField(
					mergeRequest,
					index,
				),
		);

		return `
			query ApprovalStates {
				${fields.join('\n')}
			}
		`;
	}

	private createMergeRequestField(
		mergeRequest: GitLabMergeRequest,
		index: number,
	): string {
		const globalId =
			`gid://gitlab/MergeRequest/${mergeRequest.id}`;

		return `
			mr${index}: mergeRequest(
				id: ${JSON.stringify(globalId)}
			) {
				project {
					fullPath
				}

				approvedBy {
					nodes {
						username
					}
				}

				reviewers {
					nodes {
						username

						mergeRequestInteraction {
							reviewState
						}
					}
				}
			}
		`;
	}

	private isPendingReview(
		approvalState: GitLabApprovalState | null,
		username: string,
	): boolean {
		return (
			!this.isApprovedByUser(
				approvalState,
				username,
			) &&
			!this.hasRequestedChanges(
				approvalState,
				username,
			)
		);
	}

	private isApprovedByUser(
		approvalState: GitLabApprovalState | null,
		username: string,
	): boolean {
		const approvers =
			approvalState?.approvedBy?.nodes ?? [];

		return approvers.some(
			approver =>
				approver.username === username,
		);
	}

	private hasRequestedChanges(
		approvalState: GitLabApprovalState | null,
		username: string,
	): boolean {
		const reviewers =
			approvalState?.reviewers?.nodes ?? [];

		const currentReviewer = reviewers.find(
			reviewer =>
				reviewer.username === username,
		);

		return (
			currentReviewer
				?.mergeRequestInteraction
				?.reviewState === 'REQUESTED_CHANGES'
		);
	}

	public async filterApprovedReviews(
		mergeRequests: GitLabMergeRequest[],
		user: GitLabUser,
	): Promise<GitLabMergeRequest[]> {
		return this.filterByState(
			mergeRequests,
			user,
			(state, username) => this.isApprovedByUser(state, username),
		);
	}

	public async filterRequestedChangesReviews(
		mergeRequests: GitLabMergeRequest[],
		user: GitLabUser,
	): Promise<GitLabMergeRequest[]> {
		return this.filterByState(
			mergeRequests,
			user,
			(state, username) => this.hasRequestedChanges(state, username),
		);
	}
}