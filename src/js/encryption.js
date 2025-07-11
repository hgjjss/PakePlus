
// integrated_security_data_management_system_7053/frontend/js/encryption.js
/**
 * 数据加密模块
 * 使用Web Crypto API实现前端加密功能
 */

class EncryptionService {
    constructor() {
        this.keyStoragePrefix = 'enc_key_';
        this.algorithm = { name: 'AES-GCM', length: 256 };
        this.ivLength = 12; // 初始化向量长度
    }

    /**
     * 生成加密密钥
     * @returns {Promise<CryptoKey>} - 生成的密钥
     */
    async generateKey() {
        try {
            const key = await window.crypto.subtle.generateKey(
                this.algorithm,
                true, // 是否可导出
                ['encrypt', 'decrypt']
            );
            
            // 记录密钥生成事件
            this.logEncryptionEvent('key_generated');
            
            return key;
        } catch (error) {
            console.error('密钥生成失败:', error);
            throw new Error('密钥生成失败');
        }
    }

    /**
     * 导出密钥为可存储格式
     * @param {CryptoKey} key - 要导出的密钥
     * @returns {Promise<string>} - 导出的密钥字符串
     */
    async exportKey(key) {
        try {
            const exported = await window.crypto.subtle.exportKey('jwk', key);
            return JSON.stringify(exported);
        } catch (error) {
            console.error('密钥导出失败:', error);
            throw new Error('密钥导出失败');
        }
    }

    /**
     * 从存储格式导入密钥
     * @param {string} keyStr - 存储的密钥字符串
     * @returns {Promise<CryptoKey>} - 导入的密钥
     */
    async importKey(keyStr) {
        try {
            const keyData = JSON.parse(keyStr);
            return await window.crypto.subtle.importKey(
                'jwk',
                keyData,
                this.algorithm,
                true,
                ['encrypt', 'decrypt']
            );
        } catch (error) {
            console.error('密钥导入失败:', error);
            throw new Error('密钥导入失败');
        }
    }

