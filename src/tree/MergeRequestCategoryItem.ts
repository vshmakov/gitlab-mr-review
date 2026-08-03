import { MergeRequestsStore } from '../store/MergeRequestsStore';
import { ITreeItem } from '../infra/tree-item';
import { MergeRequestCategory, MergeRequestItem } from './MergeRequestItem';
import { MergeRequestMessageItem } from './MergeRequestMessageItem';

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
	my: {
		label: 'My',
		icon: 'person',
		contextValue: 'categoryMy',
	},
};

export class MergeRequestCategoryItem implements ITreeItem {
	readonly label: string;
	readonly contextValue: string;
	readonly collapsibleState: 'collapsed' = 'collapsed';
	readonly icon: { name: string };

	public constructor(
		public readonly category: MergeRequestCategory,
		private readonly store: MergeRequestsStore,
	) {
		const config = CATEGORY_CONFIG[category];
		this.label = config.label;
		this.contextValue = config.contextValue;
		this.icon = { name: config.icon };
	}

	public getChildren(): (MergeRequestItem | MergeRequestMessageItem)[] {
		// Loading state — store is fetching this category
		if (this.store.isCategoryLoading(this.category)) {
			return [new MergeRequestMessageItem('Loading...')];
		}

		// Not yet loaded — trigger load and show loading indicator
		if (!this.store.isCategoryLoaded(this.category)) {
			this.loadCategory();
			return [new MergeRequestMessageItem('Loading...')];
		}

		// Loaded — render from store data
		const mrs = this.store.getCategoryMRs(this.category);

		if (mrs.length === 0) {
			return [new MergeRequestMessageItem('No merge requests')];
		}

		return mrs.map((m) =>
			new MergeRequestItem(m, this.store),
		);
	}

	private loadCategory(): void {
		switch (this.category) {
			case 'needsReview':
				this.store.loadPending();
				break;
			case 'approved':
				this.store.loadApproved();
				break;
			case 'requestedChanges':
				this.store.loadRequestedChanges();
				break;
			case 'missed':
				this.store.loadMissedReview();
				break;
			case 'my':
				this.store.loadMyMergeRequests();
				break;
		}
	}
}