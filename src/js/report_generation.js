
// report_auto_generation_analysis_system/frontend/js/report_generation.js
class ReportGenerator {
    constructor() {
        this.templates = {
            daily: this.getDailyTemplate(),
            weekly: this.getWeeklyTemplate(),
            monthly: this.getMonthlyTemplate(),
            yearly: this.getYearlyTemplate()
        };
        this.customTemplates = this.loadCustomTemplates();
        this.lastGeneratedReport = null;
        this.eventHandlers = {};
    }

    // 获取日报模板
    getDailyTemplate() {
        return {
            id: "daily_template",
            name: "日报模板",
            title: "日报 - {date}",
            sections: [
                {
                    title: "销售概览",
                    content: "今日总销售额: {totalSales}",
                    chart: {
                        type: "bar",
                        data: "salesByProduct"
                    }
                },
                {
                    title: "热门产品",
                    content: "今日销量前三产品: {topProducts}"
                }
            ],
            styles: {
                fontFamily: "Arial",
                primaryColor: "#667eea",
                secondaryColor: "#764ba2"
            },
            createdAt: "2025-04-15"
        };
    }

    // 获取周报模板
    getWeeklyTemplate() {
        return {
            id: "weekly_template",
            name: "周报模板",
            title: "周报 - 第{week}周",
            sections: [
                {
                    title: "周销售趋势",
                    content: "本周总销售额: {totalSales}，环比{changeRate}%",
                    chart: {
                        type: "line",
                        data: "weeklySalesTrend"
                    }
                },
                {
                    title: "区域表现",
                    content: "各区域销售占比:",
                    chart: {
                        type: "pie",
                        data: "salesByRegion"
                    }
                }
            ],
            styles: {
                fontFamily: "Arial",
                primaryColor: "#4fd1c5",
                secondaryColor: "#38b2ac"
            },
            createdAt: "2025-04-10"
        };
    }

    // 获取月报模板
    getMonthlyTemplate() {
        return {
            id: "monthly_template",
            name: "月报模板",
            title: "月报 - {month}月",
            sections: [
                {
                    title: "月度总结",
                    content: "本月总销售额: {totalSales}，同比增长{growthRate}%"
                },
                {
                    title: "产品分析",
                    content: "各产品销售表现:",
                    chart: {
                        type: "bar",
                        data: "monthlyProductPerformance"
                    }
                },
                {
                    title: "客户分析",
                    content: "重点客户贡献: {topCustomers}"
                }
            ],
            styles: {
                fontFamily: "Arial",
                primaryColor: "#f6ad55",
                secondaryColor: "#ed8936"
            },
            createdAt: "2025-03-28"
        };
    }

    // 获取年报模板
    getYearlyTemplate() {
        return {
            id: "yearly_template",
            name: "年报模板",
            title: "年报 - {year}年",
            sections: [
                {
                    title: "年度回顾",
                    content: "全年总销售额: {totalSales}，同比增长{growthRate}%"
                },
                {
                    title: "季度趋势",
                    content: "季度销售趋势分析:",
                    chart: {
                        type: "line",
                        data: "quarterlyTrend"
                    }
                },
                {
                    title: "市场分析",
                    content: "市场份额变化:",
                    chart: {
                        type: "pie",
                        data: "marketShare"
                    }
                }
            ],
            styles: {
                fontFamily: "Arial",
                primaryColor: "#f56565",
                secondaryColor: "#e53e3e"
            },
            createdAt: "2025-02-15"
        };
    }

    // 加载自定义模板
    loadCustomTemplates() {
        try {
            const templates = localStorage.getItem('reportTemplates');
            return templates ? JSON.parse(templates) : [];
        } catch (e) {
            console.error('加载自定义模板失败:', e);
            return [];
        }
    }

    // 保存自定义模板
    saveCustomTemplates() {
        try {
            localStorage.setItem('reportTemplates', JSON.stringify(this.customTemplates));
            return {
                success: true,
                message: '模板保存成功'
            };
        } catch (e) {
            console.error('保存自定义模板失败:', e);
            return {
                success: false,
                message: `保存失败: ${e.message}`
            };
        }
    }

    // 获取所有模板
    getAllTemplates() {
        const systemTemplates = Object.values(this.templates);
        return [...systemTemplates, ...this.customTemplates];
    }

    // 获取模板详情
    getTemplateById(templateId) {
        // 先从系统模板中查找
        for (const key in this.templates) {
            if (this.templates[key].id === templateId) {
                return this.templates[key];
            }
        }
        
        // 再从自定义模板中查找
        return this.customTemplates.find(t => t.id === templateId);
    }

    // 添加自定义模板
    addCustomTemplate(template) {
        if (!template.name || !template.title) {
            return {
                success: false,
                message: '模板名称和标题不能为空'
            };
        }
        
        // 生成唯一ID
        template.id = `custom_${Date.now()}`;
        template.createdAt = new Date().toISOString().split('T')[0];
        
        this.customTemplates.push(template);
        const result = this.saveCustomTemplates();
        
        if (result.success) {
            this.triggerEvent('templateAdded', template);
        }
        
        return result;
    }

