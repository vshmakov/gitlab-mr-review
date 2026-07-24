import { GitLabClientFactory } from '../client/GitLabClientFactory';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { GitLabMergeRequestFile } from '../model/GitLabMergeRequestFile';

export class ReviewDataSource {
	private mergeRequests?: GitLabMergeRequest[];

	private mergeRequestsLoading?:
		Promise<GitLabMergeRequest[]>;

	private approvedMergeRequests?: GitLabMergeRequest[];

	private approvedMergeRequestsLoading?:
		Promise<GitLabMergeRequest[]>;

	private readonly filesCache = new Map<
		string,
		GitLabMergeRequestFile[]
	>();

	private readonly filesLoading = new Map<
		string,
		Promise<GitLabMergeRequestFile[]>
	>();

	public constructor(
		private readonly clientFactory:
			GitLabClientFactory,
	) {}

	public refresh(): void {
		this.mergeRequests = undefined;
		this.mergeRequestsLoading = undefined;

		this.approvedMergeRequests = undefined;
		this.approvedMergeRequestsLoading = undefined;

		this.filesCache.clear();
		this.filesLoading.clear();
	}

	public async getMergeRequests():
		Promise<GitLabMergeRequest[]> {
		if (this.mergeRequests) {
			return this.mergeRequests;
		}

		if (this.mergeRequestsLoading) {
			return this.mergeRequestsLoading;
		}

		const request = this.loadMergeRequests()
			.then(mergeRequests => {
				this.mergeRequests = mergeRequests;
				return mergeRequests;
			})
			.finally(() => {
				this.mergeRequestsLoading = undefined;
			});

		this.mergeRequestsLoading = request;

		return request;
	}

	public async getApprovedMergeRequests():
		Promise<GitLabMergeRequest[]> {
		if (this.approvedMergeRequests) {
			return this.approvedMergeRequests;
		}

		if (this.approvedMergeRequestsLoading) {
			return this.approvedMergeRequestsLoading;
		}

		const request = this.loadApprovedMergeRequests()
			.then(mergeRequests => {
				this.approvedMergeRequests = mergeRequests;
				return mergeRequests;
			})
			.finally(() => {
				this.approvedMergeRequestsLoading = undefined;
			});

		this.approvedMergeRequestsLoading = request;

		return request;
	}

	public async getMergeRequestFiles(
		mergeRequest: GitLabMergeRequest,
	): Promise<GitLabMergeRequestFile[]> {
		const cacheKey =
			this.getMergeRequestCacheKey(mergeRequest);

		const cachedFiles = this.filesCache.get(cacheKey);
		if (cachedFiles) {
			return cachedFiles;
		}

		const loadingFiles = this.filesLoading.get(cacheKey);
		if (loadingFiles) {
			return loadingFiles;
		}

		const request = this.loadMergeRequestFiles(
			mergeRequest,
		)
			.then(files => {
				this.filesCache.set(cacheKey, files);
				return files;
			})
			.finally(() => {
				this.filesLoading.delete(cacheKey);
			});

		this.filesLoading.set(cacheKey, request);

		return request;
	}

	private async loadMergeRequests():
		Promise<GitLabMergeRequest[]> {
		const client = await this.clientFactory.create();
		if (!client) {
			return [];
		}

		try {
			const user = await client.getCurrentUser();
			return await client.getPendingReviews(user);
		} catch {
			this.clientFactory.clear();
			throw new Error(
				'Не удалось загрузить merge requests',
			);
		}
	}

	private async loadApprovedMergeRequests():
		Promise<GitLabMergeRequest[]> {
		const client = await this.clientFactory.create();
		if (!client) {
			return [];
		}

		try {
			const user = await client.getCurrentUser();
			return await client.getApprovedReviews(user);
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