import * as vscode from 'vscode';
import { Notifier } from '../../domain/interfaces/notifier';

export class VsCodeNotifier implements Notifier {
	showInfo(message: string): void {
		void vscode.window.showInformationMessage(message);
	}

	showError(message: string): void {
		void vscode.window.showErrorMessage(message);
	}

	showWarning(message: string): void {
		void vscode.window.showWarningMessage(message);
	}
}