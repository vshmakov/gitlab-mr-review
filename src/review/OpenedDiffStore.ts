import * as vscode from 'vscode';

import { ParsedDiff } from './diff/parsed-diff';
import { GitLabMergeRequestFile } from '../model/GitLabMergeRequestFile';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';

export interface OpenedDiffContext {
	mergeRequest: GitLabMergeRequest;
	file: GitLabMergeRequestFile;
	parsedDiff: ParsedDiff;
	threads: vscode.CommentThread[];
}

export class OpenedDiffStore {
	private readonly contexts =
		new Map<string, OpenedDiffContext>();

	public set(
		document: vscode.TextDocument,
		context: Omit<OpenedDiffContext, 'threads'>,
	): OpenedDiffContext {
		const entry: OpenedDiffContext = {
			...context,
			threads: [],
		};
		this.contexts.set(document.uri.toString(), entry);
		return entry;
	}

	public get(
		document: vscode.TextDocument,
	): OpenedDiffContext | undefined {
		return this.contexts.get(document.uri.toString());
	}

	public delete(
		document: vscode.TextDocument,
	): void {
		const context = this.contexts.get(
			document.uri.toString(),
		);
		if (context) {
			for (const thread of context.threads) {
				thread.dispose();
			}
		}
		this.contexts.delete(document.uri.toString());
	}
}