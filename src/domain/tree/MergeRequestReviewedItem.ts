import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { GitLabMergeRequestFile } from '../model/GitLabMergeRequestFile';
import { ITreeItem } from './tree-item';
import { MergeRequestFileItem } from './MergeRequestFileItem';

export class MergeRequestReviewedItem implements ITreeItem {
    readonly label: string;
    readonly contextValue = 'reviewed';
    readonly collapsibleState: 'collapsed' = 'collapsed';
    readonly icon = { name: 'check' };

    public constructor(
        private readonly files: GitLabMergeRequestFile[],
        private readonly fileCount: number,
    ) {
        this.label = fileCount > 0 ? `Reviewed (${fileCount})` : 'Reviewed';
    }

    public getChildren(): MergeRequestFileItem[] {
        return this.files.map((f) => new MergeRequestFileItem(null as any, f, true));
    }
}