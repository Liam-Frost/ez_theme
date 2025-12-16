/**
 * 令牌验证登录功能
 * 用于处理通过URL参数verify进行的自动登录
 */

import { useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useI18n } from 'vue-i18n';
import NProgress from 'nprogress';
import { tokenLogin, handleLoginSuccess } from '@/api/auth';
import { handleRedirectPath } from '@/utils/redirectHandler';

// 存储URL参数的全局变量，在页面加载时立即捕获
const initialUrlParams = {
  verifyToken: null,
  redirectPath: null,
  originalUrl: ''
};

// 在模块加载时立即执行，捕获原始URL参数
(function captureInitialUrlParams() {
  try {
    // 保存原始URL
    initialUrlParams.originalUrl = window.location.href;
    
    // 从URL哈希部分提取参数
    const hashPart = window.location.hash || '';
    
    // 处理 #/path?param=value 格式
    if (hashPart.includes('?')) {
      const queryPart = hashPart.split('?')[1];
      if (queryPart) {
        const params = new URLSearchParams(queryPart);
        initialUrlParams.verifyToken = params.get('verify');
        initialUrlParams.redirectPath = params.get('redirect');
      }
    }
    
    // 如果在哈希部分未找到参数，则从查询字符串提取
    if (!initialUrlParams.verifyToken) {
      const queryParams = new URLSearchParams(window.location.search);
      initialUrlParams.verifyToken = queryParams.get('verify');
      initialUrlParams.redirectPath = queryParams.get('redirect');
    }
    
    // console.log('页面加载时捕获的URL参数:', initialUrlParams);
  } catch (error) {
    // console.error('捕获初始URL参数时出错:', error);
  }
})();

/**
 * 处理令牌验证登录
 * @param {Object} options - 配置选项
 * @param {Function} options.onLoginSuccess - 登录成功后的回调函数
 * @returns {Promise<Object>} 登录结果对象
 */
export const handleTokenLogin = async (options = {}) => {
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useI18n();
  
  // 优先使用页面加载时捕获的参数，如果没有再尝试从当前URL获取
  let verifyToken = initialUrlParams.verifyToken;
  let redirectPath = initialUrlParams.redirectPath;
  
  // 如果没有找到初始参数，尝试从当前URL获取（可能已经被Vue Router处理过）
  if (!verifyToken) {
    // 从URL哈希部分提取参数 - 考虑两种可能的格式: #/login?verify=xxx 和 #/login/?verify=xxx
    let hashPart = window.location.hash;
    let hashParams = new URLSearchParams();
    
    // 处理 #/path?param=value 格式
    if (hashPart.includes('?')) {
      hashParams = new URLSearchParams(hashPart.split('?')[1] || '');
    }
    
    // 处理 #/path/?param=value 格式
    const hashPathParts = hashPart.split('/');
    const lastPathPart = hashPathParts[hashPathParts.length - 1];
    if (lastPathPart && lastPathPart.includes('?')) {
      hashParams = new URLSearchParams(lastPathPart.split('?')[1] || '');
    }
    
    verifyToken = hashParams.get('verify');
    redirectPath = hashParams.get('redirect');
    
    // 如果在哈希部分未找到参数，则从查询字符串提取
    if (!verifyToken) {
      const queryParams = new URLSearchParams(window.location.search);
      verifyToken = queryParams.get('verify');
      redirectPath = queryParams.get('redirect');
    }
  }
  
  // console.log('处理令牌登录使用的参数:', { verifyToken, redirectPath, initialParams: initialUrlParams });
  
  // 设置默认的重定向路径
  redirectPath = redirectPath || '/dashboard';
  
  // 如果没有验证令牌，直接返回
  if (!verifyToken) {
    return { success: false, verified: false };
  }
  
  // 显示加载进度条
  NProgress.start();
  
  try {
    // 调用验证令牌登录API
    const response = await tokenLogin(verifyToken, redirectPath);
    
    // 验证成功，返回格式为 { data: { token, auth_data }, message: "..." }
    if (response.data && (response.data.token || response.data.auth_data)) {
      // 显示成功消息，优先使用API返回的message
      showToast(response.message || t('auth.verifyTokenSuccess'), 'success');
      
      // 处理登录成功后的认证数据存储 (类似于普通登录)
      // 将token和auth_data存入cookie和localStorage，24小时有效期
      const loginResult = handleLoginSuccess(response.data, false); // false表示不是"记住我"登录，使用24小时有效期
      
      if (!loginResult.success) {
        // console.error('令牌登录认证数据处理失败', loginResult.error);
      }
      
      // 使用重定向处理工具函数处理路径
      const targetPath = handleRedirectPath(redirectPath);
      
      // 登录成功回调
      if (options.onLoginSuccess && typeof options.onLoginSuccess === 'function') {
        options.onLoginSuccess();
      }
      
      // 延迟跳转，让消息有时间显示
      setTimeout(() => {
        router.push(targetPath);
      }, 500);
      
      return { success: true, verified: true, redirectPath: targetPath };
    } else {
      // 验证失败但API正常响应
      showToast(t('auth.verifyTokenFailed'), 'error');
      return { success: false, verified: true, error: t('auth.verifyTokenFailed') };
    }
  } catch (error) {
    // API请求错误
    // console.error('Token verification failed', error);
    // 优先使用国际化翻译，而不是API返回的错误消息
    showToast(t('auth.verifyTokenFailed'), 'error');
    return { 
      success: false, 
      verified: true, 
      error: t('auth.verifyTokenFailed')
    };
  } finally {
    // 完成加载进度条
    NProgress.done();
  }
};

/**
 * 检查URL中是否包含验证令牌
 * @returns {Boolean} 是否包含验证令牌
 */
export const hasVerifyToken = () => {
  // 优先检查页面加载时捕获的参数
  if (initialUrlParams.verifyToken) {
    return true;
  }
  
  // 从URL哈希部分提取参数 - 考虑两种可能的格式: #/login?verify=xxx 和 #/login/?verify=xxx
  let hashPart = window.location.hash;
  let hashParams = new URLSearchParams();
  
  // 处理 #/path?param=value 格式
  if (hashPart.includes('?')) {
    hashParams = new URLSearchParams(hashPart.split('?')[1] || '');
  }
  
  // 处理 #/path/?param=value 格式
  const hashPathParts = hashPart.split('/');
  const lastPathPart = hashPathParts[hashPathParts.length - 1];
  if (lastPathPart && lastPathPart.includes('?')) {
    hashParams = new URLSearchParams(lastPathPart.split('?')[1] || '');
  }
  
  // 从查询字符串提取参数
  const queryParams = new URLSearchParams(window.location.search);
  
  // 调试输出
  // console.log('URL参数检查:', {
  //   hashParams: Object.fromEntries(hashParams.entries()),
  //   queryParams: Object.fromEntries(queryParams.entries()),
  //   hasVerifyInHash: hashParams.has('verify'),
  //   hasVerifyInQuery: queryParams.has('verify'),
  //   fullUrl: window.location.href,
  //   hashPart: hashPart,
  //   initialParams: initialUrlParams
  // });
  
  // 如果在任一位置找到verify参数，则返回true
  return hashParams.has('verify') || queryParams.has('verify') || !!initialUrlParams.verifyToken;
}; 