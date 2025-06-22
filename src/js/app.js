
/* public_employment_service_platform_8683/frontend/js/app.js */
/**
 * 公共就业服务平台核心业务逻辑
 * 包含登录状态管理、本地存储操作和模块状态跟踪
 */

// 增强的登录状态管理
class AuthService {
    static checkLoginStatus() {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
        if (!isLoggedIn && !window.location.href.includes('index.html')) {
            window.location.href = 'index.html';
        }
        return isLoggedIn;
    }

    static login(username, password, remember) {
        // 模拟API调用
        return new Promise((resolve) => {
            setTimeout(() => {
                if (username === 'admin' && password === '12345') {
                    sessionStorage.setItem('isLoggedIn', 'true');
                    sessionStorage.setItem('userRole', 'admin');
                    
                    if (remember) {
                        localStorage.setItem('rememberMe', 'true');
                        localStorage.setItem('username', username);
                    }
                    resolve({ success: true, role: 'admin' });
                } else {
                    resolve({ success: false, message: '用户名或密码错误' });
                }
            }, 500);
        });
    }

    static logout() {
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('activeModule');
        window.location.href = 'index.html';
    }

    static getCurrentUser() {
        return {
            username: localStorage.getItem('username') || '',
            role: sessionStorage.getItem('userRole') || 'guest'
        };
    }
}

// 增强的模块状态管理
class ModuleState {
    static modules = [
        'dashboard', 'registration', 'payment', 'exception',
        'finance', 'permission', 'config', 'logs',
        'query', 'visualization'
    ];

    static init() {
        if (!localStorage.getItem('moduleStates')) {
            const defaultStates = {};
            this.modules.forEach(module => {
                defaultStates[module] = {
                    lastVisit: null,
                    visitCount: 0,
                    favorite: false
                };
            });
            localStorage.setItem('moduleStates', JSON.stringify(defaultStates));
        }
    }

    static getState(moduleName) {
        const states = JSON.parse(localStorage.getItem('moduleStates'));
        return states[moduleName] || null;
    }

    static updateState(moduleName, updates) {
        const states = JSON.parse(localStorage.getItem('moduleStates'));
        if (states[moduleName]) {
            states[moduleName] = { ...states[moduleName], ...updates };
            localStorage.setItem('moduleStates', JSON.stringify(states));
        }
    }

    static toggleFavorite(moduleName) {
        const state = this.getState(moduleName);
        if (state) {
            this.updateState(moduleName, { favorite: !state.favorite });
        }
    }

    static getFavorites() {
        const states = JSON.parse(localStorage.getItem('moduleStates'));
        return Object.entries(states)
            .filter(([_, state]) => state.favorite)
            .map(([module]) => module);
    }
}

// 增强的用户设置管理
class UserSettings {
    static defaultSettings = {
        theme: 'light',
        fontSize: 'medium',
        language: 'zh-CN',
        notifications: true,
        shortcuts: ['registration', 'payment'],
        gridView: false
    };

    static init() {
        if (!localStorage.getItem('userSettings')) {
            localStorage.setItem('userSettings', JSON.stringify(this.defaultSettings));
        }
    }

    static getSettings() {
        return JSON.parse(localStorage.getItem('userSettings')) || this.defaultSettings;
    }

    static updateSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        localStorage.setItem('userSettings', JSON.stringify(settings));
        this.applySettings();
        return true;
    }

    static applySettings() {
        const settings = this.getSettings();
        
        // 应用主题
        document.documentElement.setAttribute('data-theme', settings.theme);
        
        // 应用字体大小
        const sizes = { small: '14px', medium: '16px', large: '18px' };
        document.documentElement.style.fontSize = sizes[settings.fontSize];
        
        // 应用网格视图
        if (settings.gridView) {
            document.body.classList.add('grid-view');
        } else {
            document.body.classList.remove('grid-view');
        }
    }

    static addShortcut(moduleName) {
        const settings = this.getSettings();
        if (!settings.shortcuts.includes(moduleName)) {
            settings.shortcuts.push(moduleName);
            localStorage.setItem('userSettings', JSON.stringify(settings));
        }
    }

    static removeShortcut(moduleName) {
        const settings = this.getSettings();
        settings.shortcuts = settings.shortcuts.filter(m => m !== moduleName);
        localStorage.setItem('userSettings', JSON.stringify(settings));
    }
}

// 数据缓存管理
class DataCache {
    static cache = new Map();
    static ttl = 5 * 60 * 1000; // 5分钟缓存时间

