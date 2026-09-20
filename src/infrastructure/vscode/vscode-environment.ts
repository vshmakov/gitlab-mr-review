import * as vscode from 'vscode';
import { Disposable, DisposableCollection } from '../../domain/interfaces/disposable';
import { Environment } from '../../domain/interfaces/environment';
import { VsCodeSecretStorage } from './vscode-secret-storage';
import { VsCodeConfiguration } from './vscode-configuration';
import { VsCodeCommandRegistry } from './vscode-command-registry';
import { VsCodeInput } from './vscode-input';
import { VsCodeProgress } from './vscode-progress';
import { VsCodeDocumentService } from './vscode-document-service';
import { VsCodeUriOpener } from './vscode-uri-opener';
import { VsCodeNotifier } from './vscode-notifier';
import { VsCodeCommentManager } from './vscode-comment-manager';
import { VsCodeHttpClient } from './vscode-http';

class VsCodeDisposableCollection implements DisposableCollection {
	private readonly items: vscode.Disposable[] = [];

	push(...disposables: Disposable[]): void {
		this.items.push(...disposables.map((d) => ({ dispose: d.dispose.bind(d) })));
	}

	dispose(): void {
		for (const item of this.items) {
			item.dispose();
		}
		this.items.length = 0;
	}
}

export function createVsCodeEnvironment(
	context: vscode.ExtensionContext,
): Environment {
	const disposables = new VsCodeDisposableCollection();
	const notifier = new VsCodeNotifier();
	const comments = new VsCodeCommentManager();

	return {
		secrets: new VsCodeSecretStorage(context),
		config: new VsCodeConfiguration(),
		commands: new VsCodeCommandRegistry(),
		input: new VsCodeInput(),
		progress: new VsCodeProgress(),
		documents: new VsCodeDocumentService(),
		uri: new VsCodeUriOpener(),
		notifier,
		comments,
		http: new VsCodeHttpClient(),
		globalState: context.globalState,
		disposables,
	};
}