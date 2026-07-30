import * as vscode from 'vscode';
import { GitLabApprovalUser } from '../model/GitLabApprovalData';

export class MergeRequestReviewerItem
	extends vscode.TreeItem
{
	public constructor(user: GitLabApprovalUser) {
		super(user.name, vscode.TreeItemCollapsibleState.None);

		this.description = user.username;
		this.tooltip = `@${user.username}`;
		this.contextValue = 'reviewer';
		this.iconPath = new vscode.ThemeIcon('person');
		this.accessibilityInformation = {
			label: `${user.name} (@${user.username})`,
			role: 'treeitem',
		};
	}

	public getChildren(): never[] {
		return [];
	}
}
