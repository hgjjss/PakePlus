
/* video_monitoring_replay_service/frontend/js/main.js */
document.addEventListener('DOMContentLoaded', function() {
    // 登录状态检查
    function checkLoginStatus() {
        return localStorage.getItem('isLoggedIn') === 'true';
    }

    // 登录验证
    function validateLogin(username, password) {
        if(username === 'admin' && password === '12345') {
            localStorage.setItem('isLoggedIn', 'true');
            return true;
        }
        return false;
    }

    // 登出功能
    function logout() {
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html';
    }

    // 视频源管理
    const videoSources = {
        'front': {
            id: 'V001',
            name: '车辆前摄像头',
            url: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
            thumbnail: 'https://picsum.photos/1280/720?random=1'
        },
        'door': {
            id: 'V002',
            name: '车门监控',
            url: 'https://samplelib.com/lib/preview/mp4/sample-10s.mp4',
            thumbnail: 'https://picsum.photos/1280/720?random=2'
        },
        'inside': {
            id: 'V003',
            name: '车内监控',
            url: 'https://samplelib.com/lib/preview/mp4/sample-15s.mp4',
            thumbnail: 'https://picsum.photos/1280/720?random=3'
        }
    };

    // 获取视频源
    function getVideoSource(sourceId) {
        return videoSources[sourceId] || null;
    }

    // 切换视频源
    function switchVideoSource(videoElement, sourceId) {
        const source = getVideoSource(sourceId);
        if (source && videoElement) {
            videoElement.src = source.url;
            videoElement.poster = source.thumbnail;
            return source;
        }
        return null;
    }

    // 智能分析事件处理器
    const analysisEvents = {
        motionDetection: function(videoElement, sensitivity = 0.7) {
            console.log(`运动检测已启用，敏感度: ${sensitivity}`);
            // 模拟分析结果
            return {
                type: 'motion',
                confidence: 0.85,
                regions: [
                    {x: 100, y: 150, width: 200, height: 200}
                ],
                timestamp: new Date().toISOString()
            };
        },
        abnormalBehavior: function(videoElement, threshold = 0.5) {
            console.log(`异常行为分析已启用，阈值: ${threshold}`);
            // 模拟分析结果
            return {
                type: 'abnormal',
                confidence: 0.65,
                description: '检测到异常移动模式',
                timestamp: new Date().toISOString()
            };
        },
        faceRecognition: function(videoElement, minConfidence = 0.8) {
            console.log(`人脸识别已启用，最小置信度: ${minConfidence}`);
            // 模拟分析结果
            return {
                type: 'face',
                confidence: 0.92,
                count: 2,
                timestamp: new Date().toISOString()
            };
        }
    };

    // 执行智能分析
    function runAnalysis(type, videoElement, options = {}) {
        if (analysisEvents[type] && videoElement) {
            return analysisEvents[type](videoElement, options);
        }
        return null;
    }

    // 获取设备状态
    function getDeviceStatus() {
        return {
            frontCamera: { status: 'online', lastActive: '2025-05-28T15:30:00Z' },
            doorCamera: { status: 'online', lastActive: '2025-05-28T15:28:00Z' },
            insideCamera: { status: 'online', lastActive: '2025-05-28T15:25:00Z' }
        };
    }

    // 暴露全局方法
    window.MonitorApp = {
        checkLoginStatus,
        validateLogin,
        logout,
        getVideoSource,
        switchVideoSource,
        runAnalysis,
        getDeviceStatus,
        videoSources,
        analysisEvents
    };
});
