import * as vscode from 'vscode';
import { SecretStorage } from '../../domain/interfaces/secret-storage';

export class VsCodeSecretStorage implements SecretStorage {
	constructor(private readonly context: vscode.ExtensionContext) {}

	get(key: string): Promise<string | undefined> {
		return Promise.resolve().then(() => this.context.secrets.get(key));
	}

	store(key: string, value: string): Promise<void> {
		return Promise.resolve().then(() => this.context.secrets.store(key, value));
	}

	delete(key: string): Promise<void> {
		return Promise.resolve().then(() => this.context.secrets.delete(key));
	}
}