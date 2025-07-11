
/* report_auto_generation_analysis_system/frontend/js/data_analysis.js */
class DataAnalyzer {
    constructor() {
        this.data = [];
        this.analysisResults = {};
        this.filters = [];
        this.sortConfig = {};
        this.calculationConfig = {};
        this.eventListeners = {};
    }

    /**
     * 加载数据
     * @param {Array} data - 要分析的数据集
     * @returns {DataAnalyzer} - 返回实例本身，支持链式调用
     */
    loadData(data) {
        this.data = Array.isArray(data) ? [...data] : [];
        this.resetResults();
        this.triggerEvent('dataLoaded', { count: this.data.length });
        return this;
    }

    /**
     * 重置分析结果
     */
    resetResults() {
        this.analysisResults = {};
        this.filters = [];
        this.sortConfig = {};
        this.calculationConfig = {};
        return this;
    }

    /**
     * 数据汇总
     * @param {Object} options - 汇总选项
     * @param {Array} options.groupBy - 分组依据字段列表
     * @param {Array} options.calculate - 计算规则列表，每个规则包含字段和操作类型
     * @returns {DataAnalyzer} - 返回实例本身，支持链式调用
     */
    summarize(options = {}) {
        const { groupBy, calculate } = options;
        
        if (!groupBy || !calculate || !Array.isArray(groupBy) || !Array.isArray(calculate)) {
            throw new Error('汇总配置需要groupBy和calculate参数，且均为数组');
        }

        const result = {};
        
        this.data.forEach(item => {
            // 创建分组键
            const groupKey = groupBy.map(field => item[field]).join('|');
            
            // 初始化该分组
            if (!result[groupKey]) {
                result[groupKey] = {
                    ...groupBy.reduce((acc, field) => {
                        acc[field] = item[field];
                        return acc;
                    }, {}),
                    count: 0
                };
                
                calculate.forEach(calc => {
                    if (calc.operation === 'min') {
                        result[groupKey][`${calc.operation}_${calc.field}`] = Infinity;
                    } else if (calc.operation === 'max') {
                        result[groupKey][`${calc.operation}_${calc.field}`] = -Infinity;
                    } else {
                        result[groupKey][`${calc.operation}_${calc.field}`] = 0;
                    }
                });
            }
            
            // 递增计数器
            result[groupKey].count++;
            
            // 根据计算类型更新值
            calculate.forEach(calc => {
                const fieldName = `${calc.operation}_${calc.field}`;
                const value = parseFloat(item[calc.field]) || 0;
                
                switch (calc.operation) {
                    case 'sum':
                        result[groupKey][fieldName] += value;
                        break;
                    case 'avg':
                        // 用累计总和除以计数，避免浮点精度问题
                        if (!result[groupKey][`sum_for_avg_${calc.field}`]) {
                            result[groupKey][`sum_for_avg_${calc.field}`] = 0;
                        }
                        result[groupKey][`sum_for_avg_${calc.field}`] += value;
                        result[groupKey][fieldName] = result[groupKey][`sum_for_avg_${calc.field}`] / result[groupKey].count;
                        break;
                    case 'max':
                        if (value > result[groupKey][fieldName]) {
                            result[groupKey][fieldName] = value;
                        }
                        break;
                    case 'min':
                        if (value < result[groupKey][fieldName]) {
                            result[groupKey][fieldName] = value;
                        }
                        break;
                    case 'count_distinct':
                        if (!result[groupKey][`distinct_values_${calc.field}`]) {
                            result[groupKey][`distinct_values_${calc.field}`] = new Set();
                        }
                        result[groupKey][`distinct_values_${calc.field}`].add(item[calc.field]);
                        result[groupKey][fieldName] = result[groupKey][`distinct_values_${calc.field}`].size;
                        break;
                }
            });
        });
        
        // 清理中间计算值，生成最终结果
        const summaryResults = Object.values(result).map(entry => {
            const cleanEntry = {...entry};
            
            // 移除临时计算字段
            Object.keys(cleanEntry).forEach(key => {
                if (key.startsWith('sum_for_avg_') || key.startsWith('distinct_values_')) {
                    delete cleanEntry[key];
                }
            });
            
            return cleanEntry;
        });
        
        this.analysisResults.summary = summaryResults;
        this.triggerEvent('summarized', { count: summaryResults.length });
        
        return this;
    }

