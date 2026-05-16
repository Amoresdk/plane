# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目背景（重要）

这是一个**基于 makeplane/plane 二次开发的独立项目**，**不再跟随上游更新**。Plane 只是起点，未来所有演进都在自己的主线上进行。

### 法律合规（AGPL-3.0）

Plane 采用 AGPL-3.0 许可证，本项目继承该许可证并以同样方式发布。关键义务：

1. **保留原始版权与 LICENSE 文件**，根目录 `LICENSE` 不要删除或替换
2. **衍生作品保持 AGPL-3.0**，不能改成 MIT、私有专有协议或闭源
3. **网络服务条款**：如果以 SaaS 或对外网络服务形式部署，必须向使用服务的用户提供完整源码下载入口（这是 AGPL 区别于 GPL 的核心条款）
4. 新代码与原项目作为整体分发时一并以 AGPL-3.0 发布

### 工作流约定

- **唯一主线**：`main` 分支。日常开发、特性分支都基于 `main`
- **代码改动**：直接修改，不需要保留"上游兼容"的额外考量
- **提交规范**：自由使用 conventional commit（`feat:` / `fix:` / `chore:` / `refactor:` 等）。历史中保留了 `[CUSTOM]` 前缀的提交是早期"还是 fork"时期的标记，新提交不再需要这个前缀
- **`CUSTOMIZATIONS.md`**：现为**初始变更归档**（脱离上游前那一刻的差异快照），不再持续维护新改动，只读

### 上游 Plane 关系

- `upstream` remote 仍保留，仅用于查阅上游的安全补丁。fetch refspec 已收窄为只拿 `upstream/master`
- 想看上游有没有修某个漏洞：`git fetch upstream && git log upstream/master --oneline | head -50`
- 真要 cherry-pick 上游补丁：`git cherry-pick <commit-sha>`，**手动操作，不要自动同步**

根目录的 `AGENTS.md` 是 Plane 上游留下的简短命令笔记，作为补充参考即可，不要重复其内容。

## 部署现状（当前已运行）

This fork runs in **hybrid mode**: backend + infrastructure inside Docker, frontend dev servers on the host. This is the official Plane recommended setup, not a fork-specific choice.

### What's running where

| 层                                                     | 跑在哪                                     | 启动命令                                           | 热加载                            |
| ------------------------------------------------------ | ------------------------------------------ | -------------------------------------------------- | --------------------------------- |
| Postgres / Redis / RabbitMQ / MinIO                    | Docker (`docker-compose-local.yml`)        | `docker compose -f docker-compose-local.yml up -d` | n/a                               |
| Django API + Celery worker / beat / migrator           | Docker（源码 `volume` 挂载到容器 `/code`） | 同上                                               | Django runserver autoreload ✓     |
| `apps/web` / `apps/admin` / `apps/space` / `apps/live` | 宿主机（`pnpm dev` via turbo）             | `pnpm dev` 在仓库根目录                            | Vite HMR ✓ / live 用 tsdown watch |

不要把前端塞进 Docker——macOS Docker Desktop 的挂载 I/O 慢，Vite HMR 会从毫秒级退化到秒级，开发体验明显下降。

### 引导账号（首位实例管理员）

```
邮箱:  admin@plane.local
密码:  admin123
```

数据库里已存在该账号，并已设置 `Instance.is_setup_done=True`。`docker compose down` 不删卷，重启不会丢数据；只有 `down -v` 才会清空。

### 端口（已统一迁到 19xxx 段）

| 服务           | 端口                                 |
| -------------- | ------------------------------------ |
| 主应用 web     | http://localhost:**19000**           |
| God Mode admin | http://localhost:**19001**/god-mode/ |
| 公开空间 space | http://localhost:**19002**/spaces/   |
| 实时协作 live  | ws://localhost:**19100**             |
| Django API     | http://localhost:**19800**           |
| Postgres       | localhost:**19432**                  |
| Redis          | localhost:**19379**                  |
| MinIO S3       | http://localhost:**19900**           |
| MinIO console  | http://localhost:**19990**           |

注意：**容器间互通**仍用原端口（5432 / 6379 / 9000）。`apps/api/.env` 里 `POSTGRES_PORT=5432`、`REDIS_PORT=6379` 是容器内通信值，**别改**；只改了 host 映射端口和宿主机访问的 URL。

## Monorepo layout

Plane is a **dual-stack monorepo**: Python/Django backend + TypeScript/React frontend, managed by two separate tool chains.

