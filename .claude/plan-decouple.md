# План: отвязка от VS Code

## Цель
Сделать бизнес-логику тестируемой без VS Code (Jest), оставив зависимость от vscode только в тонком адаптерном слое.

## Что сейчас привязано

| Файл | Зависимость |
|---|---|
| 3 стора | `vscode.window.showErrorMessage`, `vscode.EventEmitter` |
| 7 tree-классов | `vscode.TreeItem`, `ThemeIcon`, `ThemeColor`, `MarkdownString` |
| TreeProvider | `vscode.TreeDataProvider`, `EventEmitter` |
| Extension-слой | всё (commands, config, secrets, window) |
| ClientFactory | `ExtensionContext`, `workspace`, `window`, `commands` |

## Шаг 1: `Notifier` интерфейс

**`src/infra/notifier.ts`**
```ts
export interface Notifier {
  showInfo(message: string): void;
  showError(message: string): void;
  showWarning(message: string): void;
}
```

**`src/infra/vscode-notifier.ts`** — реализация через `vscode.window`

**Изменения:**
- `MergeRequestFilesStore` — конструктор принимает `Notifier`
- `MergeRequestApprovalStore` — конструктор принимает `Notifier`
- `MergeRequestsStore` — конструктор принимает `Notifier`
- `GitLabCommentService` — уже использует vscode.window, тоже заведем Notifier

## Шаг 2: Tree item как plain class

**`src/infra/tree-item.ts`** — интерфейс без vscode:
```ts
export interface ITreeItem {
  readonly label: string;
  readonly description?: string;
  readonly tooltip?: string;
  readonly contextValue: string;
  readonly collapsibleState: CollapsibleState; // enum, не vscode
  readonly command?: Command;
  getChildren?(): ITreeItem[];
}

export type CollapsibleState = None | Expanded | Collapsed;
```

**Рефакторинг tree-классов:**
- Больше не наследуют `vscode.TreeItem`
- Хранят данные как свойства (`label`, `description`, `contextValue` и т.д.)
- `getChildren()` возвращает `ITreeItem[]`

**`src/infra/vscode-tree-adapter.ts`** — адаптер:
```ts
// Конвертирует ITreeItem → vscode.TreeItem на лету
function toVsCodeTreeItem(item: ITreeItem): vscode.TreeItem
```

## Шаг 3: TreeProvider

- `MergeRequestsTreeProvider` работает с `ITreeItem` вместо `vscode.TreeItem`
- `getTreeItem()` использует адаптер для конвертации
- `EventEmitter` оставляем vscode-ный (это часть TreeDataProvider, не бизнес-логика)

## Шаг 4: Wire-up в extension

`GitLabMrReviewExtension` создаёт:
- `VsCodeNotifier` и передаёт в сторы
- Сторы получают `Notifier`, а не `vscode`
- Tree provider получает адаптер

## Что НЕ меняем
- `extension.ts`, `GitLabMrReviewExtension` — точка входа, должна знать про vscode
- `GitLabCommandRegistrar` — регистрация команд, inherently vscode
- `GitLabFileOpener` — работа с документами vscode
- `GitLabCommentController` — декорации текста в редакторе

## Результат
- Сторы и tree-логика тестируются через Jest без vscode
- Чистые функции (парсер, клиенты, утилиты) уже тестируются ✅
- VS Code-слой остаётся тонким и не тестируется отдельно (integration tests)