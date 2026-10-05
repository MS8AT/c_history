# План тестирования

## 1. Статический контракт

Команда: `npm test`.

Проверяет обязательные файлы, локальные `href/src`, lang/title/description,
семантические секции, alt/aria, skip-link, reduced-motion, отсутствие внешних
ресурсов и запретных публичных маркеров.

## 2. Source quality

- `git diff --check` после инициализации Git;
- UTF-8 и отсутствие битой кодировки;
- инвентарь дерева без зависимостей, build/runtime и временных файлов;
- ручное чтение README, страницы, rights notice и public-safe disclaimer.

## 3. Visual и interaction QA

Локальный HTTP preview:

- desktop viewport около 1440×900;
- mobile viewport около 390×844;
- переходы по якорям, кнопка звёзд, scroll progress;
- клавиатурная навигация и видимый focus;
- основная история при отключённом JavaScript;
- reduced-motion без обязательной анимации.

## 4. Public safety

- secret/sensitive pattern scan всего tracked tree;
- подтверждение отсутствия внешних запросов;
- никакие source/workspace/runtime файлы не попали в репозиторий;
- logo checksum и происхождение сверены с текущим фирменным asset.

## 5. Git и GitHub

- локальный repository root строго `c_history`;
- branch `main`, clean status, один scoped initial commit;
- push dry-run/guarded publish;
- remote URL соответствует `MS8AT/c_history`;
- GitHub сообщает `visibility=PUBLIC`;
- remote `refs/heads/main` совпадает с local HEAD;
- fresh clone проходит `git fsck --full` и имеет то же дерево;
- публичная HTTPS-страница репозитория читается без credentials.
