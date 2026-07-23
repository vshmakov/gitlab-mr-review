import { GitLabRestClient } from './GitLabRestClient';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { GitLabMergeRequestFile } from '../model/GitLabMergeRequestFile';

export interface GitLabNote {
	id: number;
}

export class GitLabNoteClient {
	public constructor(private readonly restClient: GitLabRestClient) {}

	public async createDraftNote(
		mergeRequest: GitLabMergeRequest,
		file: GitLabMergeRequestFile,
		body: string,
		oldLine?: number,
		newLine?: number,
	): Promise<GitLabNote> {
		const path =
			`/api/v4/projects/${mergeRequest.project_id}/` +
			`merge_requests/${mergeRequest.iid}/notes`;

		return this.restClient.post<GitLabNote>(path, {
			body,
			draft: true,
			position: {
				base_sha: mergeRequest.baseSha,
				start_sha: mergeRequest.startSha,
				head_sha: mergeRequest.headSha,
				position_type: 'text',
				old_path: file.oldPath,
				new_path: file.newPath,
				old_line: oldLine,
				new_line: newLine,
			},
		});
	}

	public async submitNote(
		mergeRequest: GitLabMergeRequest,
		noteId: number,
	): Promise<GitLabNote> {
		const path =
			`/api/v4/projects/${mergeRequest.project_id}/` +
			`merge_requests/${mergeRequest.iid}/notes/${noteId}`;

		return this.restClient.patch<GitLabNote>(path, {
			draft: false,
		});
	}
}