
// public_employment_service_platform/frontend/script.js
/**
 * 公共就业服务平台核心脚本
 * 包含系统主要功能实现
 */

// 粒子效果初始化
function initParticles() {
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 } },
                color: { value: "#ffffff" },
                shape: { type: "circle" },
                opacity: { value: 0.5, random: true },
                size: { value: 3, random: true },
                line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.4, width: 1 },
                move: { enable: true, speed: 2, direction: "none", random: true, straight: false, out_mode: "out" }
            },
            interactivity: {
                detect_on: "canvas",
                events: {
                    onhover: { enable: true, mode: "repulse" },
                    onclick: { enable: true, mode: "push" }
                }
            }
        });
    }
}

// 登录验证
function validateLogin(username, password) {
    const usernameRegex = /^[A-Za-z0-9]{3,20}$/;
    const passwordRegex = /^.{5,20}$/;
    
    if (!usernameRegex.test(username)) {
        return { valid: false, message: '用户名只能包含字母和数字，长度3-20位' };
    }
    
    if (!passwordRegex.test(password)) {
        return { valid: false, message: '密码长度需在5-20位之间' };
    }
    
    if (username === 'admin' && password === '12345') {
        return { valid: true, message: '登录成功' };
    } else {
        return { valid: false, message: '用户名或密码错误' };
    }
}

// 保存登录状态
function saveLoginStatus() {
    localStorage.setItem('isLoggedIn', 'true');
}

// 检查登录状态
function checkLoginStatus() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

// 清除登录状态
function clearLoginStatus() {
    localStorage.removeItem('isLoggedIn');
}

// 智能业务分派
function dispatchBusiness(businessType, urgency, description) {
    // 模拟AI分派逻辑
    const recommendations = [
        "根据您的需求，我们推荐您联系就业服务中心的李顾问，他擅长处理类似案例。",
        "系统建议您参加下周的职业培训课程，这将有助于解决您的问题。",
        "我们为您匹配了政策咨询专家王老师，他可以帮助您了解相关政策。",
        "推荐您使用我们的在线就业指导平台，提供24小时自助服务。"
    ];
    
    const processingTimes = ["1-3个工作日", "立即处理", "3-5个工作日", "24小时内"];
    const contacts = [
        "电话: 123-4567-8910<br>邮箱: li.advisor@service.com",
        "电话: 123-4567-8911<br>邮箱: training@service.com",
        "电话: 123-4567-8912<br>邮箱: wang.advisor@service.com",
        "网址: online.service.com"
    ];
    
    const randomIndex = Math.floor(Math.random() * recommendations.length);
    const matchPercentage = Math.floor(Math.random() * 30) + 70; // 70-100%
    
    return {
        matchPercentage,
        recommendation: recommendations[randomIndex],
        processingTime: processingTimes[randomIndex],
        contactInfo: contacts[randomIndex]
    };
}

// 智能推荐算法
function generateRecommendations(preferences) {
    const recommendations = [
        {
            title: "就业服务中心 - 李顾问",
            description: "擅长职业规划和简历优化，10年人力资源经验",
            match: Math.floor(Math.random() * 30) + 70,
            type: "mentor"
        },
        {
            title: "创业贷款方案",
            description: "最高50万元，期限3年，利率4.35%起",
            match: Math.floor(Math.random() * 30) + 70,
            type: "finance"
        },
        {
            title: "全栈开发培训课程",
            description: "3个月强化培训，包含前端和后端开发技术",
            match: Math.floor(Math.random() * 30) + 70,
            type: "training"
        }
    ];
    
    // 根据用户偏好过滤推荐内容
    if (preferences && preferences.length > 0) {
        return recommendations.filter(rec => preferences.includes(rec.type));
    }
    
    return recommendations;
}

// 知识图谱生成
function generateKnowledgeGraph(type) {
    const graphs = {
        industry: {
            nodes: [
                { id: 'it', name: 'IT', size: 80 },
                { id: 'finance', name: '金融', size: 70 },
                { id: 'education', name: '教育', size: 60 },
                { id: 'health', name: '医疗', size: 50 },
                { id: 'manufacture', name: '制造', size: 60 }
            ],
            connections: [
                { from: 'it', to: 'finance', strength: 0.7 },
                { from: 'it', to: 'education', strength: 0.8 },
                { from: 'finance', to: 'health', strength: 0.5 },
                { from: 'education', to: 'health', strength: 0.6 },
                { from: 'manufacture', to: 'it', strength: 0.9 }
            ]
        },
        career: {
            nodes: [
                { id: 'developer', name: '开发者', size: 80 },
                { id: 'designer', name: '设计师', size: 70 },
                { id: 'manager', name: '经理', size: 60 },
                { id: 'analyst', name: '分析师', size: 50 },
                { id: 'consultant', name: '顾问', size: 60 }
            ],
            connections: [
                { from: 'developer', to: 'designer', strength: 0.7 },
                { from: 'developer', to: 'manager', strength: 0.6 },
                { from: 'designer', to: 'manager', strength: 0.8 },
                { from: 'analyst', to: 'consultant', strength: 0.9 },
                { from: 'manager', to: 'consultant', strength: 0.7 }
            ]
        },
        skill: {
            nodes: [
                { id: 'programming', name: '编程', size: 80 },
                { id: 'design', name: '设计', size: 70 },
                { id: 'analysis', name: '分析', size: 60 },
                { id: 'communication', name: '沟通', size: 50 },
                { id: 'management', name: '管理', size: 60 }
            ],
            connections: [
                { from: 'programming', to: 'design', strength: 0.6 },
                { from: 'programming', to: 'analysis', strength: 0.9 },
                { from: 'design', to: 'communication', strength: 0.8 },
                { from: 'analysis', to: 'management', strength: 0.7 },
                { from: 'communication', to: 'management', strength: 0.8 }
            ]
        }
    };
    
    return graphs[type] || graphs.industry;
}

// 页面导航
function navigateTo(page) {
    window.location.href = page;
}

// 退出系统
function logout() {
    clearLoginStatus();
    window.location.href = 'login.html';
}

// 初始化函数
function init() {
    initParticles();
    
    // 检查登录状态
    if (!checkLoginStatus() && window.location.pathname !== '/login.html') {
        window.location.href = 'login.html';
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
