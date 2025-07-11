
// report_auto_generation_analysis_system/frontend/js/user_management.js
class UserManager {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.roles = {
            admin: ['data_collection', 'report_generation', 'data_analysis', 'data_visualization', 'user_management'],
            analyst: ['data_collection', 'report_generation', 'data_analysis', 'data_visualization'],
            viewer: ['data_analysis', 'data_visualization']
        };
    }

    // 加载用户数据
    loadUsers() {
        try {
            const users = localStorage.getItem('users');
            return users ? JSON.parse(users) : [];
        } catch (e) {
            console.error('加载用户数据失败:', e);
            return [];
        }
    }

    // 保存用户数据
    saveUsers() {
        try {
            localStorage.setItem('users', JSON.stringify(this.users));
            return true;
        } catch (e) {
            console.error('保存用户数据失败:', e);
            return false;
        }
    }

    // 注册新用户
    register(username, password, role = 'viewer') {
        if (!username || !password) {
            throw new Error('用户名和密码不能为空');
        }

        if (this.users.some(u => u.username === username)) {
            throw new Error('用户名已存在');
        }

        if (!this.roles[role]) {
            throw new Error('无效的用户角色');
        }

        const newUser = {
            username,
            password: this.hashPassword(password),
            role,
            createdAt: new Date().toISOString()
        };

        this.users.push(newUser);
        this.saveUsers();
        return newUser;
    }

    // 用户登录
    login(username, password) {
        const user = this.users.find(u => u.username === username);
        
        if (!user || user.password !== this.hashPassword(password)) {
            throw new Error('用户名或密码错误');
        }

        this.currentUser = user;
        this.saveCurrentUser();
        return user;
    }

    // 保存当前用户
    saveCurrentUser() {
        try {
            if (this.currentUser) {
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            }
        } catch (e) {
            console.error('保存当前用户失败:', e);
        }
    }

    // 加载当前用户
    loadCurrentUser() {
        try {
            const user = localStorage.getItem('currentUser');
            if (user) {
                this.currentUser = JSON.parse(user);
            }
            return this.currentUser;
        } catch (e) {
            console.error('加载当前用户失败:', e);
            return null;
        }
    }

    // 用户注销
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }

    // 检查权限
    hasPermission(permission) {
        if (!this.currentUser) return false;
        return this.roles[this.currentUser.role].includes(permission);
    }

    // 密码哈希
    hashPassword(password) {
        // 简单哈希，实际应用中应使用更安全的哈希算法
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    // 获取所有用户（仅管理员）
    getAllUsers() {
        if (!this.currentUser || this.currentUser.role !== 'admin') {
            throw new Error('无权访问');
        }
        return [...this.users];
    }

    // 更新用户角色（仅管理员）
    updateUserRole(username, newRole) {
        if (!this.currentUser || this.currentUser.role !== 'admin') {
            throw new Error('无权访问');
        }

        if (!this.roles[newRole]) {
            throw new Error('无效的用户角色');
        }

        const userIndex = this.users.findIndex(u => u.username === username);
        if (userIndex === -1) {
            throw new Error('用户不存在');
        }

        this.users[userIndex].role = newRole;
        this.saveUsers();
        return this.users[userIndex];
    }

    // 删除用户（仅管理员）
    deleteUser(username) {
        if (!this.currentUser || this.currentUser.role !== 'admin') {
            throw new Error('无权访问');
        }

        const userIndex = this.users.findIndex(u => u.username === username);
        if (userIndex === -1) {
            throw new Error('用户不存在');
        }

        const deletedUser = this.users.splice(userIndex, 1)[0];
        this.saveUsers();
        return deletedUser;
    }
}

// 导出单例实例
const userManager = new UserManager();
export default userManager;