    /**
     * 加密数据
     * @param {string} data - 要加密的数据
     * @param {CryptoKey} key - 加密密钥
     * @returns {Promise<{iv: string, encryptedData: string}>} - 加密结果(IV和加密数据)
     */
    async encryptData(data, key) {
        try {
            // 生成初始化向量
            const iv = window.crypto.getRandomValues(new Uint8Array(this.ivLength));
            
            // 加密数据
            const encoded = new TextEncoder().encode(data);
            const encrypted = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key,
                encoded
            );
            
            // 转换为可存储格式
            const encryptedArray = Array.from(new Uint8Array(encrypted));
            const encryptedStr = btoa(String.fromCharCode.apply(null, encryptedArray));
            const ivStr = btoa(String.fromCharCode.apply(null, iv));
            
            // 记录加密事件
            this.logEncryptionEvent('data_encrypted', data.length);
            
            return { iv: ivStr, encryptedData: encryptedStr };
        } catch (error) {
            console.error('数据加密失败:', error);
            throw new Error('数据加密失败');
        }
    }

    /**
     * 解密数据
     * @param {string} encryptedData - 加密的数据
     * @param {string} iv - 初始化向量
     * @param {CryptoKey} key - 解密密钥
     * @returns {Promise<string>} - 解密后的原始数据
     */
    async decryptData(encryptedData, iv, key) {
        try {
            // 转换格式
            const ivArray = new Uint8Array(atob(iv).split('').map(c => c.charCodeAt(0)));
            const encryptedArray = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
            
            // 解密数据
            const decrypted = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: ivArray },
                key,
                encryptedArray
            );
            
            const decoded = new TextDecoder().decode(decrypted);
            
            // 记录解密事件
            this.logEncryptionEvent('data_decrypted', decoded.length);
            
            return decoded;
        } catch (error) {
            console.error('数据解密失败:', error);
            throw new Error('数据解密失败');
        }
    }

    /**
     * 存储密钥到本地存储
     * @param {string} keyId - 密钥ID
     * @param {CryptoKey} key - 要存储的密钥
     * @returns {Promise<void>}
     */
    async storeKey(keyId, key) {
        try {
            const keyStr = await this.exportKey(key);
            localStorage.setItem(`${this.keyStoragePrefix}${keyId}`, keyStr);
            
            // 记录密钥存储事件
            this.logEncryptionEvent('key_stored', keyId);
        } catch (error) {
            console.error('密钥存储失败:', error);
            throw new Error('密钥存储失败');
        }
    }

    /**
     * 从本地存储获取密钥
     * @param {string} keyId - 密钥ID
     * @returns {Promise<CryptoKey>} - 获取的密钥
     */
    async getStoredKey(keyId) {
        try {
            const keyStr = localStorage.getItem(`${this.keyStoragePrefix}${keyId}`);
            if (!keyStr) {
                throw new Error('密钥不存在');
            }
            
            const key = await this.importKey(keyStr);
            
            // 记录密钥获取事件
            this.logEncryptionEvent('key_retrieved', keyId);
            
            return key;
        } catch (error) {
            console.error('获取存储的密钥失败:', error);
            throw new Error('获取存储的密钥失败');
        }
    }

    /**
     * 删除本地存储的密钥
     * @param {string} keyId - 密钥ID
     */
    deleteStoredKey(keyId) {
        localStorage.removeItem(`${this.keyStoragePrefix}${keyId}`);
        
        // 记录密钥删除事件
        this.logEncryptionEvent('key_deleted', keyId);
    }

    /**
     * 记录加密相关事件
     * @param {string} action - 事件类型
     * @param {any} details - 事件详情
     */
    logEncryptionEvent(action, details = null) {
        const logs = JSON.parse(localStorage.getItem('encryptionLogs') || '[]');
        const user = window.authService?.getCurrentUser()?.username || 'system';
        
        logs.push({
            action,
            user,
            timestamp: new Date().toISOString(),
            details
        });
        
        // 只保留最近1000条日志
        if (logs.length > 1000) {
            logs.splice(0, logs.length - 1000);
        }
        
        localStorage.setItem('encryptionLogs', JSON.stringify(logs));
    }

    /**
     * 获取加密日志
     * @returns {Array} - 加密日志数组
     */
    getEncryptionLogs() {
        return JSON.parse(localStorage.getItem('encryptionLogs') || '[]');
    }

    /**
     * 生成密钥对(非对称加密)
     * @returns {Promise<{publicKey: CryptoKey, privateKey: CryptoKey}>} - 生成的密钥对
     */
    async generateKeyPair() {
        try {
            const keyPair = await window.crypto.subtle.generateKey(
                {
                    name: 'RSA-OAEP',
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
                    hash: { name: 'SHA-256' }
                },
                true,
                ['encrypt', 'decrypt']
            );
            
            // 记录密钥对生成事件
            this.logEncryptionEvent('keypair_generated');
            
            return keyPair;
        } catch (error) {
            console.error('密钥对生成失败:', error);
            throw new Error('密钥对生成失败');
        }
    }

    /**
     * 使用公钥加密数据
     * @param {string} data - 要加密的数据
     * @param {CryptoKey} publicKey - 公钥
     * @returns {Promise<string>} - 加密后的数据
     */
    async encryptWithPublicKey(data, publicKey) {
        try {
            const encoded = new TextEncoder().encode(data);
            const encrypted = await window.crypto.subtle.encrypt(
                { name: 'RSA-OAEP' },
                publicKey,
                encoded
            );
            
            const encryptedArray = Array.from(new Uint8Array(encrypted));
            const encryptedStr = btoa(String.fromCharCode.apply(null, encryptedArray));
            
            // 记录公钥加密事件
            this.logEncryptionEvent('public_key_encrypt', data.length);
            
            return encryptedStr;
        } catch (error) {
            console.error('公钥加密失败:', error);
            throw new Error('公钥加密失败');
        }
    }

    /**
     * 使用私钥解密数据
     * @param {string} encryptedData - 加密的数据
     * @param {CryptoKey} privateKey - 私钥
     * @returns {Promise<string>} - 解密后的原始数据
     */
    async decryptWithPrivateKey(encryptedData, privateKey) {
        try {
            const encryptedArray = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
            
            const decrypted = await window.crypto.subtle.decrypt(
                { name: 'RSA-OAEP' },
                privateKey,
                encryptedArray
            );
            
            const decoded = new TextDecoder().decode(decrypted);
            
            // 记录私钥解密事件
            this.logEncryptionEvent('private_key_decrypt', decoded.length);
            
            return decoded;
        } catch (error) {
            console.error('私钥解密失败:', error);
            throw new Error('私钥解密失败');
        }
    }

    /**
     * 生成数据哈希值
     * @param {string} data - 要哈希的数据
     * @param {string} algorithm - 哈希算法(默认SHA-256)
     * @returns {Promise<string>} - 哈希值(十六进制字符串)
     */
    async generateHash(data, algorithm = 'SHA-256') {
        try {
            const encoded = new TextEncoder().encode(data);
            const hashBuffer = await window.crypto.subtle.digest(algorithm, encoded);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            // 记录哈希生成事件
            this.logEncryptionEvent('hash_generated', algorithm);
            
            return hashHex;
        } catch (error) {
            console.error('哈希生成失败:', error);
            throw new Error('哈希生成失败');
        }
    }
}

// 创建加密服务实例
const encryptionService = new EncryptionService();

// 导出为全局变量
window.encryptionService = encryptionService;

// DOMContentLoaded事件处理
document.addEventListener('DOMContentLoaded', () => {
    // 初始化加密日志存储
    if (!localStorage.getItem('encryptionLogs')) {
        localStorage.setItem('encryptionLogs', JSON.stringify([]));
    }
    
    console.log('数据加密模块初始化完成');
});
