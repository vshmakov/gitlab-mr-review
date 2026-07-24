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
		const pendingMergeRequests:
			GitLabMergeRequest[] = [];

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

			const pendingBatch =
				await this.filterPendingBatch(
					batch,
					user.username,
				);

			pendingMergeRequests.push(...pendingBatch);
		}

		return pendingMergeRequests;
	}

	private async filterPendingBatch(
		mergeRequests: GitLabMergeRequest[],
		username: string,
	): Promise<GitLabMergeRequest[]> {
		const approvalStates =
			await this.getApprovalStates(mergeRequests);

		return mergeRequests.filter(
			(_mergeRequest, index) =>
				this.isPendingReview(
					approvalStates[`mr${index}`],
					username,
				),
		);
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
		const approvedMergeRequests:
			GitLabMergeRequest[] = [];

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

			const approvedBatch =
				await this.filterApprovedBatch(
					batch,
					user.username,
				);

			approvedMergeRequests.push(...approvedBatch);
		}

		return approvedMergeRequests;
	}

	private async filterApprovedBatch(
		mergeRequests: GitLabMergeRequest[],
		username: string,
	): Promise<GitLabMergeRequest[]> {
		const approvalStates =
			await this.getApprovalStates(mergeRequests);

		return mergeRequests.filter(
			(_mergeRequest, index) =>
				this.isApprovedByUser(
					approvalStates[`mr${index}`],
					username,
				),
		);
	}
}