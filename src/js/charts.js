
/* public_employment_service_platform_8683/frontend/js/charts.js */
/**
 * 数据可视化图表模块
 * 使用Chart.js实现多种图表类型
 */

// 图表颜色配置
const chartColors = {
    primary: 'rgba(99, 102, 241, 0.7)',
    secondary: 'rgba(16, 185, 129, 0.7)',
    danger: 'rgba(239, 68, 68, 0.7)',
    warning: 'rgba(245, 158, 11, 0.7)',
    info: 'rgba(59, 130, 246, 0.7)',
    light: 'rgba(248, 250, 252, 0.7)',
    dark: 'rgba(30, 41, 59, 0.7)'
};

// 初始化趋势图
function initTrendChart(ctx, data) {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: data.datasets[0].label,
                data: data.datasets[0].data,
                backgroundColor: chartColors.primary.replace('0.7', '0.2'),
                borderColor: chartColors.primary,
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: getCommonOptions()
    });
}

// 初始化饼图/环形图
function initPieChart(ctx, data, isDoughnut = false) {
    return new Chart(ctx, {
        type: isDoughnut ? 'doughnut' : 'pie',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.data,
                backgroundColor: [
                    chartColors.primary,
                    chartColors.secondary,
                    chartColors.danger,
                    chartColors.warning,
                    chartColors.info
                ],
                borderWidth: 1
            }]
        },
        options: {
            ...getCommonOptions(),
            plugins: {
                legend: {
                    position: 'right',
                }
            }
        }
    });
}

// 初始化柱状图
function initBarChart(ctx, data, isHorizontal = false) {
    return new Chart(ctx, {
        type: isHorizontal ? 'bar' : 'horizontalBar',
        data: {
            labels: data.labels,
            datasets: [{
                label: data.label,
                data: data.data,
                backgroundColor: chartColors.primary,
                borderColor: chartColors.primary,
                borderWidth: 1
            }]
        },
        options: getCommonOptions()
    });
}

// 初始化散点图
function initScatterChart(ctx, data) {
    return new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: data.label,
                data: data.data,
                backgroundColor: chartColors.primary,
                borderColor: chartColors.primary,
                borderWidth: 1,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            ...getCommonOptions(),
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom'
                }
            }
        }
    });
}

// 初始化热力图
function initHeatmapChart(ctx, data) {
    return new Chart(ctx, {
        type: 'matrix',
        data: {
            datasets: [{
                label: data.label,
                data: data.data,
                backgroundColor: ({raw}) => {
                    const value = raw.v;
                    const alpha = (value - data.min) / (data.max - data.min) * 0.7 + 0.3;
                    return chartColors.danger.replace('0.7', alpha.toFixed(2));
                },
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1,
                width: ({chart}) => (chart.chartArea.width / data.xLabels.length) - 1,
                height: ({chart}) => (chart.chartArea.height / data.yLabels.length) - 1
            }]
        },
        options: {
            ...getCommonOptions(),
            scales: {
                x: {
                    type: 'category',
                    labels: data.xLabels,
                    offset: true,
                    grid: {
                        display: false
                    }
                },
                y: {
                    type: 'category',
                    labels: data.yLabels,
                    offset: true,
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: () => '',
                        label: ({raw}) => `值: ${raw.v}`
                    }
                }
            }
        }
    });
}

// 获取通用图表配置
function getCommonOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: {
                        family: "'Noto Sans SC', sans-serif"
                    }
                }
            },
            tooltip: {
                bodyFont: {
                    family: "'Noto Sans SC', sans-serif"
                },
                titleFont: {
                    family: "'Noto Sans SC', sans-serif"
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    font: {
                        family: "'Noto Sans SC', sans-serif"
                    }
                }
            },
            x: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    font: {
                        family: "'Noto Sans SC', sans-serif"
                    }
                }
            }
        }
    };
}

// 更新图表数据
function updateChart(chart, newData) {
    chart.data.labels = newData.labels || chart.data.labels;
    chart.data.datasets.forEach((dataset, i) => {
        dataset.data = newData.datasets[i].data || dataset.data;
        dataset.label = newData.datasets[i].label || dataset.label;
    });
    chart.update();
}

// 导出图表为图片
function exportChartAsImage(chart, fileName = 'chart') {
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = chart.toBase64Image();
    link.click();
}

// 注册矩阵图表类型
Chart.register({
    id: 'matrix',
    defaults: {
        scales: {
            x: { type: 'category' },
            y: { type: 'category' }
        }
    }
});

// 初始化所有图表
document.addEventListener('DOMContentLoaded', function() {
    // 自动初始化带有data-chart属性的canvas元素
    document.querySelectorAll('[data-chart]').forEach(canvas => {
        const ctx = canvas.getContext('2d');
        const chartType = canvas.getAttribute('data-chart');
        const chartData = JSON.parse(canvas.getAttribute('data-chart-data') || '{}');
        
        switch(chartType) {
            case 'trend':
                initTrendChart(ctx, chartData);
                break;
            case 'pie':
                initPieChart(ctx, chartData);
                break;
            case 'doughnut':
                initPieChart(ctx, chartData, true);
                break;
            case 'bar':
                initBarChart(ctx, chartData);
                break;
            case 'horizontalBar':
                initBarChart(ctx, chartData, true);
                break;
            case 'scatter':
                initScatterChart(ctx, chartData);
                break;
            case 'heatmap':
                initHeatmapChart(ctx, chartData);
                break;
        }
    });
});
