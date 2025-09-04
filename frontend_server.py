#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
团队邀请系统前端代理服务器
提供静态文件服务 + 后端API代理
"""

import os
import sys
import requests
import json
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, send_file, redirect
from urllib.parse import urljoin
from dotenv import load_dotenv
import logging

# 加载环境变量
load_dotenv()

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 创建Flask应用
app = Flask(__name__)

# 配置
class Config:
    # 后端API服务器地址（可通过环境变量覆盖）
    BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:5125')
    
    # 前端服务器配置
    HOST = os.environ.get('FRONTEND_HOST', '0.0.0.0')
    PORT = int(os.environ.get('FRONTEND_PORT', 8080))
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    # 静态文件目录
    STATIC_DIR = os.path.dirname(os.path.abspath(__file__))

    # 后台管理跳转基础域名（可选）
    # 若未设置，则使用 BACKEND_URL
    ADMIN_REDIRECT_BASE = os.environ.get('ADMIN_REDIRECT_BASE') or BACKEND_URL
    AGENT_REDIRECT_BASE = os.environ.get('AGENT_REDIRECT_BASE') or BACKEND_URL

config = Config()

# ========== 静态文件服务 ==========

@app.route('/')
def index():
    """主页"""
    return send_file(os.path.join(config.STATIC_DIR, 'index.html'))

@app.route('/favicon.ico')
def favicon():
    """网站图标"""
    return send_file(os.path.join(config.STATIC_DIR, 'favicon.ico'))

@app.route('/assets/<path:filename>')
def assets(filename):
    """静态资源文件"""
    return send_from_directory(os.path.join(config.STATIC_DIR, 'assets'), filename)

@app.route('/config/<path:filename>')
def config_files(filename):
    """配置文件"""
    return send_from_directory(os.path.join(config.STATIC_DIR, 'config'), filename)

# ========== 管理/Agent 跳转 ==========

def _build_redirect_url(base: str, prefix: str, subpath: str) -> str:
    # 规范化路径
    if subpath:
        target_path = f"/{prefix.rstrip('/')}/{subpath.lstrip('/')}"
    else:
        target_path = f"/{prefix.strip('/')}"

    target_url = urljoin(base, target_path)

    # 保留查询参数
    if request.query_string:
        try:
            qs = request.query_string.decode('utf-8')
        except Exception:
            qs = request.query_string.decode('latin-1', errors='ignore')
        if qs:
            connector = '&' if ('?' in target_url) else '?'
            target_url = f"{target_url}{connector}{qs}"

    return target_url


@app.route('/admin', defaults={'path': ''})
@app.route('/admin/<path:path>')
def admin_redirect(path):
    """将 /admin* 路径重定向到后端域名"""
    target_url = _build_redirect_url(config.ADMIN_REDIRECT_BASE, 'admin', path)
    return redirect(target_url, code=302)


@app.route('/agent', defaults={'path': ''})
@app.route('/agent/<path:path>')
def agent_redirect(path):
    """将 /agent* 路径重定向到后端域名"""
    target_url = _build_redirect_url(config.AGENT_REDIRECT_BASE, 'agent', path)
    return redirect(target_url, code=302)

# ========== 后端API代理 ==========

@app.route('/backend_api/<path:api_path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
def backend_proxy(api_path):
    """
    后端API代理
    将 /backend_api/* 请求转发到真正的后端服务器
    """
    try:
        # 构造后端URL
        backend_url = urljoin(config.BACKEND_URL, f'/api/{api_path}')
        
        # 获取请求数据
        headers = dict(request.headers)
        # 移除一些代理不需要的头部
        headers.pop('Host', None)
        headers.pop('Content-Length', None)
        
        # 处理请求数据
        data = None
        if request.method in ['POST', 'PUT'] and request.is_json:
            data = request.get_json()
        elif request.method in ['POST', 'PUT']:
            data = request.get_data()
        
        # 获取查询参数
        params = dict(request.args)
        
        logger.info(f"代理请求: {request.method} {backend_url}")
        logger.debug(f"请求头: {headers}")
        logger.debug(f"请求数据: {data}")
        
        # 发送请求到后端
        response = requests.request(
            method=request.method,
            url=backend_url,
            headers=headers,
            json=data if request.is_json else None,
            data=data if not request.is_json else None,
            params=params,
            timeout=30
        )
        
        logger.info(f"后端响应: {response.status_code}")
        
        # 构造响应
        resp_headers = {}
        
        # 复制一些重要的响应头
        for key, value in response.headers.items():
            if key.lower() not in ['content-encoding', 'content-length', 'transfer-encoding', 'connection']:
                resp_headers[key] = value
        
        # 返回响应
        if response.headers.get('content-type', '').startswith('application/json'):
            return jsonify(response.json()), response.status_code, resp_headers
        else:
            return response.content, response.status_code, resp_headers
            
    except requests.exceptions.RequestException as e:
        logger.error(f"代理请求失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'后端服务不可用: {str(e)}',
            'type': 'proxy_error'
        }), 502
    except Exception as e:
        logger.error(f"代理处理异常: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'代理服务器内部错误: {str(e)}',
            'type': 'internal_error'
        }), 500

# ========== 健康检查和信息接口 ==========

@app.route('/health')
def health_check():
    """健康检查"""
    try:
        # 检查后端连接
        backend_health_url = urljoin(config.BACKEND_URL, '/health')
        response = requests.get(backend_health_url, timeout=5)
        backend_status = response.status_code == 200
    except:
        backend_status = False
    
    return jsonify({
        'status': 'healthy',
        'frontend': True,
        'backend': backend_status,
        'backend_url': config.BACKEND_URL,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/info')
def server_info():
    """服务器信息"""
    return jsonify({
        'name': '团队邀请系统前端代理服务器',
        'version': '1.0.0',
        'backend_url': config.BACKEND_URL,
        'host': config.HOST,
        'port': config.PORT,
        'debug': config.DEBUG
    })

# ========== 错误处理 ==========

@app.errorhandler(404)
def not_found(error):
    """404错误处理 - 返回首页"""
    return send_file(os.path.join(config.STATIC_DIR, 'index.html'))

@app.errorhandler(500)
def internal_error(error):
    """500错误处理"""
    return jsonify({
        'success': False,
        'error': '服务器内部错误',
        'type': 'server_error'
    }), 500

# ========== 启动服务器 ==========

if __name__ == '__main__':
    from datetime import datetime
    
    print("🚀 团队邀请系统前端代理服务器")
    print("=" * 50)
    print(f"📁 静态文件目录: {config.STATIC_DIR}")
    print(f"🔗 后端API地址: {config.BACKEND_URL}")
    print(f"🌐 服务器地址: http://{config.HOST}:{config.PORT}")
    print(f"🔧 调试模式: {'开启' if config.DEBUG else '关闭'}")
    print("=" * 50)
    
    # 检查静态文件
    index_file = os.path.join(config.STATIC_DIR, 'index.html')
    if not os.path.exists(index_file):
        print(f"❌ 错误: 找不到 index.html 文件")
        print(f"   请确保在正确的目录运行此脚本")
        sys.exit(1)
    
    print("✅ 静态文件检查通过")
    print(f"🎯 访问地址: http://localhost:{config.PORT}")
    print("🔄 代理路径: /backend_api/* -> " + config.BACKEND_URL + "/api/*")
    print()
    
    try:
        app.run(
            host=config.HOST,
            port=config.PORT,
            debug=config.DEBUG,
            threaded=True
        )
    except KeyboardInterrupt:
        print("\n👋 服务器已停止")
    except Exception as e:
        print(f"❌ 启动失败: {e}")
        sys.exit(1)
