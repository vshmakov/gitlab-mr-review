# Шаг 2: Отправка draft-комментария в GitLab

## Что нужно

GitLab API для positioned notes требует:
- SHA-хэши из `diff_refs` (base_sha, start_sha, head_sha)
- old_line/new_line + old_path/new_path
- `draft: true` для черновика

## Изменения

### 1. GitLabRestClient — добавить `post` и `patch`
Сейчас только `get`. Добавить `post<T>` и `patch<T>` по аналогии.

### 2. GitLabMergeRequest — добавить SHA-поля
```ts
baseSha?: string;
startSha?: string;
headSha?: string;
```
Заполняются из `diff_refs` REST API GitLab.

### 3. GitLabNoteClient (client/)
Новый клиент для работы с notes:
- `createDraftNote(mergeRequest, file, body, oldLine?, newLine?)` → POST
- `submitNote(mergeRequest, noteId)` → PATCH draft: false

### 4. GitLabClient
Добавить `GitLabNoteClient` как зависимость.

### 5. GitLabClientFactory
Создавать `GitLabNoteClient` и передавать в `GitLabClient`.

### 6. GitLabCommentService
Вместо алерта — вызывать `GitLabNoteClient.createDraftNote()`.

## Файлы

Создаётся:
- `src/client/GitLabNoteClient.ts`

Изменяются:
- `src/client/GitLabRestClient.ts` — post/patch
- `src/model/GitLabMergeRequest.ts` — SHA
- `src/client/GitLabClient.ts` — noteClient
- `src/client/GitLabClientFactory.ts` — создание noteClient
- `src/extension/GitLabCommentService.ts` — вызов API
- `src/extension/GitLabMrReviewExtension.ts` — wiring