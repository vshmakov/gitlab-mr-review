import { EventEmitter, createEventEmitter } from './event';
import { GitLabClient } from '../client/GitLabClient';
import { GitLabClientFactory } from '../client/GitLabClientFactory';
import { Notifier } from '../interfaces/notifier';
import { GitLabApprovalData } from '../model/GitLabApprovalData';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { MergeRequestCategory } from '../tree/MergeRequestItem';
import { MergeRequestApprovalStore } from './MergeRequestApprovalStore';
import { MergeRequestFilesStore } from './MergeRequestFilesStore';
import { ReviewedFilesStore } from './ReviewedFilesStore';

const CATEGORY_LOADER: Record<
	MergeRequestCategory,
	(client: GitLabClient) => Promise<GitLabMergeRequest[]>
> = {
	needsReview: (c) => c.getPendingReviews(),
	approved: (c) => c.getApprovedReviews(),
	requestedChanges: (c) => c.getRequestedChangesReviews(),
	missed: (c) => c.getMissedReviews(),
	my: (c) => c.getMyMergeRequests(),
};

const CATEGORY_DATA: Record<MergeRequestCategory, string> = {
	needsReview: 'pendingMergeRequests',
	approved: 'approvedMergeRequests',
	requestedChanges: 'requestedChangesMergeRequests',
	missed: 'missedMergeRequests',
	my: 'myMergeRequests',
};

export type LoadingState =
	| 'idle'
	| MergeRequestCategory
	| 'files';

export class MergeRequestsStore {
	private readonly _cache = new Map<
		MergeRequestCategory,
		GitLabMergeRequest[]
	>();

	private readonly _loadedCategories =
		new Set<MergeRequestCategory>();

	private _loading: LoadingState = 'idle';

	private _error: string | undefined;

	private readonly changeEmitter: EventEmitter<void> =
		createEventEmitter<void>();

	public readonly onDidChange =
		this.changeEmitter.event;

	public readonly files: MergeRequestFilesStore;

	public readonly approvalStore: MergeRequestApprovalStore;

	public readonly reviewed: ReviewedFilesStore;

	public constructor(
		private readonly clientFactory: GitLabClientFactory,
		private readonly notifier: Notifier,
	) {
		this.files = new MergeRequestFilesStore(
			clientFactory,
			notifier,
		);
		this.approvalStore = new MergeRequestApprovalStore(
			clientFactory,
			notifier,
		);
		this.reviewed = new ReviewedFilesStore();
	}

	// -- Category state --

	public isCategoryLoading(category: MergeRequestCategory): boolean {
		return this._loading === category;
	}

	public isCategoryLoaded(category: MergeRequestCategory): boolean {
		return this._loadedCategories.has(category);
	}

	public getCategoryMRs(category: MergeRequestCategory): GitLabMergeRequest[] {
		return this._cache.get(category) ?? [];
	}

	// -- Legacy accessors (kept for compatibility) --

	public get pendingMergeRequests(): GitLabMergeRequest[] {
		return this._cache.get('needsReview') ?? [];
	}

	public get approvedMergeRequests(): GitLabMergeRequest[] {
		return this._cache.get('approved') ?? [];
	}

	public get requestedChangesMergeRequests(): GitLabMergeRequest[] {
		return this._cache.get('requestedChanges') ?? [];
	}

	public get missedMergeRequests(): GitLabMergeRequest[] {
		return this._cache.get('missed') ?? [];
	}

	public get myMergeRequests(): GitLabMergeRequest[] {
		return this._cache.get('my') ?? [];
	}

	public get loading(): LoadingState {
		return this._loading;
	}

	public get error(): string | undefined {
		return this._error;
	}

	// -- File state --

	public isFilesLoading(
		mergeRequest: GitLabMergeRequest,
	): boolean {
		return this.files.isFilesLoading(mergeRequest);
	}

	// -- Approval state --

	public isApprovalLoading(
		mergeRequest: GitLabMergeRequest,
	): boolean {
		return this.approvalStore.isApprovalLoading(mergeRequest);
	}

	public getApprovalData(
		mergeRequest: GitLabMergeRequest,
	): GitLabApprovalData | undefined {
		return this.approvalStore.getApprovalData(mergeRequest);
	}

	public async loadApprovalData(
		mergeRequest: GitLabMergeRequest,
	): Promise<void> {
		try {
			await this.approvalStore.loadApprovalData(mergeRequest);
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			this.notifier.showError(
				`Failed to load approval data for MR !${mergeRequest.iid}: ${msg}`,
			);
		}
		this.changeEmitter.fire();
	}


	// -- Actions --

	public async loadPending(): Promise<void> {
		await this.loadCategory('needsReview');
	}

	public async loadApproved(): Promise<void> {
		await this.loadCategory('approved');
	}

	public async loadRequestedChanges(): Promise<void> {
		await this.loadCategory('requestedChanges');
	}

	public async loadMissedReview(): Promise<void> {
		await this.loadCategory('missed');
	}

	public async loadMyMergeRequests(): Promise<void> {
		await this.loadCategory('my');
	}

	private async loadCategory(
		category: MergeRequestCategory,
	): Promise<void> {
		if (this._loadedCategories.has(category)) {
			return;
		}

		this._loading = category;
		this._error = undefined;
		this.notify();

		try {
			const mr = await this.fetchByCategory(category);
			this._cache.set(category, mr);
			this._loadedCategories.add(category);
		} catch (e: unknown) {
			this._error = e instanceof Error
				? e.message
				: String(e);
		} finally {
			this._loading = 'idle';
			this.notify();
		}
	}

	public async loadFiles(
		mergeRequest: GitLabMergeRequest,
	): Promise<void> {
		this._loading = 'files';
		this._error = undefined;
		this.notify();

		try {
			await this.files.loadFiles(mergeRequest);
		} catch (e: unknown) {
			this._error = e instanceof Error
				? e.message
				: String(e);
		} finally {
			this._loading = 'idle';
			this.notify();
		}
	}

	public refresh(): void {
		this._cache.clear();
		this._loadedCategories.clear();
		this.files.refresh();
		this.approvalStore.refresh();
		this.reviewed.refresh();
		this._error = undefined;
		this.notify();
	}

	private async fetchByCategory(
		category: MergeRequestCategory,
	): Promise<GitLabMergeRequest[]> {
		const client =
			await this.clientFactory.create();
		if (!client) {
			return [];
		}

		try {
			return await CATEGORY_LOADER[category](client);
		} catch {
			this.clientFactory.clear();
			throw new Error(
				'Не удалось загрузить merge requests',
			);
		}
	}

	private notify(): void {
		this.changeEmitter.fire();
	}
}