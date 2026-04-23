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

> 目前无改动。首次定制后在此处登记。

<!-- 示例：
### [001] 替换默认 Logo 与品牌色
- 类型：UI 定制
- 文件：packages/utils/src/theme/palette-generator.ts、apps/web/public/logo.svg
- 提交：abc1234
- 原因：品牌要求；优先走 theme 系统而非改组件源码
- 同步风险：上游若重构 theme 模块会冲突
- 可恢复性：低影响，失效时回退到官方品牌即可
-->

---

## 上游同步日志

每次从 upstream 合并后追加一条。

| 日期 | 合并到版本 | 合并方式 | 冲突文件 | 处理人 | 备注 |
|------|-----------|---------|---------|--------|------|
| —    | v1.3.0    | 初始克隆 | —       | —      | fork 起点 |

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