- `apps/api` — Django project (Python). Managed by `pyproject.toml` (ruff) + `requirements/`. **Not part of the pnpm workspace** (see `pnpm-workspace.yaml` exclusions)。
- `apps/proxy` — Caddy reverse proxy. Also outside pnpm workspace.
- `apps/web`、`apps/admin`、`apps/space`、`apps/live` — 4 个前端 app（React Router v7）
- `packages/*` — shared TypeScript packages (`editor`, `ui`, `i18n`, `shared-state`, `services`, ...)

Frontend apps and `packages/*` share `pnpm@10` + `turbo@2.9` workspace. Internal deps use `workspace:*`; external deps pinned via `catalog:` in `pnpm-workspace.yaml`. Node `>=22.18`.

## Commands

### 日常启动 / 重启

```bash
# 后端基础设施（已构建过镜像，重启很快）
docker compose -f docker-compose-local.yml up -d
docker compose -f docker-compose-local.yml ps              # 看容器状态
docker compose -f docker-compose-local.yml logs -f api     # 跟 API 日志

# 前端（开一个常驻终端窗口）
pnpm dev                                                   # 全部 4 个前端
pnpm --filter=web dev                                      # 只起 web，省资源

# 停止
docker compose -f docker-compose-local.yml down            # 保留数据
docker compose -f docker-compose-local.yml down -v         # ⚠️ 清空所有数据卷
```

首次启动后 Vite 会做依赖预构建（约 473 个 deps，30–60 秒），之后秒开。

### Frontend (pnpm + turbo)

```bash
pnpm build                                  # all packages + apps
pnpm check                                  # format + lint + types
pnpm check:types                            # depends on ^build
pnpm fix                                    # auto-fix format + lint

pnpm turbo run <task> --filter=@plane/ui    # 单包
pnpm --filter=@plane/ui storybook           # Storybook 端口 6006

pnpm --filter=@plane/live exec vitest run path/to/file.test.ts  # 单测
```

### Backend (Django, in container)

通过 `docker compose exec` 直接在 api 容器里跑 manage.py：

```bash
# Django shell
docker compose -f docker-compose-local.yml exec api \
  python manage.py shell --settings=plane.settings.local

# 单元测试 / 单文件 / 单用例
docker compose -f docker-compose-local.yml exec api ./run_tests.sh
docker compose -f docker-compose-local.yml exec api pytest plane/tests/path/to/test_file.py
docker compose -f docker-compose-local.yml exec api pytest plane/tests/path/to/test_file.py::TestClass::test_name

# Lint / format（ruff，行宽 120，配置在 apps/api/pyproject.toml）
docker compose -f docker-compose-local.yml exec api ruff check plane/
docker compose -f docker-compose-local.yml exec api ruff format plane/
```

如果在宿主机直接跑 Django，需要本地装 Python 3.12 + `requirements/local.txt` 依赖；不推荐，容器里跑就够了。

## Code architecture

### Django backend (`apps/api/plane/`)

Django project 名为 `plane`。关键 app：

- `api/` — DRF views/serializers/urls (public API surface)
- `app/` — internal web app endpoints
- `authentication/` — auth flows (password, OAuth, magic link)
- `bgtasks/` — Celery tasks（`celery.py` 在项目根）
- `db/` — models, managers, queryset helpers
- `license/` — self-hosted license + instance config
- `middleware/`, `throttles/` — request-level concerns
- `space/`, `web/` — edition-specific endpoints
- `settings/` — split settings（base + 由 env 决定的覆盖）

运行时服务：`api`（WSGI）、`worker`（Celery）、`beat-worker`（Celery beat）、`migrator`（一次性迁移）。彼此通过 Postgres + Redis + RabbitMQ 协调。

### Frontend architecture

- **Routing**: React Router v7（**不是** Next.js）。`react-router.config.ts` 控制 ssr 等。
- **State**: MobX stores in `packages/shared-state` — 响应式，不是 Redux/Zustand。
- **Editor**: `@plane/editor` 封装 TipTap。新增编辑器功能必须走 `packages/editor/src/core/extensions/` 里的扩展系统（hook：`useEditor`），不要 fork 编辑器核心。
- **UI library**: `packages/ui` — 通过 Storybook 隔离开发。复用/扩展这里的组件，不要在 app 里重复造。
- **Theming**: `packages/utils/src/theme` 提供 `applyCustomTheme`、`generateThemePalettes`。品牌定制走这里，别硬编码颜色。
- **`apps/web/core/` vs `apps/web/ce/`**：community-edition override 模式。共享代码在 `core/`，CE 专属实现在 `ce/`。改动前先确认该改哪一层。