    static set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    static get(key) {
        const item = this.cache.get(key);
        if (item && Date.now() - item.timestamp < this.ttl) {
            return item.data;
        }
        return null;
    }

    static clear(key) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }
}

// 表单验证工具类
class FormValidator {
    static validate(formData, rules) {
        const errors = {};
        
        for (const field in rules) {
            const value = formData[field];
            const fieldRules = rules[field];
            
            for (const rule of fieldRules) {
                if (rule.required && !value) {
                    errors[field] = rule.message || '此字段为必填项';
                    break;
                }
                
                if (rule.pattern && !rule.pattern.test(value)) {
                    errors[field] = rule.message || '格式不正确';
                    break;
                }
                
                if (rule.minLength && value.length < rule.minLength) {
                    errors[field] = rule.message || `至少需要${rule.minLength}个字符`;
                    break;
                }
            }
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
}

// 初始化应用
function initApp() {
    // 初始化模块状态和用户设置
    ModuleState.init();
    UserSettings.init();
    
    // 检查登录状态
    if (!AuthService.checkLoginStatus()) return;
    
    // 应用用户设置
    UserSettings.applySettings();
    
    // 绑定全局事件
    bindGlobalEvents();
    
    // 更新当前模块状态
    const currentModule = window.location.pathname.split('/').pop().replace('.html', '');
    if (ModuleState.modules.includes(currentModule)) {
        ModuleState.updateState(currentModule, {
            lastVisit: new Date().toISOString(),
            visitCount: (ModuleState.getState(currentModule)?.visitCount || 0) + 1
        });
        sessionStorage.setItem('activeModule', currentModule);
    }
}

// 绑定全局事件
function bindGlobalEvents() {
    // 登出按钮
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', AuthService.logout);
    });
    
    // 主题切换
    document.querySelectorAll('.theme-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const currentTheme = UserSettings.getSettings().theme;
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            UserSettings.updateSetting('theme', newTheme);
        });
    });
    
    // 收藏模块
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const moduleName = this.dataset.module;
            ModuleState.toggleFavorite(moduleName);
            this.classList.toggle('active');
        });
    });
    
    // 快捷操作
    document.querySelectorAll('.shortcut-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const moduleName = this.dataset.module;
            const isShortcut = UserSettings.getSettings().shortcuts.includes(moduleName);
            
            if (isShortcut) {
                UserSettings.removeShortcut(moduleName);
                this.classList.remove('active');
            } else {
                UserSettings.addShortcut(moduleName);
                this.classList.add('active');
            }
        });
    });

    // 表单提交验证
    document.querySelectorAll('form[data-validate]').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {};
            const rules = JSON.parse(this.dataset.rules || '{}');
            
            Array.from(this.elements).forEach(element => {
                if (element.name) {
                    formData[element.name] = element.value;
                }
            });
            
            const { isValid, errors } = FormValidator.validate(formData, rules);
            
            if (isValid) {
                this.submit();
            } else {
                // 显示错误信息
                for (const field in errors) {
                    const errorElement = document.getElementById(`${field}-error`);
                    if (errorElement) {
                        errorElement.textContent = errors[field];
                        errorElement.style.display = 'block';
                    }
                }
            }
        });
    });

    // 批量操作按钮
    document.querySelectorAll('.batch-action-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.dataset.action;
            const selectedItems = Array.from(document.querySelectorAll('.item-checkbox:checked'))
                .map(checkbox => checkbox.value);
                
            if (selectedItems.length === 0) {
                showToast('请至少选择一项进行操作', 'warning');
                return;
            }
            
            if (action === 'delete') {
                if (confirm(`确定要删除选中的${selectedItems.length}项吗？`)) {
                    // 执行删除操作
                    showToast(`成功删除${selectedItems.length}项`, 'success');
                }
            } else {
                // 执行其他批量操作
                showToast(`已对${selectedItems.length}项执行${action}操作`, 'success');
            }
        });
    });
}

// 显示提示信息
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            ${type === 'success' ? '✓' : type === 'error' ? '✗' : 'i'}
        </div>
        <div class="toast-message">${message}</div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 导出功能
function exportData(data, type = 'csv', filename = 'data') {
    if (type === 'csv') {
        return exportToCSV(data, filename);
    } else if (type === 'excel') {
        return exportToExcel(data, filename);
    }
    return false;
}

// 初始化应用
document.addEventListener('DOMContentLoaded', initApp);

// 全局API
window.App = {
    Auth: AuthService,
    Modules: ModuleState,
    Settings: UserSettings,
    Cache: DataCache,
    Validator: FormValidator,
    exportData,
    showToast
};
