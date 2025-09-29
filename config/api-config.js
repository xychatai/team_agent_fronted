/**
 * 前端API配置文件
 * 用于配置后端API服务地址
 */

// 简单配置 - 使用Flask代理服务器时的API路径
const DEFAULT_CONFIG = {
    // 后端API基础URL (空字符串表示同域)
    baseURL: '',
    
    // API路径配置
    endpoints: {
        // 用户相关接口
        user: {
            redeem: '/backend_api/user/redeem',
            status: '/backend_api/user/status', 
            confirm: '/backend_api/user/confirm',
            unbind: '/backend_api/user/unbind',
            help: '/backend_api/user/help',
            cleanup: {
                preview: '/backend_api/user/cleanup/preview',
                execute: '/backend_api/user/cleanup/execute'
            }
        },
        // 质保相关接口
        warranty: {
            check: '/backend_api/user/warranty/check',
            replace: '/backend_api/user/warranty/replace'
        }
    },
    
    // 请求配置
    request: {
        timeout: 300000, // 5分钟超时
        retryTimes: 3,   // 重试次数
        retryDelay: 1000 // 重试延迟(ms)
    },
    
    // 未来扩展：支付相关配置（预留）
    payment: {
        // 支付网关配置
        gateway: {
            // alipay: {},
            // wechat: {},
            // stripe: {}
        }
    }
};

// 最终配置
const API_CONFIG = DEFAULT_CONFIG;

// 获取完整的API URL
function getApiUrl(endpoint) {
    // 处理嵌套的endpoint路径
    const pathParts = endpoint.split('.');
    let path = API_CONFIG.endpoints;
    
    for (const part of pathParts) {
        if (path[part]) {
            path = path[part];
        } else {
            console.error(`API endpoint not found: ${endpoint}`);
            return null;
        }
    }
    
    return API_CONFIG.baseURL + path;
}

// 导出配置和工具函数
window.API_CONFIG = API_CONFIG;
window.getApiUrl = getApiUrl;

// 配置验证
console.log('API配置已加载:', {
    baseURL: API_CONFIG.baseURL || '(同域代理)',
    endpoints: Object.keys(API_CONFIG.endpoints)
});