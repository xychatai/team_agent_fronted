/**
 * 主应用逻辑
 * 基于Vue 3 + Element Plus实现
 */

const { createApp, ref, reactive } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;

// 创建Vue应用
const app = createApp({
    setup() {
        // 响应式数据
        const activeTab = ref('redeem');
        const loading = reactive({
            redeem: false,
            unbindConfirm: false,
            warranty: false,
            replace: false,
            unbind: false,
            help: false,
            batch: false,
            batchUnbindCheck: false,
            batchUnbind: false,
            cleanupPreview: false,
            cleanupExecute: false
        });
        
        // 兑换表单相关
        const redeemFormRef = ref(null);
        const redeemForm = reactive({
            code: '',
            email: ''
        });
        const redeemRules = {
            code: [
                { required: true, message: '请输入兑换码', trigger: 'blur' }
            ],
            email: [
                { required: true, message: '请输入邮箱', trigger: 'blur' },
                { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
            ]
        };
        const redeemResult = ref(null);
        
        // 解绑表单相关（独立页面）
        const unbindMode = ref('single');
        const unbindFormRef = ref(null);
        const unbindForm = reactive({
            code: ''
        });
        const unbindRules = {
            code: [
                { required: true, message: '请输入兑换码', trigger: 'blur' }
            ]
        };
        const unbindConfirmation = ref(null);
        
        // 批量解绑相关
        const batchUnbindForm = reactive({
            codes: '',
            codeList: []
        });
        
        const batchUnbindValidation = reactive({
            isValid: false,
            message: '',
            type: 'info'
        });
        
        const batchUnbindProgress = reactive({
            total: 0,
            success: 0,
            failed: 0,
            pending: 0,
            percentage: 0
        });
        
        const batchUnbindResults = ref([]);
        
        // 帮助内容相关
        const helpContent = ref(null);
        
        // 批量兑换相关
        const batchForm = reactive({
            emails: '',
            codes: '',
            emailList: [],
            codeList: []
        });
        
        const batchValidation = reactive({
            isValid: false,
            message: '',
            type: 'info'
        });
        
        const batchProgress = reactive({
            total: 0,
            success: 0,
            failed: 0,
            pending: 0,
            percentage: 0
        });
        
        const batchResults = ref([]);
        
        // 团队清理相关
        const cleanupFormRef = ref(null);
        const cleanupForm = reactive({
            code: ''
        });
        const cleanupRules = {
            code: [
                { required: true, message: '请输入兑换码', trigger: 'blur' }
            ]
        };
        const cleanupPreviewResult = ref(null);
        const cleanupExecuteResult = ref(null);
        
        // 监听标签页切换
        const handleTabChange = (tabName) => {
            if (tabName === 'help' && helpContent.value === null) {
                loadHelpContent();
            }
        };
        
        // 加载帮助内容
        const loadHelpContent = async () => {
            loading.help = true;
            try {
                const data = await window.helpApi.getContent();
                if (data.success && data.content) {
                    helpContent.value = data.content;
                } else {
                    // API存在但没有内容，显示提示
                    helpContent.value = '';
                }
            } catch (error) {
                console.warn('获取帮助内容失败，使用默认内容:', error);
                // 设置为空字符串，这样会显示默认内容
                helpContent.value = '';
            } finally {
                loading.help = false;
            }
        };
        
        // 页面加载时尝试获取帮助内容
        const initializeHelp = async () => {
            try {
                const data = await window.helpApi.getContent();
                if (data.success && data.content) {
                    helpContent.value = data.content;
                } else {
                    helpContent.value = '';
                }
            } catch (error) {
                console.warn('初始化帮助内容失败:', error);
                helpContent.value = '';
            }
        };
        
        // 批量输入验证
        const validateBatchInput = () => {
            // 解析邮箱列表
            const emailLines = batchForm.emails.trim().split('\n').filter(line => line.trim().length > 0);
            const codeLines = batchForm.codes.trim().split('\n').filter(line => line.trim().length > 0);
            
            batchForm.emailList = emailLines.map(line => line.trim());
            batchForm.codeList = codeLines.map(line => line.trim());
            
            // 重置验证状态
            batchValidation.isValid = false;
            batchValidation.message = '';
            batchValidation.type = 'info';
            
            // 检查是否有输入
            if (batchForm.emailList.length === 0 && batchForm.codeList.length === 0) {
                return;
            }
            
            // 检查数量是否匹配
            if (batchForm.emailList.length !== batchForm.codeList.length) {
                batchValidation.message = `邮箱数量（${batchForm.emailList.length}）和兑换码数量（${batchForm.codeList.length}）不匹配，请确保每行对应`;
                batchValidation.type = 'error';
                return;
            }
            
            // 检查邮箱格式
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const invalidEmails = batchForm.emailList.filter(email => !emailRegex.test(email));
            if (invalidEmails.length > 0) {
                batchValidation.message = `发现 ${invalidEmails.length} 个无效邮箱格式：${invalidEmails.slice(0, 3).join(', ')}${invalidEmails.length > 3 ? '...' : ''}`;
                batchValidation.type = 'error';
                return;
            }
            
            // 检查兑换码是否为空
            const emptyCodes = batchForm.codeList.filter(code => code.length === 0);
            if (emptyCodes.length > 0) {
                batchValidation.message = '发现空的兑换码，请检查输入';
                batchValidation.type = 'error';
                return;
            }
            
            // 检查重复
            const uniqueEmails = new Set(batchForm.emailList);
            const uniqueCodes = new Set(batchForm.codeList);
            
            if (uniqueEmails.size !== batchForm.emailList.length) {
                batchValidation.message = `发现重复邮箱，请检查输入`;
                batchValidation.type = 'warning';
                return;
            }
            
            if (uniqueCodes.size !== batchForm.codeList.length) {
                batchValidation.message = `发现重复兑换码，请检查输入`;
                batchValidation.type = 'warning';
                return;
            }
            
            // 验证通过
            batchValidation.isValid = true;
            batchValidation.message = `准备处理 ${batchForm.emailList.length} 对邮箱和兑换码`;
            batchValidation.type = 'success';
        };
        
        // 批量兑换处理
        const handleBatchRedeem = async () => {
            if (!batchValidation.isValid) {
                ElMessage.warning('请先检查输入格式');
                return;
            }
            
            loading.batch = true;
            
            // 初始化进度和结果
            const total = batchForm.emailList.length;
            batchProgress.total = total;
            batchProgress.success = 0;
            batchProgress.failed = 0;
            batchProgress.pending = total;
            batchProgress.percentage = 0;
            
            // 初始化结果列表
            batchResults.value = batchForm.emailList.map((email, index) => ({
                email: email,
                code: batchForm.codeList[index],
                status: 'pending',
                statusText: '等待处理',
                message: ''
            }));
            
            // 逐个处理兑换
            for (let i = 0; i < total; i++) {
                const email = batchForm.emailList[i];
                const code = batchForm.codeList[i];
                const result = batchResults.value[i];
                
                try {
                    // 更新当前状态为处理中
                    result.status = 'processing';
                    result.statusText = '处理中...';
                    
                    // 调用兑换API
                    const data = await window.userApi.redeem(code, email);
                    
                    if (data.success) {
                        result.status = 'success';
                        result.statusText = '兑换成功';
                        result.message = data.message || '请检查邮箱接受邀请';
                        batchProgress.success++;
                    } else {
                        result.status = 'failed';
                        result.statusText = '兑换失败';
                        result.message = data.error || '未知错误';
                        batchProgress.failed++;
                    }
                } catch (error) {
                    result.status = 'failed';
                    result.statusText = '请求失败';
                    result.message = error.error || error.message || '网络错误';
                    batchProgress.failed++;
                }
                
                // 更新进度
                batchProgress.pending--;
                batchProgress.percentage = Math.round(((i + 1) / total) * 100);
                
                // 添加延迟避免服务器压力
                if (i < total - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            loading.batch = false;
            
            // 显示完成消息
            if (batchProgress.success === total) {
                ElMessage.success(`全部兑换成功！共处理 ${total} 个兑换码`);
            } else if (batchProgress.failed === total) {
                ElMessage.error(`全部兑换失败！共处理 ${total} 个兑换码`);
            } else {
                ElMessage.info(`批量兑换完成！成功 ${batchProgress.success} 个，失败 ${batchProgress.failed} 个`);
            }
        };
        
        // 清空批量结果
        const clearBatchResults = () => {
            batchResults.value = [];
            batchProgress.total = 0;
            batchProgress.success = 0;
            batchProgress.failed = 0;
            batchProgress.pending = 0;
            batchProgress.percentage = 0;
            batchForm.emails = '';
            batchForm.codes = '';
            batchForm.emailList = [];
            batchForm.codeList = [];
            batchValidation.isValid = false;
            batchValidation.message = '';
            batchValidation.type = 'info';
        };
        
        // 批量解绑输入验证
        const validateBatchUnbindInput = () => {
            // 解析兑换码列表
            const codeLines = batchUnbindForm.codes.trim().split('\n').filter(line => line.trim().length > 0);
            batchUnbindForm.codeList = codeLines.map(line => line.trim());
            
            // 重置验证状态
            batchUnbindValidation.isValid = false;
            batchUnbindValidation.message = '';
            batchUnbindValidation.type = 'info';
            
            // 检查是否有输入
            if (batchUnbindForm.codeList.length === 0) {
                return;
            }
            
            // 检查兑换码是否为空
            const emptyCodes = batchUnbindForm.codeList.filter(code => code.length === 0);
            if (emptyCodes.length > 0) {
                batchUnbindValidation.message = '发现空的兑换码，请检查输入';
                batchUnbindValidation.type = 'error';
                return;
            }
            
            // 检查重复
            const uniqueCodes = new Set(batchUnbindForm.codeList);
            if (uniqueCodes.size !== batchUnbindForm.codeList.length) {
                batchUnbindValidation.message = `发现重复兑换码，请检查输入`;
                batchUnbindValidation.type = 'warning';
                return;
            }
            
            // 验证通过
            batchUnbindValidation.isValid = true;
            batchUnbindValidation.message = `准备查询 ${batchUnbindForm.codeList.length} 个兑换码的绑定状态`;
            batchUnbindValidation.type = 'success';
        };
        
        // 批量查询绑定状态（通过兑换码）
        const handleBatchCheckStatusByCode = async () => {
            if (!batchUnbindValidation.isValid) {
                ElMessage.warning('请先检查兑换码输入格式');
                return;
            }
            
            loading.batchUnbindCheck = true;
            
            // 初始化进度和结果
            const total = batchUnbindForm.codeList.length;
            batchUnbindProgress.total = total;
            batchUnbindProgress.success = 0;
            batchUnbindProgress.failed = 0;
            batchUnbindProgress.pending = total;
            batchUnbindProgress.percentage = 0;
            
            // 初始化结果列表
            batchUnbindResults.value = batchUnbindForm.codeList.map(code => ({
                code: code,
                status: 'pending',
                statusText: '等待查询',
                message: '',
                binding: null,
                canUnbind: false
            }));
            
            // 逐个查询绑定状态
            for (let i = 0; i < total; i++) {
                const code = batchUnbindForm.codeList[i];
                const result = batchUnbindResults.value[i];
                
                try {
                    // 更新当前状态为查询中
                    result.status = 'processing';
                    result.statusText = '查询中...';
                    
                    // 调用状态查询API（通过兑换码）
                    const data = await window.userApi.getStatusByCode(code);
                    
                    if (data.success) {
                        if (data.has_binding && data.binding && data.binding.status === 'active') {
                            result.status = 'checked';
                            result.statusText = '可解绑';
                            result.binding = data.binding;
                            result.canUnbind = true;
                            result.message = `已绑定${data.binding.type === 'warranty' ? '质保型' : '一次性'}兑换码`;
                            batchUnbindProgress.success++;
                        } else {
                            result.status = 'checked';
                            result.statusText = '无可解绑项';
                            result.message = data.has_binding ? '绑定状态非活跃或已过期' : '未绑定任何用户';
                            batchUnbindProgress.success++;
                        }
                    } else {
                        result.status = 'failed';
                        result.statusText = '查询失败';
                        result.message = data.error || '状态查询失败';
                        batchUnbindProgress.failed++;
                    }
                } catch (error) {
                    result.status = 'failed';
                    result.statusText = '查询失败';
                    result.message = error.error || error.message || '网络错误';
                    batchUnbindProgress.failed++;
                }
                
                // 更新进度
                batchUnbindProgress.pending--;
                batchUnbindProgress.percentage = Math.round(((i + 1) / total) * 100);
                
                // 添加延迟避免服务器压力
                if (i < total - 1) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }
            
            loading.batchUnbindCheck = false;
            
            // 显示查询完成消息
            const canUnbindCount = batchUnbindResults.value.filter(r => r.canUnbind).length;
            if (canUnbindCount > 0) {
                ElMessage.success(`查询完成！发现 ${canUnbindCount} 个可解绑项`);
            } else {
                ElMessage.info(`查询完成！没有发现可解绑项`);
            }
        };
        
        // 批量解绑处理
        const handleBatchUnbind = async () => {
            const unbindableItems = batchUnbindResults.value.filter(r => r.canUnbind);
            
            if (unbindableItems.length === 0) {
                ElMessage.warning('没有可解绑的项目');
                return;
            }
            
            try {
                await ElMessageBox.confirm(
                    `确定要批量解绑 ${unbindableItems.length} 个兑换码吗？此操作不可撤销。`,
                    '确认批量解绑',
                    {
                        confirmButtonText: '确定解绑',
                        cancelButtonText: '取消',
                        type: 'warning',
                        dangerouslyUseHTMLString: true
                    }
                );
            } catch (error) {
                if (error === 'cancel') {
                    return;
                }
            }
            
            loading.batchUnbind = true;
            
            // 重置进度统计
            batchUnbindProgress.success = 0;
            batchUnbindProgress.failed = 0;
            batchUnbindProgress.pending = unbindableItems.length;
            batchUnbindProgress.percentage = 0;
            
            // 逐个解绑
            for (let i = 0; i < unbindableItems.length; i++) {
                const item = unbindableItems[i];
                
                try {
                    // 更新当前状态为解绑中
                    item.status = 'processing';
                    item.statusText = '解绑中...';
                    
                    // 调用解绑API（使用绑定中的用户邮箱）
                    const userEmail = item.binding.user_email || item.binding.masked_email || '';
                    const data = await window.userApi.unbind(userEmail, item.binding.redemption_code);
                    
                    if (data.success) {
                        item.status = 'success';
                        item.statusText = '解绑成功';
                        item.message = `${item.binding.type === 'warranty' ? '质保型' : '一次性'}兑换码解绑成功`;
                        item.canUnbind = false;
                        item.unbindResponse = data; // 保存解绑响应数据
                        batchUnbindProgress.success++;
                    } else {
                        item.status = 'failed';
                        item.statusText = '解绑失败';
                        item.message = data.error || '解绑操作失败';
                        batchUnbindProgress.failed++;
                    }
                } catch (error) {
                    item.status = 'failed';
                    item.statusText = '解绑失败';
                    item.message = error.error || error.message || '网络错误';
                    batchUnbindProgress.failed++;
                }
                
                // 更新进度
                batchUnbindProgress.pending--;
                batchUnbindProgress.percentage = Math.round(((i + 1) / unbindableItems.length) * 100);
                
                // 添加延迟避免服务器压力
                if (i < unbindableItems.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            loading.batchUnbind = false;
            
            // 显示批量解绑结果汇总弹窗
            showBatchUnbindResultDialog(unbindableItems);
            
            // 显示完成消息
            if (batchUnbindProgress.success === unbindableItems.length) {
                ElMessage.success(`全部解绑成功！共处理 ${unbindableItems.length} 个兑换码`);
            } else if (batchUnbindProgress.failed === unbindableItems.length) {
                ElMessage.error(`全部解绑失败！共处理 ${unbindableItems.length} 个兑换码`);
            } else {
                ElMessage.info(`批量解绑完成！成功 ${batchUnbindProgress.success} 个，失败 ${batchUnbindProgress.failed} 个`);
            }
        };
        
        // 清空批量解绑结果
        const clearBatchUnbindResults = () => {
            batchUnbindResults.value = [];
            batchUnbindProgress.total = 0;
            batchUnbindProgress.success = 0;
            batchUnbindProgress.failed = 0;
            batchUnbindProgress.pending = 0;
            batchUnbindProgress.percentage = 0;
            batchUnbindForm.codes = '';
            batchUnbindForm.codeList = [];
            batchUnbindValidation.isValid = false;
            batchUnbindValidation.message = '';
            batchUnbindValidation.type = 'info';
        };
        
        // 获取解绑结果标签类型
        const getUnbindResultTagType = (result) => {
            if (result.status === 'success') return 'success';
            if (result.status === 'failed') return 'danger';
            if (result.status === 'checked' && result.canUnbind) return 'warning';
            if (result.status === 'checked') return 'info';
            return 'info';
        };
        
        // 显示批量解绑结果汇总弹窗
        const showBatchUnbindResultDialog = (processedItems) => {
            const successItems = processedItems.filter(item => item.status === 'success');
            const failedItems = processedItems.filter(item => item.status === 'failed');
            
            // 构建弹窗内容
            let dialogContent = `
                <div class="batch-unbind-result-dialog">
                    <div class="result-summary">
                        <div class="summary-stats">
                            <div class="stat-item success-stat">
                                <div class="stat-number">${successItems.length}</div>
                                <div class="stat-label">成功解绑</div>
                            </div>
                            <div class="stat-item failed-stat">
                                <div class="stat-number">${failedItems.length}</div>
                                <div class="stat-label">解绑失败</div>
                            </div>
                        </div>
                    </div>
            `;
            
            if (successItems.length > 0) {
                dialogContent += `
                    <div class="result-section success-section">
                        <h3>✅ 解绑成功的兑换码 (${successItems.length}个)</h3>
                        <div class="code-list">
                `;
                
                successItems.forEach(item => {
                    const codeType = item.binding.type === 'warranty' ? '质保型' : '一次性';
                    
                    // 获取解绑响应数据
                    const unbindData = item.unbindResponse || {};
                    const oldCode = unbindData.old_redemption_code || item.binding.redemption_code;
                    const newCode = unbindData.new_redemption_code;
                    const canReuse = unbindData.can_reuse;
                    
                    let codeDisplay = '';
                    let isReusable = true;
                    let reusableText = '✅ 可重新使用';
                    
                    if (codeType === '质保型') {
                        // 质保型总是可重用，使用原兑换码
                        codeDisplay = oldCode;
                        reusableText = '✅ 可重新使用';
                    } else if (codeType === '一次性') {
                        if (canReuse !== false) {
                            // 母号活跃，可重用
                            if (newCode && newCode !== oldCode) {
                                codeDisplay = `${newCode} <span style="color: #909399; font-size: 11px;">(新)</span>`;
                            } else {
                                codeDisplay = oldCode;
                            }
                            reusableText = '✅ 可重新使用';
                        } else {
                            // 母号问题，检查是否有新兑换码
                            if (newCode && newCode !== oldCode) {
                                codeDisplay = `${newCode} <span style="color: #67c23a; font-size: 11px;">(新生成)</span>`;
                                reusableText = '✅ 新兑换码可用';
                            } else {
                                codeDisplay = `${oldCode} <span style="color: #ef4444; font-size: 11px;">(已作废)</span>`;
                                isReusable = false;
                                reusableText = '⚠️ 母号已封禁';
                            }
                        }
                    }
                    
                    dialogContent += `
                        <div class="code-item success-item">
                            <div class="code-info">
                                <div class="code-display">${codeDisplay}</div>
                                <div class="code-meta">
                                    <span class="code-type ${item.binding.type}">${codeType}</span>
                                    <span class="email-info">${newCode && newCode !== oldCode ? newCode : oldCode}</span>
                                </div>
                            </div>
                            <div class="reuse-status">
                                <span class="${isReusable ? 'reusable' : 'not-reusable'}">${reusableText}</span>
                            </div>
                        </div>
                    `;
                });
                
                dialogContent += `
                        </div>
                        <div class="copy-actions">
                            <button class="copy-button" onclick="copySuccessCodes()">
                                📋 复制所有成功的兑换码
                            </button>
                        </div>
                    </div>
                `;
            }
            
            if (failedItems.length > 0) {
                dialogContent += `
                    <div class="result-section failed-section">
                        <h3>❌ 解绑失败的项目 (${failedItems.length}个)</h3>
                        <div class="failed-list">
                `;
                
                failedItems.forEach(item => {
                    dialogContent += `
                        <div class="failed-item">
                            <div class="failed-info">
                                <div class="email-display">${item.email}</div>
                                <div class="error-message">${item.message || '未知错误'}</div>
                            </div>
                            ${item.binding ? 
                                `<div class="code-display small">${item.binding.redemption_code}</div>` : 
                                ''
                            }
                        </div>
                    `;
                });
                
                dialogContent += `
                        </div>
                    </div>
                `;
            }
            
            dialogContent += `
                    <div class="dialog-tips">
                        <div class="tip-item">
                            <strong>📌 提示：</strong>
                        </div>
                        <div class="tip-content">
                            • 质保型兑换码解绑后总是可以重新使用<br>
                            • 一次性兑换码解绑成功说明母号活跃，可以重新使用<br>
                            • 母号已封禁的兑换码无法产生新的兑换码<br>
                            • 请妥善保存上述兑换码，避免丢失
                        </div>
                    </div>
                </div>
            `;
            
            // 存储成功的兑换码列表用于复制功能（只复制可用的兑换码）
            window.batchUnbindSuccessCodes = successItems.filter(item => {
                const unbindData = item.unbindResponse || {};
                const canReuse = unbindData.can_reuse;
                const newCode = unbindData.new_redemption_code;
                const oldCode = unbindData.old_redemption_code || item.binding.redemption_code;
                
                // 质保型总是可用，或者一次性且可重用，或者有新兑换码
                return item.binding.type === 'warranty' || 
                       canReuse !== false || 
                       (newCode && newCode !== oldCode);
            }).map(item => {
                const unbindData = item.unbindResponse || {};
                const oldCode = unbindData.old_redemption_code || item.binding.redemption_code;
                const newCode = unbindData.new_redemption_code;
                
                // 优先返回新兑换码，如果没有则返回原兑换码
                return newCode && newCode !== oldCode ? newCode : oldCode;
            });
            
            // 显示弹窗
            ElMessageBox.alert(dialogContent, '批量解绑结果汇总', {
                dangerouslyUseHTMLString: true,
                confirmButtonText: '知道了',
                customClass: 'batch-result-dialog',
                callback: () => {
                    // 清理全局变量
                    delete window.batchUnbindSuccessCodes;
                }
            });
        };
        
        // 复制成功的兑换码到剪贴板
        const copySuccessCodes = () => {
            if (window.batchUnbindSuccessCodes && window.batchUnbindSuccessCodes.length > 0) {
                const codesText = window.batchUnbindSuccessCodes.join('\n');
                navigator.clipboard.writeText(codesText).then(() => {
                    ElMessage.success(`已复制 ${window.batchUnbindSuccessCodes.length} 个兑换码到剪贴板`);
                }).catch(() => {
                    // 降级方案：使用 textarea 复制
                    const textarea = document.createElement('textarea');
                    textarea.value = codesText;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    ElMessage.success(`已复制 ${window.batchUnbindSuccessCodes.length} 个兑换码到剪贴板`);
                });
            }
        };
        
        // 将复制函数暴露到全局作用域
        window.copySuccessCodes = copySuccessCodes;
        
        // 团队清理预览处理
        const handleCleanupPreview = () => {
            cleanupFormRef.value.validate(async (valid) => {
                if (valid) {
                    loading.cleanupPreview = true;
                    cleanupPreviewResult.value = null;
                    cleanupExecuteResult.value = null;
                    
                    try {
                        const data = await window.userApi.cleanupPreview(cleanupForm.code);
                        cleanupPreviewResult.value = data;
                        
                        if (data.success) {
                            ElMessage.success(`预览成功！发现 ${data.will_delete_count} 个可清理成员`);
                        } else {
                            ElMessage.error(data.error || '预览失败');
                        }
                    } catch (error) {
                        console.error('清理预览请求失败:', error);
                        cleanupPreviewResult.value = error;
                        ElMessage.error(error.error || '请求失败，请重试');
                    } finally {
                        loading.cleanupPreview = false;
                    }
                }
            });
        };
        
        // 团队清理执行处理
        const handleCleanupExecute = async () => {
            if (!cleanupPreviewResult.value || !cleanupPreviewResult.value.success) {
                ElMessage.warning('请先进行预览');
                return;
            }
            
            const previewData = cleanupPreviewResult.value;
            
            try {
                await ElMessageBox.confirm(
                    `<div style="line-height: 1.8;">
                        <p><strong>确定要执行团队清理吗？</strong></p>
                        <p>母号：${previewData.mother_email}</p>
                        <p>将删除 <span style="color: #f56c6c; font-weight: bold;">${previewData.will_delete_count}</span> 个非用户成员</p>
                        <p>将保留 <span style="color: #67c23a; font-weight: bold;">${previewData.will_keep_count}</span> 个已绑定用户</p>
                        <p style="color: #e6a23c; margin-top: 10px;">⚠️ 此操作不可撤销！</p>
                    </div>`,
                    '确认执行清理',
                    {
                        confirmButtonText: '确定执行',
                        cancelButtonText: '取消',
                        type: 'warning',
                        dangerouslyUseHTMLString: true
                    }
                );
                
                loading.cleanupExecute = true;
                cleanupExecuteResult.value = null;
                
                const data = await window.userApi.cleanupExecute(cleanupForm.code);
                cleanupExecuteResult.value = data;
                
                if (data.success) {
                    ElMessage.success(`清理完成！成功删除 ${data.deleted_count} 个成员`);
                    // 清理成功后重置预览结果
                    cleanupPreviewResult.value = null;
                } else {
                    ElMessage.error(data.error || '清理失败');
                }
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('清理执行请求失败:', error);
                    cleanupExecuteResult.value = error;
                    ElMessage.error(error.error || '请求失败，请重试');
                }
            } finally {
                loading.cleanupExecute = false;
            }
        };
        
        // 页面加载完成后初始化帮助内容
        Vue.nextTick(() => {
            initializeHelp();
        });
        
        // 兑换码兑换处理
        const handleRedeem = () => {
            redeemFormRef.value.validate(async (valid) => {
                if (valid) {
                    loading.redeem = true;
                    redeemResult.value = null;
                    
                    try {
                        const data = await window.userApi.redeem(redeemForm.code, redeemForm.email);
                        redeemResult.value = data;
                        
                        if (data.success) {
                            ElMessage.success('兑换成功！请检查邮箱');
                        } else {
                            ElMessage.error(data.error || '兑换失败');
                        }
                    } catch (error) {
                        console.error('兑换请求失败:', error);
                        redeemResult.value = error;
                        ElMessage.error(error.error || '请求失败，请重试');
                    } finally {
                        loading.redeem = false;
                    }
                }
            });
        };
        
        
        // 解绑确认处理
        const handleUnbindConfirm = () => {
            unbindFormRef.value.validate(async (valid) => {
                if (valid) {
                    loading.unbindConfirm = true;
                    unbindConfirmation.value = null;
                    
                    try {
                        const data = await window.userApi.getUnbindConfirmation(unbindForm.code);
                        
                        if (data.success) {
                            unbindConfirmation.value = data;
                        } else {
                            ElMessage.error(data.error || '获取确认信息失败');
                        }
                    } catch (error) {
                        console.error('解绑确认请求失败:', error);
                        ElMessage.error(error.error || '请求失败，请重试');
                    } finally {
                        loading.unbindConfirm = false;
                    }
                }
            });
        };
        
        
        // 邮箱脱敏处理
        const maskEmail = (email) => {
            if (!email || typeof email !== 'string') return email;
            const atIndex = email.indexOf('@');
            if (atIndex <= 0) return email;
            
            const username = email.substring(0, atIndex);
            const domain = email.substring(atIndex);
            
            if (username.length <= 2) {
                return username.charAt(0) + '*'.repeat(username.length - 1) + domain;
            } else if (username.length <= 4) {
                return username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1) + domain;
            } else {
                return username.substring(0, 2) + '**' + username.substring(username.length - 2) + domain;
            }
        };
        
        // 通过确认信息直接解绑
        const handleConfirmedUnbind = async () => {
            if (!unbindConfirmation.value || !unbindConfirmation.value.confirmation_info) {
                ElMessage.warning('没有确认信息');
                return;
            }
            
            const confirmInfo = unbindConfirmation.value.confirmation_info;
            const typeText = confirmInfo.bind_type === 'warranty' 
                ? '质保型（解绑后可重新使用）' 
                : '一次性（母号活跃时可重新使用）';
            
            try {
                await ElMessageBox.confirm(
                    `确定要解绑兑换码 ${confirmInfo.redemption_code} 吗？\n类型：${typeText}\n用户：${confirmInfo.masked_email}`,
                    '最终确认解绑',
                    {
                        confirmButtonText: '确定解绑',
                        cancelButtonText: '取消',
                        type: 'warning',
                        dangerouslyUseHTMLString: true
                    }
                );
                
                loading.unbind = true;
                
                // 使用脱敏邮箱进行解绑（后端会处理）
                // 注意：后端应该支持通过兑换码直接解绑，不需要邮箱
                const data = await window.userApi.unbind('', confirmInfo.redemption_code);
                
                if (data.success) {
                    handleUnbindSuccess(data, confirmInfo.redemption_code, confirmInfo.bind_type);
                    
                    // 清空确认信息
                    unbindConfirmation.value = null;
                } else {
                    ElMessage.error(data.error || '解绑失败');
                }
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('解绑请求失败:', error);
                    ElMessage.error('操作失败：' + (error.error || error.message || error));
                }
            } finally {
                loading.unbind = false;
            }
        };
        
        // 解绑成功处理逻辑
        const handleUnbindSuccess = (data, redemptionCode, codeType) => {
            // 根据类型和新响应字段显示不同的成功消息
            if (data.code_type === 'warranty' || codeType === 'warranty') {
                const codeToShow = data.old_redemption_code || redemptionCode;
                ElMessageBox.alert(
                    `<div style="line-height: 1.8;">
                        <p><strong>✓ 质保卡密解绑成功！</strong></p>
                        <p>兑换码: <strong>${codeToShow}</strong></p>
                        <p style="color: #67c23a;">此兑换码已重置为未使用状态，可以直接重新使用。</p>
                        <p>您可以：</p>
                        <ul style="text-align: left; margin-left: 20px;">
                            <li>使用新邮箱重新绑定此兑换码</li>
                            <li>将此兑换码提供给其他用户</li>
                        </ul>
                    </div>`,
                    '解绑成功',
                    {
                        dangerouslyUseHTMLString: true,
                        confirmButtonText: '知道了',
                        type: 'success'
                    }
                );
            } else if (data.code_type === 'one-time' || codeType === 'onetime') {
                const oldCode = data.old_redemption_code || redemptionCode;
                
                if (data.can_reuse !== false) {
                    // 母号活跃，兑换码可重用
                    let codeInfo = '';
                    if (data.new_redemption_code && data.new_redemption_code !== oldCode) {
                        codeInfo = `<p>新兑换码: <strong>${data.new_redemption_code}</strong></p>
                                   <p style="color: #909399;">原兑换码: <del>${oldCode}</del> (已更换)</p>`;
                    } else {
                        codeInfo = `<p>兑换码: <strong>${oldCode}</strong></p>`;
                    }
                    
                    ElMessageBox.alert(
                        `<div style="line-height: 1.8;">
                            <p><strong>✓ 一次性卡密解绑成功！</strong></p>
                            ${codeInfo}
                            <p style="color: #67c23a;">兑换码已重置为未使用状态，可以重新使用。</p>
                            <p>您可以：</p>
                            <ul style="text-align: left; margin-left: 20px;">
                                <li>使用新邮箱重新绑定此兑换码</li>
                                <li>将此兑换码提供给其他用户</li>
                                <li style="color: #909399;">注：重新使用时仍由原母号邀请</li>
                            </ul>
                        </div>`,
                        '解绑成功',
                        {
                            dangerouslyUseHTMLString: true,
                            confirmButtonText: '知道了',
                            type: 'success'
                        }
                    );
                } else {
                    // 母号问题导致不可重用，检查是否生成了新兑换码
                    if (data.new_redemption_code && data.new_redemption_code !== oldCode) {
                        // 已生成新兑换码
                        ElMessageBox.alert(
                            `<div style="line-height: 1.8;">
                                <p><strong>✓ 一次性卡密解绑成功！</strong></p>
                                <p>新兑换码: <strong style="color: #67c23a;">${data.new_redemption_code}</strong></p>
                                <p style="color: #909399;">原兑换码: <del>${oldCode}</del> (已作废)</p>
                                <p style="color: #67c23a;">系统已为您生成新的兑换码，可以直接使用。</p>
                                <p>您可以：</p>
                                <ul style="text-align: left; margin-left: 20px;">
                                    <li>使用新邮箱重新绑定新兑换码</li>
                                    <li>将新兑换码提供给其他用户</li>
                                    <li style="color: #909399;">注：新兑换码仍由原母号邀请</li>
                                </ul>
                                <div style="margin-top: 16px; padding: 12px; background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px;">
                                    <strong style="color: #0369a1;">💡 提示：</strong> 请保存好新兑换码，避免丢失
                                </div>
                            </div>`,
                            '解绑成功',
                            {
                                dangerouslyUseHTMLString: true,
                                confirmButtonText: '知道了',
                                type: 'success'
                            }
                        );
                    } else {
                        // 没有生成新兑换码，母号已封禁
                        ElMessageBox.alert(
                            `<div style="line-height: 1.8;">
                                <p><strong>✓ 一次性卡密解绑成功！</strong></p>
                                <p>原兑换码: <strong>${oldCode}</strong> (已作废)</p>
                                <p style="color: #e6a23c;">注意：母号已被封禁，无法产生新的兑换码。</p>
                                <p>原因：</p>
                                <ul style="text-align: left; margin-left: 20px;">
                                    <li>母号已封禁，无法生成新兑换码</li>
                                    <li>原兑换码已失效且不可重用</li>
                                </ul>
                            </div>`,
                            '解绑成功',
                            {
                                dangerouslyUseHTMLString: true,
                                confirmButtonText: '知道了',
                                type: 'warning'
                            }
                        );
                    }
                }
            } else {
                ElMessage.success(data.message || '解绑成功');
            }
        };
        
        
        // 返回响应式数据和方法
        return {
            activeTab,
            loading,
            handleTabChange,
            
            // 兑换相关
            redeemForm,
            redeemFormRef,
            redeemRules,
            redeemResult,
            handleRedeem,
            
            // 团队清理相关
            cleanupForm,
            cleanupFormRef,
            cleanupRules,
            cleanupPreviewResult,
            cleanupExecuteResult,
            handleCleanupPreview,
            handleCleanupExecute,
            
            // 解绑相关
            unbindMode,
            unbindForm,
            unbindFormRef,
            unbindRules,
            unbindConfirmation,
            handleUnbindConfirm,
            handleConfirmedUnbind,
            maskEmail,
            
            // 批量解绑相关
            batchUnbindForm,
            batchUnbindValidation,
            batchUnbindProgress,
            batchUnbindResults,
            validateBatchUnbindInput,
            handleBatchCheckStatusByCode,
            handleBatchUnbind,
            clearBatchUnbindResults,
            getUnbindResultTagType,
            
            // 帮助相关
            helpContent,
            loadHelpContent,
            
            // 批量兑换相关
            batchForm,
            batchValidation,
            batchProgress,
            batchResults,
            validateBatchInput,
            handleBatchRedeem,
            clearBatchResults
        };
    }
});

// 挂载应用
app.use(ElementPlus, {
    locale: ElementPlusLocaleZhCn
}).mount('#app');

console.log('主应用已加载并挂载');