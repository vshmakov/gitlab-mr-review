import { GitLabClient } from '../client/GitLabClient';
import { GitLabClientFactory } from '../client/GitLabClientFactory';
import { GitLabApprovalData } from '../model/GitLabApprovalData';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';

export class MergeRequestApprovalStore {
	private readonly _cache = new Map<
		string,
		GitLabApprovalData
	>();

	private readonly _loading = new Set<string>();

	public constructor(
		private readonly clientFactory:
			GitLabClientFactory,
	) {}

	private key(mergeRequest: GitLabMergeRequest): string {
		return `${mergeRequest.project_id}:${mergeRequest.iid}`;
	}

	public getApprovalData(
		mergeRequest: GitLabMergeRequest,
	): GitLabApprovalData | undefined {
		return this._cache.get(this.key(mergeRequest));
	}

	public isApprovalLoading(
		mergeRequest: GitLabMergeRequest,
	): boolean {
		return this._loading.has(this.key(mergeRequest));
	}

	public async loadApprovalData(
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

		this._loading.add(k);

		try {
			const data =
				await client.getApprovalData(mergeRequest);
			this._cache.set(k, data);
		} catch (e: unknown) {
			this.clientFactory.clear();
			const origMsg = e instanceof Error ? e.message : String(e);
			console.error(`[ApprovalStore MR !${mergeRequest.iid}] Failed:`, origMsg);
			this._cache.set(k, {
				approvedBy: [],
				requestedChanges: [],
			});
			throw new Error(
				`Failed to load approval data: ${origMsg}`,
			);
		} finally {
			this._loading.delete(k);
		}
	}

	public refresh(): void {
		this._cache.clear();
		this._loading.clear();
	}
}