    // 更新自定义模板
    updateCustomTemplate(templateId, updates) {
        const index = this.customTemplates.findIndex(t => t.id === templateId);
        if (index === -1) {
            return {
                success: false,
                message: '未找到指定模板'
            };
        }
        
        this.customTemplates[index] = {
            ...this.customTemplates[index],
            ...updates,
            updatedAt: new Date().toISOString().split('T')[0]
        };
        
        const result = this.saveCustomTemplates();
        
        if (result.success) {
            this.triggerEvent('templateUpdated', this.customTemplates[index]);
        }
        
        return result;
    }

    // 删除自定义模板
    deleteCustomTemplate(templateId) {
        const index = this.customTemplates.findIndex(t => t.id === templateId);
        if (index === -1) {
            return {
                success: false,
                message: '未找到指定模板'
            };
        }
        
        const deletedTemplate = this.customTemplates[index];
        this.customTemplates.splice(index, 1);
        const result = this.saveCustomTemplates();
        
        if (result.success) {
            this.triggerEvent('templateDeleted', deletedTemplate);
        }
        
        return result;
    }

    // 生成报表
    generateReport(data, templateId, options = {}) {
        const template = this.getTemplateById(templateId);
        
        if (!template) {
            return {
                success: false,
                message: '找不到指定的报表模板'
            };
        }

        try {
            // 克隆模板以避免修改原始模板
            const report = JSON.parse(JSON.stringify(template));
            
            // 填充数据占位符
            report.content = this.fillPlaceholders(report, data);
            
            // 应用选项
            if (options.styles) {
                report.styles = {...report.styles, ...options.styles};
            }
            
            // 添加生成信息
            report.generatedAt = new Date().toISOString();
            report.generatedBy = options.user || '匿名用户';
            
            // 保存最后生成的报表
            this.lastGeneratedReport = report;
            
            // 触发事件
            this.triggerEvent('reportGenerated', report);
            
            return {
                success: true,
                message: '报表生成成功',
                report: report
            };
        } catch (error) {
            console.error('报表生成错误:', error);
            return {
                success: false,
                message: `报表生成失败: ${error.message}`
            };
        }
    }

    // 填充占位符
    fillPlaceholders(obj, data) {
        const result = JSON.parse(JSON.stringify(obj));
        
        const processValue = (value) => {
            if (typeof value === 'string') {
                return value.replace(/\{([^}]+)\}/g, (match, key) => {
                    return data[key] !== undefined ? data[key] : match;
                });
            } else if (typeof value === 'object' && value !== null) {
                return this.fillPlaceholders(value, data);
            }
            return value;
        };
        
        for (const key in result) {
            result[key] = processValue(result[key]);
        }
        
