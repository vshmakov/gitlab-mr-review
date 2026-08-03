import * as vscode from 'vscode';
import { createVsCodeEnvironment } from './infrastructure/vscode/vscode-environment';
import { GitLabMrReviewExtension } from './infrastructure/vscode/GitLabMrReviewExtension';

let extension: GitLabMrReviewExtension | undefined;

export function activate(context: vscode.ExtensionContext): void {
	const env = createVsCodeEnvironment(context);
	extension = new GitLabMrReviewExtension(env);
	extension.activate();
}

export function deactivate(): void {
	extension?.env.disposables.dispose();
}