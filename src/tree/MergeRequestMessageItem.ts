import { ITreeItem } from '../infra/tree-item';

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