        return result;
    }

    // 获取报表预览
    getReportPreview(templateId, sampleData = this.getSampleData()) {
        return this.generateReport(sampleData, templateId);
    }

    // 获取样本数据
    getSampleData() {
        return {
            date: new Date().toLocaleDateString(),
            week: this.getWeekNumber(),
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            totalSales: '¥156,789.00',
            changeRate: '+12.5',
            growthRate: '+8.3',
            topProducts: 'A产品, B产品, C产品',
            topCustomers: '客户X (¥45,600), 客户Y (¥32,400)'
        };
    }

    // 获取当前是第几周
    getWeekNumber() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        return Math.ceil((((now - start) / 86400000) + start.getDay() + 1) / 7);
    }

    // 导出为Excel
    exportToExcel(report = this.lastGeneratedReport, fileName = 'report.xlsx') {
        if (!report) {
            return {
                success: false,
                message: '没有可导出的报表'
            };
        }
        
        // 实际应用中，这里会调用专门的库来生成Excel文件
        console.log(`导出Excel报表: ${fileName}`, report);
        
        // 模拟导出
        setTimeout(() => {
            this.triggerEvent('reportExported', {
                format: 'excel',
                fileName: fileName,
                report: report
            });
            
            alert(`Excel报表 "${fileName}" 导出成功！`);
        }, 800);
        
        return {
            success: true,
            message: '正在导出Excel报表...',
            fileName: fileName
        };
    }

    // 导出为PDF
    exportToPDF(report = this.lastGeneratedReport, fileName = 'report.pdf') {
        if (!report) {
            return {
                success: false,
                message: '没有可导出的报表'
            };
        }
        
        // 实际应用中，这里会调用专门的库来生成PDF文件
        console.log(`导出PDF报表: ${fileName}`, report);
        
        // 模拟导出
        setTimeout(() => {
            this.triggerEvent('reportExported', {
                format: 'pdf',
                fileName: fileName,
                report: report
            });
            
            alert(`PDF报表 "${fileName}" 导出成功！`);
        }, 1000);
        
        return {
            success: true,
            message: '正在导出PDF报表...',
            fileName: fileName
        };
    }

    // 导出为Word
    exportToWord(report = this.lastGeneratedReport, fileName = 'report.docx') {
        if (!report) {
            return {
                success: false,
                message: '没有可导出的报表'
            };
        }
        
        // 实际应用中，这里会调用专门的库来生成Word文件
        console.log(`导出Word报表: ${fileName}`, report);
        
        // 模拟导出
        setTimeout(() => {
            this.triggerEvent('reportExported', {
                format: 'word',
                fileName: fileName,
                report: report
            });
            
            alert(`Word报表 "${fileName}" 导出成功！`);
        }, 900);
        
        return {
            success: true,
            message: '正在导出Word报表...',
            fileName: fileName
        };
    }

    // 定时生成报表
    scheduleReport(templateId, data, interval, options = {}) {
        const scheduleId = `schedule_${Date.now()}`;
        
        console.log(`设置定时报表任务 ${scheduleId}，间隔: ${interval}毫秒`);
        
        // 实际应用中可能会使用Web Workers或服务器端的定时任务
        const timerId = setInterval(() => {
            const result = this.generateReport(data, templateId, options);
            
            if (result.success) {
                this.triggerEvent('scheduledReportGenerated', {
                    scheduleId: scheduleId,
                    report: result.report,
                    timestamp: new Date().toISOString()
                });
                
                // 如果配置了自动导出
                if (options.autoExport) {
                    const date = new Date().toISOString().split('T')[0];
                    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
                    const fileName = `${options.filePrefix || 'report'}_${date}_${time}`;
                    
                    if (options.exportFormat === 'pdf') {
                        this.exportToPDF(result.report, `${fileName}.pdf`);
                    } else if (options.exportFormat === 'word') {
                        this.exportToWord(result.report, `${fileName}.docx`);
                    } else {
                        this.exportToExcel(result.report, `${fileName}.xlsx`);
                    }
                }
            }
        }, interval);
        
        // 返回取消函数
        return {
            scheduleId: scheduleId,
            cancel: () => {
                clearInterval(timerId);
                console.log(`已取消定时报表任务 ${scheduleId}`);
                this.triggerEvent('scheduleCanceled', { scheduleId: scheduleId });
                return { success: true, message: '已取消定时报表任务' };
            }
        };
    }

    // 邮件发送报表
    sendReportByEmail(report = this.lastGeneratedReport, email, subject = '自动生成的报表', options = {}) {
        if (!report) {
            return {
                success: false,
                message: '没有可发送的报表'
            };
        }
        
        if (!email || !email.includes('@')) {
            return {
                success: false,
                message: '请提供有效的邮箱地址'
            };
        }
        
        // 模拟邮件发送
        console.log(`发送报表到邮箱: ${email}`, {
            subject: subject,
            report: report,
            options: options
        });
        
        // 实际应用中，这里会调用邮件API
        setTimeout(() => {
            this.triggerEvent('reportSent', {
                email: email,
                subject: subject,
                report: report,
                timestamp: new Date().toISOString()
            });
            
            alert(`报表已发送到 ${email}`);
        }, 1200);
        
        return {
            success: true,
            message: `正在发送报表到 ${email}...`,
            email: email
        };
    }

    // 批量生成报表
    batchGenerateReports(data, templateIds, options = {}) {
        const results = [];
        let successCount = 0;
        
        for (const templateId of templateIds) {
            const result = this.generateReport(data, templateId, options);
            results.push(result);
            
            if (result.success) {
                successCount++;
            }
        }
        
        this.triggerEvent('batchReportsGenerated', {
            totalCount: templateIds.length,
            successCount: successCount,
            results: results
        });
        
        return {
            success: successCount === templateIds.length,
            message: `生成了 ${successCount}/${templateIds.length} 个报表`,
            reports: results.filter(r => r.success).map(r => r.report)
        };
    }

    // 注册事件监听器
    on(eventName, handler) {
        if (!this.eventHandlers[eventName]) {
            this.eventHandlers[eventName] = [];
        }
        this.eventHandlers[eventName].push(handler);
    }

    // 移除事件监听器
    off(eventName, handler) {
        if (!this.eventHandlers[eventName]) return;
        
        if (!handler) {
            // 移除所有该事件的监听器
            delete this.eventHandlers[eventName];
        } else {
            // 移除特定监听器
            this.eventHandlers[eventName] = this.eventHandlers[eventName].filter(h => h !== handler);
        }
    }

    // 触发事件
    triggerEvent(eventName, data) {
        if (!this.eventHandlers[eventName]) return;
        
        this.eventHandlers[eventName].forEach(handler => {
            try {
                handler(data);
            } catch (e) {
                console.error(`事件处理器错误 (${eventName}):`, e);
            }
        });
    }
}

// 导出单例实例
const reportGenerator = new ReportGenerator();
export default reportGenerator;
