import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { ITreeItem } from '../infra/tree-item';
import { MergeRequestFileItem } from './MergeRequestFileItem';
import { MergeRequestMessageItem } from './MergeRequestMessageItem';
import { MergeRequestsStore } from '../store/MergeRequestsStore';

export class MergeRequestChangesItem implements ITreeItem {
	readonly label: string;
	readonly contextValue = 'changes';
	readonly collapsibleState: 'collapsed' = 'collapsed';
	readonly icon = { name: 'list' };

	public constructor(
		private readonly mergeRequest: GitLabMergeRequest,
		private readonly store: MergeRequestsStore,
		private readonly fileCount?: number,
	) {
		this.label =
			fileCount !== undefined
				? `Changes (${fileCount})`
				: 'Changes';
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