export interface GitLabMergeRequestFile {
	path: string;
	oldPath: string;
	newPath: string;
	added: boolean;
	deleted: boolean;
	renamed: boolean;
}

export interface GitLabMergeRequestDiffResponse {
	old_path: string;
	new_path: string;
	new_file: boolean;
	deleted_file: boolean;
	renamed_file: boolean;
}