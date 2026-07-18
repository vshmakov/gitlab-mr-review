export interface GitLabMergeRequest {
	id: number;
	iid: number;
	title: string;
	web_url: string;
	project_id: number;
	updated_at: string;
	draft: boolean;
	work_in_progress: boolean;
	references?: GitLabMergeRequestReferences;
	author?: GitLabMergeRequestAuthor;
}

export interface GitLabMergeRequestReferences {
	short?: string;
	relative?: string;
	full?: string;
}

export interface GitLabMergeRequestAuthor {
	name: string;
	username: string;
}