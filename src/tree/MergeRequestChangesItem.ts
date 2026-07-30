import * as vscode from 'vscode';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { MergeRequestFileItem } from './MergeRequestFileItem';
import { MergeRequestMessageItem } from './MergeRequestMessageItem';
import { MergeRequestsStore } from '../store/MergeRequestsStore';

export class MergeRequestChangesItem
	extends vscode.TreeItem
{
	public constructor(
		private readonly mergeRequest: GitLabMergeRequest,
		private readonly store: MergeRequestsStore,
		private readonly fileCount?: number,
	) {
		super(
			fileCount !== undefined ? `Changes (${fileCount})` : 'Changes',
			vscode.TreeItemCollapsibleState.Collapsed,
		);

		this.contextValue = 'changes';
		this.iconPath = new vscode.ThemeIcon('list');
	}

	public getChildren(): (MergeRequestFileItem | MergeRequestMessageItem)[] {
		if (this.store.isFilesLoading(this.mergeRequest)) {
			return [new MergeRequestMessageItem('Loading files...')];
		}

		const files = this.store.files.getFiles(this.mergeRequest);
		if (files) {
			return files.map((f) =>
				new MergeRequestFileItem(
					this.mergeRequest,
					f,
				),
			);
		}

		this.store.loadFiles(this.mergeRequest);
		return [new MergeRequestMessageItem('Loading files...')];
	}
}
