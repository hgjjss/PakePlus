
// report_auto_generation_analysis_system/frontend/js/data_processing.js
class DataProcessor {
    constructor() {
        this.dataSources = {
            file: [],
            database: [],
            api: []
        };
        this.processedData = [];
        this.connectionStatus = {
            database: false,
            api: false
        };
        this.activeConnections = [];
    }

    // 从文件导入数据
    importFromFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject('请选择文件');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    let data = [];
                    
                    if (file.name.endsWith('.csv')) {
                        data = this.parseCSV(content);
                    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                        // 实际应用中这里会使用库如SheetJS来处理Excel
                        data = this.mockExcelData();
                    } else if (file.name.endsWith('.json')) {
                        data = JSON.parse(content);
                    } else {
                        reject('不支持的文件格式，请上传CSV、Excel或JSON文件');
                        return;
                    }
                    
                    this.dataSources.file = data;
                    this.saveToLocalStorage('fileData', data);
                    resolve({
                        success: true,
                        message: '文件导入成功',
                        recordCount: data.length,
                        data: data
                    });
                } catch (error) {
                    reject(`文件解析错误: ${error.message}`);
                }
            };
            reader.onerror = () => reject('文件读取错误');
            reader.readAsText(file);
        });
    }

    // 解析CSV数据
    parseCSV(content) {
        const lines = content.split('\n');
        if (lines.length === 0) return [];
        
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const values = lines[i].split(',');
            const row = {};
            
            for (let j = 0; j < headers.length; j++) {
                if (j < values.length) {
                    row[headers[j]] = values[j].trim();
                } else {
                    row[headers[j]] = '';
                }
            }
            
            data.push(row);
        }
        
        return data;
    }

    // 模拟Excel数据（实际应用中会使用专门的库）
    mockExcelData() {
        return [
            { id: 'E001', date: '2025-06-01', product: 'Excel产品A', sales: 15000, region: '北部' },
            { id: 'E002', date: '2025-06-02', product: 'Excel产品B', sales: 12500, region: '南部' },
            { id: 'E003', date: '2025-06-03', product: 'Excel产品C', sales: 18000, region: '东部' }
        ];
    }

    // 连接数据库
    connectToDatabase(config) {
        return new Promise((resolve, reject) => {
            if (!config || !config.host || !config.username) {
                reject('数据库配置不完整');
                return;
            }
            
            // 验证配置
            const errors = this.validateDatabaseConfig(config);
            if (errors.length) {
                reject(`配置错误: ${errors.join(', ')}`);
                return;
            }
            
            console.log(`正在连接数据库: ${config.type} @ ${config.host}:${config.port}`);
            
            // 模拟连接过程
            setTimeout(() => {
                if (Math.random() > 0.1) { // 90%成功率，模拟可能的连接失败
                    const connectionId = `db_${Date.now()}`;
                    
                    // 模拟查询数据
                    const mockData = this.generateMockDatabaseData(config.type);
                    
                    this.dataSources.database = mockData;
                    this.connectionStatus.database = true;
                    this.activeConnections.push({
                        id: connectionId,
                        type: 'database',
                        config: {...config, password: '******'}, // 安全处理
                        timestamp: new Date().toISOString()
                    });
                    
                    this.saveToLocalStorage('dbData', mockData);
                    this.saveToLocalStorage('dbConnections', this.activeConnections);
                    
                    resolve({
                        success: true,
                        connectionId: connectionId,
                        message: '数据库连接成功',
                        recordCount: mockData.length,
                        data: mockData.slice(0, 5) // 仅返回前5条作为预览
                    });
                } else {
                    reject('数据库连接超时，请检查网络或凭据');
                }
            }, 1500); // 模拟网络延迟
        });
    }

    // 验证数据库配置
    validateDatabaseConfig(config) {
        const errors = [];
        
        if (!['mysql', 'postgresql', 'sqlserver', 'oracle'].includes(config.type)) {
            errors.push('不支持的数据库类型');
        }
        
        if (!config.port || isNaN(parseInt(config.port))) {
            errors.push('无效的端口号');
        }
        
        if (config.port && (parseInt(config.port) < 0 || parseInt(config.port) > 65535)) {
            errors.push('端口号必须在0-65535之间');
        }
        
        return errors;
    }

    // 生成模拟数据库数据
    generateMockDatabaseData(dbType) {
        const products = ['数据库产品A', '数据库产品B', '数据库产品C', '数据库产品D'];
        const regions = ['北部', '南部', '东部', '西部', '中部'];
        const data = [];
        
        // 根据数据库类型生成不同特征的数据
        const recordCount = 20 + Math.floor(Math.random() * 30); // 20-50条记录
        
        for (let i = 1; i <= recordCount; i++) {
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // 过去30天内的随机日期
            
            data.push({
                id: `${dbType.substr(0, 2).toUpperCase()}${i.toString().padStart(3, '0')}`,
                date: date.toISOString().split('T')[0],
                product: products[Math.floor(Math.random() * products.length)],
                sales: 5000 + Math.floor(Math.random() * 15000),
                region: regions[Math.floor(Math.random() * regions.length)],
                quantity: 50 + Math.floor(Math.random() * 200)
            });
        }
        
        return data;
    }

    // 测试数据库连接
    testDatabaseConnection(config) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (config && config.host && config.username) {
                    if (Math.random() > 0.2) { // 80%成功率
                        resolve({
                            success: true,
                            message: '连接测试成功',
                            details: {
                                version: this.getMockDatabaseVersion(config.type),
                                tables: this.getMockTableCount(config.type),
                                latency: `${Math.floor(Math.random() * 100)}ms`
                            }
                        });
                    } else {
                        reject({
                            success: false,
                            message: '连接测试失败',
                            error: '服务器响应超时'
                        });
                    }
                } else {
                    reject({
                        success: false,
                        message: '连接测试失败',
                        error: '配置不完整'
                    });
                }
            }, 1000);
        });
    }

    // 获取模拟的数据库版本
    getMockDatabaseVersion(dbType) {
        const versions = {
            mysql: '8.0.26',
            postgresql: '13.4',
            sqlserver: '2019',
            oracle: '19c'
        };
        return versions[dbType] || '未知版本';
    }

    // 获取模拟的数据库表数量
    getMockTableCount(dbType) {
        const baseCounts = {
            mysql: 15,
            postgresql: 22,
            sqlserver: 30,
            oracle: 45
        };
        const baseCount = baseCounts[dbType] || 10;
        return baseCount + Math.floor(Math.random() * 10);
    }

    // 通过API获取数据
    fetchFromAPI(config) {
        return new Promise((resolve, reject) => {
            if (!config || !config.url) {
                reject('API配置不完整');
                return;
            }
            
            console.log(`正在连接API: ${config.url} [${config.method}]`);
            
            // 模拟API调用
            setTimeout(() => {
                if (Math.random() > 0.15) { // 85%成功率
                    const connectionId = `api_${Date.now()}`;
                    const mockData = this.generateMockAPIData(config);
                    
                    this.dataSources.api = mockData;
                    this.connectionStatus.api = true;
                    this.activeConnections.push({
                        id: connectionId,
                        type: 'api',
                        config: {...config, apiKey: config.apiKey ? '******' : undefined},
                        timestamp: new Date().toISOString()
                    });
                    
                    this.saveToLocalStorage('apiData', mockData);
                    this.saveToLocalStorage('apiConnections', this.activeConnections);
                    
                    resolve({
                        success: true,
                        connectionId: connectionId,
                        message: 'API连接成功',
                        recordCount: mockData.length,
                        data: mockData.slice(0, 5) // 仅返回前5条作为预览
                    });
                } else {
                    reject('API请求失败，错误码: 503');
                }
            }, 1200); // 模拟网络延迟
        });
    }

    // 测试API连接
    testAPIConnection(config) {
        return new Promise((resolve, reject) => {
            if (!config || !config.url) {
                reject({
                    success: false,
                    message: 'API测试失败',
                    error: 'URL不能为空'
                });
                return;
            }
            
            setTimeout(() => {
                if (Math.random() > 0.2) { // 80%成功率
                    resolve({
                        success: true,
                        message: 'API测试成功',
                        details: {
                            status: 200,
                            contentType: 'application/json',
                            responseTime: `${Math.floor(Math.random() * 200)}ms`
                        }
                    });
                } else {
                    const errorCodes = [400, 401, 404, 500, 503];
                    const errorCode = errorCodes[Math.floor(Math.random() * errorCodes.length)];
                    reject({
                        success: false,
                        message: 'API测试失败',
                        error: `服务器返回错误: ${errorCode}`
                    });
                }
            }, 800);
        });
    }

    // 生成模拟API数据
    generateMockAPIData(config) {
        const metrics = ['访问量', '转化率', '点击数', '停留时长', '跳出率'];
        const channels = ['搜索引擎', '社交媒体', '直接访问', '邮件营销', '联盟营销'];
        const data = [];
        
        // 根据URL生成一些特征数据
        const recordCount = 10 + Math.floor(Math.random() * 40); // 10-50条记录
        
        for (let i = 1; i <= recordCount; i++) {
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 14)); // 过去14天的随机日期
            
            const isPercentage = Math.random() > 0.7;
            const value = isPercentage ? 
                          (Math.random() * 0.5).toFixed(2) : // 百分比值
                          Math.floor(Math.random() * 10000); // 整数值
            
            data.push({
                id: `API${i.toString().padStart(3, '0')}`,
                date: date.toISOString().split('T')[0],
                metric: metrics[Math.floor(Math.random() * metrics.length)],
                channel: channels[Math.floor(Math.random() * channels.length)],
                value: isPercentage ? parseFloat(value) : parseInt(value),
                isPercentage: isPercentage
            });
        }
        
        return data;
    }

    // 数据清洗
    cleanData(data, options = {}) {
        if (!data || !Array.isArray(data) || data.length === 0) {
            return [];
        }
        
        let cleanedData = [...data];
        
        // 去重
        if (options.removeDuplicates) {
            const seen = new Set();
            cleanedData = cleanedData.filter(item => {
                const key = JSON.stringify(item);
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        }
        
        // 处理空值
        if (options.handleMissingValues) {
            const replacement = options.missingValueReplacement || 'N/A';
            cleanedData = cleanedData.map(item => {
                const newItem = {...item};
                for (const key in newItem) {
                    if (newItem[key] === '' || newItem[key] === null || newItem[key] === undefined) {
                        newItem[key] = replacement;
                    }
                }
                return newItem;
            });
        }
        
        // 类型转换
        if (options.typeConversion && options.typeConversion.length) {
            cleanedData = cleanedData.map(item => {
                const newItem = {...item};
                options.typeConversion.forEach(conv => {
                    if (newItem[conv.field] !== undefined) {
                        switch (conv.type) {
                            case 'number':
                                newItem[conv.field] = parseFloat(newItem[conv.field]) || 0;
                                break;
                            case 'string':
                                newItem[conv.field] = String(newItem[conv.field]);
                                break;
                            case 'date':
                                newItem[conv.field] = new Date(newItem[conv.field]).toISOString().split('T')[0];
                                break;
                            case 'boolean':
                                newItem[conv.field] = Boolean(newItem[conv.field]);
                                break;
                        }
                    }
                });
                return newItem;
            });
        }
        
        // 过滤异常值
        if (options.filterOutliers && options.outlierFields) {
            for (const field of options.outlierFields) {
                if (cleanedData.some(item => !isNaN(parseFloat(item[field])))) {
                    const values = cleanedData.map(item => parseFloat(item[field])).filter(v => !isNaN(v));
                    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
                    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length);
                    const threshold = stdDev * (options.outlierThreshold || 3);
                    
                    cleanedData = cleanedData.filter(item => {
                        const val = parseFloat(item[field]);
                        if (isNaN(val)) return true; // 保留非数字值
                        return Math.abs(val - avg) <= threshold;
                    });
                }
            }
        }
        
        return cleanedData;
    }

    // 数据转换
    transformData(data, transformations) {
        if (!data || !Array.isArray(data) || data.length === 0 || !transformations) {
            return data;
        }

        return data.map(item => {
            const newItem = {...item};
            
            transformations.forEach(transform => {
                switch (transform.type) {
                    case 'format':
                        if (transform.field && newItem[transform.field] !== undefined) {
                            if (transform.format === 'date') {
                                try {
                                    newItem[transform.field] = new Date(newItem[transform.field]).toLocaleDateString();
                                } catch (e) {
                                    console.error('日期格式化错误:', e);
                                }
                            } else if (transform.format === 'currency') {
                                try {
                                    newItem[transform.field] = `¥${parseFloat(newItem[transform.field]).toFixed(2)}`;
                                } catch (e) {
                                    console.error('货币格式化错误:', e);
                                }
                            } else if (transform.format === 'percentage') {
                                try {
                                    newItem[transform.field] = `${(parseFloat(newItem[transform.field]) * 100).toFixed(1)}%`;
                                } catch (e) {
                                    console.error('百分比格式化错误:', e);
                                }
                            }
                        }
                        break;
                    
                    case 'calculate':
                        if (transform.expression && transform.newField) {
                            try {
                                // 安全的表达式评估
                                const evalFunc = new Function(...Object.keys(newItem), `return ${transform.expression};`);
                                newItem[transform.newField] = evalFunc(...Object.values(newItem));
                            } catch (e) {
                                console.error('计算错误:', e);
                                newItem[transform.newField] = null;
                            }
                        }
                        break;
                    
                    case 'replace':
                        if (transform.field && transform.pattern && transform.replacement !== undefined) {
                            try {
                                const val = String(newItem[transform.field] || '');
                                newItem[transform.field] = val.replace(
                                    new RegExp(transform.pattern, transform.flags || 'g'), 
                                    transform.replacement
                                );
                            } catch (e) {
                                console.error('替换错误:', e);
                            }
                        }
                        break;
                    
                    case 'extract':
                        if (transform.field && transform.pattern && transform.newField) {
                            try {
                                const val = String(newItem[transform.field] || '');
                                const regex = new RegExp(transform.pattern, transform.flags);
                                const match = val.match(regex);
                                newItem[transform.newField] = match ? match[transform.group || 0] : null;
                            } catch (e) {
                                console.error('提取错误:', e);
                                newItem[transform.newField] = null;
                            }
                        }
                        break;
                }
            });
            
            return newItem;
        });
    }

    // 合并数据源
    mergeDataSources(sources = ['file', 'database', 'api']) {
        const merged = [];
        sources.forEach(source => {
            if (this.dataSources[source] && this.dataSources[source].length) {
                merged.push(...this.dataSources[source].map(item => ({
                    ...item,
                    source: source
                })));
            }
        });
        this.processedData = merged;
        return merged;
    }

    // 断开连接
    disconnect(connectionId) {
        const index = this.activeConnections.findIndex(conn => conn.id === connectionId);
        if (index > -1) {
            const connection = this.activeConnections[index];
            this.activeConnections.splice(index, 1);
            
            // 更新连接状态
            if (connection.type === 'database') {
                this.connectionStatus.database = this.activeConnections.some(conn => conn.type === 'database');
            } else if (connection.type === 'api') {
                this.connectionStatus.api = this.activeConnections.some(conn => conn.type === 'api');
            }
            
            this.saveToLocalStorage('dbConnections', this.activeConnections);
            return true;
        }
        return false;
    }

    // 数据导出
    exportData(data, format = 'csv') {
        if (!data || !Array.isArray(data) || data.length === 0) {
            throw new Error('没有可导出的数据');
        }
        
        let content = '';
        const filename = `export-${new Date().toISOString().split('T')[0]}.${format}`;
        
        switch (format) {
            case 'csv':
                const headers = Object.keys(data[0]).join(',');
                const rows = data.map(item => 
                    Object.values(item).map(value => 
                        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
                    ).join(',')
                );
                content = [headers, ...rows].join('\n');
                break;
                
            case 'json':
                content = JSON.stringify(data, null, 2);
                break;
                
            default:
                throw new Error(`不支持的导出格式: ${format}`);
        }
        
        // 在浏览器中创建下载链接
        const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
        
        return { filename, format, size: content.length };
    }

    // 保存到本地存储
    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('本地存储错误:', e);
            return false;
        }
    }

    // 从本地存储加载
    loadFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('本地存储读取错误:', e);
            return null;
        }
    }

    // 获取处理后的数据
    getProcessedData() {
        return this.processedData;
    }

    // 获取连接状态
    getConnectionStatus() {
        return {
            ...this.connectionStatus,
            activeConnections: this.activeConnections.length
        };
    }
}

// 导出单例实例
const dataProcessor = new DataProcessor();
export default dataProcessor;
