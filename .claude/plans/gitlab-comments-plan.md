# План: Draft-комментарии на диффе файлов

## Архитектура

Пользователь кликает на строку диффа → VS Comment API создаёт thread → ввод текста → мгновенный POST в GitLab (draft: true) → PATCH (draft: false) для отправки.
