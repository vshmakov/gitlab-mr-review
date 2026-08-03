import * as vscode from 'vscode';
import { UriOpener } from '../../domain/interfaces/uri-opener';

export class VsCodeUriOpener implements UriOpener {
	openExternal(uri: string): void {
		void vscode.env.openExternal(vscode.Uri.parse(uri));
	}
}