import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { ITreeItem } from './tree-item';
import { MergeRequestFileItem } from './MergeRequestFileItem';
import { MergeRequestMessageItem } from './MergeRequestMessageItem';
import { MergeRequestReviewedItem } from './MergeRequestReviewedItem';
import { MergeRequestsStore } from '../store/MergeRequestsStore';

export class MergeRequestChangesItem implements ITreeItem {
	readonly label: string;
	readonly contextValue = 'changes';
	readonly collapsibleState: 'expanded' = 'expanded';
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

	public getChildren(): (MergeRequestFileItem | MergeRequestMessageItem | MergeRequestReviewedItem)[] {
		if (this.store.isFilesLoading(this.mergeRequest)) {
			return [new MergeRequestMessageItem('Loading files...')];
		}

		const files = this.store.files.getFiles(this.mergeRequest);
		if (files) {
			const reviewedFiles = this.store.reviewed.getReviewedFiles(
				this.mergeRequest,
				files,
			);
			const unreviewedFiles = files.filter(
				(f) => !this.store.reviewed.isReviewed(this.mergeRequest, f),
			);

			const result: (MergeRequestFileItem | MergeRequestReviewedItem)[] =
				unreviewedFiles.map((f) =>
					new MergeRequestFileItem(this.mergeRequest, f),
				);

			if (reviewedFiles.length > 0) {
				result.push(
					new MergeRequestReviewedItem(
						reviewedFiles,
						reviewedFiles.length,
					),
				);
			}

			return result;
		}

		this.store.loadFiles(this.mergeRequest);
		return [new MergeRequestMessageItem('Loading files...')];
	}
}