import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { GitLabMergeRequestFile } from '../model/GitLabMergeRequestFile';
import { ITreeItem } from './tree-item';
import { MergeRequestFileItem } from './MergeRequestFileItem';
import { MergeRequestsStore } from '../store/MergeRequestsStore';

export class MergeRequestReviewedItem implements ITreeItem {
    readonly label: string;
    readonly contextValue = 'reviewed';
    readonly collapsibleState = 'collapsed' as const;
    readonly icon = { name: 'check' };

    public constructor(
        private readonly mergeRequest: GitLabMergeRequest,
        private readonly files: GitLabMergeRequestFile[],
        private readonly fileCount: number,
        private readonly store: MergeRequestsStore,
    ) {
        this.label = fileCount > 0 ? `Reviewed (${fileCount})` : 'Reviewed';
    }

    public getChildren(): MergeRequestFileItem[] {
        return this.files.map((f) =>
            new MergeRequestFileItem(
                this.mergeRequest,
                f,
                MergeRequestFileItem.isReviewed(this.store, this.mergeRequest, f),
            ),
        );
    }
}