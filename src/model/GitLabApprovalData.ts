export interface GitLabApprovalUser {
	name: string;
	username: string;
}

export interface GitLabApprovalData {
	approvedBy: GitLabApprovalUser[];
	requestedChanges: GitLabApprovalUser[];
}
