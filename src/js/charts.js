
<!-- emergency_av_management_server/frontend/js/charts.js -->
document.addEventListener('DOMContentLoaded', function() {
    // 初始化所有图表容器
    const chartContainers = {
        'videoChart': { type: 'bar', title: '视音频资源统计' },
        'deviceChart': { type: 'doughnut', title: '设备使用情况统计' },
        'eventTrendChart': { type: 'line', title: '急救事件趋势分析' },
        'eventTypeChart': { type: 'pie', title: '急救事件类型分布' },
        'deviceUsageChart': { type: 'bar', title: '设备使用率统计' },
        'deviceStatusChart': { type: 'pie', title: '设备状态分布' },
        'mediaStorageChart': { type: 'line', title: '媒体存储增长趋势' },
        'mediaTypeChart': { type: 'doughnut', title: '媒体类型分布' }
    };

    // 初始化所有图表
    Object.keys(chartContainers).forEach(chartId => {
        const container = document.getElementById(chartId);
        if (container) {
            const canvas = document.createElement('canvas');
            container.innerHTML = '';
            container.appendChild(canvas);
            initChart(canvas, chartContainers[chartId]);
        }
    });

    // 图表初始化函数
    function initChart(canvas, config) {
        const ctx = canvas.getContext('2d');
        const data = generateChartData(config.type);
        
        new Chart(ctx, {
            type: config.type,
            data: data.data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: config.title,
                        font: {
                            size: 16,
                            family: "'Noto Sans SC', sans-serif"
                        }
                    },
                    legend: {
                        position: config.type === 'doughnut' || config.type === 'pie' ? 'right' : 'top',
                        labels: {
                            font: {
                                family: "'Noto Sans SC', sans-serif"
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                
                                if (config.type === 'doughnut' || config.type === 'pie') {
                                    const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                                    const value = context.raw;
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}${value} (${percentage}%)`;
                                } else {
                                    return `${label}${context.raw}`;
                                }
                            }
                        }
                    }
                },
                scales: config.type === 'bar' || config.type === 'line' ? {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            font: {
                                family: "'Noto Sans SC', sans-serif"
                            }
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                family: "'Noto Sans SC', sans-serif"
                            }
                        }
                    }
                } : {}
            }
        });
    }

    // 生成模拟图表数据
    function generateChartData(type) {
        const colors = [
            'rgba(59, 130, 246, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(239, 68, 68, 0.7)',
            'rgba(139, 92, 246, 0.7)',
            'rgba(236, 72, 153, 0.7)'
        ];

        const borderColors = colors.map(color => color.replace('0.7', '1'));

        if (type === 'bar') {
            const labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
            return {
                data: {
                    labels: labels,
                    datasets: [{
                        label: '数量',
                        data: labels.map(() => Math.floor(Math.random() * 200) + 50),
                        backgroundColor: colors[0],
                        borderColor: borderColors[0],
                        borderWidth: 1
                    }]
                }
            };
        } else if (type === 'line') {
            const labels = ['1月', '2月', '3月', '4月', '5月', '6月'];
            return {
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: '视频存储(GB)',
                            data: labels.map((_, i) => 100 + i * 30 + Math.random() * 20),
                            backgroundColor: colors[0],
                            borderColor: borderColors[0],
                            borderWidth: 2,
                            tension: 0.3
                        },
                        {
                            label: '音频存储(GB)',
                            data: labels.map((_, i) => 50 + i * 10 + Math.random() * 10),
                            backgroundColor: colors[1],
                            borderColor: borderColors[1],
                            borderWidth: 2,
                            tension: 0.3
                        },
                        {
                            label: '图像存储(GB)',
                            data: labels.map((_, i) => 30 + i * 5 + Math.random() * 5),
                            backgroundColor: colors[2],
                            borderColor: borderColors[2],
                            borderWidth: 2,
                            tension: 0.3
                        }
                    ]
                }
            };
        } else if (type === 'doughnut' || type === 'pie') {
            const labels = type === 'doughnut' ? 
                ['视频采集', '音频采集', '数据采集', '存储设备'] : 
                ['心脏骤停', '创伤急救', '中风急救', '呼吸急救', '其他'];
            
            return {
                data: {
                    labels: labels,
                    datasets: [{
                        data: labels.map(() => Math.floor(Math.random() * 50) + 10),
                        backgroundColor: colors.slice(0, labels.length),
                        borderColor: borderColors.slice(0, labels.length),
                        borderWidth: 1
                    }]
                }
            };
        }
    }

    // 实时更新图表数据
    setInterval(() => {
        Object.keys(chartContainers).forEach(chartId => {
            const container = document.getElementById(chartId);
            if (container && container.querySelector('canvas')) {
                container.innerHTML = '';
                const canvas = document.createElement('canvas');
                container.appendChild(canvas);
                initChart(canvas, chartContainers[chartId]);
            }
        });
    }, 30000); // 每30秒更新一次数据

    // 导出图表数据为CSV
    window.exportChartData = function(chartId) {
        const chartType = chartContainers[chartId]?.type;
        if (!chartType) return;

        const data = generateChartData(chartType).data;
        let csvContent = "data:text/csv;charset=utf-8,";
        
        if (chartType === 'bar' || chartType === 'line') {
            csvContent += "日期," + data.datasets.map(d => d.label).join(",") + "\\n";
            data.labels.forEach((label, i) => {
                const row = [label, ...data.datasets.map(d => d.data[i])];
                csvContent += row.join(",") + "\\n";
            });
        } else {
            csvContent += "类型,数量\\n";
            data.labels.forEach((label, i) => {
                csvContent += `${label},${data.datasets[0].data[i]}\\n`;
            });
        }
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${chartId}_data.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
});
