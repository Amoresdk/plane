# Customizations

本文件记录本 fork 相对 upstream (`makeplane/plane`) 的所有定制改动。**每次改动都必须登记**，这是未来同步上游时避免遗漏和快速定位冲突的依据。

---

## 上游追踪信息

- **Fork 来源**：https://github.com/makeplane/plane
- **Fork 基准分支**：`upstream/master`
- **当前基线版本**：v1.3.0（commit `cf696d200d`）
- **本地分支**：
  - `master` — 镜像 upstream，不做任何修改
  - `custom/main` — 所有定制代码都在这里

---

## 定制登记

### 格式说明

每条改动按以下模板记录：

```
### [编号] 简短标题
- 类型：配置 / 新增模块 / 修改核心 / UI 定制 / 其他
- 文件：具体路径，多个用列表
- 提交：commit hash（或 PR 号）
- 原因：为什么必须这么改，能否改为上层方案
- 同步风险：上游改动此区域时可能出现的冲突点
- 可恢复性：若此改动失效，对业务的影响
```

### 改动清单

### [001] 默认语言改为简体中文

- 类型：修改核心（i18n 常量）
- 文件：`packages/i18n/src/constants/language.ts`
- 提交：（待提交）
- 原因：本 fork 主要面向中文用户，希望首次访问的浏览器在无 `localStorage(userLanguage)` 时直接展示中文；i18n store 仅基于 localStorage + `FALLBACK_LANGUAGE` 决策，没有 env 或扩展点可走
- 同步风险：上游若调整 `FALLBACK_LANGUAGE` 类型定义、重命名常量或重构 store 初始化逻辑会冲突
- 可恢复性：低影响。失效时把值改回 `"en"` 即可，UI 也仍然支持用户在 Profile 设置里手动切换

### [002] 全部端口迁移到 19xxx 段

- 类型：修改核心（端口配置）+ 本地配置（.env）
- 文件：
  - `apps/web/package.json`、`apps/admin/package.json`、`apps/space/package.json`（dev/preview/start 脚本端口）
  - `docker-compose-local.yml`（host 端口映射，容器内端口不变）
  - `apps/{web,admin,space,live,api}/.env`（URL、CORS、PORT，**`.env` 不入 git**，仅供参考）
- 提交：（待提交，仅含 package.json + docker-compose-local.yml）
- 端口映射：3000→19000(web) / 3001→19001(admin) / 3002→19002(space) / 3100→19100(live) / 8000→19800(api) / 5432→19432(pg) / 6379→19379(redis) / 9000→19900(minio s3) / 9090→19990(minio console)
- 原因：3000 与 NewAPI/OneAPI 等本地 AI 网关冲突，5432/6379 与本机常装的 PostgreSQL/Redis 冲突。整体改到 19xxx 段（unprivileged、未被常见服务占用、同前缀易记）规避所有这类冲突
- 同步风险：上游若改 docker-compose-local.yml 端口结构或 package.json dev script 形式会冲突
- 可恢复性：中等。若失效需改回原值；同步时如冲突，端口选择是本地偏好，可优先采纳上游版本再重新 `sed` 改回 19xxx
- 注意：容器间互通端口（POSTGRES_PORT=5432、REDIS_PORT=6379 在 `apps/api/.env`）保持原值，因为它们指容器内端口，与 host 映射无关

---

## 上游同步日志

每次从 upstream 合并后追加一条。

| 日期 | 合并到版本 | 合并方式 | 冲突文件 | 处理人 | 备注      |
| ---- | ---------- | -------- | -------- | ------ | --------- |
| —    | v1.3.0     | 初始克隆 | —        | —      | fork 起点 |

---

## 改动优先级原则（决策指南）

按以下顺序选择实现方式，能用上层方案就不下沉：

1. **环境变量 / `.env`** — 首选，零冲突风险
2. **官方扩展点** — 次选
   - 编辑器：`@plane/editor` extensions
   - 主题：`packages/utils/src/theme` 的 `applyCustomTheme`
   - 后端：新建独立 Django app 放在 `apps/api/` 下
3. **新增文件** — 再次，几乎不冲突
4. **修改核心文件** — 最后选项，必须：
   - 改动行数尽量少
   - 加注释标记 `// [CUSTOM] 原因: xxx`
   - 本文件登记

---

## 同步流程提醒

```bash
git fetch upstream --tags
git checkout master && git pull upstream master
git checkout custom/main && git merge master
# 有冲突 → 先理解上游为什么改，再决定保留方案
# 合并完成 → 跑一遍关键流程冒烟测试 → 在本文件追加同步日志
```
