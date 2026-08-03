/** GitLab GraphQL review states. */
export const REVIEW_APPROVED = 'APPROVED';
export const REVIEW_REQUESTED_CHANGES = 'REQUESTED_CHANGES';

/**
 * Fetches reviewers and their review states for a single merge request.
 * Returns { mr: { reviewers: { nodes: [{ username, name, mergeRequestInteraction }] } } }.
 */
export function buildApprovalDataQuery(globalId: string): string {
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