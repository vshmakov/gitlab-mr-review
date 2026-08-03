import { DisposableCollection } from './disposable';
import { SecretStorage } from './secret-storage';
import { Configuration } from './configuration';
import { CommandRegistry } from './command-registry';
import { Input } from './input';
import { Progress } from './progress';
import { DocumentService } from './document-service';
import { UriOpener } from './uri-opener';
import { Notifier } from './notifier';
import { CommentManager } from './comment-manager';
import { HttpClient } from './http';

export interface Environment {
	readonly secrets: SecretStorage;
	readonly config: Configuration;
	readonly commands: CommandRegistry;
	readonly input: Input;
	readonly progress: Progress;
	readonly documents: DocumentService;
	readonly uri: UriOpener;
	readonly notifier: Notifier;
	readonly comments: CommentManager;
	readonly http: HttpClient;
	readonly disposables: DisposableCollection;
}