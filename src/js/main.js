
// emergency_av_management_server/frontend/js/main.js
document.addEventListener('DOMContentLoaded', function() {
    // 初始化设备数据
    if (!localStorage.getItem('devices')) {
        const defaultDevices = [
            { id: 'DEV-001', name: '急救记录仪', type: '视频采集', location: '救护车A', status: 'online', lastActive: '2分钟前' },
            { id: 'DEV-002', name: '车载存储设备', type: '存储', location: '救护车B', status: 'warning', lastActive: '5分钟前' },
            { id: 'DEV-003', name: '生命体征采集器', type: '数据采集', location: '救护车C', status: 'offline', lastActive: '1小时前' }
        ];
        localStorage.setItem('devices', JSON.stringify(defaultDevices));
    }

    // 初始化急救事件数据
    if (!localStorage.getItem('emergencyEvents')) {
        const defaultEvents = [
            { id: 'EVT-001', title: '心脏骤停急救', patient: '张某某', age: 45, status: '处理中', time: '2025-06-12 13:25:34', location: '北京市朝阳区建国路88号' },
            { id: 'EVT-002', title: '交通事故急救', patient: '李某某', age: 32, status: '已完成', time: '2025-06-12 10:15:22', location: '北京市海淀区中关村大街' }
        ];
        localStorage.setItem('emergencyEvents', JSON.stringify(defaultEvents));
    }

    // 初始化统计图表数据
    if (!localStorage.getItem('stats')) {
        const defaultStats = {
            videoStats: {
                labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
                data: [120, 190, 130, 170, 150, 220, 180]
            },
            deviceStats: {
                labels: ['视频采集', '音频采集', '数据采集', '存储设备'],
                data: [45, 30, 25, 20]
            }
        };
        localStorage.setItem('stats', JSON.stringify(defaultStats));
    }

    // 表单验证函数
    function validateForm(formId, rules) {
        const form = document.getElementById(formId);
        if (!form) return false;

        let isValid = true;
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            const rule = rules[input.name];
            if (!rule) return;

            // 必填验证
            if (rule.required && !input.value.trim()) {
                isValid = false;
                showValidationError(input, '此字段为必填项');
                return;
            }

            // 类型验证
            if (rule.type) {
                switch (rule.type) {
                    case 'email':
                        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
                            isValid = false;
                            showValidationError(input, '请输入有效的电子邮件地址');
                        }
                        break;
                    case 'number':
                        if (isNaN(input.value)) {
                            isValid = false;
                            showValidationError(input, '请输入有效的数字');
                        }
                        break;
                    case 'date':
                        if (!/^\d{4}-\d{2}-\d{2}$/.test(input.value)) {
                            isValid = false;
                            showValidationError(input, '请输入有效的日期格式 (YYYY-MM-DD)');
                        }
                        break;
                }
            }

            // 长度验证
            if (rule.minLength && input.value.length < rule.minLength) {
                isValid = false;
                showValidationError(input, `至少需要 ${rule.minLength} 个字符`);
            }

            if (rule.maxLength && input.value.length > rule.maxLength) {
                isValid = false;
                showValidationError(input, `最多允许 ${rule.maxLength} 个字符`);
            }
        });

        return isValid;
    }

    function showValidationError(input, message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'text-red-500 text-xs mt-1';
        errorElement.textContent = message;
        
        const parent = input.parentElement;
        if (parent.querySelector('.text-red-500')) {
            parent.removeChild(parent.querySelector('.text-red-500'));
        }
        parent.appendChild(errorElement);
        
        input.classList.add('border-red-500');
        input.addEventListener('input', function() {
            input.classList.remove('border-red-500');
            if (parent.querySelector('.text-red-500')) {
                parent.removeChild(parent.querySelector('.text-red-500'));
            }
        }, { once: true });
    }

    // 数据缓存管理
    function cacheData(key, data, ttl = 3600) {
        const now = new Date();
        const item = {
            data: data,
            expiry: now.getTime() + ttl * 1000
        };
        localStorage.setItem(key, JSON.stringify(item));
    }

    function getCachedData(key) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;

        const item = JSON.parse(itemStr);
        const now = new Date();
        
        if (now.getTime() > item.expiry) {
            localStorage.removeItem(key);
            return null;
        }
        
        return item.data;
    }

    // 设备管理功能
    window.addDevice = function() {
        const rules = {
            'device-name': { required: true, maxLength: 50 },
            'device-type': { required: true },
            'device-location': { required: true }
        };

        if (validateForm('add-device-form', rules)) {
            const form = document.getElementById('add-device-form');
            const formData = new FormData(form);
            const device = Object.fromEntries(formData.entries());
            
            device.id = 'DEV-' + Math.random().toString(36).substr(2, 6).toUpperCase();
            device.status = 'online';
            device.lastActive = '刚刚';
            
            const devices = JSON.parse(localStorage.getItem('devices')) || [];
            devices.push(device);
            localStorage.setItem('devices', JSON.stringify(devices));
            
            alert('设备添加成功！');
            window.location.reload();
        }
    };

    window.editDevice = function(deviceId) {
        const devices = JSON.parse(localStorage.getItem('devices'));
        const device = devices.find(d => d.id === deviceId);
        if (device) {
            // 填充表单数据
            document.getElementById('device-name').value = device.name;
            document.getElementById('device-type').value = device.type;
            document.getElementById('device-location').value = device.location;
            
            // 显示编辑模态框
            document.getElementById('add-device-modal').classList.remove('hidden');
            
            // 修改表单提交行为
            const form = document.getElementById('add-device-form');
            form.onsubmit = function(e) {
                e.preventDefault();
                
                const rules = {
                    'device-name': { required: true, maxLength: 50 },
                    'device-type': { required: true },
                    'device-location': { required: true }
                };

                if (validateForm('add-device-form', rules)) {
                    const formData = new FormData(form);
                    const updatedDevice = Object.fromEntries(formData.entries());
                    
                    device.name = updatedDevice['device-name'];
                    device.type = updatedDevice['device-type'];
                    device.location = updatedDevice['device-location'];
                    
                    localStorage.setItem('devices', JSON.stringify(devices));
                    alert('设备信息更新成功！');
                    window.location.reload();
                }
            };
        }
    };

    window.refreshDevices = function() {
        // 模拟从服务器获取最新数据
        const devices = JSON.parse(localStorage.getItem('devices')) || [];
        devices.forEach(device => {
            if (device.status === 'online') {
                device.lastActive = '刚刚';
            } else if (device.status === 'warning') {
                device.lastActive = '5分钟前';
            } else {
                device.lastActive = '1小时前';
            }
        });
        localStorage.setItem('devices', JSON.stringify(devices));
        location.reload();
    };

    // 急救事件管理
    window.viewAllEvents = function() {
        window.location.href = 'emergency_events.html';
    };

    // 车载设备管理
    window.manageVehicleDevices = function() {
        window.location.href = 'vehicle_management.html';
    };

    // 权限管理
    window.managePermissions = function() {
        window.location.href = 'permission_management.html';
    };

    // 系统设置
    window.systemSettings = function() {
        window.location.href = 'system_settings.html';
    };

    // 考核打分
    window.evaluationScoring = function() {
        window.location.href = 'evaluation.html';
    };

    // 实时监控模拟
    setInterval(() => {
        const devices = JSON.parse(localStorage.getItem('devices'));
        const randomIndex = Math.floor(Math.random() * devices.length);
        const device = devices[randomIndex];
        
        // 随机改变设备状态
        const statuses = ['online', 'warning', 'offline'];
        const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        if (device.status !== newStatus) {
            device.status = newStatus;
            device.lastActive = '刚刚';
            localStorage.setItem('devices', JSON.stringify(devices));
            
            // 触发报警
            if (newStatus === 'warning') {
                console.log(`设备报警: ${device.name} (${device.id}) 状态异常!`);
            }
        }
    }, 30000); // 每30秒检查一次
});
