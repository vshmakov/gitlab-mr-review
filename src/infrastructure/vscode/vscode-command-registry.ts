import * as vscode from 'vscode';
import { Disposable } from '../../domain/interfaces/disposable';
import { CommandRegistry } from '../../domain/interfaces/command-registry';

export class VsCodeCommandRegistry implements CommandRegistry {
	register(id: string, handler: (...args: never[]) => unknown): Disposable {
		const disposable = vscode.commands.registerCommand(id, handler);
		return { dispose: () => disposable.dispose() };
	}

	execute(id: string, ...args: unknown[]): Promise<unknown> {
		return vscode.commands.executeCommand(id, ...args) as Promise<unknown>;
	}
}