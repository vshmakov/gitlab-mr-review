import * as vscode from 'vscode';
import { CommentManager, CommentContext, CommentLine } from '../../domain/interfaces/comment-manager';
import { TextDocument } from '../../domain/interfaces/document-service';
import { Notifier } from '../../domain/interfaces/notifier';
import { findCommentableLine as findCommentableLineUtil } from '../../domain/diff/comment-utils';

interface VsCodeCommentContext {
	mergeRequest: CommentContext['mergeRequest'];
	file: CommentContext['file'];
	lines: CommentLine[];
	threads: vscode.CommentThread[];
}

export class VsCodeCommentManager implements CommentManager {
	private readonly controller: vscode.CommentController;
	private readonly contexts = new Map<string, VsCodeCommentContext>();

	constructor(private readonly notifier: Notifier) {
		this.controller = vscode.comments.createCommentController(
			'gitlab-mr-review',
			'GitLab MR Review',
		);

		this.controller.commentingRangeProvider = {
			provideCommentingRanges: (doc: vscode.TextDocument) =>
				this.getCommentingRanges(doc),
		};
	}

	dispose(): void {
		this.controller.dispose();
	}

	setContext(document: TextDocument, context: CommentContext): void {
		const vsCodeContext: VsCodeCommentContext = {
			mergeRequest: context.mergeRequest,
			file: context.file,
			lines: context.lines,
			threads: [],
		};
		this.contexts.set(document.uri, vsCodeContext);
	}

	getContext(document: TextDocument): CommentContext | null {
		const ctx = this.contexts.get(document.uri);
		if (!ctx) return null;
		return {
			mergeRequest: ctx.mergeRequest,
			file: ctx.file,
			lines: ctx.lines,
		};
	}

	onDocumentOpened(document: TextDocument, _context: CommentContext): void {
		const uri = vscode.Uri.parse(document.uri);
		this.controller.createCommentThread(uri, new vscode.Range(0, 0, 0, 0), []);
	}

	findCommentableLine(document: TextDocument, cursorLine: number): number | null {
		const context = this.contexts.get(document.uri);
		if (!context) return null;
		return findCommentableLineUtil(context.lines, cursorLine);
	}

	async addComment(
		document: TextDocument,
		line: number,
		text: string,
	): Promise<boolean> {
		const context = this.contexts.get(document.uri);
		if (!context) {
			return false;
		}

		const parsedLine = context.lines[line];
		if (!parsedLine || !parsedLine.commentable) {
			return false;
		}

		const uri = vscode.Uri.parse(document.uri);
		const range = new vscode.Range(
			new vscode.Position(line, 0),
			new vscode.Position(line, 0),
		);

		const thread = this.controller.createCommentThread(uri, range, [
			{
				body: text,
				mode: vscode.CommentMode.Preview,
				author: { name: 'You' },
				contextValue: 'pending',
			},
		]);
		thread.canReply = false;
		context.threads.push(thread);

		return true;
	}

	private getCommentingRanges(
		document: vscode.TextDocument,
	): vscode.Range[] | undefined {
		const context = this.contexts.get(document.uri.toString());
		if (!context) return undefined;

		const ranges: vscode.Range[] = [];
		for (const line of context.lines) {
			if (line.commentable) {
				ranges.push(
					new vscode.Range(
						new vscode.Position(line.documentLine, 0),
						new vscode.Position(line.documentLine, 0),
					),
				);
			}
		}
		return ranges.length > 0 ? ranges : undefined;
	}
}