import {
	GitLabClient,
	GitLabMergeRequest,
	GitLabMergeRequestFile,
} from '../client/GitLabClient';
import { GitLabClientFactory } from './GitLabClientFactory';

export class ReviewDataSource {
	private client?: GitLabClient;

	private mergeRequests?: GitLabMergeRequest[];

	private mergeRequestsLoading?:
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
		this.client = undefined;
		this.mergeRequests = undefined;
		this.mergeRequestsLoading = undefined;

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
				this.mergeRequests =
					mergeRequests;

				return mergeRequests;
			})
			.finally(() => {
				this.mergeRequestsLoading =
					undefined;
			});

		this.mergeRequestsLoading = request;

		return request;
	}

	public async getMergeRequestFiles(
		mergeRequest: GitLabMergeRequest,
	): Promise<GitLabMergeRequestFile[]> {
		const cacheKey =
			this.getMergeRequestCacheKey(
				mergeRequest,
			);

		const cachedFiles =
			this.filesCache.get(cacheKey);

		if (cachedFiles) {
			return cachedFiles;
		}

		const loadingFiles =
			this.filesLoading.get(cacheKey);

		if (loadingFiles) {
			return loadingFiles;
		}

		const client = this.client;

		if (!client) {
			throw new Error(
				'GitLab client is not initialized',
			);
		}

		const request = client
			.getMergeRequestFiles(mergeRequest)
			.then(files => {
				this.filesCache.set(
					cacheKey,
					files,
				);

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
		const client =
			await this.clientFactory.create();

		if (!client) {
			this.client = undefined;

			return [];
		}

		this.client = client;

		try {
			const user =
				await client.getCurrentUser();

			return await client.getPendingReviews(
				user,
			);
		} catch (error: unknown) {
			this.client = undefined;

			throw error;
		}
	}

	private getMergeRequestCacheKey(
		mergeRequest: GitLabMergeRequest,
	): string {
		return (
			`${mergeRequest.project_id}:` +
			`${mergeRequest.iid}`
		);
	}
}