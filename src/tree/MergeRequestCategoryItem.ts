import * as vscode from 'vscode';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { MergeRequestsStore } from '../store/MergeRequestsStore';
import { MergeRequestCategory, MergeRequestItem } from './MergeRequestItem';

const CATEGORY_CONFIG: Record<MergeRequestCategory, {
	label: string;
	icon: string;
	contextValue: string;
}> = {
	needsReview: {
		label: 'Needs My Review',
		icon: 'git-pull-request',
		contextValue: 'categoryNeedsReview',
	},
	approved: {
		label: 'I Approved',
		icon: 'check',
		contextValue: 'categoryApproved',
	},
	requestedChanges: {
		label: 'I Requested Changes',
		icon: 'warning',
		contextValue: 'categoryRequestedChanges',
	},
	missed: {
		label: 'Missed Review',
		icon: 'warning',
		contextValue: 'categoryMissed',
	},
};

const CATEGORY_LOADER: Record<
	MergeRequestCategory,
	(store: MergeRequestsStore) => Promise<void>
> = {
	needsReview: (s) => s.loadPending(),
	requestedChanges: (s) => s.loadRequestedChanges(),
	approved: (s) => s.loadApproved(),
	missed: (s) => s.loadMissedReview(),
};

const CATEGORY_DATA: Record<
	MergeRequestCategory,
	(store: MergeRequestsStore) => GitLabMergeRequest[]
> = {
	needsReview: (s) => s.pendingMergeRequests,
	requestedChanges: (s) =>
		s.requestedChangesMergeRequests,
	approved: (s) => s.approvedMergeRequests,
	missed: (s) => s.missedMergeRequests,
};

export class MergeRequestCategoryItem
	extends vscode.TreeItem
{
	public constructor(
		public readonly category: MergeRequestCategory,
		private readonly store: MergeRequestsStore,
	) {
		const config = CATEGORY_CONFIG[category];

		super(
			config.label,
			vscode.TreeItemCollapsibleState.Collapsed,
		);

		this.iconPath =
			new vscode.ThemeIcon(config.icon);
		this.contextValue = config.contextValue;
	}

	public getChildren(): MergeRequestItem[] {
		CATEGORY_LOADER[this.category](this.store);

		const mr =
			CATEGORY_DATA[this.category](this.store);

		return mr.map((m) =>
			new MergeRequestItem(m, this.store),
		);
	}
}