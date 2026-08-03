import { ITreeItem } from './tree-item';

export class MergeRequestMessageItem implements ITreeItem {
	readonly label: string;
	readonly contextValue = 'message';
	readonly collapsibleState: 'none' = 'none';

	public constructor(message: string) {
		this.label = message;
	}

	public getChildren(): never[] {
		return [];
	}
}