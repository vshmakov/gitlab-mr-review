import { Disposable } from './disposable';
import { TextDocument } from './document-service';

export interface CommentLine {
	documentLine: number;
	oldLine?: number;
	newLine?: number;
	commentable: boolean;
}

export interface CommentContext {
	mergeRequest: {
		project_id: number;
		iid: number;
		baseSha?: string;
		startSha?: string;
		headSha?: string;
	};
	file: {
		path: string;
		oldPath: string;
		newPath: string;
	};
	lines: CommentLine[];
}

export interface CommentManager extends Disposable {
	/** Set comment context for a document. */
	setContext(document: TextDocument, context: CommentContext): void;

	/** Called when a diff document is opened to enable commenting. */
	onDocumentOpened(document: TextDocument, context: CommentContext): void;

	/** Find the nearest commentable line index for the given cursor line. Returns null if no commentable line found. */
	findCommentableLine(document: TextDocument, cursorLine: number): number | null;

	/** Add a comment at the specified line. Returns false if the line is not commentable. */
	addComment(document: TextDocument, line: number, text: string): Promise<boolean>;
}