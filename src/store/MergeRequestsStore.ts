import * as vscode from 'vscode';
import { GitLabClient } from '../client/GitLabClient';
import { GitLabClientFactory } from '../client/GitLabClientFactory';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { MergeRequestCategory } from '../tree/MergeRequestItem';
import { MergeRequestFilesStore } from './MergeRequestFilesStore';

const CATEGORY_LOADER: Record<
	MergeRequestCategory,
	(client: GitLabClient) => Promise<GitLabMergeRequest[]>
> = {
	needsReview: (c) => c.getPendingReviews(),
	approved: (c) => c.getApprovedReviews(),
	requestedChanges: (c) => c.getRequestedChangesReviews(),
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

	private readonly changeEmitter =
		new vscode.EventEmitter<void>();

	public readonly onDidChange =
		this.changeEmitter.event;

	public readonly files: MergeRequestFilesStore;

	public constructor(
		private readonly clientFactory:
			GitLabClientFactory,
	) {
		this.files = new MergeRequestFilesStore(
			clientFactory,
		);
	}

	// -- State accessors --

	public get pendingMergeRequests():
		GitLabMergeRequest[] {
		return this._cache.get('needsReview') ?? [];
	}

	public get approvedMergeRequests():
		GitLabMergeRequest[] {
		return this._cache.get('approved') ?? [];
	}

	public get requestedChangesMergeRequests():
		GitLabMergeRequest[] {
		return this._cache.get('requestedChanges') ?? [];
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

	public async loadRequestedChanges():
		Promise<void> {
		await this.loadCategory('requestedChanges');
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