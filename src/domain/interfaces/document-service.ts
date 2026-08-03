import { Disposable } from './disposable';

export interface TextDocument {
	readonly uri: string;
	readonly languageId: string;
	readonly fileName: string;
	readonly lineCount: number;
	lineAt(line: number): { text: string };
}

export interface DocumentService {
	readonly activeDocument: TextDocument | null;
	openVirtualDocument(content: string, language: string): Promise<TextDocument>;
	showDocument(document: TextDocument, preserveFocus?: boolean): void;
	onDidCloseDocument(fn: (doc: TextDocument) => void): Disposable;
}