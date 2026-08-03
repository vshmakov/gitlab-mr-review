import { GitLabClient } from '../client/GitLabClient';
import { GitLabClientFactory } from '../client/GitLabClientFactory';
import { Notifier } from '../interfaces/notifier';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { GitLabMergeRequestFile } from '../model/GitLabMergeRequestFile';

export class MergeRequestFilesStore {
	private readonly _cache = new Map<
		string,
		GitLabMergeRequestFile[]
	>();

	private readonly _loadingFiles = new Set<string>();

	public constructor(
		private readonly clientFactory: GitLabClientFactory,
		private readonly notifier: Notifier,
	) {}

	private key(mergeRequest: GitLabMergeRequest): string {
		return `${mergeRequest.project_id}:${mergeRequest.iid}`;
	}

	public getFiles(
		mergeRequest: GitLabMergeRequest,
	): GitLabMergeRequestFile[] | undefined {
		return this._cache.get(this.key(mergeRequest));
	}

	public isFilesLoading(
		mergeRequest: GitLabMergeRequest,
	): boolean {
		return this._loadingFiles.has(this.key(mergeRequest));
	}

	public hasFiles(
		mergeRequest: GitLabMergeRequest,
	): boolean {
		return this._cache.has(this.key(mergeRequest));
	}

	public async loadFiles(
		mergeRequest: GitLabMergeRequest,
	): Promise<void> {
		const k = this.key(mergeRequest);
		if (this._cache.has(k)) {
			return;
		}

		const client = await this.clientFactory.create();
		if (!client) {
			return;
		}

		this._loadingFiles.add(k);

		try {
			const files =
				await client.getMergeRequestFiles(mergeRequest);
			this._cache.set(k, files);
		} catch (error: unknown) {
			const message =
				error instanceof Error
					? error.message
					: String(error);
			console.error('[FilesStore] loadFiles failed:', message);
			this.notifier.showError(
				`Не удалось загрузить файлы: ${message}`,
			);
			this.clientFactory.clear();
			throw new Error(
				`Не удалось загрузить файлы merge request: ${message}`,
			);
		} finally {
			this._loadingFiles.delete(k);
		}
	}

	public refresh(): void {
		this._cache.clear();
		this._loadingFiles.clear();
	}
}