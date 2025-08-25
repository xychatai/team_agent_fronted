@echo off
echo 🚀 团队邀请系统前端代理服务器
echo ====================================
echo.

REM 检查Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到Python
    echo    请安装Python 3.7+
    pause
    exit /b 1
)

REM 检查依赖
if not exist requirements.txt (
    echo ❌ 错误: 找不到requirements.txt
    pause
    exit /b 1
)

echo 📦 检查并安装依赖...
pip install -r requirements.txt

if errorlevel 1 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

echo.
echo ✅ 依赖安装完成
echo.

REM 设置环境变量（可选）
REM set BACKEND_URL=http://localhost:5125
REM set FRONTEND_PORT=8080

echo 🔧 启动配置:
echo    前端端口: %FRONTEND_PORT% (默认8080)
echo    后端地址: %BACKEND_URL% (默认http://localhost:5125)
echo.

echo 🚀 启动服务器...
echo    访问地址: http://localhost:8080
echo    按Ctrl+C停止服务器
echo.

python frontend_server.py

pause