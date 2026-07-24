import * as vscode from 'vscode';

export class MergeRequestMessageItem
	extends vscode.TreeItem
{
	public constructor(message: string) {
		super(message);

		this.contextValue = 'message';
		this.collapsibleState =
			vscode.TreeItemCollapsibleState.None;
	}

	public getChildren(): never[] {
		return [];
	}
}