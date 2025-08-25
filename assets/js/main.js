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
            status: false,
            warranty: false,
            replace: false,
            unbind: false
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
        
        // 状态查询表单相关
        const statusFormRef = ref(null);
        const statusForm = reactive({
            email: ''
        });
        const statusRules = {
            email: [
                { required: true, message: '请输入邮箱', trigger: 'blur' },
                { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
            ]
        };
        const statusResult = ref(null);
        
        // 质保表单相关
        const warrantyFormRef = ref(null);
        const warrantyForm = reactive({
            email: ''
        });
        const warrantyRules = {
            email: [
                { required: true, message: '请输入邮箱', trigger: 'blur' },
                { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
            ]
        };
        const warrantyStatus = ref(null);
        const replaceResult = ref(null);
        
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
        
        // 状态查询处理
        const handleCheckStatus = () => {
            statusFormRef.value.validate(async (valid) => {
                if (valid) {
                    loading.status = true;
                    statusResult.value = null;
                    
                    try {
                        const data = await window.userApi.getStatus(statusForm.email);
                        
                        if (data.success) {
                            statusResult.value = data;
                        } else {
                            ElMessage.error(data.error || '查询失败');
                        }
                    } catch (error) {
                        console.error('状态查询请求失败:', error);
                        ElMessage.error(error.error || '请求失败，请重试');
                    } finally {
                        loading.status = false;
                    }
                }
            });
        };
        
        // 质保状态检查处理
        const handleCheckWarranty = () => {
            warrantyFormRef.value.validate(async (valid) => {
                if (valid) {
                    loading.warranty = true;
                    warrantyStatus.value = null;
                    replaceResult.value = null;
                    
                    try {
                        const data = await window.warrantyApi.checkStatus(warrantyForm.email);
                        
                        if (data.success) {
                            warrantyStatus.value = data;
                        } else {
                            ElMessage.error(data.error || '查询失败');
                        }
                    } catch (error) {
                        console.error('质保状态查询请求失败:', error);
                        ElMessage.error(error.error || '请求失败，请重试');
                    } finally {
                        loading.warranty = false;
                    }
                }
            });
        };
        
        // 质保替换申请处理
        const handleRequestReplacement = async () => {
            loading.replace = true;
            replaceResult.value = null;
            
            try {
                const data = await window.warrantyApi.requestReplacement(warrantyForm.email, '母号失效');
                replaceResult.value = data;
                
                if (data.success) {
                    ElMessage.success('替换成功！请检查邮箱');
                    // 重新检查质保状态
                    handleCheckWarranty();
                } else {
                    ElMessage.error(data.error || '替换失败');
                }
            } catch (error) {
                console.error('质保替换请求失败:', error);
                replaceResult.value = error;
                ElMessage.error(error.error || '请求失败，请重试');
            } finally {
                loading.replace = false;
            }
        };
        
        // 解绑处理
        const handleUnbind = async () => {
            if (!statusResult.value || !statusResult.value.binding) {
                ElMessage.warning('没有可解绑的卡密');
                return;
            }
            
            const binding = statusResult.value.binding;
            const typeText = binding.type === 'warranty' 
                ? '质保型（解绑后可重新使用）' 
                : '一次性（母号活跃时可重新使用）';
            
            try {
                await ElMessageBox.confirm(
                    `确定要解绑兑换码 ${binding.redemption_code} 吗？\n类型：${typeText}`,
                    '确认解绑',
                    {
                        confirmButtonText: '确定解绑',
                        cancelButtonText: '取消',
                        type: 'warning',
                        dangerouslyUseHTMLString: true
                    }
                );
                
                loading.unbind = true;
                
                const data = await window.userApi.unbind(statusForm.email, binding.redemption_code);
                
                if (data.success) {
                    // 根据类型显示不同的成功消息
                    if (data.code_type === 'warranty') {
                        ElMessageBox.alert(
                            `<div style="line-height: 1.8;">
                                <p><strong>✓ 质保卡密解绑成功！</strong></p>
                                <p>兑换码: <strong>${data.redemption_code}</strong></p>
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
                    } else if (data.code_type === 'one-time') {
                        if (data.can_reuse) {
                            // 母号活跃，兑换码已重置
                            ElMessageBox.alert(
                                `<div style="line-height: 1.8;">
                                    <p><strong>✓ 一次性卡密解绑成功！</strong></p>
                                    <p>兑换码: <strong>${data.redemption_code}</strong></p>
                                    <p style="color: #67c23a;">此兑换码已重置为未使用状态，可以重新使用。</p>
                                    <p style="color: #409eff;">原母号: ${data.original_mother || '将由原母号邀请'}</p>
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
                            // 母号已封禁或其他原因，兑换码不可重用
                            ElMessageBox.alert(
                                `<div style="line-height: 1.8;">
                                    <p><strong>✓ 一次性卡密解绑成功！</strong></p>
                                    <p>原兑换码: <strong>${data.redemption_code}</strong> (已作废)</p>
                                    <p style="color: #e6a23c;">注意：原兑换码不可重用，需要新的兑换码才能重新加入。</p>
                                    <p>下一步：</p>
                                    <ul style="text-align: left; margin-left: 20px;">
                                        <li>请联系管理员获取新的兑换码</li>
                                        <li>或到管理后台生成新的兑换码</li>
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
                    } else {
                        ElMessage.success(data.message || '解绑成功');
                    }
                    
                    // 清空状态结果
                    statusResult.value = null;
                    // 2秒后重新查询状态
                    setTimeout(() => {
                        handleCheckStatus();
                    }, 2000);
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
        
        // 返回响应式数据和方法
        return {
            activeTab,
            loading,
            
            // 兑换相关
            redeemForm,
            redeemFormRef,
            redeemRules,
            redeemResult,
            handleRedeem,
            
            // 状态查询相关
            statusForm,
            statusFormRef,
            statusRules,
            statusResult,
            handleCheckStatus,
            handleUnbind,
            
            // 质保相关
            warrantyForm,
            warrantyFormRef,
            warrantyRules,
            warrantyStatus,
            replaceResult,
            handleCheckWarranty,
            handleRequestReplacement
        };
    }
});

// 挂载应用
app.use(ElementPlus, {
    locale: ElementPlusLocaleZhCn
}).mount('#app');

console.log('主应用已加载并挂载');