### i18n 实情（重要）

`FALLBACK_LANGUAGE` 已改为 `"zh-CN"`，但从 Plane 继承下来的 i18n 覆盖是**残缺的**：

- ✅ `apps/web` 主交互（菜单、表单、按钮、提示）走 `useTranslation` → 已是中文
- ❌ `apps/admin` 整个应用**没接 i18n**（`grep useTranslation apps/admin` 零结果），所有文本硬编码英文
- ❌ `apps/web` 部分页面硬编码英文（如 `not-ready-view.tsx` 的 "Welcome to Plane"、登录页的 "Work in all dimensions"、底部条款链接等）

要全中文化必须改源码替换硬编码字符串 + 补 zh-CN 翻译键。这部分是后续工作，可以按页面/模块逐步推进。

### i18n 翻译键规则

- 嵌套结构 + ICU MessageFormat（plurals / variables）
- 新增 key 必须**所有语言文件都加**（缺失会静默 fallback）
- 加新语言要改 3 处：`types/language.ts`、`constants/language.ts`、新建 locales 目录。详见 `CONTRIBUTING.md` "Adding new languages"

## 易踩的坑

### 1. Django shell 创建管理员要补 setup 标志

直接 `User.objects.create() + InstanceAdmin.objects.create()` 会绕过 `/api/instances/admins/sign-up/` 端点，**不会**自动设置：

```python
inst.is_setup_done = True
inst.is_signup_screen_visited = True
```

否则前端永远显示 "Setup your Plane Instance" 表单。要么用官方端点 POST，要么 shell 里手动补这两个字段。

### 2. localhost vs 127.0.0.1 的 IPv6 陷阱

Docker Desktop 会把容器端口同时绑到 IPv4 (`0.0.0.0`) 和 IPv6 (`*` / `[::]`)。如果系统里**另一个** Docker 容器也绑了同一端口的 IPv6（典型如 NewAPI/OneAPI），浏览器解析 `localhost` 优先走 IPv6，会命中那个容器而非 Plane。这次端口迁到 19xxx 已规避此风险，但若以后再加新服务，先用 `lsof -nP -iTCP:<port> -sTCP:LISTEN` 确认端口干净。

### 3. trailing slash 严格匹配

admin app 的 basename `/god-mode` 严格要求末尾 `/`。访问 `localhost:19001/god-mode` 会 404，必须 `localhost:19001/god-mode/`。从 Plane 继承的小毛病，待修。

### 4. URL 构造的 trailing slash

`VITE_ADMIN_BASE_URL`(`http://localhost:19001`) + `VITE_ADMIN_BASE_PATH`(`/god-mode`) = `http://localhost:19001/god-mode`（无末尾 `/`），所以 web 跳 admin 时会先 404 再让用户手动加斜杠。同上一条，待修。

## Tooling

- **Formatter**: `oxfmt`（不是 Prettier）。lint-staged pre-commit 跑 `.{js,jsx,ts,tsx,json,css,md}`。
- **Linter**: `oxlint`（不是 ESLint）。配置 `.oxlintrc.json`。pre-commit 用 `--deny-warnings --fix` 跑 `.{js,jsx,ts,tsx}`。
- **Python**: `ruff` 同时做 lint 和 format，行宽 120，isort 把 `plane` 当 first-party。
- **Husky** 管 git hooks（`.husky/`）。**不要** `--no-verify` 绕过；hook 失败要查根因。
- **Turbo cache**: `turbo.json` 声明任务的 inputs/outputs。`check:types` depends on `^build`，上游包类型出错会级联——先 build 受影响的包再 type-check。

## Environment variables

`turbo.json` 的 `globalEnv` 列出了所有影响构建产物的变量。前端变量都加 `VITE_` 前缀（Vite 约定）+ `SENTRY_*`、`APP_VERSION`、`LOG_LEVEL`。后端变量在 `apps/api/.env`（参考 `.env.example`）：`DATABASE_URL`、`REDIS_URL`、`AMQP_URL`、`AWS_S3_*`、`SECRET_KEY`。

`.env` 文件**不入 git**（被 `.gitignore` 忽略），是开发者本机配置；只有 `.env.example` 入 git。

## 提交 / PR 规范

- 使用 conventional commit 前缀：`feat:` / `fix:` / `chore:` / `refactor:` / `docs:` / `test:` / `style:` / `perf:`
- 中文 body 可以
- 永远**不要** push 到 `upstream`（指 makeplane/plane，只读）；push 到 `origin`（自己的 fork）
