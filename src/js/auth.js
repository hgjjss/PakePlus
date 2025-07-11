
// integrated_security_data_management_system_7053/frontend/js/auth.js
/**
 * 身份认证模块 - 用户登录、注册、权限控制
 * 使用localStorage模拟用户数据库
 */

// 用户角色定义
const ROLES = {
    ADMIN: 'admin',
    USER: 'user',
    AUDITOR: 'auditor',
    OPERATOR: 'operator'
};

// 权限定义
const PERMISSIONS = {
    DATA_MANAGEMENT: 'data_management',
    DATA_ENCRYPTION: 'data_encryption',
    AUDIT_LOG: 'audit_log',
    BACKUP_RESTORE: 'backup_restore',
    SYSTEM_SETTINGS: 'system_settings',
    USER_MANAGEMENT: 'user_management'
};

// 角色权限映射
const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: [
        PERMISSIONS.DATA_MANAGEMENT,
        PERMISSIONS.DATA_ENCRYPTION,
        PERMISSIONS.AUDIT_LOG,
        PERMISSIONS.BACKUP_RESTORE,
        PERMISSIONS.SYSTEM_SETTINGS,
        PERMISSIONS.USER_MANAGEMENT
    ],
    [ROLES.USER]: [
        PERMISSIONS.DATA_MANAGEMENT,
        PERMISSIONS.DATA_ENCRYPTION
    ],
    [ROLES.AUDITOR]: [
        PERMISSIONS.AUDIT_LOG
    ],
    [ROLES.OPERATOR]: [
        PERMISSIONS.DATA_MANAGEMENT,
        PERMISSIONS.BACKUP_RESTORE
    ]
};

// 初始化用户数据库
function initUserDatabase() {
    if (!localStorage.getItem('users')) {
        const defaultUsers = [
            {
                id: 1,
                username: 'admin',
                email: 'admin@example.com',
                password: 'Admin@123', // 注意: 实际项目中应存储哈希值而非明文密码
                role: ROLES.ADMIN,
                isActive: true,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                mfaEnabled: false
            },
            {
                id: 2,
                username: 'user1',
                email: 'user1@example.com',
                password: 'User@123',
                role: ROLES.USER,
                isActive: true,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                mfaEnabled: false
            }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
}

// 用户注册
function registerUser(username, email, password, confirmPassword) {
    // 验证输入
    if (!username || !email || !password || !confirmPassword) {
        return { success: false, message: '请填写所有字段' };
    }

    if (password !== confirmPassword) {
        return { success: false, message: '两次输入的密码不一致' };
    }

    if (password.length < 8) {
        return { success: false, message: '密码长度不能少于8位' };
    }

    // 检查用户名和邮箱是否已存在
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userExists = users.some(u => u.username === username);
    const emailExists = users.some(u => u.email === email);

    if (userExists) {
        return { success: false, message: '用户名已存在' };
    }

    if (emailExists) {
        return { success: false, message: '邮箱已被注册' };
    }

    // 创建新用户
    const newUser = {
        id: Date.now(),
        username,
        email,
        password, // 注意: 实际项目中应存储哈希值而非明文密码
        role: ROLES.USER,
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        mfaEnabled: false
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    return { success: true, message: '注册成功' };
}

// 用户登录
function loginUser(username, password, rememberMe = false) {
    // 验证输入
    if (!username || !password) {
        return { success: false, message: '请输入用户名和密码' };
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return { success: false, message: '用户名或密码错误' };
    }

    if (!user.isActive) {
        return { success: false, message: '账户已被禁用，请联系管理员' };
    }

    // 更新最后登录时间
    user.lastLogin = new Date().toISOString();
    localStorage.setItem('users', JSON.stringify(users));

    // 存储当前用户信息
    const currentUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        mfaEnabled: user.mfaEnabled
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // 记住我功能
    if (rememberMe) {
        localStorage.setItem('rememberedUser', username);
    } else {
        localStorage.removeItem('rememberedUser');
    }

    return { success: true, message: '登录成功', user: currentUser };
}

// 用户登出
function logoutUser() {
    localStorage.removeItem('currentUser');
    return { success: true, message: '已退出登录' };
}

// 获取当前用户
function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

// 检查用户是否登录
function isLoggedIn() {
    return !!getCurrentUser();
}

// 检查用户角色
function hasRole(role) {
    const user = getCurrentUser();
    return user && user.role === role;
}

// 检查用户权限
function hasPermission(permission) {
    const user = getCurrentUser();
    if (!user) return false;
    
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(permission);
}

// 更新用户信息
function updateUserProfile(userId, updates) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return { success: false, message: '用户不存在' };
    }

    // 不允许更新某些字段
    const { id, role, isActive, ...safeUpdates } = updates;

    users[userIndex] = {
        ...users[userIndex],
        ...safeUpdates,
        updatedAt: new Date().toISOString()
    };

    localStorage.setItem('users', JSON.stringify(users));

    // 如果更新的是当前用户，更新localStorage
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
        localStorage.setItem('currentUser', JSON.stringify({
            ...currentUser,
            username: users[userIndex].username,
            email: users[userIndex].email
        }));
    }

    return { success: true, message: '用户信息更新成功' };
}

