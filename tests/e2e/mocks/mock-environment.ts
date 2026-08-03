import { SecretStorage } from '../../../src/domain/interfaces/secret-storage';
import { Configuration } from '../../../src/domain/interfaces/configuration';
import { CommandRegistry } from '../../../src/domain/interfaces/command-registry';
import { Input, InputBoxOptions } from '../../../src/domain/interfaces/input';
import { Progress } from '../../../src/domain/interfaces/progress';
import { DocumentService, TextDocument } from '../../../src/domain/interfaces/document-service';
import { UriOpener } from '../../../src/domain/interfaces/uri-opener';
import { Notifier } from '../../../src/domain/interfaces/notifier';
import { CommentManager } from '../../../src/domain/interfaces/comment-manager';
import { Disposable, DisposableCollection } from '../../../src/domain/interfaces/disposable';
import { Environment } from '../../../src/domain/interfaces/environment';
import { HttpClient } from '../../../src/domain/interfaces/http';

export class MockSecretStorage implements SecretStorage {
	private _data = new Map<string, string>();
	get(key: string): Promise<string | undefined> { return Promise.resolve(this._data.get(key)); }
	store(key: string, value: string): Promise<void> { this._data.set(key, value); return Promise.resolve(); }
	delete(key: string): Promise<void> { this._data.delete(key); return Promise.resolve(); }
}

export class MockConfiguration implements Configuration {
	private config = new Map<string, string>();
	get<T>(section: string, key: string, fallback?: T): T {
		const value = this.config.get(`${section}.${key}`);
		return (value !== undefined ? value : fallback) as T;
	}
	update<T>(section: string, key: string, value: T): Promise<void> {
		this.config.set(`${section}.${key}`, String(value));
		return Promise.resolve();
	}
}

export class MockCommandRegistry implements CommandRegistry {
	private commands = new Map<string, (...args: unknown[]) => unknown>();
	register(id: string, handler: (...args: unknown[]) => unknown): Disposable {
		this.commands.set(id, handler);
		return { dispose: () => this.commands.delete(id) };
	}
	execute(id: string, ...args: unknown[]): Promise<unknown> {
		const handler = this.commands.get(id);
		if (!handler) throw new Error(`Command not found: ${id}`);
		return Promise.resolve(handler(...args));
	}
}

export class MockInput implements Input {
	private nextInput?: string;
	private nextWarning?: string;

	withInput(value: string): void { this.nextInput = value; }
	withWarning(action: string): void { this.nextWarning = action; }

	showInputBox(_options?: InputBoxOptions): Promise<string | undefined> {
		const value = this.nextInput;
		this.nextInput = undefined;
		return Promise.resolve(value);
	}
	showWarningMessage(_message: string, ...items: string[]): Promise<string | undefined> {
		const value = this.nextWarning;
		this.nextWarning = undefined;
		return Promise.resolve(value ?? items[0]);
	}
}

export class MockProgress implements Progress {
	async withProgress<T>(task: () => Promise<T>): Promise<T> { return task(); }
}

export class MockDocumentService implements DocumentService {
	activeDocument: TextDocument | null = null;
	openVirtualDocument(_content: string, _lang: string): Promise<TextDocument> { return Promise.resolve({ uri: 'mock://diff', languageId: 'diff', fileName: 'diff', lineCount: 0, lineAt: () => ({ text: '' }) }); }
	showDocument(_doc: TextDocument, _preserveFocus?: boolean): void {}
	onDidCloseDocument(_fn: (doc: TextDocument) => void): Disposable { return { dispose: () => {} }; }
}

export class MockUriOpener implements UriOpener {
	openedUrls: string[] = [];
	openExternal(uri: string): void { this.openedUrls.push(uri); }
}

export class MockNotifier implements Notifier {
	shown: Array<{ type: string; message: string }> = [];
	showInfo(message: string): void { this.shown.push({ type: 'info', message }); }
	showError(message: string): void { this.shown.push({ type: 'error', message }); }
	showWarning(message: string): void { this.shown.push({ type: 'warning', message }); }
}

export class MockCommentManager implements CommentManager {
	dispose(): void {}
	setContext(_doc: TextDocument, _ctx: unknown): void {}
	onDocumentOpened(_doc: TextDocument, _ctx: unknown): void {}
	addComment(_doc: TextDocument, _line: number, _text: string): Promise<boolean> { return Promise.resolve(true); }
}

export class MockDisposableCollection implements DisposableCollection {
	private items: Disposable[] = [];
	push(...disposables: Disposable[]): void { this.items.push(...disposables); }
	dispose(): void { this.items.forEach((d) => d.dispose()); this.items = []; }
}

export function createMockEnvironment(httpClient?: HttpClient): Environment {
	const notifier = new MockNotifier();
	return {
		secrets: new MockSecretStorage(),
		config: new MockConfiguration(),
		commands: new MockCommandRegistry(),
		input: new MockInput(),
		progress: new MockProgress(),
		documents: new MockDocumentService(),
		uri: new MockUriOpener(),
		notifier,
		comments: new MockCommentManager(),
		http: httpClient ?? createNoopHttpClient(),
		disposables: new MockDisposableCollection(),
	};
}

function createNoopHttpClient(): HttpClient {
	return {
		request: async () => ({
			ok: false, status: 500, statusText: 'Not configured',
			text: async () => '', json: async <T = unknown>() => ({} as T),
		}),
	};
}