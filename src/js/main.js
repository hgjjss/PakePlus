
/* management_monitoring_system/frontend/js/main.js */

/**
 * 管理与监控信息共享系统
 * 核心业务逻辑和数据处理
 * 实现数据缓存和基础分析功能
 * @version 1.0.0
 * @date 2025-05-06
 */

// 数据缓存实现
const DataCache = (function() {
    // 私有缓存存储
    let cache = {};
    
    // 缓存配置
    const config = {
        maxAge: 5 * 60 * 1000, // 默认缓存有效期5分钟
        maxSize: 100 // 最大缓存条目数
    };
    
    // 缓存项数量
    let size = 0;
    
    // 缓存统计
    const stats = {
        hits: 0,
        misses: 0,
        totalRequests: 0
    };
    
    /**
     * 获取缓存项
     * @param {string} key - 缓存键
     * @returns {*} 缓存值或null
     */
    function get(key) {
        stats.totalRequests++;
        
        if (cache[key] && !isExpired(cache[key])) {
            stats.hits++;
            cache[key].lastAccessed = Date.now(); // 更新最后访问时间
            return cache[key].value;
        }
        
        // 缓存未命中或已过期
        if (cache[key]) {
            delete cache[key];
            size--;
        }
        
        stats.misses++;
        return null;
    }
    
    /**
     * 设置缓存项
     * @param {string} key - 缓存键
     * @param {*} value - 缓存值
     * @param {number} maxAge - 可选，此项的过期时间(毫秒)
     */
    function set(key, value, maxAge = config.maxAge) {
        // 如果缓存已满，清理最旧的项
        if (!cache[key] && size >= config.maxSize) {
            evictOldest();
        }
        
        // 创建或更新缓存项
        if (!cache[key]) {
            size++;
        }
        
        cache[key] = {
            value,
            created: Date.now(),
            lastAccessed: Date.now(),
            expires: Date.now() + maxAge
        };
        
        return true;
    }
    
    /**
     * 检查缓存项是否已过期
     * @param {object} cacheItem - 缓存项
     * @returns {boolean} 是否已过期
     */
    function isExpired(cacheItem) {
        return cacheItem.expires <= Date.now();
    }
    
    /**
     * 删除最旧的缓存项
     */
    function evictOldest() {
        let oldest = null;
        let oldestKey = null;
        
        for (const key in cache) {
            if (!oldest || cache[key].lastAccessed < oldest) {
                oldest = cache[key].lastAccessed;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            delete cache[oldestKey];
            size--;
        }
    }
    
    /**
     * 清除所有缓存
     */
    function clear() {
        cache = {};
        size = 0;
    }
    
    /**
     * 获取缓存统计信息
     */
    function getStats() {
        return {
            ...stats,
            size,
            hitRate: stats.totalRequests > 0 ? (stats.hits / stats.totalRequests) * 100 : 0
        };
    }
    
    return {
        get,
        set,
        clear,
        getStats
    };
})();

// 数据处理类
class DataProcessor {
    constructor() {
        // 初始化数据状态
        this.data = {
            sensors: [],
            alerts: [],
            systemStatus: {}
        };
    }
    
    /**
     * 处理传感器数据
     * @param {Array} sensorData - 传感器原始数据
     * @returns {Array} 处理后的传感器数据
     */
    processSensorData(sensorData) {
        if (!sensorData || !Array.isArray(sensorData)) {
            return [];
        }
        
        // 处理数据并缓存
        const processed = sensorData.map(sensor => {
            // 数据验证和清洗
            if (!sensor.id || !sensor.type || sensor.value === undefined) {
                return null;
            }
            
            // 根据不同类型的传感器设置警戒值
            const thresholds = this.getThresholds(sensor.type);
            
            // 计算状态
            let status = 'normal';
            if (sensor.value >= thresholds.high) {
                status = 'danger';
            } else if (sensor.value >= thresholds.medium) {
                status = 'warning';
            }
            
            // 格式化数据
            return {
                ...sensor,
                status,
                timestamp: sensor.timestamp || Date.now(),
                formatted: this.formatValue(sensor.value, sensor.type)
            };
        }).filter(sensor => sensor !== null);
        
        // 更新数据状态
        this.data.sensors = processed;
        
        // 缓存处理后的数据
        DataCache.set('sensors', processed);
        
        return processed;
    }
    
    /**
     * 获取传感器类型对应的阈值
     * @param {string} type - 传感器类型
     * @returns {Object} 阈值配置
     */
    getThresholds(type) {
        const thresholdsMap = {
            'temperature': { medium: 30, high: 40 },
            'humidity': { medium: 70, high: 90 },
            'pressure': { medium: 5, high: 8 },
            'flow': { medium: 150, high: 180 },
            'voltage': { medium: 220, high: 240 },
            'current': { medium: 15, high: 18 },
            'ph': { medium: 8, high: 10 },
            'gas': { medium: 300, high: 450 },
            'default': { medium: 50, high: 80 }
        };
        
        return thresholdsMap[type] || thresholdsMap['default'];
    }
    
    /**
     * 格式化传感器值
     * @param {number} value - 传感器读数
     * @param {string} type - 传感器类型
     * @returns {string} 格式化后的值
     */
    formatValue(value, type) {
        const formatMap = {
            'temperature': `${value}°C`,
            'humidity': `${value}%`,
            'pressure': `${value} MPa`,
            'flow': `${value} L/min`,
            'voltage': `${value} V`,
            'current': `${value} A`,
            'ph': `${value}`,
            'gas': `${value} ppm`,
            'default': `${value}`
        };
        
        return formatMap[type] || formatMap['default'];
    }
    
    /**
     * 生成告警记录
     * @param {Array} sensorData - 处理后的传感器数据
     * @returns {Array} 告警记录
     */
    generateAlerts(sensorData = this.data.sensors) {
        const alerts = [];
        
        sensorData.forEach(sensor => {
            if (sensor.status === 'warning' || sensor.status === 'danger') {
                // 检查是否有相同的告警已存在（防止重复）
                const existingAlert = this.data.alerts.find(alert => 
                    alert.sensorId === sensor.id && alert.status === 'active'
                );
                
                if (!existingAlert) {
                    // 创建新告警
                    alerts.push({
                        id: `ALT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        sensorId: sensor.id,
                        sensorName: sensor.name,
                        type: sensor.status === 'danger' ? 'high' : 'medium',
                        value: sensor.value,
                        formatted: sensor.formatted,
                        message: this.generateAlertMessage(sensor),
                        timestamp: Date.now(),
                        status: 'active',
                        acknowledged: false
                    });
                }
            }
        });
        
        // 更新告警状态
        this.data.alerts = [...this.data.alerts, ...alerts].slice(-100); // 只保留最近的100条
        
        // 缓存告警数据
        DataCache.set('alerts', this.data.alerts);
        
        return alerts;
    }
    
    /**
     * 生成告警消息
     * @param {Object} sensor - 传感器数据
     * @returns {string} 告警消息
     */
    generateAlertMessage(sensor) {
        const messageTemplates = {
            'temperature': {
                'warning': `${sensor.name || sensor.id}温度偏高: ${sensor.formatted}`,
                'danger': `${sensor.name || sensor.id}温度过高警报: ${sensor.formatted}`
            },
            'humidity': {
                'warning': `${sensor.name || sensor.id}湿度偏高: ${sensor.formatted}`,
                'danger': `${sensor.name || sensor.id}湿度过高警报: ${sensor.formatted}`
            },
            'pressure': {
                'warning': `${sensor.name || sensor.id}压力偏高: ${sensor.formatted}`,
                'danger': `${sensor.name || sensor.id}压力过高警报: ${sensor.formatted}`
            },
            'default': {
                'warning': `${sensor.name || sensor.id}数值偏高: ${sensor.formatted}`,
                'danger': `${sensor.name || sensor.id}数值过高警报: ${sensor.formatted}`
            }
        };
        
        const templates = messageTemplates[sensor.type] || messageTemplates['default'];
        return templates[sensor.status] || `${sensor.name || sensor.id}异常警报: ${sensor.formatted}`;
    }
    
    /**
     * 更新系统状态
     * @param {Object} statusData - 系统状态数据
     * @returns {Object} 更新后的系统状态
     */
    updateSystemStatus(statusData) {
        if (!statusData) {
            return this.data.systemStatus;
        }
        
        // 更新系统状态
        this.data.systemStatus = {
            ...this.data.systemStatus,
            ...statusData,
            lastUpdated: Date.now()
        };
        
        // 缓存系统状态
        DataCache.set('systemStatus', this.data.systemStatus);
        
        return this.data.systemStatus;
    }
    
    /**
     * 数据分析功能
     * @param {Array} sensorData - 传感器数据
     * @returns {Object} 分析结果
     */
    analyzeData(sensorData = this.data.sensors) {
        // 缓存键
        const cacheKey = `analysis_${Date.now()}`;
        
        // 检查缓存
        const cachedResult = DataCache.get(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }
        
        // 数据分析
        const result = {
            timestamp: Date.now(),
            summary: {},
            anomalies: [],
            trends: {}
        };
        
        // 分组统计
        const typeGroups = {};
        const statusGroups = { normal: 0, warning: 0, danger: 0 };
        
        sensorData.forEach(sensor => {
            // 按类型分组
            if (!typeGroups[sensor.type]) {
                typeGroups[sensor.type] = [];
            }
            typeGroups[sensor.type].push(sensor);
            
            // 按状态分组
            statusGroups[sensor.status]++;
            
            // 收集异常
            if (sensor.status !== 'normal') {
                result.anomalies.push({
                    sensorId: sensor.id,
                    sensorName: sensor.name,
                    type: sensor.type,
                    value: sensor.value,
                    status: sensor.status,
                    timestamp: sensor.timestamp
                });
            }
        });
        
        // 汇总信息
        result.summary = {
            total: sensorData.length,
            byStatus: statusGroups,
            byType: Object.keys(typeGroups).reduce((acc, type) => {
                acc[type] = typeGroups[type].length;
                return acc;
            }, {})
        };
        
        // 计算各类型的平均值、最大值、最小值
        result.trends = Object.keys(typeGroups).reduce((acc, type) => {
            const values = typeGroups[type].map(sensor => sensor.value);
            acc[type] = {
                average: this.average(values),
                max: Math.max(...values),
                min: Math.min(...values),
                count: values.length
            };
            return acc;
        }, {});
        
        // 缓存分析结果
        DataCache.set(cacheKey, result, 60000); // 1分钟缓存
        
        return result;
    }
    
    /**
     * 计算平均值
     * @param {Array} values - 数值数组
     * @returns {number} 平均值
     */
    average(values) {
        return values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    }
    
    /**
     * 导出数据为指定格式
     * @param {string} format - 导出格式：'excel', 'pdf', 'csv', 'json'
     * @param {Object} options - 导出选项
     * @returns {Object} 导出结果
     */
    exportData(format, options = {}) {
        const { dataTypes = ['sensors', 'alerts'], fromDate, toDate } = options;
        
        // 准备导出数据
        const exportData = {};
        
        // 根据时间筛选
        const startTime = fromDate ? new Date(fromDate).getTime() : 0;
        const endTime = toDate ? new Date(toDate).getTime() : Date.now();
        
        // 收集传感器数据
        if (dataTypes.includes('sensors')) {
            exportData.sensors = this.data.sensors.filter(sensor => 
                sensor.timestamp >= startTime && sensor.timestamp <= endTime
            );
        }
        
        // 收集告警数据
        if (dataTypes.includes('alerts')) {
            exportData.alerts = this.data.alerts.filter(alert => 
                alert.timestamp >= startTime && alert.timestamp <= endTime
            );
        }
        
        // 收集系统状态数据
        if (dataTypes.includes('system')) {
            exportData.systemStatus = this.data.systemStatus;
        }
        
        // 添加元数据
        if (options.addMetadata) {
            exportData.metadata = {
                exportTime: new Date().toISOString(),
                system: 'Management & Monitoring System',
                version: '1.0.0',
                format
            };
        }
        
        // 在实际应用中，这里会有格式转换逻辑
        // 由于这是前端JS，我们只准备数据，不进行实际格式转换
        
        return {
            success: true,
            format,
            data: exportData,
            message: `已准备${format.toUpperCase()}格式的导出数据`
        };
    }
    
    /**
     * 获取数据统计
     * @returns {Object} 数据统计信息
     */
    getStatistics() {
        return {
            sensors: {
                total: this.data.sensors.length,
                byStatus: {
                    normal: this.data.sensors.filter(s => s.status === 'normal').length,
                    warning: this.data.sensors.filter(s => s.status === 'warning').length,
                    danger: this.data.sensors.filter(s => s.status === 'danger').length
                }
            },
            alerts: {
                total: this.data.alerts.length,
                active: this.data.alerts.filter(a => a.status === 'active').length,
                acknowledged: this.data.alerts.filter(a => a.acknowledged).length,
                byType: {
                    high: this.data.alerts.filter(a => a.type === 'high').length,
                    medium: this.data.alerts.filter(a => a.type === 'medium').length,
                    low: this.data.alerts.filter(a => a.type === 'low').length
                }
            },
            cache: DataCache.getStats()
        };
    }
}

// 模拟数据生成器
class DataGenerator {
    constructor() {
        this.sensorTypes = [
            { id: 'temperature', name: '温度', unit: '°C', range: [-10, 50] },
            { id: 'humidity', name: '湿度', unit: '%', range: [0, 100] },
            { id: 'pressure', name: '压力', unit: 'MPa', range: [0, 10] },
            { id: 'flow', name: '流量', unit: 'L/min', range: [0, 200] },
            { id: 'voltage', name: '电压', unit: 'V', range: [0, 240] },
            { id: 'current', name: '电流', unit: 'A', range: [0, 20] },
            { id: 'ph', name: 'pH值', unit: '', range: [0, 14] },
            { id: 'gas', name: '气体浓度', unit: 'ppm', range: [0, 500] }
        ];
        
        this.locations = [
            '工厂A区', '工厂B区', '水处理厂', '发电站',
            '化学实验室', '仓库', '办公楼', '车间'
        ];
    }
    
    /**
     * 生成传感器数据
     * @param {number} count - 要生成的传感器数量
     * @returns {Array} 生成的传感器数据
     */
    generateSensorData(count = 10) {
        const sensors = [];
        
        for (let i = 1; i <= count; i++) {
            const typeIndex = Math.floor(Math.random() * this.sensorTypes.length);
            const locIndex = Math.floor(Math.random() * this.locations.length);
            const type = this.sensorTypes[typeIndex];
            
            // 生成值
            const value = this.randomValue(type.range[0], type.range[1]);
            
            sensors.push({
                id: `SEN-${i.toString().padStart(4, '0')}`,
                name: `${type.name}传感器-${i}`,
                type: type.id,
                typeName: type.name,
                location: this.locations[locIndex],
                value: value,
                unit: type.unit,
                timestamp: Date.now() - Math.floor(Math.random() * 3600000) // 1小时内随机时间
            });
        }
        
        return sensors;
    }
    
    /**
     * 生成系统状态数据
     * @returns {Object} 系统状态数据
     */
    generateSystemStatus() {
        return {
            cpu: this.randomValue(30, 80),
            memory: this.randomValue(40, 75),
            disk: this.randomValue(20, 90),
            network: this.randomValue(10, 60),
            uptime: {
                days: Math.floor(this.randomValue(1, 30)),
                hours: Math.floor(this.randomValue(0, 24)),
                minutes: Math.floor(this.randomValue(0, 60))
            },
            timestamp: Date.now()
        };
    }
    
    /**
     * 生成随机值
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @param {number} decimals - 小数位数
     * @returns {number} 随机值
     */
    randomValue(min, max, decimals = 1) {
        const value = Math.random() * (max - min) + min;
        return Number(value.toFixed(decimals));
    }
}

// 认证模块
const AuthManager = {
    /**
     * 检查用户是否已登录
     * @returns {boolean} 是否已登录
     */
    isLoggedIn() {
        return localStorage.getItem('isLoggedIn') === 'true';
    },
    
    /**
     * 获取当前登录用户
     * @returns {string|null} 用户名
     */
    getCurrentUser() {
        return localStorage.getItem('username');
    },
    
    /**
     * 执行登录
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @param {boolean} rememberMe - 是否记住登录状态
     * @returns {boolean} 登录是否成功
     */
    login(username, password, rememberMe = false) {
        // 实际应用中，这里应该与后端API交互验证
        if (username === 'admin' && password === '12345') {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);
            
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
            } else {
                localStorage.removeItem('rememberMe');
            }
            
            return true;
        }
        
        return false;
    },
    
    /**
     * 执行登出
     */
    logout() {
        localStorage.removeItem('isLoggedIn');
        // 保留rememberMe设置
    }
};

// 实例化数据处理器和生成器
const dataProcessor = new DataProcessor();
const dataGenerator = new DataGenerator();

// 导出模块
window.MonitorSystem = {
    DataProcessor: dataProcessor,
    DataGenerator: dataGenerator,
    DataCache: DataCache,
    AuthManager: AuthManager
};
