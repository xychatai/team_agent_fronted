# 团队邀请系统 - 独立前端

## 📋 项目概述

这是团队邀请系统的独立前端项目，与后端完全分离，可以独立部署到任何静态文件服务器。支持配置后端API地址，为未来的支付功能集成等扩展做好准备。

## ✨ 特性

- 🔄 **前后端分离**: 完全独立的前端，不依赖后端框架
- ⚙️ **可配置后端**: 通过配置文件灵活指定后端API地址
- 📱 **响应式设计**: 支持桌面端和移动端
- 🎨 **现代UI**: 基于Vue 3 + Element Plus
- 🔒 **跨域支持**: 支持跨域API调用
- 💳 **支付就绪**: 预留支付模块接口
- 🚀 **零构建**: 纯静态文件，无需构建过程

## 🏗️ 项目结构

```
frontend-user/
├── index.html              # 主页面
├── config/
│   └── api-config.js       # API配置文件
├── assets/
│   ├── css/
│   │   └── style.css       # 样式文件
│   └── js/
│       ├── main.js         # 主逻辑
│       └── api.js          # API调用封装
├── package.json            # 项目配置
└── README.md               # 项目说明
```

## 🚀 快速开始

### 方法一：直接打开HTML文件

1. 克隆或下载项目文件
2. 直接用浏览器打开 `index.html`
3. 如需修改后端地址，编辑 `config/api-config.js`

### 方法二：使用本地服务器

```bash
# 使用Python
python -m http.server 8080

# 使用PHP
php -S localhost:8080

# 使用Node.js (需要先安装live-server)
npm install -g live-server
live-server --port=8080
```

### 方法三：使用npm脚本

```bash
# 安装依赖（可选，仅用于开发服务器）
npm install

# 启动开发服务器
npm run dev

# 使用Python服务器
npm run serve
```

## ⚙️ 配置

### 修改后端API地址

编辑 `config/api-config.js` 文件：

```javascript
const DEFAULT_CONFIG = {
    // 修改这里的baseURL
    baseURL: 'https://your-backend-domain.com',
    // 其他配置...
};
```

### 环境变量配置

如果部署环境支持，可以通过环境变量配置：

```bash
export API_BASE_URL=https://your-backend-domain.com
```

### 路径跳转（/admin 与 /agent）

当访问前端域名下的 `/admin` 或 `/agent`（含子路径，如 `/admin/login`、`/agent/xxx`）时，会自动重定向到后端的对应路径。

- 默认重定向基址来源：`.env` 中的 `BACKEND_URL`
- 可分别覆盖：

```env
# 可选：单独为 /admin 与 /agent 指定跳转基础域名
ADMIN_REDIRECT_BASE=https://teamapi.example.com
AGENT_REDIRECT_BASE=https://teamapi.example.com
```

示例：
- 访问 `https://team.xychatai.com/admin` → 跳转到 `https://teamapi.jiankong.xychatai.com/admin`
- 访问 `https://team.xychatai.com/agent/a/b` → 跳转到 `https://teamapi.jiankong.xychatai.com/agent/a/b`

## 🌐 部署指南

### 静态文件服务器部署

将所有文件上传到任何支持静态文件的Web服务器：

- Apache
- Nginx  
- IIS
- Caddy
- 或任何CDN服务

### Nginx配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/frontend-user;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 启用gzip压缩
    gzip on;
    gzip_types text/css application/javascript application/json;
}
```

### Docker部署

#### 方法一：使用nginx镜像（简单静态托管）
```bash
# 使用nginx镜像
docker run -d \
  --name team-invite-frontend \
  -p 8080:80 \
  -v $(pwd):/usr/share/nginx/html \
  nginx:alpine

# 或使用apache镜像
docker run -d \
  --name team-invite-frontend \
  -p 8080:80 \
  -v $(pwd):/usr/local/apache2/htdocs \
  httpd:alpine
```

#### 方法二：使用 docker-compose（推荐）
```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置后端地址等参数

# 2. 构建并启动服务
docker-compose up -d

# 3. 查看日志
docker-compose logs -f frontend-user

# 4. 停止服务
docker-compose down
```

#### Docker Compose 配置说明

项目包含完整的 `docker-compose.yml` 配置，支持：

- **前端服务**: 基于 Flask 的代理服务器
- **环境变量配置**: 通过 `.env` 文件管理
- **健康检查**: 自动监控服务状态
- **日志管理**: 持久化日志存储
- **网络配置**: 支持与后端服务通信

主要环境变量：
```env
BACKEND_URL=http://team_invite_web:5125  # 后端服务地址
FRONTEND_PORT=8080                       # 前端服务端口
FLASK_DEBUG=false                        # 调试模式
TZ=Asia/Shanghai                         # 时区配置
```

### CDN部署

将文件上传到CDN服务：
- 阿里云OSS
- 腾讯云COS  
- AWS S3
- Cloudflare Pages
- Vercel
- Netlify

## 🔧 功能说明

### 核心功能

1. **兑换码兑换**: 用户输入兑换码和邮箱进行团队邀请
2. **状态查询**: 查询邀请状态、绑定信息
3. **质保服务**: 检查质保状态、申请替换
4. **解绑功能**: 解绑兑换码，支持重新使用

### API接口

所有API调用都通过配置的后端地址：

- `POST /api/user/redeem` - 兑换码兑换
- `POST /api/user/status` - 查询状态  
- `POST /api/user/warranty/check` - 检查质保
- `POST /api/user/warranty/replace` - 申请替换
- `POST /api/user/unbind` - 解绑兑换码

## 🔒 安全说明

### CORS配置

后端需要配置CORS以支持跨域请求：

```python
from flask_cors import CORS

# 在Flask应用中添加
CORS(app, origins=['https://your-frontend-domain.com'])
```

### HTTPS建议

生产环境建议使用HTTPS：
- 保护用户数据传输
- 支持现代浏览器特性
- 提升SEO排名

## 🔮 未来扩展

### 支付模块集成

项目已预留支付模块接口，可以轻松集成：

```javascript
// 在 config/api-config.js 中已预留
payment: {
    gateway: {
        alipay: { /* 支付宝配置 */ },
        wechat: { /* 微信支付配置 */ },
        stripe: { /* Stripe配置 */ }
    }
}
```

### 多语言支持

可以添加国际化支持：
- 英文界面
- 其他语言支持
- 动态语言切换

### 主题定制

支持主题切换：
- 深色模式
- 自定义品牌色彩
- 响应式布局优化

## 🐛 故障排除

### 常见问题

1. **跨域错误**
   - 确保后端已配置CORS
   - 检查API地址配置是否正确

2. **API请求失败**
   - 检查网络连接
   - 确认后端服务运行状态
   - 查看浏览器控制台错误信息

3. **页面显示异常**
   - 检查CDN资源加载是否正常
   - 清除浏览器缓存重试

### 调试模式

打开浏览器开发者工具查看：
- Network面板：检查API请求
- Console面板：查看JavaScript错误
- Application面板：检查本地存储

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📞 支持

如有问题，请联系：
- 提交GitHub Issue
- 发送邮件到：support@example.com

---

**注意**: 这是一个独立的前端项目，不会修改原有的后端系统。可以与现有系统并行运行。
