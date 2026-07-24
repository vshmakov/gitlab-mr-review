import { GitLabClient } from '../client/GitLabClient';
import { GitLabClientFactory } from '../client/GitLabClientFactory';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { GitLabMergeRequestFile } from '../model/GitLabMergeRequestFile';
import { CategoryKey } from './ReviewItem';

const CATEGORY_LOADER: Record<
	CategoryKey,
	(client: GitLabClient) => Promise<GitLabMergeRequest[]>
> = {
	needsReview: (client) => client.getPendingReviews(),
	approved: (client) => client.getApprovedReviews(),
	requestedChanges: (client) =>
		client.getRequestedChangesReviews(),
};

export class ReviewDataSource {
	private readonly _mrCache = new Map<
		CategoryKey,
		GitLabMergeRequest[]
	>();

	private readonly _mrLoading = new Map<
		CategoryKey,
		Promise<GitLabMergeRequest[]>
	>();

	private readonly _filesCache = new Map<
		string,
		GitLabMergeRequestFile[]
	>();

	private readonly _filesLoading = new Map<
		string,
		Promise<GitLabMergeRequestFile[]>
	>();

	public constructor(
		private readonly clientFactory:
			GitLabClientFactory,
	) {}

	public refresh(): void {
		this._mrCache.clear();
		this._mrLoading.clear();
		this._filesCache.clear();
		this._filesLoading.clear();
	}

	public async getMergeRequestsByCategory(
		categoryKey: CategoryKey,
	): Promise<GitLabMergeRequest[]> {
		if (this._mrCache.has(categoryKey)) {
			return this._mrCache.get(categoryKey)!;
		}

		if (this._mrLoading.has(categoryKey)) {
			return this._mrLoading.get(categoryKey)!;
		}

		const request = this.loadByCategory(categoryKey)
			.then(mr => {
				this._mrCache.set(categoryKey, mr);
				return mr;
			})
			.finally(() => {
				this._mrLoading.delete(categoryKey);
			});

		this._mrLoading.set(categoryKey, request);

		return request;
	}

	public async getMergeRequestFiles(
		mergeRequest: GitLabMergeRequest,
	): Promise<GitLabMergeRequestFile[]> {
		const cacheKey =
			this.getMergeRequestCacheKey(mergeRequest);

		if (this._filesCache.has(cacheKey)) {
			return this._filesCache.get(cacheKey)!;
		}

		if (this._filesLoading.has(cacheKey)) {
			return this._filesLoading.get(cacheKey)!;
		}

		const request = this.loadMergeRequestFiles(
			mergeRequest,
		)
			.then(files => {
				this._filesCache.set(cacheKey, files);
				return files;
			})
			.finally(() => {
				this._filesLoading.delete(cacheKey);
			});

		this._filesLoading.set(cacheKey, request);

		return request;
	}

	private async loadByCategory(
		categoryKey: CategoryKey,
	): Promise<GitLabMergeRequest[]> {
		const client = await this.clientFactory.create();
		if (!client) {
			return [];
		}

		try {
			const loader = CATEGORY_LOADER[categoryKey];
			return await loader(client);
		} catch {
			this.clientFactory.clear();
			throw new Error(
				'Не удалось загрузить merge requests',
			);
		}
	}

	private async loadMergeRequestFiles(
		mergeRequest: GitLabMergeRequest,
	): Promise<GitLabMergeRequestFile[]> {
		const client = await this.clientFactory.create();
		if (!client) {
			throw new Error(
				'GitLab client is not initialized',
			);
		}

		return client.getMergeRequestFiles(mergeRequest);
	}

	private getMergeRequestCacheKey(
		mergeRequest: GitLabMergeRequest,
	): string {
		return `${mergeRequest.project_id}:${mergeRequest.iid}`;
	}
}