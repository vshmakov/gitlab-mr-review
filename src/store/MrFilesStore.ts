import { GitLabClient } from '../client/GitLabClient';
import { GitLabClientFactory } from '../client/GitLabClientFactory';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { GitLabMergeRequestFile } from '../model/GitLabMergeRequestFile';

export class MrFilesStore {
	private readonly _cache = new Map<
		string,
		GitLabMergeRequestFile[]
	>();

	public constructor(
		private readonly clientFactory:
			GitLabClientFactory,
	) {}

	public getFiles(
		mergeRequest: GitLabMergeRequest,
	): GitLabMergeRequestFile[] | undefined {
		const key =
			`${mergeRequest.project_id}:${mergeRequest.iid}`;
		return this._cache.get(key);
	}

	public async loadFiles(
		mergeRequest: GitLabMergeRequest,
	): Promise<void> {
		if (this.getFiles(mergeRequest)) {
			return;
		}

		const client = await this.clientFactory.create();
		if (!client) {
			return;
		}

		try {
			const files =
				await client.getMergeRequestFiles(mergeRequest);
			const key =
				`${mergeRequest.project_id}:${mergeRequest.iid}`;
			this._cache.set(key, files);
		} catch {
			this.clientFactory.clear();
			throw new Error(
				'Не удалось загрузить файлы merge request',
			);
		}
	}

	public refresh(): void {
		this._cache.clear();
	}
}