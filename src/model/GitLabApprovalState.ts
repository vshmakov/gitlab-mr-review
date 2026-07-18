export interface GitLabGraphQLUser {
	username: string;
}

export interface GitLabGraphQLReviewer
	extends GitLabGraphQLUser {
	mergeRequestInteraction?: {
		reviewState: string;
	};
}

export interface GitLabApprovalState {
	approvedBy?: {
		nodes: GitLabGraphQLUser[];
	};
	reviewers?: {
		nodes: GitLabGraphQLReviewer[];
	};
}

export type GitLabApprovalStatesQuery = Record<
	string,
	GitLabApprovalState | null
>;