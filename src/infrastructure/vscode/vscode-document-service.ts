import * as vscode from 'vscode';
import { Disposable } from '../../domain/interfaces/disposable';
import { DocumentService, TextDocument } from '../../domain/interfaces/document-service';

class VsCodeTextDocument implements TextDocument {
	constructor(private readonly doc: vscode.TextDocument) {}

	get uri(): string {
		return this.doc.uri.toString();
	}

	get languageId(): string {
		return this.doc.languageId;
	}

	get fileName(): string {
		return this.doc.fileName;
	}

	get lineCount(): number {
		return this.doc.lineCount;
	}

	lineAt(line: number): { text: string } {
		return { text: this.doc.lineAt(line).text };
	}
}

export class VsCodeDocumentService implements DocumentService {
	private readonly docCache = new Map<string, VsCodeTextDocument>();

	get activeDocument(): TextDocument | null {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {return null;}
		const key = editor.document.uri.toString();
		if (!this.docCache.has(key)) {
			this.docCache.set(key, new VsCodeTextDocument(editor.document));
		}
		return this.docCache.get(key) || null;
	}

	get activeCursorLine(): number | null {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {return null;}
		return editor.selection.active.line;
	}

	async openVirtualDocument(
		content: string,
		language: string,
	): Promise<TextDocument> {
		const doc = await vscode.workspace.openTextDocument({
			content,
			language,
		});
		const wrapped = new VsCodeTextDocument(doc);
		this.docCache.set(doc.uri.toString(), wrapped);
		return wrapped;
	}

	showDocument(document: TextDocument, preserveFocus?: boolean): void {
		const uri = vscode.Uri.parse(document.uri);
		vscode.window.showTextDocument(uri, { preserveFocus });
	}

	onDidCloseDocument(
		fn: (doc: TextDocument) => void,
	): Disposable {
		const subscription = vscode.workspace.onDidCloseTextDocument((doc) => {
			const key = doc.uri.toString();
			const cached = this.docCache.get(key);
			if (cached) {
				fn(cached);
				this.docCache.delete(key);
			}
		});
		return { dispose: () => subscription.dispose() };
	}
}