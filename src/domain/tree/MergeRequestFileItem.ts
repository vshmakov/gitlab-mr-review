import * as path from 'path';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { Command, ITreeItem } from './tree-item';
import { GitLabMergeRequestFile } from '../model/GitLabMergeRequestFile';

export class MergeRequestFileItem implements ITreeItem {
	readonly description: string | undefined;
	readonly collapsibleState: 'none' = 'none';
	readonly command: Command;

	private readonly _baseLabel: string;
	private readonly _baseTooltip: string;

	public constructor(
		public readonly mergeRequest: GitLabMergeRequest | null,
		public readonly file: GitLabMergeRequestFile,
		private readonly _getReviewed: () => boolean = () => false,
	) {
		const fileName = path.basename(file.path);
		const directory = path.dirname(file.path);
		const prefix = getFilePrefix(file);

		this._baseLabel = `${prefix} ${fileName}`;
		this._baseTooltip = getFileTooltip(file);
		this.description = directory === '.' ? undefined : directory;

		this.command = {
			command: 'gitlabMrReview.openFilePatch',
			title: 'Open File Patch',
			arguments: [this],
		};
	}

	static isReviewed(
		store: { reviewed: { isReviewed: (mr: GitLabMergeRequest, f: GitLabMergeRequestFile) => boolean } },
		mr: GitLabMergeRequest,
		file: GitLabMergeRequestFile,
	): () => boolean {
		return () => store.reviewed.isReviewed(mr, file);
	}

	public get label(): string {
		return this._getReviewed() ? `* ${this._baseLabel}` : this._baseLabel;
	}

	public get tooltip(): string {
		return this._baseTooltip;
	}

	public get contextValue(): string {
		return this._getReviewed()
			? 'mergeRequestFile.reviewed'
			: 'mergeRequestFile';
	}

	public get accessibilityLabel(): string {
		return this._getReviewed()
			? `* ${this._baseLabel}`
			: this._baseLabel;
	}

	public getReviewed(): boolean {
		return this._getReviewed();
	}

	public getChildren(): never[] {
		return [];
	}
}

function getFilePrefix(file: GitLabMergeRequestFile): string {
	if (file.added) {return 'A';}
	if (file.deleted) {return 'D';}
	if (file.renamed) {return 'R';}
	return 'M';
}

function getFileTooltip(file: GitLabMergeRequestFile): string {
	if (file.renamed) {
		return `${file.oldPath} → ${file.newPath}`;
	}
	return file.path;
}