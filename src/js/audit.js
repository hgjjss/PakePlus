
/* integrated_security_data_management_system_7053/frontend/js/audit.js */

/**
 * 安全审计模块
 * 实现对系统操作的全面审计与日志记录功能
 */

class AuditService {
    constructor() {
        this.auditLogStorageKey = 'auditLogs';
        this.complianceReportStorageKey = 'complianceReports';
        this.maxLogsCount = 10000; // 最大日志存储数量
        this.logTypes = {
            LOGIN: 'login',
            LOGOUT: 'logout',
            DATA_ACCESS: 'data_access',
            DATA_MODIFICATION: 'data_modification',
            PERMISSION_CHANGE: 'permission_change',
            SYSTEM_SETTING: 'system_setting',
            SECURITY_EVENT: 'security_event',
            COMPLIANCE: 'compliance',
            ENCRYPTION: 'encryption',
            BACKUP: 'backup',
            DATA_SHARE: 'data_share',
            SYSTEM_MONITOR: 'system_monitor'
        };
        
        this.severityLevels = {
            INFO: 'info',
            WARNING: 'warning',
            ERROR: 'error',
            CRITICAL: 'critical'
        };
        
        // 初始化审计日志存储
        this.initializeStorage();
        
        // 自动清理过期日志
        this.scheduleLogCleanup();
    }
    
    /**
     * 初始化本地存储
     */
    initializeStorage() {
        if (!localStorage.getItem(this.auditLogStorageKey)) {
            localStorage.setItem(this.auditLogStorageKey, JSON.stringify([]));
        }
        
        if (!localStorage.getItem(this.complianceReportStorageKey)) {
            localStorage.setItem(this.complianceReportStorageKey, JSON.stringify([]));
        }
    }
    
    /**
     * 记录审计日志
     * @param {string} type - 日志类型
     * @param {string} action - 操作描述
     * @param {object} details - 操作详情
     * @param {string} severity - 严重程度
     * @returns {object} - 记录的日志对象
     */
    logAudit(type, action, details = {}, severity = 'info') {
        const user = window.authService?.getCurrentUser() || { username: 'system', role: 'system' };
        
        const logEntry = {
            id: this.generateLogId(),
            timestamp: new Date().toISOString(),
            type,
            action,
            details,
            severity,
            user: user.username,
            role: user.role,
            ipAddress: this.getClientIP(),
            userAgent: navigator.userAgent
        };
        
        this.saveLogEntry(logEntry);
        
        // 对于严重事件，触发实时告警
        if (severity === this.severityLevels.ERROR || severity === this.severityLevels.CRITICAL) {
            this.triggerAlert(logEntry);
        }
        
        return logEntry;
    }
    
    /**
     * 保存日志条目到存储
     * @param {object} logEntry - 日志条目
     */
    saveLogEntry(logEntry) {
        const logs = this.getAuditLogs();
        logs.unshift(logEntry); // 添加到数组开头，以便按时间倒序
        
        // 如果日志数量超过最大值，删除最旧的日志
        if (logs.length > this.maxLogsCount) {
            logs.splice(this.maxLogsCount);
        }
        
        localStorage.setItem(this.auditLogStorageKey, JSON.stringify(logs));
    }
    
