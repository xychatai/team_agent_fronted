#!/bin/bash

# 团队邀请系统前端部署脚本

echo "🚀 团队邀请系统前端部署脚本"
echo "================================"

# 检查当前目录
if [ ! -f "index.html" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

echo "📁 当前项目目录: $(pwd)"

# 显示配置信息
echo ""
echo "📋 当前配置:"
echo "   后端API地址: $(grep -o "baseURL: '[^']*'" config/api-config.js | cut -d"'" -f2)"
echo "   项目版本: $(grep -o '"version": "[^"]*"' package.json | cut -d'"' -f4)"

echo ""
echo "🎯 选择部署方式:"
echo "   1) 本地开发服务器 (推荐)"
echo "   2) Python HTTP服务器"
echo "   3) PHP内置服务器"
echo "   4) 生成Docker命令"
echo "   5) 生成Nginx配置"
echo "   6) 显示部署说明"

read -p "请选择 (1-6): " choice

case $choice in
    1)
        echo "🔧 启动本地开发服务器..."
        if command -v live-server &> /dev/null; then
            echo "✅ 使用 live-server"
            live-server --host=0.0.0.0 --port=8080 --open=/index.html
        elif command -v npm &> /dev/null; then
            echo "📦 安装 live-server..."
            npm install -g live-server
            live-server --host=0.0.0.0 --port=8080 --open=/index.html
        else
            echo "❌ 需要安装 Node.js 和 npm"
            echo "   请访问: https://nodejs.org/"
        fi
        ;;
    2)
        echo "🐍 启动Python HTTP服务器..."
        if command -v python3 &> /dev/null; then
            echo "✅ 使用 Python 3"
            echo "🌐 访问地址: http://localhost:8080"
            python3 -m http.server 8080
        elif command -v python &> /dev/null; then
            echo "✅ 使用 Python 2"
            echo "🌐 访问地址: http://localhost:8080"
            python -m SimpleHTTPServer 8080
        else
            echo "❌ 未找到 Python"
        fi
        ;;
    3)
        echo "🔧 启动PHP内置服务器..."
        if command -v php &> /dev/null; then
            echo "✅ 使用 PHP"
            echo "🌐 访问地址: http://localhost:8080"
            php -S localhost:8080
        else
            echo "❌ 未找到 PHP"
        fi
        ;;
    4)
        echo "🐳 Docker部署命令:"
        echo ""
        echo "   # 使用 Nginx:"
        echo "   docker run -d --name team-invite-frontend \\"
        echo "     -p 8080:80 \\"
        echo "     -v \$(pwd):/usr/share/nginx/html \\"
        echo "     nginx:alpine"
        echo ""
        echo "   # 使用 Apache:"
        echo "   docker run -d --name team-invite-frontend \\"
        echo "     -p 8080:80 \\"
        echo "     -v \$(pwd):/usr/local/apache2/htdocs \\"
        echo "     httpd:alpine"
        echo ""
        echo "   访问地址: http://localhost:8080"
        ;;
    5)
        echo "⚙️  Nginx配置文件:"
        echo ""
        cat << EOF
server {
    listen 80;
    server_name your-domain.com;
    root $(pwd);
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # 启用gzip压缩
    gzip on;
    gzip_types text/css application/javascript application/json;
    
    # 缓存静态资源
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
        ;;
    6)
        echo "📚 部署说明:"
        echo ""
        echo "1. 🌐 静态文件服务器:"
        echo "   - 将所有文件上传到Web服务器"
        echo "   - 确保index.html为默认首页"
        echo ""
        echo "2. ☁️  CDN部署:"
        echo "   - 上传到阿里云OSS、腾讯云COS等"
        echo "   - 配置自定义域名和HTTPS"
        echo ""
        echo "3. 🔧 配置修改:"
        echo "   - 编辑 config/api-config.js"
        echo "   - 修改 baseURL 为实际后端地址"
        echo ""
        echo "4. 🔒 HTTPS建议:"
        echo "   - 生产环境使用HTTPS"
        echo "   - 确保后端支持CORS"
        echo ""
        echo "详细说明请查看 README.md"
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "✅ 部署脚本执行完成"