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
	project?: {
		fullPath: string;
	};
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