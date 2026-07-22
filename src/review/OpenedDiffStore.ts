import * as vscode from 'vscode';

import { ParsedDiff } from './diff/parsed-diff';
import { GitLabMergeRequestFile } from '../model/GitLabMergeRequestFile';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';

export interface OpenedDiffContext {
	mergeRequest: GitLabMergeRequest;
	file: GitLabMergeRequestFile;
	parsedDiff: ParsedDiff;
}

export class OpenedDiffStore {
	private readonly contexts =
		new Map<string, OpenedDiffContext>();

	public set(
		document: vscode.TextDocument,
		context: OpenedDiffContext,
	): void {
		this.contexts.set(
			document.uri.toString(),
			context,
		);
	}

	public get(
		document: vscode.TextDocument,
	): OpenedDiffContext | undefined {
		return this.contexts.get(
			document.uri.toString(),
		);
	}

	public delete(
		document: vscode.TextDocument,
	): void {
		this.contexts.delete(
			document.uri.toString(),
		);
	}
}