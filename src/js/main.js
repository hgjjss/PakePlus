
// integrated_security_data_management_system_7053/frontend/js/main.js
/**
 * 综合数据安全管理系统 - 核心业务逻辑
 * 包含数据加密、脱敏、资产管理等核心功能实现
 */

// 数据资产管理模块
class DataManager {
    constructor() {
        this.dataAssets = JSON.parse(localStorage.getItem('dataAssets')) || [];
    }

    // 添加数据资产
    addDataAsset(data) {
        const newAsset = {
            id: Date.now(),
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active'
        };
        this.dataAssets.unshift(newAsset);
        this._saveToLocalStorage();
        return newAsset;
    }

    // 更新数据资产
    updateDataAsset(id, updates) {
        const index = this.dataAssets.findIndex(item => item.id === id);
        if (index !== -1) {
            this.dataAssets[index] = {
                ...this.dataAssets[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this._saveToLocalStorage();
            return this.dataAssets[index];
        }
        return null;
    }

    // 删除数据资产
    deleteDataAsset(id) {
        this.dataAssets = this.dataAssets.filter(item => item.id !== id);
        this._saveToLocalStorage();
    }

    // 获取所有数据资产
    getAllDataAssets() {
        return [...this.dataAssets];
    }

    // 根据ID获取数据资产
    getDataAssetById(id) {
        return this.dataAssets.find(item => item.id === id);
    }

    // 根据分类筛选数据资产
    filterDataAssetsByCategory(category) {
        if (category === 'all') return this.getAllDataAssets();
        return this.dataAssets.filter(item => item.category === category);
    }

    // 保存到本地存储
    _saveToLocalStorage() {
        localStorage.setItem('dataAssets', JSON.stringify(this.dataAssets));
    }
}

// 加密模块
class EncryptionManager {
    constructor() {
        this.encryptionKeys = JSON.parse(localStorage.getItem('encryptionKeys')) || [
            { id: 1, name: '主加密密钥', algorithm: 'AES-256', status: 'active', createdAt: '2025-01-01' }
        ];
    }

    // 模拟加密函数
    async encryptData(text, algorithm = 'AES-256') {
        return new Promise((resolve) => {
            setTimeout(() => {
                // 模拟加密过程 - 实际项目中应使用Web Crypto API
                const encrypted = btoa(encodeURIComponent(text));
                resolve({
                    algorithm,
                    encryptedData: encrypted,
                    timestamp: new Date().toISOString()
                });
            }, 500);
        });
    }

    // 模拟解密函数
    async decryptData(encryptedText, algorithm = 'AES-256') {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    // 模拟解密过程
                    const decrypted = decodeURIComponent(atob(encryptedText));
                    resolve(decrypted);
                } catch (error) {
                    reject('解密失败: 数据格式不正确');
                }
            }, 500);
        });
    }

    // 添加加密密钥
    addEncryptionKey(keyInfo) {
        const newKey = {
            id: Date.now(),
            ...keyInfo,
            status: 'active',
            createdAt: new Date().toISOString()
        };
        this.encryptionKeys.push(newKey);
        this._saveToLocalStorage();
        return newKey;
    }

    // 获取所有加密密钥
    getAllEncryptionKeys() {
        return [...this.encryptionKeys];
    }

    // 保存到本地存储
    _saveToLocalStorage() {
        localStorage.setItem('encryptionKeys', JSON.stringify(this.encryptionKeys));
    }
}

// 数据脱敏模块
class DataMaskingManager {
    constructor() {
        this.maskingPatterns = {
            full: (value) => '*'.repeat(value.length),
            partial: (value) => {
                if (value.length <= 2) return '*'.repeat(value.length);
                return value.charAt(0) + '*'.repeat(value.length - 2) + value.charAt(value.length - 1);
            },
            hash: (value) => {
                // 简单哈希函数 - 仅用于演示
                let hash = 0;
                for (let i = 0; i < value.length; i++) {
                    hash = (hash << 5) - hash + value.charCodeAt(i);
                    hash |= 0; // 转换为32位整数
                }
                return 'hash_' + Math.abs(hash).toString(16).substring(0, 8);
            },
            random: (value) => {
                return value.split('').map(c => Math.random() > 0.5 ? c : '*').join('');
            }
        };
    }

