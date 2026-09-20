import { normalizeBaseUrl } from './url-utils';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { GitLabMergeRequestFile } from '../model/GitLabMergeRequestFile';
import { HttpClient } from '../interfaces/http';

type NoteMergeRequest = Pick<
	GitLabMergeRequest,
	'project_id' | 'iid' | 'baseSha' | 'startSha' | 'headSha'
>;

type NoteFile = Pick<GitLabMergeRequestFile, 'path' | 'oldPath' | 'newPath'>;

export interface GitLabNote {
	id: number;
}

export class GitLabNoteClient {
	private readonly baseUrl: string;
	private readonly token: string;

	public constructor(
		baseUrl: string,
		token: string,
		private readonly http: HttpClient,
	) {
		this.baseUrl = normalizeBaseUrl(baseUrl);
		this.token = token;
	}

	public async createDraftNote(
		mergeRequest: NoteMergeRequest,
		file: NoteFile,
		body: string,
		oldLine?: number,
		newLine?: number,
	): Promise<GitLabNote> {
		const path =
			`/api/v4/projects/${mergeRequest.project_id}/` +
			`merge_requests/${mergeRequest.iid}/draft_notes`;

		const formData = new FormData();

		formData.append('note', body);
		formData.append('position[position_type]', 'text');
		formData.append('position[base_sha]', mergeRequest.baseSha ?? '');
		formData.append('position[start_sha]', mergeRequest.startSha ?? '');
		formData.append('position[head_sha]', mergeRequest.headSha ?? '');
		formData.append('position[old_path]', file.oldPath);
		formData.append('position[new_path]', file.newPath);

		if (oldLine !== null && oldLine !== undefined) {
			formData.append('position[old_line]', String(oldLine));
		}

		if (newLine !== null && newLine !== undefined) {
			formData.append('position[new_line]', String(newLine));
		}

		const response = await this.http.request(`${this.baseUrl}${path}`, {
			method: 'POST',
			headers: {
				'PRIVATE-TOKEN': this.token,
			},
			body: formData,
		});

		if (!response.ok) {
			const text = await response.text();
			throw new Error(
				`GitLab API ${response.status}: ${text}`,
			);
		}

		return response.json<GitLabNote>();
	}

	public async submitNote(
		mergeRequest: GitLabMergeRequest,
		noteId: number,
	): Promise<GitLabNote> {
		const path =
			`/api/v4/projects/${mergeRequest.project_id}/` +
			`merge_requests/${mergeRequest.iid}/notes/${noteId}`;

		const response = await this.http.request(`${this.baseUrl}${path}`, {
			method: 'PATCH',
			headers: {
				'PRIVATE-TOKEN': this.token,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ draft: false }),
		});

		if (!response.ok) {
			const text = await response.text();
			throw new Error(
				`GitLab API ${response.status}: ${text}`,
			);
		}

		return response.json<GitLabNote>();
	}
}