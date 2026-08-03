import { normalizeBaseUrl } from './url-utils';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { GitLabMergeRequestFile } from '../model/GitLabMergeRequestFile';
import { HttpClient } from '../interfaces/http';

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
		mergeRequest: GitLabMergeRequest,
		file: GitLabMergeRequestFile,
		body: string,
		oldLine?: number,
		newLine?: number,
	): Promise<GitLabNote> {
		const path =
			`/api/v4/projects/${mergeRequest.project_id}/` +
			`merge_requests/${mergeRequest.iid}/draft_notes`;

		const formData = new URLSearchParams();

		formData.append('note', body);
		formData.append('position[position_type]', 'text');
		formData.append('position[base_sha]', mergeRequest.baseSha ?? '');
		formData.append('position[start_sha]', mergeRequest.startSha ?? '');
		formData.append('position[head_sha]', mergeRequest.headSha ?? '');
		formData.append('position[old_path]', file.oldPath);
		formData.append('position[new_path]', file.newPath);

		if (oldLine != null) {
			formData.append('position[old_line]', String(oldLine));
		}

		if (newLine != null) {
			formData.append('position[new_line]', String(newLine));
		}

		const response = await this.http.request(`${this.baseUrl}${path}`, {
			method: 'POST',
			headers: {
				'PRIVATE-TOKEN': this.token,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: formData.toString(),
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