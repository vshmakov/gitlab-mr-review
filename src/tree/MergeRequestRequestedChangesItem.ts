import * as vscode from 'vscode';
import { GitLabApprovalData } from '../model/GitLabApprovalData';
import { MergeRequestReviewerItem } from './MergeRequestReviewerItem';

export class MergeRequestRequestedChangesItem
	extends vscode.TreeItem
{
	private readonly _requestedChanges: { name: string; username: string }[];

	public constructor(
		approvalData: GitLabApprovalData,
	) {
		const count = approvalData.requestedChanges.length;
		super(
			`Requested Changes (${count})`,
			count > 0
				? vscode.TreeItemCollapsibleState.Collapsed
				: vscode.TreeItemCollapsibleState.None,
		);

		this._requestedChanges = approvalData.requestedChanges;
		this.contextValue = 'requestedChanges';
		this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.yellow'));
	}

	public getChildren(): MergeRequestReviewerItem[] {
		return this._requestedChanges.map(
			(user) => new MergeRequestReviewerItem(user),
		);
	}
}