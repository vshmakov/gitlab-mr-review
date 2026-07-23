import * as vscode from 'vscode';

import { OpenedDiffStore } from '../review/OpenedDiffStore';
import { GitLabCommentService } from './GitLabCommentService';

export class GitLabCommentController {
	private readonly controller: vscode.CommentController;

	public constructor(
		private readonly openedDiffStore: OpenedDiffStore,
		private readonly commentService: GitLabCommentService,
	) {
		this.controller = vscode.comments.createCommentController(
			'gitlab-mr-review',
			'GitLab MR Review',
		);

		this.controller.commentingRangeProvider = {
			provideCommentingRanges: (
				document: vscode.TextDocument,
			): vscode.Range[] | undefined => {
				return this.getCommentingRanges(document);
			},
		};
	}

	public dispose(): void {
		this.controller.dispose();
	}

	public onDocumentOpened(document: vscode.TextDocument): void {
		// Trigger VS Code to re-evaluate commenting ranges
		this.controller.createCommentThread(
			document.uri,
			new vscode.Range(0, 0, 0, 0),
			[],
		);
	}

	private getCommentingRanges(
		document: vscode.TextDocument,
	): vscode.Range[] | undefined {
		const context = this.openedDiffStore.get(document);
		if (!context) {
			return undefined;
		}

		const ranges: vscode.Range[] = [];

		for (const line of context.parsedDiff.lines) {
			if (line.commentable) {
				const range = new vscode.Range(
					new vscode.Position(line.documentLine, 0),
					new vscode.Position(line.documentLine, 0),
				);
				ranges.push(range);
			}
		}

		return ranges.length > 0 ? ranges : undefined;
	}

	public async addComment(
		document: vscode.TextDocument,
		line: number,
		text: string,
	): Promise<void> {
		console.log(
			'[CommentController] addComment:',
			document.uri.toString(),
			'line:', line,
		);

		const context = this.openedDiffStore.get(document);
		if (!context) {
			console.log(
				'[CommentController] context not found for:',
				document.uri.toString(),
			);
			return;
		}

		console.log('[CommentController] context found');

		const parsedLine = context.parsedDiff.lines[line];

		const range = new vscode.Range(
			new vscode.Position(line, 0),
			new vscode.Position(line, 0),
		);

		const thread = this.controller.createCommentThread(
			document.uri,
			range,
			[
				{
					body: text,
					mode: vscode.CommentMode.Preview,
					author: {
						name: 'You',
					},
					contextValue: 'pending',
				},
			],
		);

		thread.canReply = false;

		context.threads.push(thread);

		await this.commentService.handleComment({
			text,
			documentLine: line,
			oldLine: parsedLine?.oldLine,
			newLine: parsedLine?.newLine,
			mergeRequest: context.mergeRequest,
			file: context.file,
		});
	}
}