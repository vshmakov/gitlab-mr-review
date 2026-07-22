# GitLab MR Review

Расширение для VS Code, которое показывает Merge Requests, ожидающие твоего ревью.

## Что умеет

- Показывает список MR-ов из GitLab в боковой панели VS Code
- Позволяет смотреть дифф каждого файла прямо в редакторе
- Открывает MR в браузере по клику
- Парсит unified diff с подсветкой синтаксиса

## Установка

1. Скопируй папку в расширения VS Code или установи из `.vsix`:
```bash
vsce package
code --install-extension gitlab-mr-review-0.0.1.vsix
```

## Настройка

1. Укажи адрес GitLab-сервера в настройках:
```json
{
  "gitlabMrReview.url": "https://gitlab.example.com"
}
```

2. Нажми **GitLab MR Review: Authenticate** в Command Palette для авторизации.

## Команды

| Команда | Описание |
|---------|----------|
| `GitLab MR Review: Refresh` | Обновить список MR-ов |
| `GitLab MR Review: Authenticate` | Авторизоваться в GitLab |
| `GitLab MR Review: Log Out` | Выйти из аккаунта |
| `GitLab MR Review: Open File Patch` | Открыть дифф файла в редакторе |

## Разработка

```bash
npm install
npm run compile    # компиляция
npm run watch      # режим наблюдения
```

Запусти debug в VS Code (F5) — откроется новое окно с расширением.