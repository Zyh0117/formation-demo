# 足球比赛阵容演示

这个 Demo 展示 SZTUFA 赛事详情页的「双方阵容」交互。观众可以从球场查看首发和球员事件，编辑者可以在同一页调整主客队阵容，预览会同步更新。

## 本地打开

```bash
git clone https://github.com/Zyh0117/formation-demo.git
cd formation-demo
```

用浏览器打开 [formation-demo.html](./formation-demo.html)。页面无需安装依赖或启动服务，打开时请保留同目录下的 JS 和 CSS 文件。

## 使用方法

- **查看阵容。** 在「双方阵容」中点选球场上的首发或下方的替补，查看对应球员的本场记录。「关键事件」标签页显示全场事件。
- **编辑阵容。** 点击顶部的「编辑双方阵容」，分别选择主客队阵型。从任一队的候选名单选中球员，再点击同队的场上位置。使用「一键排入」只补齐空位。
- **记录比赛。** 切到「赛后标注」，点击场上球员记录进球、助攻或红黄牌。换人时先在替补席点「换上」，再选同队要换下的球员并输入分钟。比赛预览中的阵型图继续显示原首发。
- **保留改动。** 支持撤销、重做和 JSON 导入导出。编辑会保存在当前浏览器。要备份或在另一台设备继续编辑，可导出 JSON，再在目标浏览器导入。

## 接入网站

[match-lineups.js](./match-lineups.js) 和 [match-lineups.css](./match-lineups.css) 提供可嵌入赛事详情的阵容展示。调用 `window.MatchLineups.mount(container, { match, formations, onPlayerClick })`，传入官网现有的比赛详情数据。可选的 `formations` 按 `home`、`away` 提供 `shape` 和 `playerIds`。球员 ID 按门将、后卫、中场、前锋的槽位顺序排列，空位用 `null`。可通过 `onPlayerClick(playerId, playerName)` 打开球员资料。比赛没有阵型位置时，组件会显示名单。

[match-preview.js](./match-preview.js) 提供演示数据并连接编辑器和预览。此仓库使用示例阵型和比赛事件，尚未接入官网或后端。
