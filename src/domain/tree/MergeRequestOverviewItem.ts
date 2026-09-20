import { ITreeItem } from './tree-item';

export class MergeRequestOverviewItem implements ITreeItem {
	readonly label: string;
	readonly contextValue = 'overview';
	readonly collapsibleState = 'none' as const;
	readonly icon = { name: 'info' };

	public constructor(readonly notesCount?: number) {
		this.label = notesCount !== undefined
			? `Overview (${notesCount})`
			: 'Overview';
	}

	public getChildren(): never[] {
		return [];
	}
}