    // 数据脱敏
    maskData(data, fields, pattern = 'partial') {
        const maskedData = { ...data };
        const maskFunction = this.maskingPatterns[pattern] || this.maskingPatterns.partial;

        fields.forEach(field => {
            if (maskedData[field]) {
                maskedData[field] = maskFunction(maskedData[field]);
            }
        });

        return maskedData;
    }

    // 批量脱敏
    batchMaskData(dataList, fields, pattern = 'partial') {
        return dataList.map(data => this.maskData(data, fields, pattern));
    }
}

// 审计日志模块
class AuditLogger {
    constructor() {
        this.logs = JSON.parse(localStorage.getItem('auditLogs')) || [];
    }

    // 记录日志
    log(action, module, user, status = 'success', details = {}) {
        const newLog = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            action,
            module,
            user,
            status,
            details,
            ip: this._getClientIP() // 模拟获取客户端IP
        };

        this.logs.unshift(newLog);
        this._saveToLocalStorage();
        return newLog;
    }

    // 获取所有日志
    getAllLogs() {
        return [...this.logs];
    }

    // 按类型筛选日志
    filterLogsByType(type) {
        if (type === 'all') return this.getAllLogs();
        return this.logs.filter(log => log.module === type);
    }

    // 模拟获取客户端IP
    _getClientIP() {
        // 在实际项目中应从请求头中获取真实IP
        const ips = ['192.168.1.100', '10.0.0.15', '172.16.0.20'];
        return ips[Math.floor(Math.random() * ips.length)];
    }

    // 保存到本地存储
    _saveToLocalStorage() {
        localStorage.setItem('auditLogs', JSON.stringify(this.logs));
    }
}

// 备份与恢复模块
class BackupManager {
    constructor() {
        this.backups = JSON.parse(localStorage.getItem('dataBackups')) || [];
    }

    // 创建备份
    createBackup(data, type = 'full', description = '') {
        const backup = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            type,
            description,
            data: JSON.stringify(data),
            size: this._calculateSize(data)
        };

        this.backups.unshift(backup);
        this._saveToLocalStorage();
        return backup;
    }

    // 恢复备份
    restoreBackup(backupId) {
        const backup = this.backups.find(b => b.id === backupId);
        if (!backup) return null;

        try {
            return JSON.parse(backup.data);
        } catch (error) {
            console.error('恢复备份失败:', error);
            return null;
        }
    }

    // 获取所有备份
    getAllBackups() {
        return [...this.backups];
    }

    // 删除备份
    deleteBackup(backupId) {
        this.backups = this.backups.filter(b => b.id !== backupId);
        this._saveToLocalStorage();
    }

    // 计算数据大小
    _calculateSize(data) {
        return new Blob([JSON.stringify(data)]).size;
    }

    // 保存到本地存储
    _saveToLocalStorage() {
        localStorage.setItem('dataBackups', JSON.stringify(this.backups));
    }
}

// 系统监控模块
class SystemMonitor {
    constructor() {
        this.metrics = {
            cpu: 0,
            memory: 0,
            storage: 0,
            network: 0
        };
        this._startMonitoring();
    }

    // 获取系统指标
    getSystemMetrics() {
        return {
            ...this.metrics,
            timestamp: new Date().toISOString()
        };
    }

    // 模拟监控数据更新
    _startMonitoring() {
        setInterval(() => {
            this.metrics = {
                cpu: Math.random() * 30 + 10, // 10-40%
                memory: Math.random() * 40 + 20, // 20-60%
                storage: Math.random() * 50 + 30, // 30-80%
                network: Math.random() * 20 + 5 // 5-25 Mbps
            };
        }, 3000);
    }
}

// 导出模块实例
export const dataManager = new DataManager();
export const encryptionManager = new EncryptionManager();
export const maskingManager = new DataMaskingManager();
export const auditLogger = new AuditLogger();
export const backupManager = new BackupManager();
export const systemMonitor = new SystemMonitor();

// 初始化函数
export function initializeSystem() {
    // 检查本地存储中是否有初始数据
    if (!localStorage.getItem('dataAssets')) {
        // 添加示例数据
        dataManager.addDataAsset({
            name: '示例数据资产',
            category: 'business',
            sensitivity: 'medium',
            description: '这是一个示例数据资产'
        });
    }

    // 检查是否有管理员用户
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.length === 0) {
        users.push({
            username: 'admin',
            password: 'Admin@123', // 注意: 实际项目中应存储哈希值而非明文密码
            email: 'admin@example.com',
            role: 'admin',
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('users', JSON.stringify(users));
    }

    console.log('系统初始化完成');
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeSystem();
});
