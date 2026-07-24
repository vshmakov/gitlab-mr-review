import * as vscode from 'vscode';
import { GitLabClient } from '../client/GitLabClient';
import { GitLabClientFactory } from '../client/GitLabClientFactory';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { CategoryKey } from '../tree/ReviewItem';
import { MrFilesStore } from './MrFilesStore';

const CATEGORY_LOADER: Record<
	CategoryKey,
	(client: GitLabClient) => Promise<GitLabMergeRequest[]>
> = {
	needsReview: (c) => c.getPendingReviews(),
	approved: (c) => c.getApprovedReviews(),
	requestedChanges: (c) => c.getRequestedChangesReviews(),
};

export type LoadingState =
	| 'idle'
	| CategoryKey
	| 'files';

export class ReviewStore {
	private readonly _mrCache = new Map<
		CategoryKey,
		GitLabMergeRequest[]
	>();

	private readonly _loadedCategories = new Set<CategoryKey>();

	private _loading: LoadingState = 'idle';

	private _error: string | undefined;

	private readonly changeEmitter =
		new vscode.EventEmitter<void>();

	public readonly onDidChange =
		this.changeEmitter.event;

	public readonly files: MrFilesStore;

	public constructor(
		private readonly clientFactory:
			GitLabClientFactory,
	) {
		this.files = new MrFilesStore(clientFactory);
	}

	// -- State accessors --

	public get pendingMRs(): GitLabMergeRequest[] {
		return this._mrCache.get('needsReview') ?? [];
	}

	public get approvedMRs(): GitLabMergeRequest[] {
		return this._mrCache.get('approved') ?? [];
	}

	public get requestedChangesMRs(): GitLabMergeRequest[] {
		return this._mrCache.get('requestedChanges') ?? [];
	}

	public get loading(): LoadingState {
		return this._loading;
	}

	public get error(): string | undefined {
		return this._error;
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

	private async loadCategory(
		categoryKey: CategoryKey,
	): Promise<void> {
		if (this._loadedCategories.has(categoryKey)) {
			return;
		}

		this._loading = categoryKey;
		this._error = undefined;
		this.notify();

		try {
			const mr = await this.fetchByCategory(categoryKey);
			this._mrCache.set(categoryKey, mr);
			this._loadedCategories.add(categoryKey);
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
		this._mrCache.clear();
		this._loadedCategories.clear();
		this.files.refresh();
		this._error = undefined;
		this.notify();
	}

	private async fetchByCategory(
		categoryKey: CategoryKey,
	): Promise<GitLabMergeRequest[]> {
		const client = await this.clientFactory.create();
		if (!client) {
			return [];
		}

		try {
			return await CATEGORY_LOADER[categoryKey](client);
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