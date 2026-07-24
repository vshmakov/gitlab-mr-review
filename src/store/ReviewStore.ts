import * as vscode from 'vscode';
import { GitLabClientFactory } from '../client/GitLabClientFactory';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { GitLabMergeRequestFile } from '../model/GitLabMergeRequestFile';
import { CategoryKey } from '../tree/ReviewItem';
import { ReviewDataSource } from '../tree/ReviewDataSource';

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

	private readonly _filesCache = new Map<
		string,
		GitLabMergeRequestFile[]
	>();

	private _loading: LoadingState = 'idle';

	private _error: string | undefined;

	private readonly changeEmitter =
		new vscode.EventEmitter<void>();

	public readonly onDidChange =
		this.changeEmitter.event;

	private readonly dataSource: ReviewDataSource;

	public constructor(clientFactory: GitLabClientFactory) {
		this.dataSource = new ReviewDataSource(
			clientFactory,
		);
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

	public getFiles(
		mergeRequest: GitLabMergeRequest,
	): GitLabMergeRequestFile[] | undefined {
		const key = `${mergeRequest.project_id}:${mergeRequest.iid}`;
		return this._filesCache.get(key);
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
			const mr =
				await this.dataSource.getMergeRequestsByCategory(
					categoryKey,
				);
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
		if (this.getFiles(mergeRequest)) {
			return;
		}

		this._loading = 'files';
		this._error = undefined;
		this.notify();

		try {
			const files =
				await this.dataSource.getMergeRequestFiles(
					mergeRequest,
				);
			const key =
				`${mergeRequest.project_id}:${mergeRequest.iid}`;
			this._filesCache.set(key, files);
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
		this.dataSource.refresh();
		this._mrCache.clear();
		this._loadedCategories.clear();
		this._filesCache.clear();
		this._error = undefined;
		this.notify();
	}

	private notify(): void {
		this.changeEmitter.fire();
	}
}