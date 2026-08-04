import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { ITreeItem } from './tree-item';
import { MergeRequestFileItem } from './MergeRequestFileItem';
import { MergeRequestReviewedItem } from './MergeRequestReviewedItem';
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

	public getChildren(): (MergeRequestFileItem | MergeRequestReviewedItem)[] {
		if (this.store.isFilesLoading(this.mergeRequest)) {
			return [];
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

			const result: (MergeRequestReviewedItem | MergeRequestFileItem)[] = [];

			if (reviewedFiles.length > 0) {
				result.push(
					new MergeRequestReviewedItem(
						this.mergeRequest,
						reviewedFiles,
						reviewedFiles.length,
					),
				);
			}

			result.push(
				...unreviewedFiles.map((f) =>
					new MergeRequestFileItem(this.mergeRequest, f, () =>
						this.store.reviewed.isReviewed(this.mergeRequest, f),
					),
				),
			);

			return result;
		}

		this.store.loadFiles(this.mergeRequest);
		return [];
	}
}