    /**
     * 生成唯一的日志ID
     * @returns {string} - 生成的ID
     */
    generateLogId() {
        return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * 获取客户端IP地址(模拟)
     * @returns {string} - IP地址
     */
    getClientIP() {
        // 在实际应用中，这应该是从服务器获取的
        // 这里我们模拟一个随机IP
        return `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
    }
    
    /**
     * 触发安全告警
     * @param {object} logEntry - 引发告警的日志条目
     */
    triggerAlert(logEntry) {
        console.warn('安全告警:', logEntry);
        
        // 在实际应用中，这里可以发送通知给管理员
        // 例如通过WebSocket推送通知或发送邮件
        
        // 模拟告警通知
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            const alertEvent = new CustomEvent('securityAlert', { 
                detail: {
                    message: `安全告警: ${logEntry.action}`,
                    severity: logEntry.severity,
                    timestamp: logEntry.timestamp
                }
            });
            window.dispatchEvent(alertEvent);
        }
    }
    
    /**
     * 获取所有审计日志
     * @returns {Array} - 审计日志数组
     */
    getAuditLogs() {
        try {
            return JSON.parse(localStorage.getItem(this.auditLogStorageKey) || '[]');
        } catch (error) {
            console.error('获取审计日志失败:', error);
            return [];
        }
    }
    
    /**
     * 查询审计日志
     * @param {object} filters - 过滤条件
     * @param {string} sortBy - 排序字段
     * @param {boolean} ascending - 是否升序排序
     * @param {number} page - 页码
     * @param {number} pageSize - 每页条数
     * @returns {object} - 查询结果
     */
    queryAuditLogs(filters = {}, sortBy = 'timestamp', ascending = false, page = 1, pageSize = 50) {
        let logs = this.getAuditLogs();
        
        // 应用过滤器
        if (filters) {
            logs = logs.filter(log => {
                for (const [key, value] of Object.entries(filters)) {
                    // 支持简单的日期范围过滤
                    if (key === 'startDate' && new Date(log.timestamp) < new Date(value)) {
                        return false;
                    }
                    if (key === 'endDate' && new Date(log.timestamp) > new Date(value)) {
                        return false;
                    }
                    
                    // 支持数组值匹配
                    if (key !== 'startDate' && key !== 'endDate' && value !== undefined) {
                        if (Array.isArray(value)) {
                            if (!value.includes(log[key])) {
                                return false;
                            }
                        } else if (log[key] !== value) {
                            return false;
                        }
                    }
                }
                return true;
            });
        }
        
        // 应用排序
        logs.sort((a, b) => {
            if (a[sortBy] < b[sortBy]) return ascending ? -1 : 1;
            if (a[sortBy] > b[sortBy]) return ascending ? 1 : -1;
            return 0;
        });
        
        // 计算分页
        const totalCount = logs.length;
        const totalPages = Math.ceil(totalCount / pageSize);
        const start = (page - 1) * pageSize;
        const end = Math.min(start + pageSize, totalCount);
        const paginatedLogs = logs.slice(start, end);
        
        return {
            logs: paginatedLogs,
            pagination: {
                page,
                pageSize,
                totalCount,
                totalPages
            }
        };
    }
    
    /**
     * 导出审计日志
     * @param {Array} logs - 要导出的日志数组
     * @param {string} format - 导出格式(json/csv)
     * @returns {string} - 导出的数据字符串
     */
    exportLogs(logs, format = 'json') {
        if (!logs || !logs.length) {
            return '';
        }
        
        if (format === 'csv') {
            // 生成CSV格式
            const headers = Object.keys(logs[0]).join(',');
            const rows = logs.map(log => {
                return Object.values(log).map(value => {
                    if (typeof value === 'object') {
                        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                    }
                    return `"${String(value).replace(/"/g, '""')}"`;
                }).join(',');
            });
            
            return `${headers}\n${rows.join('\n')}`;
        } else {
            // 默认为JSON格式
            return JSON.stringify(logs, null, 2);
        }
    }
    
    /**
     * 生成合规审计报告
     * @param {string} reportType - 报告类型
     * @param {string} description - 报告描述
     * @param {object} criteria - 审计标准
     * @returns {object} - 生成的报告对象
     */
    generateComplianceReport(reportType, description, criteria) {
        // 获取相关日志
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30); // 默认获取最近30天的日志
        
        const logs = this.queryAuditLogs({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        }).logs;
        
        // 分析日志，检查合规性
        const complianceResults = this.analyzeCompliance(logs, criteria);
        
        const report = {
            id: `report_${Date.now()}`,
            type: reportType,
            description,
            generatedAt: new Date().toISOString(),
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            },
            criteria,
            results: complianceResults,
            summary: this.generateComplianceSummary(complianceResults)
        };
        
        // 保存报告
        this.saveComplianceReport(report);
        
        return report;
    }
    
    /**
     * 分析合规性
     * @param {Array} logs - 审计日志
     * @param {object} criteria - 审计标准
     * @returns {Array} - 合规检查结果
     */
    analyzeCompliance(logs, criteria) {
        const results = [];
        
        // 这里只是简单示例，实际应该根据具体合规要求进行更复杂的分析
        if (criteria.checkLoginAttempts) {
            // 检查登录尝试
            const loginLogs = logs.filter(log => log.type === this.logTypes.LOGIN);
            const failedLogins = loginLogs.filter(log => log.details && log.details.status === 'failed');
            
            results.push({
                check: '登录安全',
                passed: failedLogins.length <= criteria.maxFailedLogins,
                details: {
                    totalAttempts: loginLogs.length,
                    failedAttempts: failedLogins.length,
                    threshold: criteria.maxFailedLogins
                }
            });
        }
        
        if (criteria.checkDataAccess) {
            // 检查敏感数据访问
            const dataAccessLogs = logs.filter(log => log.type === this.logTypes.DATA_ACCESS);
            const sensitiveDataAccess = dataAccessLogs.filter(
                log => log.details && log.details.sensitivityLevel === 'high'
            );
            
            results.push({
                check: '敏感数据访问',
                passed: sensitiveDataAccess.length <= criteria.maxSensitiveDataAccess,
                details: {
                    totalAccess: dataAccessLogs.length,
                    sensitiveAccess: sensitiveDataAccess.length,
                    threshold: criteria.maxSensitiveDataAccess
                }
            });
        }
        
        if (criteria.checkPermissionChanges) {
            // 检查权限变更
            const permissionLogs = logs.filter(log => log.type === this.logTypes.PERMISSION_CHANGE);
            
            results.push({
                check: '权限变更审计',
                passed: permissionLogs.length > 0,
                details: {
                    totalChanges: permissionLogs.length,
                    byUser: this.groupBy(permissionLogs, 'user')
                }
            });
        }
        
        return results;
    }
    
    /**
     * 按指定字段对数组进行分组
     * @param {Array} array - 要分组的数组
     * @param {string} key - 分组字段
     * @returns {object} - 分组结果
     */
    groupBy(array, key) {
        return array.reduce((result, item) => {
            const groupKey = item[key];
            if (!result[groupKey]) {
                result[groupKey] = [];
            }
            result[groupKey].push(item);
            return result;
        }, {});
    }
    
    /**
     * 生成合规摘要
     * @param {Array} results - 合规检查结果
     * @returns {object} - 摘要信息
     */
    generateComplianceSummary(results) {
        const totalChecks = results.length;
        const passedChecks = results.filter(result => result.passed).length;
        const passRate = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0;
        
        return {
            totalChecks,
            passedChecks,
            failedChecks: totalChecks - passedChecks,
            passRate: parseFloat(passRate.toFixed(2)),
            status: passRate >= 80 ? '合规' : passRate >= 60 ? '部分合规' : '不合规'
        };
    }
    
    /**
     * 保存合规报告
     * @param {object} report - 报告对象
     */
    saveComplianceReport(report) {
        const reports = this.getComplianceReports();
        reports.unshift(report);
        
        // 只保留最近50份报告
        if (reports.length > 50) {
            reports.splice(50);
        }
        
        localStorage.setItem(this.complianceReportStorageKey, JSON.stringify(reports));
    }
    
    /**
     * 获取所有合规报告
     * @returns {Array} - 合规报告数组
     */
    getComplianceReports() {
        try {
            return JSON.parse(localStorage.getItem(this.complianceReportStorageKey) || '[]');
        } catch (error) {
            console.error('获取合规报告失败:', error);
            return [];
        }
    }
    
    /**
     * 获取指定ID的合规报告
     * @param {string} reportId - 报告ID
     * @returns {object|null} - 报告对象或null
     */
    getComplianceReportById(reportId) {
        const reports = this.getComplianceReports();
        return reports.find(report => report.id === reportId) || null;
    }
    
    /**
     * 定期清理过期日志
     * 每天清理一次超过保留期的日志
     */
    scheduleLogCleanup() {
        // 设置日志保留时间（默认180天）
        const retentionPeriod = 180 * 24 * 60 * 60 * 1000; // 180天（毫秒）
        
        // 清理函数
        const cleanupLogs = () => {
            const logs = this.getAuditLogs();
            const now = Date.now();
            const filteredLogs = logs.filter(log => {
                const logTime = new Date(log.timestamp).getTime();
                return (now - logTime) <= retentionPeriod;
            });
            
            if (filteredLogs.length < logs.length) {
                localStorage.setItem(this.auditLogStorageKey, JSON.stringify(filteredLogs));
                console.log(`已清理 ${logs.length - filteredLogs.length} 条过期日志`);
            }
        };
        
        // 立即执行一次清理
        cleanupLogs();
        
        // 尝试每天定时清理（在实际环境中需要更可靠的调度机制）
        if (typeof window !== 'undefined') {
            // 设置为每天凌晨3点执行
            const scheduleNextCleanup = () => {
                const now = new Date();
                const nextRun = new Date(now);
                nextRun.setDate(now.getDate() + 1);
                nextRun.setHours(3, 0, 0, 0);
                
                const timeUntilNextRun = nextRun.getTime() - now.getTime();
                setTimeout(() => {
                    cleanupLogs();
                    scheduleNextCleanup();
                }, timeUntilNextRun);
            };
            
            scheduleNextCleanup();
        }
    }
    
    /**
     * 记录用户登录操作
     * @param {string} username - 用户名
     * @param {boolean} success - 是否成功
     * @param {string} method - 登录方式
     */
    logLogin(username, success, method = 'password') {
        return this.logAudit(
            this.logTypes.LOGIN,
            success ? '用户登录成功' : '用户登录失败',
            { username, method, status: success ? 'success' : 'failed' },
            success ? this.severityLevels.INFO : this.severityLevels.WARNING
        );
    }
    
    /**
     * 记录用户注销操作
     * @param {string} username - 用户名
     */
    logLogout(username) {
        return this.logAudit(
            this.logTypes.LOGOUT,
            '用户注销',
            { username },
            this.severityLevels.INFO
        );
    }
    
    /**
     * 记录数据访问操作
     * @param {string} dataId - 数据ID
     * @param {string} dataType - 数据类型
     * @param {string} operation - 操作类型
     * @param {string} sensitivityLevel - 敏感级别
     */
    logDataAccess(dataId, dataType, operation, sensitivityLevel = 'normal') {
        const severityMap = {
            'low': this.severityLevels.INFO,
            'normal': this.severityLevels.INFO,
            'medium': this.severityLevels.INFO,
            'high': this.severityLevels.WARNING,
            'critical': this.severityLevels.WARNING
        };
        
        return this.logAudit(
            this.logTypes.DATA_ACCESS,
            `访问${dataType}数据`,
            { dataId, dataType, operation, sensitivityLevel },
            severityMap[sensitivityLevel] || this.severityLevels.INFO
        );
    }
    
    /**
     * 记录数据修改操作
     * @param {string} dataId - 数据ID
     * @param {string} dataType - 数据类型
     * @param {string} operation - 操作类型(create/update/delete)
     * @param {object} changes - 变更内容
     */
    logDataModification(dataId, dataType, operation, changes = {}) {
        const operationMap = {
            'create': '创建',
            'update': '修改',
            'delete': '删除'
        };
        
        return this.logAudit(
            this.logTypes.DATA_MODIFICATION,
            `${operationMap[operation] || operation}${dataType}数据`,
            { dataId, dataType, operation, changes },
            this.severityLevels.INFO
        );
    }
    
    /**
     * 记录权限变更操作
     * @param {string} targetUser - 目标用户
     * @param {string} permission - 权限
     * @param {string} operation - 操作类型(grant/revoke)
     */
    logPermissionChange(targetUser, permission, operation) {
        const operationMap = {
            'grant': '授予',
            'revoke': '撤销'
        };
        
        return this.logAudit(
            this.logTypes.PERMISSION_CHANGE,
            `${operationMap[operation] || operation}用户权限`,
            { targetUser, permission, operation },
            this.severityLevels.WARNING
        );
    }
    
    /**
     * 记录安全事件
     * @param {string} eventType - 事件类型
     * @param {string} description - 事件描述
     * @param {string} severity - 严重程度
     */
    logSecurityEvent(eventType, description, severity = 'warning') {
        return this.logAudit(
            this.logTypes.SECURITY_EVENT,
            `安全事件: ${eventType}`,
            { eventType, description },
            severity
        );
    }
}

