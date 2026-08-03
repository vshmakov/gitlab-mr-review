export interface GitLabMergeRequest {
	id: number;
	iid: number;
	title: string;
	web_url: string;
	project_id: number;
	project_path?: string;
	updated_at: string;
	draft: boolean;
	work_in_progress: boolean;
	baseSha?: string;
	startSha?: string;
	headSha?: string;
	references?: GitLabMergeRequestReferences;
	author?: GitLabMergeRequestAuthor;
	diff_refs?: GitLabMergeRequestDiffRefs;
}

export interface GitLabMergeRequestReferences {
	short?: string;
	relative?: string;
	full?: string;
}

export interface GitLabMergeRequestDiffRefs {
	base_sha: string;
	start_sha: string;
	head_sha: string;
}

export interface GitLabMergeRequestAuthor {
	name: string;
	username: string;
}