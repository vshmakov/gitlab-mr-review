import * as vscode from 'vscode';
import { Input, InputBoxOptions } from '../../domain/interfaces/input';

export class VsCodeInput implements Input {
	async showInputBox(options: InputBoxOptions): Promise<string | undefined> {
		return vscode.window.showInputBox(options);
	}

	async showWarningMessage(
		message: string,
		...items: string[]
	): Promise<string | undefined> {
		return vscode.window.showWarningMessage(message, ...items);
	}
}