import * as vscode from 'vscode';
import { GitLabMrReviewExtension } from './extension/GitLabMrReviewExtension';

export function activate(
	context: vscode.ExtensionContext,
): void {
	const extension = new GitLabMrReviewExtension(context);

	extension.activate();
}

export function deactivate(): void {}