// 创建审计服务实例
const auditService = new AuditService();

// 导出为全局变量
window.auditService = auditService;

// DOMContentLoaded事件处理
document.addEventListener('DOMContentLoaded', () => {
    // 创建安全告警通知区域（如果还不存在）
    if (window.location.pathname.includes('dashboard.html')) {
        // 监听安全告警事件
        window.addEventListener('securityAlert', (event) => {
            showNotification(event.detail.message, event.detail.severity);
        });
    }
    
    // 记录页面访问
    const currentPath = window.location.pathname;
    const pageName = currentPath.split('/').pop() || 'index.html';
    
    auditService.logAudit(
        'page_access',
        `访问页面: ${pageName}`,
        { page: pageName, url: currentPath },
        'info'
    );
    
    console.log('安全审计模块初始化完成');
});

/**
 * 显示通知提示
 * @param {string} message - 通知消息
 * @param {string} type - 通知类型(info/warning/error/success)
 */
function showNotification(message, type = 'info') {
    // 简单实现，在实际应用中可以使用更好看的通知组件
    const notificationArea = document.getElementById('notification-area') || createNotificationArea();
    
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} fade-in`;
    notification.innerHTML = `
        <i class="fas ${getIconForType(type)} alert-icon"></i>
        <div>
            <div class="font-medium">${getTypeTitle(type)}</div>
            <div class="text-sm">${message}</div>
        </div>
        <button class="ml-auto" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    notificationArea.appendChild(notification);
    
    // 5秒后自动消失
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 5000);
}

/**
 * 创建通知区域
 * @returns {HTMLElement} - 通知区域DOM元素
 */
function createNotificationArea() {
    const notificationArea = document.createElement('div');
    notificationArea.id = 'notification-area';
    notificationArea.className = 'fixed top-4 right-4 z-50 w-72 space-y-2';
    document.body.appendChild(notificationArea);
    return notificationArea;
}

/**
 * 根据通知类型获取图标
 * @param {string} type - 通知类型
 * @returns {string} - 图标类名
 */
function getIconForType(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'error': return 'fa-times-circle';
        default: return 'fa-info-circle';
    }
}

/**
 * 根据通知类型获取标题
 * @param {string} type - 通知类型
 * @returns {string} - 标题文本
 */
function getTypeTitle(type) {
    switch (type) {
        case 'success': return '操作成功';
        case 'warning': return '警告';
        case 'error': return '错误';
        case 'critical': return '严重错误';
        default: return '提示信息';
    }
}
