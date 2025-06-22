
// public_employment_service_platform_8683/frontend/js/export.js
/**
 * 交易日志导出功能模块
 * 支持CSV和Excel格式导出，纯前端实现
 */

// 导出CSV文件
function exportToCSV(data, filename = '交易日志') {
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('导出数据不能为空');
        return false;
    }

    try {
        // 处理数据中的特殊字符
        const escapeCsv = (str) => {
            if (typeof str !== 'string') str = String(str);
            if (str.includes('"') || str.includes(',') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        // 获取表头
        const headers = Object.keys(data[0]);
        const csvRows = [];
        
        // 添加表头
        csvRows.push(headers.map(escapeCsv).join(','));
        
        // 添加数据行
        data.forEach(row => {
            const values = headers.map(header => escapeCsv(row[header]));
            csvRows.push(values.join(','));
        });

        // 创建下载链接
        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${filename}_${formatDate(new Date())}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return true;
    } catch (error) {
        console.error('导出CSV失败:', error);
        return false;
    }
}

// 导出Excel文件
function exportToExcel(data, filename = '交易日志') {
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('导出数据不能为空');
        return false;
    }

    try {
        // 检查SheetJS库是否加载
        if (typeof XLSX === 'undefined') {
            console.error('SheetJS库未加载');
            alert('导出Excel功能需要加载SheetJS库，请稍后再试');
            return false;
        }

        // 创建工作簿
        const wb = XLSX.utils.book_new();
        
        // 创建工作表
        const ws = XLSX.utils.json_to_sheet(data);
        
        // 添加工作表到工作簿
        XLSX.utils.book_append_sheet(wb, ws, '交易日志');
        
        // 导出文件
        XLSX.writeFile(wb, `${filename}_${formatDate(new Date())}.xlsx`);
        
        return true;
    } catch (error) {
        console.error('导出Excel失败:', error);
        return false;
    }
}

// 格式化日期为YYYYMMDD
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

// 初始化导出按钮事件
function initExportButtons() {
    document.querySelectorAll('.export-csv-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tableId = this.getAttribute('data-table');
            const table = document.getElementById(tableId);
            if (!table) return;
            
            const data = tableToJson(table);
            if (data.length > 0) {
                const filename = this.getAttribute('data-filename') || '交易日志';
                exportToCSV(data, filename);
            }
        });
    });

    document.querySelectorAll('.export-excel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tableId = this.getAttribute('data-table');
            const table = document.getElementById(tableId);
            if (!table) return;
            
            const data = tableToJson(table);
            if (data.length > 0) {
                const filename = this.getAttribute('data-filename') || '交易日志';
                exportToExcel(data, filename);
            }
        });
    });
}

// 将HTML表格转换为JSON数据
function tableToJson(table) {
    const data = [];
    const headers = [];
    
    // 获取表头
    const headerRow = table.querySelector('thead tr');
    if (headerRow) {
        headerRow.querySelectorAll('th').forEach(th => {
            headers.push(th.textContent.trim());
        });
    } else {
        // 如果没有thead，使用第一行作为表头
        const firstRow = table.querySelector('tr');
        if (firstRow) {
            firstRow.querySelectorAll('td').forEach(td => {
                headers.push(td.textContent.trim());
            });
        }
    }
    
    // 获取数据行
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const rowData = {};
        const cells = row.querySelectorAll('td');
        
        cells.forEach((cell, index) => {
            const header = headers[index] || `列${index + 1}`;
            rowData[header] = cell.textContent.trim();
        });
        
        data.push(rowData);
    });
    
    return data;
}

// 导出模块API
const ExportService = {
    toCSV: exportToCSV,
    toExcel: exportToExcel,
    init: initExportButtons
};

// 初始化导出功能
document.addEventListener('DOMContentLoaded', function() {
    // 自动初始化导出按钮
    initExportButtons();
    
    // 全局导出方法
    window.exportData = function(data, type = 'csv', filename = '交易日志') {
        if (type.toLowerCase() === 'csv') {
            return exportToCSV(data, filename);
        } else if (type.toLowerCase() === 'excel') {
            return exportToExcel(data, filename);
        }
        return false;
    };
});

// 导出模块
export default ExportService;
