# План: полная отвязка от VS Code

## Архитектура

```
src/
  infra/           ← интерфейсы + VS Code реализации
    notifier.ts
    vscode-notifier.ts
    tree-item.ts
    vscode-tree-adapter.ts
    secret-storage.ts        ← новый
    vscode-secret-storage.ts ← новый
    configuration.ts         ← новый
    vscode-configuration.ts  ← новый
    command-registry.ts      ← новый
    vscode-command-registry.ts ← новый
    input.ts                 ← новый
    vscode-input.ts          ← новый
    progress.ts              ← новый
    vscode-progress.ts       ← новый
    document-service.ts      ← новый
    vscode-document-service.ts ← новый
    uri-opener.ts            ← новый
    vscode-uri-opener.ts     ← новый
    environment.ts           ← новый (все интерфейсы вместе)
    vscode-environment.ts    ← новый (все реализации вместе)

  app/
    Application.ts           ← новый (бывший GitLabMrReviewExtension)

  model/     ← уже чистый ✅
  client/    ← почти чистый (Factory нужно почистить)
  store/     ← уже использует Notifier ✅
  tree/      ← уже ITreeItem ✅
  review/    ← уже чистый ✅

  extension/ ← VS Code адаптеры
    GitLabCommentController.ts    ← остаётся vscode (UI-фича)
    GitLabFileOpener.ts           ← использует DocumentService
    GitLabCommandRegistrar.ts     ← использует CommandRegistry
    GitLabAuthenticationService.ts ← использует SecretStorage, Configuration, Input
    GitLabMrReviewExtension.ts    ← удаляется, логика в Application

  extension.ts ← тонкий адаптер (50 строк)
```

## Интерфейсы

### SecretStorage
```ts
interface SecretStorage {
  get(key: string): Promise<string | undefined>;
  store(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}
```

### Configuration
```ts
interface Configuration {
  get<T>(section: string, key: string, fallback?: T): T;
  update<T>(section: string, key: string, value: T): Promise<void>;
}
```

### CommandRegistry
```ts
interface CommandRegistry {
  register(id: string, handler: (...args: any[]) => any): Disposable;
  execute(id: string, ...args: any[]): Promise<unknown>;
}

interface Disposable {
  dispose(): void;
}
```

### Input
```ts
interface Input {
  showInputBox(options: InputBoxOptions): Promise<string | undefined>;
  showWarningMessage(message: string, ...items: string[]): Promise<string | undefined>;
}
```

### Progress
```ts
interface Progress {
  withProgress<T>(task: () => Promise<T>): Promise<T>;
}
```

### DocumentService
```ts
interface DocumentService {
  readonly activeDocument: TextDocument | null;
  openVirtualDocument(content: string, language: string): Promise<TextDocument>;
  showDocument(document: TextDocument, preserveFocus?: boolean): void;
  onDidCloseDocument(fn: (doc: TextDocument) => void): Disposable;
}

interface TextDocument {
  readonly uri: { toString(): string };
  readonly languageId: string;
  readonly fileName: string;
  readonly lineCount: number;
  lineAt(line: number): { text: string };
}
```

### UriOpener
```ts
interface UriOpener {
  openExternal(uri: string): void;
}
```

### Environment (факад)
```ts
interface Environment {
  readonly secrets: SecretStorage;
  readonly config: Configuration;
  readonly commands: CommandRegistry;
  readonly input: Input;
  readonly progress: Progress;
  readonly documents: DocumentService;
  readonly uri: UriOpener;
  readonly notifier: Notifier;
  readonly disposables: DisposableCollection;
}
```

## Шаг 1: Создать интерфейсы в infra/
- secret-storage.ts, configuration.ts, command-registry.ts
- input.ts, progress.ts, document-service.ts, uri-opener.ts
- environment.ts (факад)

## Шаг 2: Создать VS Code реализации
- vscode-secret-storage.ts
- vscode-configuration.ts
- vscode-command-registry.ts
- vscode-input.ts
- vscode-progress.ts
- vscode-document-service.ts
- vscode-uri-opener.ts
- vscode-environment.ts (собирает всё вместе)

## Шаг 3: Создать Application класс
- Берёт `Environment` в конструктор
- Инициализирует все сервисы
- Регистрирует команды
- Активирует tree view

## Шаг 4: Рефакторинг существующих классов
- GitLabClientFactory — принимает SecretStorage + Configuration вместо ExtensionContext
- GitLabAuthenticationService — принимает Input + Progress + Configuration + SecretStorage
- GitLabCommandRegistrar — принимает CommandRegistry
- GitLabFileOpener — принимает DocumentService + UriOpener

## Шаг 5: extension.ts — тонкий адаптер
```ts
export function activate(context: vscode.ExtensionContext) {
  const env = createVsCodeEnvironment(context);
  const app = new Application(env);
  app.activate();
}
```

## Что остаётся VS Code-специфичным
- GitLabCommentController — Comment API VS Code, не абстрагируем
- Document decorations — VS Code специфика
- Tree view creation — VS Code UI