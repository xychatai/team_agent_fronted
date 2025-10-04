/**
 * API调用封装模块
 * 提供统一的HTTP请求处理和错误处理
 */

class ApiClient {
    constructor() {
        this.config = window.API_CONFIG;
        this.retryCount = 0;
    }

    /**
     * 通用HTTP请求方法
     * @param {string} url - 请求URL
     * @param {Object} options - 请求选项
     * @returns {Promise} 请求结果
     */
    async request(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: this.config.request.timeout
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            // 创建AbortController用于超时控制
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), finalOptions.timeout);

            const response = await fetch(url, {
                ...finalOptions,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // 检查响应状态
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('API请求失败:', error);
            
            // 网络错误重试机制
            if (this.shouldRetry(error) && this.retryCount < this.config.request.retryTimes) {
                this.retryCount++;
                console.log(`重试第 ${this.retryCount} 次...`);
                
                await this.delay(this.config.request.retryDelay);
                return this.request(url, options);
            }

            this.retryCount = 0;
            throw this.handleError(error);
        }
    }

    /**
     * POST请求
     * @param {string} endpoint - API端点
     * @param {Object} data - 请求数据
     * @returns {Promise} 请求结果
     */
    async post(endpoint, data) {
        const url = window.getApiUrl(endpoint);
        if (!url) {
            throw new Error(`无效的API端点: ${endpoint}`);
        }

        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * GET请求
     * @param {string} endpoint - API端点
     * @param {Object} params - 查询参数
     * @returns {Promise} 请求结果
     */
    async get(endpoint, params = {}) {
        const url = window.getApiUrl(endpoint);
        if (!url) {
            throw new Error(`无效的API端点: ${endpoint}`);
        }

        const searchParams = new URLSearchParams(params);
        const finalUrl = searchParams.toString() ? `${url}?${searchParams}` : url;

        return this.request(finalUrl, {
            method: 'GET'
        });
    }

    /**
     * 判断是否应该重试
     * @param {Error} error - 错误对象
     * @returns {boolean} 是否重试
     */
    shouldRetry(error) {
        // 网络错误、超时错误或5xx服务器错误时重试
        return (
            error.name === 'AbortError' ||
            error.name === 'TypeError' ||
            (error.message && error.message.includes('HTTP 5'))
        );
    }

    /**
     * 错误处理
     * @param {Error} error - 原始错误
     * @returns {Object} 处理后的错误信息
     */
    handleError(error) {
        let errorMessage = '请求失败，请重试';
        let errorType = 'unknown';

        if (error.name === 'AbortError') {
            errorMessage = '请求超时，请检查网络连接';
            errorType = 'timeout';
        } else if (error.name === 'TypeError') {
            errorMessage = '网络连接失败，请检查网络设置';
            errorType = 'network';
        } else if (error.message && error.message.includes('HTTP')) {
            errorMessage = `服务器错误: ${error.message}`;
            errorType = 'server';
        } else if (error.message) {
            errorMessage = error.message;
        }

        return {
            success: false,
            error: errorMessage,
            type: errorType,
            originalError: error
        };
    }

    /**
     * 延迟函数
     * @param {number} ms - 延迟毫秒数
     * @returns {Promise} 延迟Promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 用户API类
class UserApi {
    constructor() {
        this.client = new ApiClient();
    }

    /**
     * 兑换码兑换
     * @param {string} code - 兑换码
     * @param {string} email - 用户邮箱
     * @param {boolean} confirmReplace - 是否确认替换已有绑定
     * @returns {Promise} 兑换结果
     */
    async redeem(code, email, confirmReplace = false) {
        return this.client.post('user.redeem', {
            code,
            email,
            confirm_replace: confirmReplace
        });
    }

    /**
     * 查询用户状态（通过邮箱）
     * @param {string} email - 用户邮箱
     * @returns {Promise} 状态信息
     */
    async getStatus(email) {
        return this.client.post('user.status', { email });
    }

    /**
     * 查询用户状态（通过兑换码）
     * @param {string} code - 兑换码
     * @returns {Promise} 状态信息
     */
    async getStatusByCode(code) {
        return this.client.post('user.status', { code });
    }

    /**
     * 获取解绑确认信息
     * @param {string} code - 兑换码
     * @returns {Promise} 解绑确认信息
     */
    async getUnbindConfirmation(code) {
        return this.client.post('user.unbind_confirm', { code });
    }

    /**
     * 确认邀请
     * @param {string} email - 用户邮箱
     * @returns {Promise} 确认结果
     */
    async confirm(email) {
        return this.client.post('user.confirm', { email });
    }

    /**
     * 解绑兑换码
     * @param {string} email - 用户邮箱
     * @param {string} code - 兑换码（可选）
     * @returns {Promise} 解绑结果
     */
    async unbind(email, code = null) {
        const data = { email };
        if (code) {
            data.code = code;
        }
        return this.client.post('user.unbind', data);
    }

    /**
     * 预览团队清理结果
     * @param {string} code - 兑换码
     * @returns {Promise} 清理预览结果
     */
    async cleanupPreview(code) {
        return this.client.post('user.cleanup.preview', { code });
    }

    /**
     * 执行团队清理
     * @param {string} code - 兑换码
     * @returns {Promise} 清理执行结果
     */
    async cleanupExecute(code) {
        return this.client.post('user.cleanup.execute', { code });
    }
}

// 质保API类
class WarrantyApi {
    constructor() {
        this.client = new ApiClient();
    }

    /**
     * 检查质保状态
     * @param {string} email - 用户邮箱
     * @returns {Promise} 质保状态
     */
    async checkStatus(email) {
        return this.client.post('warranty.check', { email });
    }

    /**
     * 申请质保替换
     * @param {string} email - 用户邮箱
     * @param {string} reason - 替换原因
     * @returns {Promise} 替换结果
     */
    async requestReplacement(email, reason = '母号失效') {
        return this.client.post('warranty.replace', { email, reason });
    }
}

// 帮助API类
class HelpApi {
    constructor() {
        this.client = new ApiClient();
    }

    /**
     * 获取帮助内容
     * @returns {Promise} 帮助内容
     */
    async getContent() {
        try {
            return await this.client.get('user.help');
        } catch (error) {
            // 如果API不存在或失败，返回默认结果
            console.warn('帮助API暂不可用:', error);
            return {
                success: false,
                content: null
            };
        }
    }
}

// 创建全局API实例
window.userApi = new UserApi();
window.warrantyApi = new WarrantyApi();
window.helpApi = new HelpApi();

// 导出API类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ApiClient,
        UserApi,
        WarrantyApi,
        HelpApi
    };
}

console.log('API模块已加载');