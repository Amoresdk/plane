# 初始变更归档

> **本文件是历史归档**。它记录了本项目脱离 makeplane/plane 上游、独立演进**之前**那一刻相对于上游的差异快照。
>
> 项目已转入独立开发模式，新改动不再登记在此处——直接走常规 commit 历史即可（`git log`）。本文件保留为只读，仅用于追溯项目起点。

---

## 项目起点

- **起源仓库**：https://github.com/makeplane/plane
- **基线版本**：v1.3.0（commit `cf696d200d`）
- **脱离日期**：2026-05-16
- **许可证**：AGPL-3.0（继承自上游，本项目继续以 AGPL-3.0 发布）

---

## 脱离前的差异清单

### [001] 默认语言改为简体中文

- 文件：`packages/i18n/src/constants/language.ts`
- 改动：`FALLBACK_LANGUAGE` 由 `"en"` 改为 `"zh-CN"`
- 原因：项目面向中文用户，希望首次访问的浏览器在没有 `localStorage(userLanguage)` 时直接展示中文

### [002] 全部端口迁移到 19xxx 段

- 文件：
  - `apps/web/package.json`、`apps/admin/package.json`、`apps/space/package.json`（dev/preview/start 脚本端口）
  - `docker-compose-local.yml`（host 端口映射，容器内端口不变）
  - `apps/{web,admin,space,live,api}/.env`（URL、CORS、PORT，**`.env` 不入 git**）
- 端口映射：3000→19000(web) / 3001→19001(admin) / 3002→19002(space) / 3100→19100(live) / 8000→19800(api) / 5432→19432(pg) / 6379→19379(redis) / 9000→19900(minio s3) / 9090→19990(minio console)
- 原因：3000 与 NewAPI/OneAPI 等本地 AI 网关冲突，5432/6379 与本机常装的 PostgreSQL/Redis 冲突。19xxx 段未被常见服务占用、同前缀易记
- 注意：容器间互通端口（`apps/api/.env` 里 `POSTGRES_PORT=5432`、`REDIS_PORT=6379`）保持原值，因为它们指容器内端口，与 host 映射无关

---

## 历史经验：改动优先级（可继续作为开发指南）

虽然不再是"fork"约束，但下面的层次原则对长期维护性仍然有价值：

1. **环境变量 / `.env`** — 零侵入，首选
2. **官方扩展点**
   - 编辑器：`@plane/editor` extensions
   - 主题：`packages/utils/src/theme` 的 `applyCustomTheme`
   - 后端：新建独立 Django app 放在 `apps/api/` 下
3. **新增文件** — 隔离性好
4. **修改核心文件** — 改动尽量集中、注释说明意图