// 更改密码
function changePassword(userId, oldPassword, newPassword) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return { success: false, message: '用户不存在' };
    }

    if (users[userIndex].password !== oldPassword) {
        return { success: false, message: '旧密码不正确' };
    }

    if (newPassword.length < 8) {
        return { success: false, message: '新密码长度不能少于8位' };
    }

    users[userIndex].password = newPassword;
    users[userIndex].updatedAt = new Date().toISOString();
    localStorage.setItem('users', JSON.stringify(users));

    return { success: true, message: '密码修改成功' };
}

// 管理员功能: 获取所有用户
function getAllUsers() {
    if (!hasRole(ROLES.ADMIN)) {
        return { success: false, message: '无权访问此功能' };
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    // 返回时不包含密码
    const sanitizedUsers = users.map(({ password, ...user }) => user);
    return { success: true, users: sanitizedUsers };
}

// 管理员功能: 更新用户状态
function updateUserStatus(userId, isActive) {
    if (!hasRole(ROLES.ADMIN)) {
        return { success: false, message: '无权访问此功能' };
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return { success: false, message: '用户不存在' };
    }

    users[userIndex].isActive = isActive;
    users[userIndex].updatedAt = new Date().toISOString();
    localStorage.setItem('users', JSON.stringify(users));

    // 如果禁用的是当前用户，强制登出
    const currentUser = getCurrentUser();
    if (!isActive && currentUser && currentUser.id === userId) {
        logoutUser();
    }

    return { success: true, message: '用户状态更新成功' };
}

// 管理员功能: 更改用户角色
function updateUserRole(userId, role) {
    if (!hasRole(ROLES.ADMIN)) {
        return { success: false, message: '无权访问此功能' };
    }

    if (!Object.values(ROLES).includes(role)) {
        return { success: false, message: '无效的角色' };
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return { success: false, message: '用户不存在' };
    }

    users[userIndex].role = role;
    users[userIndex].updatedAt = new Date().toISOString();
    localStorage.setItem('users', JSON.stringify(users));

    // 如果更改的是当前用户，更新localStorage
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
        localStorage.setItem('currentUser', JSON.stringify({
            ...currentUser,
            role: role
        }));
    }

    return { success: true, message: '用户角色更新成功' };
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initUserDatabase();
});

// 导出API
export {
    ROLES,
    PERMISSIONS,
    initUserDatabase,
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    isLoggedIn,
    hasRole,
    hasPermission,
    updateUserProfile,
    changePassword,
    getAllUsers,
    updateUserStatus,
    updateUserRole
};
