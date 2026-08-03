import * as vscode from 'vscode';
import { createVsCodeEnvironment } from './infra/vscode-environment';
import { GitLabMrReviewExtension } from './extension/GitLabMrReviewExtension';

let extension: GitLabMrReviewExtension | undefined;

export function activate(context: vscode.ExtensionContext): void {
	const env = createVsCodeEnvironment(context);
	extension = new GitLabMrReviewExtension(env);
	extension.activate();
}

export function deactivate(): void {
	extension?.env.disposables.dispose();
}