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
	/** Called when a diff document is opened to enable commenting. */
	onDocumentOpened(document: TextDocument, context: CommentContext): void;

	/** Add a comment at the specified line. Returns false if the line is not commentable. */
	addComment(document: TextDocument, line: number, text: string): Promise<boolean>;
}