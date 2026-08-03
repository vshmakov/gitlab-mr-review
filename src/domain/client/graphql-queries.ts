import { GitLabApprovalData } from '../model/GitLabApprovalData';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { GitLabGraphQLClient } from './GitLabGraphQLClient';

/** GitLab GraphQL review states. */
export const REVIEW_APPROVED = 'APPROVED';
export const REVIEW_REQUESTED_CHANGES = 'REQUESTED_CHANGES';

/**
 * Fetches reviewers and their review states for a single merge request.
 * Returns { mr: { reviewers: { nodes: [{ username, name, mergeRequestInteraction }] } } }.
 */
function buildApprovalDataQuery(globalId: string): string {
	return `
		query {
			mr: mergeRequest(id: "${globalId}") {
				reviewers {
					nodes {
						username
						name
						mergeRequestInteraction {
							reviewState
						}
					}
				}
			}
		}
	`;
}

export async function fetchApprovalData(
	mergeRequest: GitLabMergeRequest,
	graphQLClient: GitLabGraphQLClient,
): Promise<GitLabApprovalData> {
	const globalId = `gid://gitlab/MergeRequest/${mergeRequest.id}`;
	const query = buildApprovalDataQuery(globalId);

	const data = await graphQLClient.request<{
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