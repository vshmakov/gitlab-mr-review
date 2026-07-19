export type DiffLineType =
	| 'hunk'
	| 'context'
	| 'added'
	| 'deleted'
	| 'metadata'
	| 'no-newline';

export interface ParsedDiffLine {
	documentLine: number;
	content: string;
	type: DiffLineType;
	oldLine?: number;
	newLine?: number;
	commentable: boolean;
}

export interface ParsedDiff {
	text: string;
	lines: ParsedDiffLine[];
}