# xychatai team-fronted 部署说明（仅部署文件）

本目录仅包含部署所需文件，不包含任何源代码。

## 文件列表
- `docker-compose.yml`: 使用远程镜像 `xychatai/team-fronted:latest` 的部署编排
- `.env.example`: 环境变量模板

## 快速部署
1. 准备环境
   - Docker >= 20.10
   - Docker Compose v2
2. 克隆部署分支或仅下载本目录内容
3. 复制环境模板并编辑
   ```bash
   cp .env.example .env
   # 按需编辑 .env（至少填 BACKEND_URL）
   ```
4. 启动服务
   ```bash
   docker compose up -d
   ```

## 自动更新
已集成 Watchtower 服务，默认每 5 分钟检查一次并自动拉取最新镜像：
- 目标容器：`frontend`
- 策略：`--interval 300 --cleanup --rolling-restart`

如需关闭自动更新，可在 `docker-compose.yml` 中移除 `watchtower` 服务。

## 常用命令
- 查看日志：`docker compose logs -f frontend`
- 拉取最新镜像并重启：`docker compose pull && docker compose up -d`
- 停止并移除：`docker compose down`

## 变量说明（.env）
- `BACKEND_URL`：后端 API 根地址（必填）
- `ADMIN_REDIRECT_BASE`：/admin 跳转基础域名（默认同 BACKEND_URL）
- `AGENT_REDIRECT_BASE`：/agent 跳转基础域名（默认同 BACKEND_URL）
- `FRONTEND_PORT`：宿主机暴露端口，默认 8080
- `TZ`：时区，默认 Asia/Shanghai

