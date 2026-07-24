import * as vscode from 'vscode';
import { GitLabClientFactory } from '../client/GitLabClientFactory';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { GitLabMergeRequestFile } from '../model/GitLabMergeRequestFile';
import { ReviewDataSource } from '../tree/ReviewDataSource';

export type LoadingState =
	| 'idle'
	| 'pending'
	| 'approved'
	| 'requestedChanges'
	| 'files';

export class ReviewStore {
	private readonly _pendingMRs: GitLabMergeRequest[] = [];

	private readonly _approvedMRs: GitLabMergeRequest[] = [];

	private readonly _requestedChangesMRs: GitLabMergeRequest[] = [];

	private readonly _filesCache = new Map<
		string,
		GitLabMergeRequestFile[]
	>();

	private _loading: LoadingState = 'idle';

	private _error: string | undefined;

	private _pendingLoaded = false;

	private _approvedLoaded = false;

	private _requestedChangesLoaded = false;

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
		return this._pendingMRs;
	}

	public get approvedMRs(): GitLabMergeRequest[] {
		return this._approvedMRs;
	}

	public get requestedChangesMRs(): GitLabMergeRequest[] {
		return this._requestedChangesMRs;
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
		if (this._pendingLoaded) {
			return;
		}

		this._loading = 'pending';
		this._error = undefined;
		this.notify();

		try {
			const mr = await this.dataSource.getMergeRequests();
			this._pendingMRs.length = 0;
			this._pendingMRs.push(...mr);
			this._pendingLoaded = true;
		} catch (e: unknown) {
			this._error = e instanceof Error
				? e.message
				: String(e);
		} finally {
			this._loading = 'idle';
			this.notify();
		}
	}

	public async loadRequestedChanges(): Promise<void> {
		if (this._requestedChangesLoaded) {
			return;
		}

		this._loading = 'requestedChanges';
		this._error = undefined;
		this.notify();

		try {
			const mr =
				await this.dataSource.getRequestedChangesMergeRequests();
			this._requestedChangesMRs.length = 0;
			this._requestedChangesMRs.push(...mr);
			this._requestedChangesLoaded = true;
		} catch (e: unknown) {
			this._error = e instanceof Error
				? e.message
				: String(e);
		} finally {
			this._loading = 'idle';
			this.notify();
		}
	}

	public async loadApproved(): Promise<void> {
		if (this._approvedLoaded) {
			return;
		}

		this._loading = 'approved';
		this._error = undefined;
		this.notify();

		try {
			const mr =
				await this.dataSource.getApprovedMergeRequests();
			this._approvedMRs.length = 0;
			this._approvedMRs.push(...mr);
			this._approvedLoaded = true;
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
		this._pendingMRs.length = 0;
		this._approvedMRs.length = 0;
		this._requestedChangesMRs.length = 0;
		this._filesCache.clear();
		this._error = undefined;
		this._pendingLoaded = false;
		this._approvedLoaded = false;
		this._requestedChangesLoaded = false;
		this.notify();
	}

	private notify(): void {
		this.changeEmitter.fire();
	}
}