    /**
     * 添加筛选条件
     * @param {string} field - 要筛选的字段
     * @param {string} operator - 操作符：equals, contains, gt, lt, between, in
     * @param {*} value - 比较值
     * @returns {DataAnalyzer} - 返回实例本身，支持链式调用
     */
    addFilter(field, operator, value) {
        if (!field || !operator) {
            throw new Error('筛选条件需要字段名和操作符');
        }
        
        this.filters.push({
            id: `filter_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            field,
            operator,
            value
        });
        
        return this;
    }

    /**
     * 移除筛选条件
     * @param {string} filterId - 筛选条件ID
     * @returns {DataAnalyzer} - 返回实例本身，支持链式调用
     */
    removeFilter(filterId) {
        const index = this.filters.findIndex(f => f.id === filterId);
        if (index !== -1) {
            this.filters.splice(index, 1);
            this.triggerEvent('filterRemoved', { id: filterId });
        }
        return this;
    }

    /**
     * 清除所有筛选条件
     * @returns {DataAnalyzer} - 返回实例本身，支持链式调用
     */
    clearFilters() {
        this.filters = [];
        this.triggerEvent('filtersCleared');
        return this;
    }

    /**
     * 应用筛选条件
     * @returns {DataAnalyzer} - 返回实例本身，支持链式调用
     */
    applyFilters() {
        if (this.filters.length === 0) {
            this.analysisResults.filtered = [...this.data];
            return this;
        }
        
        let filteredData = [...this.data];
        
        this.filters.forEach(filter => {
            filteredData = filteredData.filter(item => {
                const value = item[filter.field];
                
                switch (filter.operator) {
                    case 'equals':
                        return value == filter.value; // 使用非严格相等，允许类型转换
                    case 'not_equals':
                        return value != filter.value;
                    case 'contains':
                        return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
                    case 'not_contains':
                        return !String(value).toLowerCase().includes(String(filter.value).toLowerCase());
                    case 'gt':
                        return parseFloat(value) > parseFloat(filter.value);
                    case 'gte':
                        return parseFloat(value) >= parseFloat(filter.value);
                    case 'lt':
                        return parseFloat(value) < parseFloat(filter.value);
                    case 'lte':
                        return parseFloat(value) <= parseFloat(filter.value);
                    case 'between':
                        if (Array.isArray(filter.value) && filter.value.length === 2) {
                            return parseFloat(value) >= parseFloat(filter.value[0]) && 
                                   parseFloat(value) <= parseFloat(filter.value[1]);
                        }
                        return true;
                    case 'in':
                        return Array.isArray(filter.value) && filter.value.includes(value);
                    case 'not_in':
                        return !Array.isArray(filter.value) || !filter.value.includes(value);
                    case 'starts_with':
                        return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase());
                    case 'ends_with':
                        return String(value).toLowerCase().endsWith(String(filter.value).toLowerCase());
                    case 'is_null':
                        return value === null || value === undefined || value === '';
                    case 'is_not_null':
                        return value !== null && value !== undefined && value !== '';
                    default:
                        return true;
                }
            });
        });
        
        this.analysisResults.filtered = filteredData;
        this.triggerEvent('filtersApplied', { 
            count: filteredData.length,
            filters: this.filters
        });
        
        return this;
    }

    /**
     * 获取可能的筛选值
     * @param {string} field - 字段名称
     * @returns {Array} - 该字段的所有唯一值
     */
    getFilterValues(field) {
        if (!field) return [];
        
        const values = new Set();
        this.data.forEach(item => {
            if (item[field] !== undefined && item[field] !== null) {
                values.add(item[field]);
            }
        });
        
        return Array.from(values);
    }

    /**
     * 配置排序
     * @param {string} field - 排序字段
     * @param {string} order - 排序顺序：'asc'升序或'desc'降序
     * @returns {DataAnalyzer} - 返回实例本身，支持链式调用
     */
    sort(field, order = 'asc') {
        if (!field) {
            throw new Error('排序需要指定字段名');
        }
        
        this.sortConfig = { field, order };
        return this;
    }

    /**
     * 多字段排序
     * @param {Array} sortRules - 排序规则数组，每项包含field和order
     * @returns {DataAnalyzer} - 返回实例本身，支持链式调用
     */
    multiSort(sortRules) {
        if (!Array.isArray(sortRules) || sortRules.length === 0) {
            throw new Error('多字段排序需要排序规则数组');
        }
        
        this.sortConfig = { multiSort: true, rules: sortRules };
        return this;
    }

    /**
     * 清除排序
     * @returns {DataAnalyzer} - 返回实例本身，支持链式调用
     */
    clearSort() {
        this.sortConfig = {};
        return this;
    }

    /**
     * 应用排序
     * @returns {DataAnalyzer} - 返回实例本身，支持链式调用
     */
    applySort() {
        // 如果没有排序配置或没有可排序的数据，则返回
        if (Object.keys(this.sortConfig).length === 0 || 
            (!this.analysisResults.filtered && !this.data.length)) {
            return this;
        }
        
        const dataToSort = [...(this.analysisResults.filtered || this.data)];
        
        if (this.sortConfig.multiSort) {
            // 多字段排序
            dataToSort.sort((a, b) => {
                for (const rule of this.sortConfig.rules) {
                    const result = this.compareValues(a[rule.field], b[rule.field], rule.order);
                    if (result !== 0) return result;
                }
                return 0;
            });
        } else {
            // 单字段排序
            dataToSort.sort((a, b) => {
                return this.compareValues(
                    a[this.sortConfig.field], 
                    b[this.sortConfig.field], 
                    this.sortConfig.order
                );
            });
        }
        
        this.analysisResults.sorted = dataToSort;
        this.triggerEvent('sortApplied', { 
            count: dataToSort.length,
            sortConfig: this.sortConfig 
        });
        
        return this;
    }

    /**
     * 比较两个值
     * @private
     */
    compareValues(valueA, valueB, order) {
        // 处理null和undefined
        if (valueA === null || valueA === undefined) return order === 'asc' ? -1 : 1;
        if (valueB === null || valueB === undefined) return order === 'asc' ? 1 : -1;
        
        // 处理日期
        const dateA = new Date(valueA);
        const dateB = new Date(valueB);
        
        if (!isNaN(dateA) && !isNaN(dateB)) {
            return order === 'asc' ? dateA - dateB : dateB - dateA;
        }
        
        // 处理字符串
        if (typeof valueA === 'string' && typeof valueB === 'string') {
            return order === 'asc' 
                ? valueA.localeCompare(valueB) 
                : valueB.localeCompare(valueA);
        }
        
        // 处理数字
        const numA = parseFloat(valueA);
        const numB = parseFloat(valueB);
        
        if (!isNaN(numA) && !isNaN(numB)) {
            return order === 'asc' ? numA - numB : numB - numA;
        }
        
        // 默认按字符串比较
        return order === 'asc' 
            ? String(valueA).localeCompare(String(valueB))
            : String(valueB).localeCompare(String(valueA));
    }

    /**
     * 设置计算配置
     * @param {string} operation - 计算操作：'sum', 'avg', 'max', 'min', 'count'
     * @param {string} field - 计算字段
     * @param {string} groupByField - 分组字段，可选
     * @returns {DataAnalyzer} - 返回实例本身，支持链式调用
     */
    setCalculation(operation, field, groupByField = null) {
        if (!operation || !field) {
            throw new Error('计算配置需要操作类型和字段');
        }
        
        this.calculationConfig = {
            operation,
            field,
            groupByField
        };
        
        return this;
    }

    /**
     * 执行计算
     * @returns {Object} - 计算结果
     */
    calculate() {
        if (!this.calculationConfig.operation || !this.calculationConfig.field) {
            throw new Error('请先设置计算配置');
        }
        
        const { operation, field, groupByField } = this.calculationConfig;
        const dataToCalculate = this.analysisResults.filtered || this.analysisResults.sorted || this.data;
        
        // 无分组计算
        if (!groupByField) {
            let result;
            
            switch (operation) {
                case 'sum':
                    result = dataToCalculate.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0);
                    break;
                case 'avg':
                    if (dataToCalculate.length === 0) {
                        result = 0;
                    } else {
                        const sum = dataToCalculate.reduce((acc, item) => acc + (parseFloat(item[field]) || 0), 0);
                        result = sum / dataToCalculate.length;
                    }
                    break;
                case 'max':
                    result = dataToCalculate.reduce((max, item) => {
                        const value = parseFloat(item[field]) || 0;
                        return value > max ? value : max;
                    }, -Infinity);
                    break;
                case 'min':
                    result = dataToCalculate.reduce((min, item) => {
                        const value = parseFloat(item[field]) || 0;
                        return value < min ? value : min;
                    }, Infinity);
                    break;
                case 'count':
                    result = dataToCalculate.length;
                    break;
                case 'count_distinct':
                    const distinctValues = new Set();
                    dataToCalculate.forEach(item => {
                        if (item[field] !== undefined && item[field] !== null) {
                            distinctValues.add(item[field]);
                        }
                    });
                    result = distinctValues.size;
                    break;
            }
            
            this.analysisResults.calculation = {
                operation,
                field,
                result
            };
            
            this.triggerEvent('calculationPerformed', {
                type: 'single',
                result: this.analysisResults.calculation
            });
            
            return this.analysisResults.calculation;
        }
        
        // 分组计算
        const groups = {};
        
        dataToCalculate.forEach(item => {
            const groupValue = item[groupByField];
            if (!groups[groupValue]) {
                groups[groupValue] = {
                    count: 0,
                    values: []
                };
            }
            
            groups[groupValue].count++;
            groups[groupValue].values.push(parseFloat(item[field]) || 0);
        });
        
        const results = Object.entries(groups).map(([key, group]) => {
            let result;
            
            switch (operation) {
                case 'sum':
                    result = group.values.reduce((sum, value) => sum + value, 0);
                    break;
                case 'avg':
                    result = group.values.reduce((sum, value) => sum + value, 0) / group.count;
                    break;
                case 'max':
                    result = Math.max(...group.values);
                    break;
                case 'min':
                    result = Math.min(...group.values);
                    break;
                case 'count':
                    result = group.count;
                    break;
                case 'count_distinct':
                    result = new Set(group.values).size;
                    break;
            }
            
            return {
                [groupByField]: key,
                result
            };
        });
        
        this.analysisResults.calculation = {
            operation,
            field,
            groupByField,
            results
        };
        
        this.triggerEvent('calculationPerformed', {
            type: 'grouped',
            result: this.analysisResults.calculation
        });
        
        return this.analysisResults.calculation;
    }

    /**
     * 多维度分析
     * @param {Array} dimensions - 维度字段列表
     * @param {Array} measures - 度量字段和计算方法列表
     * @returns {Object} - 分析结果
     */
    multiDimensionalAnalysis(dimensions, measures) {
        if (!Array.isArray(dimensions) || !dimensions.length || !Array.isArray(measures) || !measures.length) {
            throw new Error('需要至少一个维度和一个度量');
        }
        
        const result = {
            dimensions,
            measures,
            data: []
        };
        
        const dimensionCombinations = new Map();
        
        this.data.forEach(item => {
            // 为多维度创建组合键
            const key = dimensions.map(d => item[d]).join('|');
            
            // 初始化新的组合
            if (!dimensionCombinations.has(key)) {
                const newEntry = dimensions.reduce((acc, d) => {
                    acc[d] = item[d];
                    return acc;
                }, {});
                
                // 初始化计数和度量值
                newEntry.count = 0;
                
                // 为每个度量创建初始值
                measures.forEach(m => {
                    if (m.operation === 'min') {
                        newEntry[`${m.operation}_${m.field}`] = Infinity;
                    } else if (m.operation === 'max') {
                        newEntry[`${m.operation}_${m.field}`] = -Infinity;
                    } else {
                        newEntry[`${m.operation}_${m.field}`] = 0;
                    }
                    
                    // 为平均值创建累计总和
                    if (m.operation === 'avg') {
                        newEntry[`sum_for_avg_${m.field}`] = 0;
                    }
                    
                    // 为唯一值计数创建集合
                    if (m.operation === 'count_distinct') {
                        newEntry[`distinct_values_${m.field}`] = new Set();
                    }
                });
                
                dimensionCombinations.set(key, newEntry);
                result.data.push(newEntry);
            }
            
            const entry = dimensionCombinations.get(key);
            entry.count++;
            
            // 更新度量值
            measures.forEach(m => {
                const value = parseFloat(item[m.field]) || 0;
                const fieldName = `${m.operation}_${m.field}`;
                
                switch (m.operation) {
                    case 'sum':
                        entry[fieldName] += value;
                        break;
                    case 'avg':
                        entry[`sum_for_avg_${m.field}`] += value;
                        entry[fieldName] = entry[`sum_for_avg_${m.field}`] / entry.count;
                        break;
                    case 'max':
                        if (value > entry[fieldName]) {
                            entry[fieldName] = value;
                        }
                        break;
                    case 'min':
                        if (value < entry[fieldName]) {
                            entry[fieldName] = value;
                        }
                        break;
                    case 'count_distinct':
                        entry[`distinct_values_${m.field}`].add(item[m.field]);
                        entry[fieldName] = entry[`distinct_values_${m.field}`].size;
                        break;
                }
            });
        });
        
        // 清理中间计算字段
        result.data.forEach(entry => {
            // 删除辅助计算字段
            Object.keys(entry).forEach(key => {
                if (key.startsWith('sum_for_avg_') || key.startsWith('distinct_values_')) {
                    delete entry[key];
                }
            });
        });
        
        this.analysisResults.multiDimensional = result;
        this.triggerEvent('multiDimensionalAnalysisPerformed', { result });
        
        return result;
    }

    /**
     * 数据挖掘 - 简单趋势分析
     * @param {string} timeField - 时间字段
     * @param {string} valueField - 值字段
     * @param {string} interval - 时间间隔：'day', 'week', 'month', 'year'
     * @returns {Object} - 分析结果
     */
    analyzeTrend(timeField, valueField, interval = 'day') {
        if (!timeField || !valueField) {
            throw new Error('需要时间字段和值字段');
        }
        
        const timeSeries = {};
        
        this.data.forEach(item => {
            // 根据间隔获取时间键
            const date = new Date(item[timeField]);
            if (isNaN(date)) return; // 跳过无效日期
            
            let timeKey;
            switch (interval) {
                case 'day':
                    timeKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
                    break;
                case 'week':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay()); // 周日为一周的开始
                    timeKey = weekStart.toISOString().split('T')[0];
                    break;
                case 'month':
                    timeKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                    break;
                case 'year':
                    timeKey = `${date.getFullYear()}`;
                    break;
                default:
                    timeKey = date.toISOString().split('T')[0];
            }
            
            const numValue = parseFloat(item[valueField]) || 0;
            
            if (!timeSeries[timeKey]) {
                timeSeries[timeKey] = {
                    time: timeKey,
                    value: 0,
                    count: 0,
                    min: Infinity,
                    max: -Infinity,
                    rawDate: new Date(date)
                };
            }
            
            timeSeries[timeKey].value += numValue;
            timeSeries[timeKey].count++;
            
            if (numValue < timeSeries[timeKey].min) {
                timeSeries[timeKey].min = numValue;
            }
            
            if (numValue > timeSeries[timeKey].max) {
                timeSeries[timeKey].max = numValue;
            }
        });
        
        // 计算平均值并格式化结果
        const seriesData = Object.values(timeSeries).map(entry => ({
            time: entry.time,
            value: entry.value,
            average: entry.value / entry.count,
            min: entry.min === Infinity ? 0 : entry.min,
            max: entry.max === -Infinity ? 0 : entry.max,
            count: entry.count
        }));
        
        // 按时间排序
        seriesData.sort((a, b) => {
            return new Date(a.time) - new Date(b.time);
        });
        
        // 计算增长率
        if (seriesData.length > 1) {
            for (let i = 1; i < seriesData.length; i++) {
                const current = seriesData[i].value;
                const previous = seriesData[i-1].value;
                
                if (previous === 0) {
                    seriesData[i].growthRate = 100; // 从0增长视为100%
                } else {
                    seriesData[i].growthRate = ((current - previous) / previous) * 100;
                }
            }
        }
        
        this.analysisResults.trend = {
            timeField,
            valueField,
            interval,
            data: seriesData
        };
        
        this.triggerEvent('trendAnalysisPerformed', { 
            result: this.analysisResults.trend 
        });
        
        return this.analysisResults.trend;
    }

    /**
     * 获取数据统计描述
     * @param {Array} fields - 要统计的字段
     * @returns {Object} - 统计结果
     */
    getStatisticalDescription(fields) {
        if (!Array.isArray(fields) || fields.length === 0) {
            fields = this.getNumericFields();
        }
        
        const result = {};
        const data = this.analysisResults.filtered || this.data;
        
        fields.forEach(field => {
            const values = data
                .map(item => parseFloat(item[field]))
                .filter(val => !isNaN(val));
                
            if (values.length === 0) {
                result[field] = {
                    count: 0,
                    min: null,
                    max: null,
                    sum: 0,
                    avg: 0,
                    median: 0,
                    stdDev: 0
                };
                return;
            }
            
            const count = values.length;
            const sum = values.reduce((acc, val) => acc + val, 0);
            const avg = sum / count;
            const min = Math.min(...values);
            const max = Math.max(...values);
            
            // 计算中位数
            const sortedValues = [...values].sort((a, b) => a - b);
            let median;
            if (count % 2 === 0) {
                median = (sortedValues[count / 2 - 1] + sortedValues[count / 2]) / 2;
            } else {
                median = sortedValues[Math.floor(count / 2)];
            }
            
            // 计算标准差
            const sumSquareDiff = values.reduce((acc, val) => {
                return acc + Math.pow(val - avg, 2);
            }, 0);
            const stdDev = Math.sqrt(sumSquareDiff / count);
            
            result[field] = {
                count,
                min,
                max,
                sum,
                avg,
                median,
                stdDev
            };
        });
        
        this.analysisResults.statistics = result;
        this.triggerEvent('statisticsCalculated', { result });
        
        return result;
    }

    /**
     * 获取数据中的数值字段
     * @returns {Array} - 数值字段列表
     */
    getNumericFields() {
        if (!this.data.length) return [];
        
        const firstItem = this.data[0];
        const potentialNumericFields = [];
        
        // 先检查第一个条目来快速筛选可能的数值字段
        for (const field in firstItem) {
            const value = firstItem[field];
            if (typeof value === 'number' || !isNaN(parseFloat(value))) {
                potentialNumericFields.push(field);
            }
        }
        
        // 对每个可能的数值字段，检查更多数据以确认
        return potentialNumericFields.filter(field => {
            // 检查前100条数据或所有数据
            const sampleSize = Math.min(100, this.data.length);
            let numericCount = 0;
            
            for (let i = 0; i < sampleSize; i++) {
                const value = this.data[i][field];
                if (typeof value === 'number' || !isNaN(parseFloat(value))) {
                    numericCount++;
                }
            }
            
            // 如果超过80%的样本是数值，则认为是数值字段
            return numericCount / sampleSize > 0.8;
        });
    }

    /**
     * 获取分析结果
     * @param {string} type - 结果类型，不指定则返回所有结果
     * @returns {Object} - 分析结果
     */
    getResults(type) {
        if (type && this.analysisResults[type]) {
            return this.analysisResults[type];
        }
        
        return {
            originalData: this.data,
            ...this.analysisResults
        };
    }

    /**
     * 获取当前数据
     * @returns {Array} - 当前处理后的数据
     */
    getCurrentData() {
        return this.analysisResults.sorted || 
               this.analysisResults.filtered || 
               this.data;
    }

    /**
     * 保存分析结果到本地存储
     * @param {string} key - 存储键名
     * @returns {boolean} - 是否成功保存
     */
    saveToLocalStorage(key = 'analysis_results') {
        try {
            localStorage.setItem(key, JSON.stringify(this.getResults()));
            this.triggerEvent('resultsSaved', { key });
            return true;
        } catch (e) {
            console.error('本地存储错误:', e);
            this.triggerEvent('error', { message: '保存分析结果失败', details: e.message });
            return false;
        }
    }

    /**
     * 从本地存储加载分析结果
     * @param {string} key - 存储键名
     * @returns {boolean} - 是否成功加载
     */
    loadFromLocalStorage(key = 'analysis_results') {
        try {
            const data = localStorage.getItem(key);
            if (!data) return false;
            
            const parsed = JSON.parse(data);
            
            if (parsed.originalData) {
                this.data = parsed.originalData;
                delete parsed.originalData;
                this.analysisResults = parsed;
                this.triggerEvent('resultsLoaded', { source: 'localStorage' });
                return true;
            }
            return false;
        } catch (e) {
            console.error('本地存储读取错误:', e);
            this.triggerEvent('error', { message: '加载分析结果失败', details: e.message });
            return false;
        }
    }

    /**
     * 导出分析结果到CSV
     * @param {string} type - 要导出的结果类型
     * @returns {string} - CSV内容
     */
    exportToCSV(type) {
        const data = type ? this.analysisResults[type] : this.getCurrentData();
        
        if (!data || (Array.isArray(data) && data.length === 0)) {
            throw new Error('没有可导出的数据');
        }
        
        // 处理不同类型的结果结构
        let exportData;
        if (Array.isArray(data)) {
            exportData = data;
        } else if (data.data && Array.isArray(data.data)) {
            exportData = data.data;
        } else if (type === 'statistics') {
            // 统计数据特殊处理
            exportData = Object.entries(data).map(([field, stats]) => {
                return { field, ...stats };
            });
        } else if (type === 'trend') {
            exportData = data.data;
        } else if (type === 'calculation' && data.results) {
            exportData = data.results;
        } else {
            throw new Error('不支持导出的数据类型');
        }
        
        if (exportData.length === 0) {
            throw new Error('没有可导出的数据行');
        }
        
        // 获取表头
        const headers = Object.keys(exportData[0]);
        
        // 创建CSV行
        const csvRows = [
            headers.join(','), // 表头行
            ...exportData.map(row => {
                return headers.map(header => {
                    // 处理包含逗号的字段
                    const value = row[header];
                    if (value === null || value === undefined) return '';
                    if (typeof value === 'string' && value.includes(',')) {
                        return `"${value}"`;
                    }
                    return value;
                }).join(',');
            })
        ];
        
        return csvRows.join('\n');
    }

    /**
     * 注册事件监听器
     * @param {string} eventName - 事件名称
     * @param {Function} handler - 处理函数
     */
    on(eventName, handler) {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(handler);
    }

    /**
     * 移除事件监听器
     * @param {string} eventName - 事件名称
     * @param {Function} handler - 要移除的处理函数，不提供则移除该事件的所有监听器
     */
    off(eventName, handler) {
        if (!this.eventListeners[eventName]) return;
        
        if (!handler) {
            delete this.eventListeners[eventName];
        } else {
            this.eventListeners[eventName] = this.eventListeners[eventName]
                .filter(h => h !== handler);
        }
    }

    /**
     * 触发事件
     * @private
     */
    triggerEvent(eventName, data = {}) {
        if (!this.eventListeners[eventName]) return;
        
        this.eventListeners[eventName].forEach(handler => {
            try {
                handler(data);
            } catch (e) {
                console.error(`事件处理器错误 (${eventName}):`, e);
            }
        });
    }
}

// 导出单例实例
const dataAnalyzer = new DataAnalyzer();
export default dataAnalyzer;
