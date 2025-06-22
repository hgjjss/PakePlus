
<!-- emergency_av_management_server/frontend/js/monitor.js -->
document.addEventListener('DOMContentLoaded', function() {
    // 初始化监控系统
    const monitorSystem = {
        devices: [],
        alertThreshold: 3, // 报警阈值
        alertHistory: [],
        checkInterval: 30000, // 30秒检查一次
        soundEnabled: true,
        
        init: function() {
            this.loadDevices();
            this.startMonitoring();
            this.setupAlertHandlers();
            this.setupSound();
        },
        
        loadDevices: function() {
            const storedDevices = localStorage.getItem('devices');
            this.devices = storedDevices ? JSON.parse(storedDevices) : [];
        },
        
        startMonitoring: function() {
            // 初始检查
            this.checkDevicesStatus();
            
            // 定时检查
            setInterval(() => {
                this.checkDevicesStatus();
            }, this.checkInterval);
        },
        
        checkDevicesStatus: function() {
            const updatedDevices = [...this.devices];
            let hasStatusChange = false;
            
            updatedDevices.forEach(device => {
                const previousStatus = device.status;
                
                // 模拟设备状态变化 (10%概率)
                if (Math.random() < 0.1) {
                    const statuses = ['online', 'warning', 'offline'];
                    const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
                    
                    if (newStatus !== device.status) {
                        device.status = newStatus;
                        device.lastActive = '刚刚';
                        hasStatusChange = true;
                        
                        // 记录状态变化
                        this.recordStatusChange(device.id, previousStatus, newStatus);
                        
                        // 检查是否需要报警
                        if (newStatus === 'warning' || newStatus === 'offline') {
                            this.triggerAlert(device);
                        }
                    }
                }
            });
            
            if (hasStatusChange) {
                localStorage.setItem('devices', JSON.stringify(updatedDevices));
                this.devices = updatedDevices;
                
                // 更新UI
                if (typeof updateDeviceList === 'function') {
                    updateDeviceList();
                }
            }
        },
        
        recordStatusChange: function(deviceId, oldStatus, newStatus) {
            const timestamp = new Date().toISOString();
            this.alertHistory.push({
                deviceId,
                oldStatus,
                newStatus,
                timestamp
            });
            
            // 保持最近100条记录
            if (this.alertHistory.length > 100) {
                this.alertHistory.shift();
            }
        },
        
        triggerAlert: function(device) {
            const alertMessage = `设备报警: ${device.name} (${device.id}) 状态从 ${this.getStatusText(device.status)}`;
            
            // 添加到报警历史
            this.alertHistory.push({
                type: 'alert',
                deviceId: device.id,
                message: alertMessage,
                timestamp: new Date().toISOString(),
                resolved: false
            });
            
            // 显示报警通知
            this.showAlertNotification(alertMessage, device.id);
            
            // 播放报警声音
            if (this.soundEnabled) {
                this.playAlertSound();
            }
            
            console.log(alertMessage);
        },
        
        showAlertNotification: function(message, deviceId) {
            // 检查是否已有相同设备的未解决报警
            const existingAlert = this.alertHistory.find(
                alert => alert.deviceId === deviceId && !alert.resolved
            );
            
            if (!existingAlert) {
                // 创建通知元素
                const notification = document.createElement('div');
                notification.className = 'fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg max-w-xs animate-pulse';
                notification.innerHTML = `
                    <div class="flex items-start">
                        <i class="fas fa-exclamation-triangle mr-2 mt-1"></i>
                        <div>
                            <p class="font-bold">设备报警</p>
                            <p class="text-sm">${message}</p>
                            <div class="flex justify-end mt-2 space-x-2">
                                <button onclick="monitorSystem.resolveAlert('${deviceId}', this.parentNode.parentNode.parentNode)" 
                                    class="px-2 py-1 bg-white text-red-500 text-xs rounded hover:bg-gray-100">
                                    已解决
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(notification);
                
                // 5秒后自动消失
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.classList.remove('animate-pulse');
                        notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
                        setTimeout(() => {
                            notification.remove();
                        }, 300);
                    }
                }, 5000);
            }
        },
        
        resolveAlert: function(deviceId, notificationElement) {
            // 标记为已解决
            this.alertHistory.forEach(alert => {
                if (alert.deviceId === deviceId && !alert.resolved) {
                    alert.resolved = true;
                    alert.resolvedAt = new Date().toISOString();
                }
            });
            
            // 移除通知
            if (notificationElement) {
                notificationElement.classList.remove('animate-pulse');
                notificationElement.classList.add('opacity-0', 'transition-opacity', 'duration-300');
                setTimeout(() => {
                    notificationElement.remove();
                }, 300);
            }
        },
        
        playAlertSound: function() {
            const audio = new Audio('https://8bituniverse.com/sounds/alert.mp3');
            audio.volume = 0.3;
            audio.play().catch(e => console.log('无法播放报警声音:', e));
        },
        
        toggleSound: function() {
            this.soundEnabled = !this.soundEnabled;
            return this.soundEnabled;
        },
        
        setupSound: function() {
            // 检查浏览器是否支持声音
            try {
                const audio = new Audio();
                audio.volume = 0;
                audio.play().then(() => {
                    audio.pause();
                }).catch(() => {
                    this.soundEnabled = false;
                    console.warn('浏览器设置阻止了声音播放，报警声音将被禁用');
                });
            } catch (e) {
                this.soundEnabled = false;
                console.warn('无法初始化声音:', e);
            }
        },
        
        setupAlertHandlers: function() {
            // 暴露方法到全局
            window.monitorSystem = this;
        },
        
        getStatusText: function(status) {
            const statusMap = {
                'online': '在线',
                'warning': '警告',
                'offline': '离线'
            };
            return statusMap[status] || status;
        }
    };
    
    // 启动监控系统
    monitorSystem.init();
    
    // 设备列表更新函数 (供其他模块调用)
    window.updateDeviceList = function() {
        const deviceTable = document.querySelector('table tbody');
        if (deviceTable) {
            const devices = JSON.parse(localStorage.getItem('devices')) || [];
            deviceTable.innerHTML = devices.map(device => `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${device.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${device.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${device.type}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${device.location}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${device.status === 'online' ? 'bg-green-500' : device.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'} 
                            text-white">
                            ${monitorSystem.getStatusText(device.status)}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${device.lastActive}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button onclick="viewDevice('${device.id}')" class="text-blue-600 hover:text-blue-900 mr-3">查看</button>
                        <button onclick="editDevice('${device.id}')" class="text-gray-600 hover:text-gray-900">设置</button>
                    </td>
                </tr>
            `).join('');
        }
    };
    
    // 初始化设备列表
    updateDeviceList();
});
