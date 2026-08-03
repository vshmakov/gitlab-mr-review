import * as vscode from 'vscode';
import { Progress } from '../../domain/interfaces/progress';

export class VsCodeProgress implements Progress {
	async withProgress<T>(task: () => Promise<T>): Promise<T> {
		return vscode.window.withProgress(
			{ location: vscode.ProgressLocation.Notification },
			() => task(),
		);
	}
}