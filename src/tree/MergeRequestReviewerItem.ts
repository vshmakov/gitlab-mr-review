import { GitLabApprovalUser } from '../model/GitLabApprovalData';
import { ITreeItem } from '../infra/tree-item';

export class MergeRequestReviewerItem implements ITreeItem {
	readonly label: string;
	readonly description: string;
	readonly tooltip: string;
	readonly contextValue = 'reviewer';
	readonly collapsibleState: 'none' = 'none';
	readonly icon = { name: 'person' };
	readonly accessibilityLabel: string;

	public constructor(user: GitLabApprovalUser) {
		this.label = user.name;
		this.description = user.username;
		this.tooltip = `@${user.username}`;
		this.accessibilityLabel = `${user.name} (@${user.username})`;
	}

	public getChildren(): never[] {
		return [];
	}
}