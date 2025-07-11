
/* report_auto_generation_analysis_system/frontend/js/data_visualization.js */
class DataVisualizer {
    constructor() {
        this.charts = {};
        this.eventListeners = {};
        this.selectedDataPoints = {};
        this.chartOptions = {
            line: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#6b7280',
                        bodyColor: '#111827',
                        borderColor: '#e5e7eb',
                        borderWidth: 1,
                        padding: 12,
                        boxPadding: 6,
                        usePointStyle: true,
                        callbacks: {
                            label: function(context) {
                                return ` ${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    },
                    x: { grid: { display: false } }
                },
                onClick: this.handleChartClick.bind(this)
            },
            bar: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#6b7280',
                        bodyColor: '#111827',
                        borderColor: '#e5e7eb',
                        borderWidth: 1,
                        padding: 12,
                        boxPadding: 6,
                        usePointStyle: true,
                        callbacks: {
                            label: function(context) {
                                return ` ${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    },
                    x: { grid: { display: false } }
                },
                onClick: this.handleChartClick.bind(this)
            },
            pie: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'right',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#6b7280',
                        bodyColor: '#111827',
                        borderColor: '#e5e7eb',
                        borderWidth: 1,
                        padding: 12,
                        boxPadding: 6,
                        usePointStyle: true,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const percentage = Math.round(context.parsed * 100);
                                return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                },
                onClick: this.handleChartClick.bind(this)
            }
        };
    }

    /**
     * 初始化图表
     * @param {string} canvasId - Canvas元素ID
     * @param {string} type - 图表类型: line, bar, pie
     * @param {Object} data - 图表数据
     * @param {Object} options - 自定义配置选项
     * @returns {Object} - 图表实例
     */
    initChart(canvasId, type, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas element with ID ${canvasId} not found`);
            return null;
        }

        const ctx = canvas.getContext('2d');
        
        // 销毁已有的图表实例以避免重复
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        // 合并默认选项和自定义选项
        const mergedOptions = this.deepMerge(this.chartOptions[type] || {}, options);
        
        // 添加图表ID和类型到数据中，便于事件处理
        data.chartId = canvasId;
        data.chartType = type;

        // 创建并存储图表实例
        this.charts[canvasId] = new Chart(ctx, {
            type,
            data,
            options: mergedOptions
        });

        // 保存图表初始数据
        this.charts[canvasId]._initialData = JSON.parse(JSON.stringify(data));
        
        this.triggerEvent('chartCreated', { 
            chartId: canvasId, 
            chartType: type, 
            chart: this.charts[canvasId] 
        });

        return this.charts[canvasId];
    }

    /**
     * 创建折线图
     * @param {string} canvasId - Canvas元素ID
     * @param {Array} labels - X轴标签
     * @param {Array} datasets - 数据集数组
     * @param {Object} options - 自定义配置选项
     * @returns {Object} - 图表实例
     */
    createLineChart(canvasId, labels, datasets, options = {}) {
        const colors = this.generateColorPalette(datasets.length);
        
        const data = {
            labels,
            datasets: datasets.map((ds, index) => ({
                label: ds.label || `数据集 ${index + 1}`,
                data: ds.data,
                backgroundColor: ds.backgroundColor || this.hexToRgba(colors[index % colors.length], 0.2),
                borderColor: ds.borderColor || colors[index % colors.length],
                borderWidth: ds.borderWidth || 2,
                tension: ds.tension !== undefined ? ds.tension : 0.3,
                fill: ds.fill !== undefined ? ds.fill : true,
                pointBackgroundColor: ds.pointBackgroundColor || colors[index % colors.length],
                pointRadius: ds.pointRadius || 4,
                pointHoverRadius: ds.pointHoverRadius || 6,
                hidden: ds.hidden || false,
                originalData: [...ds.data] // 保存原始数据用于筛选重置
            }))
        };

        return this.initChart(canvasId, 'line', data, options);
    }

    /**
     * 创建柱状图
     * @param {string} canvasId - Canvas元素ID
     * @param {Array} labels - X轴标签
     * @param {Array} datasets - 数据集数组
     * @param {Object} options - 自定义配置选项
     * @returns {Object} - 图表实例
     */
    createBarChart(canvasId, labels, datasets, options = {}) {
        const colors = this.generateColorPalette(datasets.length || 1);
        
        const data = {
            labels,
            datasets: datasets.map((ds, index) => {
                // 如果提供了单个数据集，则为每个数据点生成不同颜色
                let backgroundColor = ds.backgroundColor;
                
                if (!backgroundColor) {
                    if (datasets.length === 1 && typeof ds.data === 'object' && ds.data.length > 1) {
                        // 单个数据集的多个条形，每个使用不同颜色
                        const itemColors = this.generateColorPalette(ds.data.length);
                        backgroundColor = ds.data.map((_, i) => itemColors[i % itemColors.length]);
                    } else {
                        // 多个数据集，每个数据集一种颜色
                        backgroundColor = colors[index % colors.length];
                    }
                }
                
                return {
                    label: ds.label || `数据集 ${index + 1}`,
                    data: ds.data,
                    backgroundColor,
                    borderColor: ds.borderColor || 'rgba(0, 0, 0, 0)',
                    borderWidth: ds.borderWidth || 0,
                    borderRadius: ds.borderRadius || 4,
                    barPercentage: ds.barPercentage || 0.8,
                    categoryPercentage: ds.categoryPercentage || 0.8,
                    hidden: ds.hidden || false,
                    originalData: [...ds.data] // 保存原始数据用于筛选重置
                };
            })
        };

        return this.initChart(canvasId, 'bar', data, options);
    }

    /**
     * 创建饼图
     * @param {string} canvasId - Canvas元素ID
     * @param {Array} labels - 数据标签
     * @param {Array} dataValues - 数据值
     * @param {Object} options - 自定义配置选项
     * @returns {Object} - 图表实例
     */
    createPieChart(canvasId, labels, dataValues, options = {}) {
        const colors = this.generateColorPalette(dataValues.length);
        
        const data = {
            labels,
            datasets: [{
                data: dataValues,
                backgroundColor: options.backgroundColor || colors,
                borderColor: options.borderColor || 'rgba(255, 255, 255, 0.8)',
                borderWidth: options.borderWidth || 2,
                hoverOffset: options.hoverOffset || 15,
                originalData: [...dataValues] // 保存原始数据用于筛选重置
            }]
        };

        return this.initChart(canvasId, 'pie', data, options);
    }

    /**
     * 创建环形图
     * @param {string} canvasId - Canvas元素ID
     * @param {Array} labels - 数据标签
     * @param {Array} dataValues - 数据值
     * @param {Object} options - 自定义配置选项
     * @returns {Object} - 图表实例
     */
    createDoughnutChart(canvasId, labels, dataValues, options = {}) {
        const colors = this.generateColorPalette(dataValues.length);
        
        const data = {
            labels,
            datasets: [{
                data: dataValues,
                backgroundColor: options.backgroundColor || colors,
                borderColor: options.borderColor || 'rgba(255, 255, 255, 0.8)',
                borderWidth: options.borderWidth || 2,
                hoverOffset: options.hoverOffset || 15,
                cutout: options.cutout || '70%',
                originalData: [...dataValues] // 保存原始数据用于筛选重置
            }]
        };

        const mergedOptions = this.deepMerge(this.chartOptions.pie || {}, options);

        return this.initChart(canvasId, 'doughnut', data, mergedOptions);
    }

    /**
     * 更新图表数据
     * @param {string} canvasId - Canvas元素ID
     * @param {Object} newData - 新的图表数据
     * @param {boolean} animate - 是否显示动画
     * @returns {boolean} - 是否成功更新
     */
    updateChart(canvasId, newData, animate = true) {
        const chart = this.charts[canvasId];
        if (!chart) {
            console.error(`Chart with ID ${canvasId} not found`);
            return false;
        }

        // 更新标签
        if (newData.labels) {
            chart.data.labels = newData.labels;
        }

        // 更新数据集
        if (newData.datasets) {
            // 智能合并数据集，保留原来的格式和样式设置
            newData.datasets.forEach((newDataset, i) => {
                // 如果对应索引的数据集存在，则更新值
                if (chart.data.datasets[i]) {
                    const originalDataset = chart.data.datasets[i];
                    
                    // 仅更新数据部分
                    if (newDataset.data) {
                        originalDataset.data = newDataset.data;
                        originalDataset.originalData = [...newDataset.data];
                    }
                    
                    // 可选地更新其他属性
                    if (newDataset.label) originalDataset.label = newDataset.label;
                    if (newDataset.backgroundColor) originalDataset.backgroundColor = newDataset.backgroundColor;
                    if (newDataset.borderColor) originalDataset.borderColor = newDataset.borderColor;
                    
                } else {
                    // 如果不存在，添加新的数据集
                    chart.data.datasets.push(newDataset);
                }
            });
        }

        // 应用更新，带动画或不带
        chart.update(animate ? undefined : 'none');
        
        this.triggerEvent('chartUpdated', { 
            chartId: canvasId, 
            chart 
        });
        
        return true;
    }

    /**
     * 处理图表点击事件
     * @param {Event} event - 点击事件
     * @param {Array} elements - 被点击的元素
     * @param {Object} chart - 图表实例
     */
    handleChartClick(event, elements, chart) {
        if (elements.length === 0) return;
        
        const element = elements[0];
        const index = element.index;
        const datasetIndex = element.datasetIndex;

        const chartId = chart.data.chartId;
        const chartType = chart.data.chartType;
        
        // 获取点击位置的数据
        const label = chart.data.labels[index];
        const value = chart.data.datasets[datasetIndex].data[index];
        
        // 记录被选中的数据点
        if (!this.selectedDataPoints[chartId]) {
            this.selectedDataPoints[chartId] = [];
        }

        // 切换选择状态
        const pointKey = `${datasetIndex}-${index}`;
        const pointIndex = this.selectedDataPoints[chartId].findIndex(
            point => point.datasetIndex === datasetIndex && point.index === index
        );
        
        if (pointIndex === -1) {
            // 添加选中
            this.selectedDataPoints[chartId].push({ datasetIndex, index, label, value });
            
            // 高亮显示选中的数据点
            this.highlightDataPoint(chart, datasetIndex, index);
        } else {
            // 取消选中
            this.selectedDataPoints[chartId].splice(pointIndex, 1);
            
            // 恢复原样
            this.resetDataPointStyle(chart, datasetIndex, index);
        }

        // 触发点击事件，允许其他组件响应
        this.triggerEvent('dataPointClick', {
            chartId,
            chartType,
            datasetIndex,
            index,
            label,
            value,
            selected: this.selectedDataPoints[chartId],
            chart
        });
    }

    /**
     * 高亮显示数据点
     * @param {Object} chart - 图表实例
     * @param {number} datasetIndex - 数据集索引
     * @param {number} index - 数据点索引
     */
    highlightDataPoint(chart, datasetIndex, index) {
        const dataset = chart.data.datasets[datasetIndex];
        const chartType = chart.config.type;
        
        if (chartType === 'pie' || chartType === 'doughnut') {
            // 保存原始样式
            if (!dataset._originalStyles) {
                dataset._originalStyles = {};
            }

            // 保存当前点的原始样式
            if (!dataset._originalStyles[index]) {
                dataset._originalStyles[index] = {
                    backgroundColor: Array.isArray(dataset.backgroundColor) 
                        ? dataset.backgroundColor[index]
                        : dataset.backgroundColor
                };
            }

            // 创建一个新的背景色数组（如果需要）
            const newBackgroundColors = Array.isArray(dataset.backgroundColor)
                ? [...dataset.backgroundColor]
                : Array(dataset.data.length).fill(dataset.backgroundColor);
            
            // 使用高亮色
            newBackgroundColors[index] = this.getHighlightColor(newBackgroundColors[index]);
            dataset.backgroundColor = newBackgroundColors;
        }
        else if (chartType === 'bar') {
            if (!dataset._originalStyles) {
                dataset._originalStyles = {};
            }
            
            // 保存当前点的原始样式
            if (!dataset._originalStyles[index]) {
                dataset._originalStyles[index] = {
                    backgroundColor: Array.isArray(dataset.backgroundColor) 
                        ? dataset.backgroundColor[index]
                        : dataset.backgroundColor
                };
            }
            
            // 创建一个新的背景色数组（如果需要）
            const newBackgroundColors = Array.isArray(dataset.backgroundColor)
                ? [...dataset.backgroundColor]
                : Array(dataset.data.length).fill(dataset.backgroundColor);
            
            // 使用高亮色
            newBackgroundColors[index] = this.getHighlightColor(newBackgroundColors[index]);
            dataset.backgroundColor = newBackgroundColors;
        }
        else if (chartType === 'line') {
            // 为线图，改变点样式
            if (!dataset._originalStyles) {
                dataset._originalStyles = {
                    pointBackgroundColor: dataset.pointBackgroundColor,
                    pointBorderColor: dataset.pointBorderColor,
                    pointRadius: dataset.pointRadius
                };
            }
            
            // 为特定点创建数组
            if (!dataset.pointBackgroundColor || !Array.isArray(dataset.pointBackgroundColor)) {
                dataset.pointBackgroundColor = Array(dataset.data.length).fill(dataset.pointBackgroundColor || dataset.borderColor);
            }
            
            if (!dataset.pointBorderColor || !Array.isArray(dataset.pointBorderColor)) {
                dataset.pointBorderColor = Array(dataset.data.length).fill(dataset.pointBorderColor || '#fff');
            }
            
            if (!dataset.pointRadius || !Array.isArray(dataset.pointRadius)) {
                dataset.pointRadius = Array(dataset.data.length).fill(dataset.pointRadius || 3);
            }
            
            // 高亮特定点
            dataset.pointBackgroundColor[index] = this.getHighlightColor(dataset.pointBackgroundColor[index]);
            dataset.pointBorderColor[index] = '#fff';
            dataset.pointRadius[index] = (dataset.pointRadius[index] || 3) * 1.5;
        }
        
        chart.update();
    }

    /**
     * 重置数据点样式
     * @param {Object} chart - 图表实例
     * @param {number} datasetIndex - 数据集索引
     * @param {number} index - 数据点索引
     */
    resetDataPointStyle(chart, datasetIndex, index) {
        const dataset = chart.data.datasets[datasetIndex];
        const chartType = chart.config.type;
        
        // 检查是否有保存原始样式
        if (!dataset._originalStyles) return;
        
        if (chartType === 'pie' || chartType === 'doughnut') {
            if (dataset._originalStyles[index]) {
                // 恢复特定点的原始样式
                const originalBackground = dataset._originalStyles[index].backgroundColor;
                
                if (Array.isArray(dataset.backgroundColor)) {
                    dataset.backgroundColor[index] = originalBackground;
                } else {
                    dataset.backgroundColor = originalBackground;
                }
                
                delete dataset._originalStyles[index];
            }
        }
        else if (chartType === 'bar') {
            if (dataset._originalStyles[index]) {
                // 恢复特定点的原始样式
                const originalBackground = dataset._originalStyles[index].backgroundColor;
                
                if (Array.isArray(dataset.backgroundColor)) {
                    dataset.backgroundColor[index] = originalBackground;
                } else {
                    dataset.backgroundColor = originalBackground;
                }
                
                delete dataset._originalStyles[index];
            }
        }
        else if (chartType === 'line') {
            // 恢复线图点的样式
            if (Array.isArray(dataset.pointBackgroundColor)) {
                dataset.pointBackgroundColor[index] = dataset._originalStyles.pointBackgroundColor;
            } else {
                dataset.pointBackgroundColor = dataset._originalStyles.pointBackgroundColor;
            }
            
            if (Array.isArray(dataset.pointBorderColor)) {
                dataset.pointBorderColor[index] = dataset._originalStyles.pointBorderColor;
            } else {
                dataset.pointBorderColor = dataset._originalStyles.pointBorderColor;
            }
            
            if (Array.isArray(dataset.pointRadius)) {
                dataset.pointRadius[index] = dataset._originalStyles.pointRadius;
            } else {
                dataset.pointRadius = dataset._originalStyles.pointRadius;
            }
        }
        
        chart.update();
    }

    /**
     * 筛选图表数据
     * @param {string} canvasId - Canvas元素ID
     * @param {Function} filterFunction - 过滤函数
     * @returns {boolean} - 是否成功应用筛选
     */
    filterChartData(canvasId, filterFunction) {
        const chart = this.charts[canvasId];
        if (!chart) return false;
        
        chart.data.datasets.forEach((dataset, datasetIndex) => {
            if (!dataset.originalData) {
                dataset.originalData = [...dataset.data];
            }
            
            // 使用筛选函数筛选数据
            dataset.data = dataset.originalData.map((value, index) => {
                return filterFunction(value, index, chart.data.labels[index], datasetIndex) ? value : null;
            });
        });
        
        chart.update();
        
        this.triggerEvent('dataFiltered', {
            chartId: canvasId,
            chart
        });
        
        return true;
    }

    /**
     * 重置筛选，恢复原始数据
     * @param {string} canvasId - Canvas元素ID
     * @returns {boolean} - 是否成功重置
     */
    resetFilter(canvasId) {
        const chart = this.charts[canvasId];
        if (!chart) return false;
        
        chart.data.datasets.forEach(dataset => {
            if (dataset.originalData) {
                dataset.data = [...dataset.originalData];
            }
        });
        
        chart.update();
        
        this.triggerEvent('filterReset', {
            chartId: canvasId,
            chart
        });
        
        return true;
    }

    /**
     * 创建图表联动关系
     * @param {string} sourceChartId - 源图表ID
     * @param {string} targetChartId - 目标图表ID
     * @param {Function} linkFunction - 联动函数，接收源图表选择数据，返回目标图表筛选条件
     */
    linkCharts(sourceChartId, targetChartId, linkFunction) {
        if (!this.charts[sourceChartId] || !this.charts[targetChartId]) {
            console.error("无法创建图表联动：源图表或目标图表不存在");
            return false;
        }
        
        // 保存联动关系
        if (!this.charts[sourceChartId]._linkedCharts) {
            this.charts[sourceChartId]._linkedCharts = [];
        }
        
        this.charts[sourceChartId]._linkedCharts.push({
            targetId: targetChartId,
            linkFunction
        });
        
        // 注册事件监听
        this.on('dataPointClick', (event) => {
            if (event.chartId === sourceChartId && this.charts[sourceChartId]._linkedCharts) {
                this.charts[sourceChartId]._linkedCharts.forEach(link => {
                    if (link.targetId === targetChartId) {
                        // 应用联动筛选
                        const filterFunction = link.linkFunction(event);
                        if (typeof filterFunction === 'function') {
                            this.filterChartData(targetChartId, filterFunction);
                        }
                    }
                });
            }
        });
        
        return true;
    }

    /**
     * 移除图表联动
     * @param {string} sourceChartId - 源图表ID
     * @param {string} targetChartId - 目标图表ID
     */
    unlinkCharts(sourceChartId, targetChartId) {
        if (!this.charts[sourceChartId] || !this.charts[sourceChartId]._linkedCharts) {
            return false;
        }
        
        // 移除联动关系
        this.charts[sourceChartId]._linkedCharts = this.charts[sourceChartId]._linkedCharts.filter(
            link => link.targetId !== targetChartId
        );
        
        return true;
    }

    /**
     * 添加缩放功能
     * @param {string} canvasId - Canvas元素ID
     * @param {Object} options - 缩放选项
     */
    enableZoom(canvasId, options = {}) {
        const chart = this.charts[canvasId];
        if (!chart || !chart.options.plugins) return false;
        
        // 确保Chart.js插件已加载
        if (!Chart.Zoom) {
            console.warn("缩放功能需要Chart.js Zoom插件，请确保已引入");
            return false;
        }
        
        chart.options.plugins.zoom = {
            pan: {
                enabled: options.pan !== false,
                mode: options.panMode || 'xy',
                threshold: options.panThreshold || 10,
            },
            zoom: {
                wheel: { 
                    enabled: options.wheel !== false 
                },
                pinch: { 
                    enabled: options.pinch !== false 
                },
                mode: options.zoomMode || 'xy',
                speed: options.zoomSpeed || 0.1
            }
        };
        
        chart.update();
        return true;
    }

    /**
     * 重置缩放
     * @param {string} canvasId - Canvas元素ID
     */
    resetZoom(canvasId) {
        const chart = this.charts[canvasId];
        if (chart && chart.resetZoom) {
            chart.resetZoom();
            return true;
        }
        return false;
    }

    /**
     * 导出图表为图片
     * @param {string} canvasId - Canvas元素ID
     * @param {string} fileName - 导出文件名
     * @param {string} format - 导出格式：png, jpeg
     */
    exportChartAsImage(canvasId, fileName = 'chart', format = 'png') {
        const chart = this.charts[canvasId];
        if (!chart) return false;
        
        const canvas = chart.canvas;
        const link = document.createElement('a');
        
        const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const dataURL = canvas.toDataURL(mimeType, 1.0);
        
        link.download = `${fileName}.${format}`;
        link.href = dataURL;
        link.click();
        
        this.triggerEvent('chartExported', {
            chartId: canvasId,
            format,
            fileName
        });
        
        return true;
    }

    /**
     * 应用主题样式
     * @param {string} canvasId - Canvas元素ID
     * @param {Object} theme - 主题配置
     */
    applyTheme(canvasId, theme) {
        const chart = this.charts[canvasId];
        if (!chart) return false;
        
        const chartType = chart.config.type;
        
        // 更新背景色
        if (theme.backgroundColor) {
            chart.data.datasets.forEach(dataset => {
                if (chartType === 'line') {
                    dataset.backgroundColor = this.hexToRgba(theme.backgroundColor, 0.2);
                } else if (chartType === 'pie' || chartType === 'doughnut') {
                    if (!Array.isArray(dataset.backgroundColor)) {
                        dataset.backgroundColor = theme.backgroundColor;
                    }
                } else {
                    dataset.backgroundColor = theme.backgroundColor;
                }
            });
        }
        
        // 更新边框色
        if (theme.borderColor) {
            chart.data.datasets.forEach(dataset => {
                if (chartType !== 'pie' && chartType !== 'doughnut') {
                    dataset.borderColor = theme.borderColor;
                }
            });
        }
        
        // 更新字体颜色
        if (theme.fontColor && chart.options.scales) {
            if (chart.options.scales.x) {
                chart.options.scales.x.ticks = chart.options.scales.x.ticks || {};
                chart.options.scales.x.ticks.color = theme.fontColor;
            }
            
            if (chart.options.scales.y) {
                chart.options.scales.y.ticks = chart.options.scales.y.ticks || {};
                chart.options.scales.y.ticks.color = theme.fontColor;
            }
        }
        
        // 更新图例颜色
        if (theme.fontColor && chart.options.plugins && chart.options.plugins.legend) {
            chart.options.plugins.legend.labels = chart.options.plugins.legend.labels || {};
            chart.options.plugins.legend.labels.color = theme.fontColor;
        }
        
        chart.update();
        
        this.triggerEvent('themeApplied', {
            chartId: canvasId,
            theme
        });
        
        return true;
    }

    /**
     * 添加动画效果
     * @param {string} canvasId - Canvas元素ID
     * @param {string} animationType - 动画类型
     */
    addAnimation(canvasId, animationType = 'fade') {
        const chart = this.charts[canvasId];
        if (!chart) return false;
        
        const animations = {
            fade: {
                x: {
                    type: 'number',
                    easing: 'easeInOutQuad',
                    duration: 500,
                    from: NaN,
                    delay: (ctx) => ctx.dataIndex * 100
                },
                y: {
                    type: 'number',
                    easing: 'easeInOutQuad',
                    duration: 500,
                    from: ctx => ctx.chart.scales.y.getPixelForValue(0),
                    delay: (ctx) => ctx.dataIndex * 100
                },
                opacity: {
                    type: 'number',
                    easing: 'linear',
                    duration: 500,
                    from: 0,
                    to: 1,
                    delay: (ctx) => ctx.dataIndex * 100
                }
            },
            grow: {
                y: {
                    type: 'number',
                    easing: 'easeOutElastic',
                    duration: 2000,
                    from: ctx => ctx.chart.scales.y.getPixelForValue(0),
                    delay: (ctx) => ctx.dataIndex * 50
                }
            }
        };
        
        if (animations[animationType]) {
            chart.data.datasets.forEach(dataset => {
                dataset.animation = animations[animationType];
            });
            
            chart.update();
            return true;
        }
        
        return false;
    }

    /**
     * 销毁图表
     * @param {string} canvasId - Canvas元素ID
     */
    destroyChart(canvasId) {
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
            delete this.charts[canvasId];
            delete this.selectedDataPoints[canvasId];
            
            this.triggerEvent('chartDestroyed', { chartId: canvasId });
            
            return true;
        }
        return false;
    }

    /**
     * 销毁所有图表
     */
    destroyAllCharts() {
        Object.keys(this.charts).forEach(id => {
            this.destroyChart(id);
        });
        
        return true;
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
     * @param {Function} handler - 处理函数，不提供则移除所有
     */
    off(eventName, handler) {
        if (!this.eventListeners[eventName]) return;
        
        if (!handler) {
            delete this.eventListeners[eventName];
        } else {
            this.eventListeners[eventName] = this.eventListeners[eventName].filter(h => h !== handler);
        }
    }

    /**
     * 触发事件
     * @param {string} eventName - 事件名称
     * @param {Object} data - 事件数据
     * @private
     */
    triggerEvent(eventName, data) {
        if (!this.eventListeners[eventName]) return;
        
        this.eventListeners[eventName].forEach(handler => {
            try {
                handler(data);
            } catch (e) {
                console.error(`事件处理器错误 (${eventName}):`, e);
            }
        });
    }

    /**
     * 生成高亮颜色
     * @param {string} baseColor - 基础颜色
     * @returns {string} - 高亮颜色
     * @private
     */
    getHighlightColor(baseColor) {
        // 如果是rgba格式
        if (baseColor && baseColor.startsWith('rgba')) {
            const parts = baseColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
            if (parts) {
                const r = Math.min(255, parseInt(parts[1]) + 40);
                const g = Math.min(255, parseInt(parts[2]) + 40);
                const b = Math.min(255, parseInt(parts[3]) + 40);
                return `rgba(${r}, ${g}, ${b}, 1)`;
            }
        }
        
        // 如果是hex格式
        if (baseColor && baseColor.startsWith('#')) {
            const hex = baseColor.replace('#', '');
            // 转为RGB后增亮
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            const brightR = Math.min(255, r + 40);
            const brightG = Math.min(255, g + 40);
            const brightB = Math.min(255, b + 40);
            return `#${brightR.toString(16).padStart(2, '0')}${brightG.toString(16).padStart(2, '0')}${brightB.toString(16).padStart(2, '0')}`;
        }
        
        // 默认高亮颜色
        return '#ff7675';
    }

    /**
     * 生成颜色调色板
     * @param {number} count - 需要的颜色数量
     * @returns {Array} - 颜色数组
     * @private
     */
    generateColorPalette(count) {
        // 预定义美观的颜色
        const baseColors = [
            '#667eea', // 紫罗兰蓝
            '#764ba2', // 淡紫色
            '#f6ad55', // 橙色
            '#4fd1c5', // 绿松石
            '#fc8181', // 红色
            '#6366f1', // 靛蓝色
            '#84cc16', // 青柠色
            '#f472b6', // 粉红色
            '#10b981', // 翡翠绿
            '#a78bfa', // 淡紫色
            '#3b82f6', // 蓝色
            '#d97706'  // 琥珀色
        ];

        // 如果请求的颜色数量小于等于基础颜色数量，直接返回部分基础颜色
        if (count <= baseColors.length) {
            return baseColors.slice(0, count);
        }
        
        // 否则，生成更多的颜色变体
        const colors = [...baseColors];
        
        // 生成额外的颜色，通过调整基础颜色的亮度和饱和度
        let current = baseColors.length;
        let baseIndex = 0;
        
        while (colors.length < count) {
            const baseColor = baseColors[baseIndex % baseColors.length];
            
            // 轻微调整颜色
            const adjustedColor = this.adjustColor(baseColor, 
                // 随机轻微调整亮度
                Math.random() * 40 - 20, 
                // 随机轻微调整饱和度
                Math.random() * 30 - 10
            );
            
            colors.push(adjustedColor);
            baseIndex++;
        }
        
        return colors;
    }

    /**
     * 调整颜色亮度和饱和度
     * @param {string} color - 基础颜色（HEX格式）
     * @param {number} lightness - 亮度调整值（-100到100）
     * @param {number} saturation - 饱和度调整值（-100到100）
     * @returns {string} - 调整后的颜色（HEX格式）
     * @private
     */
    adjustColor(color, lightness = 0, saturation = 0) {
        // 将HEX转为RGB
        let r = parseInt(color.slice(1, 3), 16);
        let g = parseInt(color.slice(3, 5), 16);
        let b = parseInt(color.slice(5, 7), 16);
        
        // 转为HSL
        let [h, s, l] = this.rgbToHsl(r, g, b);
        
        // 调整亮度和饱和度
        s = Math.min(100, Math.max(0, s + saturation));
        l = Math.min(100, Math.max(0, l + lightness));
        
        // 转回RGB
        [r, g, b] = this.hslToRgb(h, s, l);
        
        // 转为HEX
        return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
    }

    /**
     * RGB转HSL
     * @param {number} r - 红色（0-255）
     * @param {number} g - 绿色（0-255）
     * @param {number} b - 蓝色（0-255）
     * @returns {Array} - [h, s, l] 色调（0-360）, 饱和度（0-100）, 亮度（0-100）
     * @private
     */
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0; // 灰色
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            
            h /= 6;
        }
        
        return [h * 360, s * 100, l * 100];
    }

    /**
     * HSL转RGB
     * @param {number} h - 色调（0-360）
     * @param {number} s - 饱和度（0-100）
     * @param {number} l - 亮度（0-100）
     * @returns {Array} - [r, g, b] 红色（0-255）, 绿色（0-255）, 蓝色（0-255）
     * @private
     */
    hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l; // 灰色
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return [r * 255, g * 255, b * 255];
    }

    /**
     * HEX转RGBA
     * @param {string} hex - 颜色的HEX值
     * @param {number} alpha - 透明度
     * @returns {string} - rgba颜色字符串
     * @private
     */
    hexToRgba(hex, alpha = 1) {
        if (!hex) return `rgba(102, 126, 234, ${alpha})`;
        
        let r, g, b;
        
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else {
            r = parseInt(hex.slice(1, 3), 16);
            g = parseInt(hex.slice(3, 5), 16);
            b = parseInt(hex.slice(5, 7), 16);
        }
        
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * 深度合并对象
     * @param {Object} target - 目标对象
     * @param {Object} source - 源对象
     * @returns {Object} - 合并后的对象
     * @private
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
                    result[key] = this.deepMerge(result[key], source[key]);
                } else {
                    result[key] = { ...source[key] };
                }
            } else {
                result[key] = source[key];
            }
        });
        
        return result;
    }
}

// 导出单例实例
const dataVisualizer = new DataVisualizer();
export default dataVisualizer;
