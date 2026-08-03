import * as vscode from 'vscode';
import { Configuration } from '../../domain/interfaces/configuration';

export class VsCodeConfiguration implements Configuration {
	get<T>(section: string, key: string, fallback?: T): T {
		const value = vscode.workspace.getConfiguration(section).get(key);
		return (value !== undefined ? value : fallback) as T;
	}

	async update<T>(section: string, key: string, value: T): Promise<void> {
		const config = vscode.workspace.getConfiguration(section);
		await config.update(key, value as unknown as string, vscode.ConfigurationTarget.Global);
	}
}