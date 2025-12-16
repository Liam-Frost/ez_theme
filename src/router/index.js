/**
 * 路由配置
 */
import { createRouter, createWebHashHistory } from 'vue-router';
import { SITE_CONFIG, DEFAULT_CONFIG, isBrowserRestricted, TRAFFICLOG_CONFIG, isXiaoV2board, AUTH_LAYOUT_CONFIG } from '@/utils/baseConfig';
import i18n from '@/i18n';
import pageCache from '@/utils/pageCache';

// 路由懒加载
const LandingPage = () => import('@/views/landing/LandingPage.vue');
const CustomLandingPage = () => import('@/views/landing/CustomLandingPage.vue');
const ApiValidation = () => import('@/views/errors/ApiValidation.vue');

// 动态根据配置选择登录页面布局
const getAuthComponent = (componentName) => {
  const layoutType = AUTH_LAYOUT_CONFIG?.layoutType || 'center';
  return () => import(`@/views/auth/${layoutType}/${componentName}.vue`);
};

const Login = getAuthComponent('Login');
const Register = getAuthComponent('Register');
const ForgotPassword = getAuthComponent('ForgotPassword');
const Dashboard = () => import('@/views/dashboard/Dashboard.vue');
const MainBoard = () => import('@/views/layout/MainBoard.vue');
const Profile = () => import('@/views/profile/UserProfile.vue');
const BrowserRestricted = () => import('@/views/errors/BrowserRestricted.vue');
const NotFound = () => import('@/views/errors/NotFound.vue');
const CustomerService = () => import('@/views/service/CustomerService.vue');

const routes = [
  {
    path: '/',
    redirect: DEFAULT_CONFIG.enableLandingPage ? '/landing' : '/login'
  },
  {
    path: '/api-validation',
    name: 'ApiValidation',
    component: ApiValidation,
    meta: {
      titleKey: 'common.apiChecking',
      requiresAuth: false
    }
  },
  {
    path: '/landing',
    name: 'Landing',
    component: getCustomOrDefaultLandingPage(),
    meta: {
      titleKey: 'landing.mainText',
      requiresAuth: false
    },
    beforeEnter: (to, from, next) => {
      // 如果禁用了落地页，则重定向到登录页
      if (!DEFAULT_CONFIG.enableLandingPage) {
        next('/login');
      } else {
        next();
      }
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      titleKey: 'common.login',
      requiresAuth: false
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: {
      titleKey: 'common.register',
      requiresAuth: false,
      keepAlive: true
    }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: {
      titleKey: 'common.forgotPassword',
      requiresAuth: false,
      keepAlive: true
    }
  },
  {
    path: '/browser-restricted',
    name: 'BrowserRestricted',
    component: BrowserRestricted,
    meta: {
      titleKey: 'errors.browserRestricted',
      requiresAuth: false
    }
  },
  {
    path: '/customer-service',
    name: 'CustomerService',
    component: CustomerService,
    meta: {
      titleKey: 'service.title',
      requiresAuth: false // 不需要登录也可以访问客服页面
    }
  },
  {
    path: '/',
    component: MainBoard,
    meta: { 
      requiresAuth: true 
    },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: {
          titleKey: 'menu.dashboard',
          requiresAuth: true,
          keepAlive: true
        }
      },
      {
        path: 'shop',
        name: 'Shop',
        component: () => import('@/views/shop/Shop.vue'),
        meta: {
          titleKey: 'menu.shop',
          requiresAuth: true,
          keepAlive: true
        }
      },
      {
        path: 'order-confirm',
        name: 'OrderConfirm',
        component: () => import('@/views/shop/OrderConfirm.vue'),
        meta: {
          titleKey: 'orders.confirmOrder',
          requiresAuth: true,
          activeNav: 'Shop' // 激活顶部菜单的"商店"标签
        }
      },
      {
        path: 'payment',
        name: 'Payment',
        component: () => import('@/views/shop/Payment.vue'),
        meta: {
          titleKey: 'orders.payment',
          requiresAuth: true,
          activeNav: 'Shop' // 激活顶部菜单的"商店"标签
        }
      },
      {
        path: 'invite',
        name: 'Invite',
        component: () => import('@/views/invite/Invite.vue'),
        meta: {
          titleKey: 'menu.invite',
          requiresAuth: true,
          keepAlive: true
        }
      },
      {
        path: 'more',
        name: 'More',
        component: () => import('@/views/more/MoreOptions.vue'),
        meta: {
          titleKey: 'menu.more',
          requiresAuth: true
        }
      },
      {
        path: 'docs',
        name: 'Docs',
        component: () => import('@/views/docs/DocsPage.vue'),
        meta: {
          titleKey: 'more.viewHelp',
          requiresAuth: true,
          activeNav: 'More' // 激活"更多"菜单
        }
      },
      {
        path: 'docs/:id',
        name: 'DocDetail',
        component: () => import('@/views/docs/DocDetail.vue'),
        meta: {
          titleKey: 'more.viewHelp',
          requiresAuth: true,
          activeNav: 'More' // 激活"更多"菜单
        }
      },
      {
        path: 'nodes',
        name: 'NodeList',
        component: () => import('@/views/servers/NodeList.vue'),
        meta: {
          titleKey: 'nodes.title',
          requiresAuth: true,
          activeNav: 'More' // 激活"更多"菜单
        }
      },
      {
        path: 'orders',
        name: 'OrderList',
        component: () => import('@/views/orders/OrderList.vue'),
        meta: {
          titleKey: 'orders.title',
          requiresAuth: true,
          activeNav: 'More' // 激活"更多"菜单
        }
      },
      {
        path: 'tickets',
        name: 'TicketList',
        component: () => import('@/views/ticket/TicketList.vue'),
        meta: {
          titleKey: 'tickets.title',
          requiresAuth: true,
          activeNav: 'More' // 激活"更多"菜单
        }
      },
      // 手机工单页面
      {
        path: 'mobile/tickets',
        name: 'MobileTickets',
        component: () => import('@/views/ticket/MobileTicketList.vue'),
        meta: {
          titleKey: 'tickets.title',
          requiresAuth: true,
          activeNav: 'More' // 激活"更多"菜单
        }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: Profile,
        meta: {
          titleKey: 'profile.title',
          requiresAuth: true,
          activeNav: 'More' // 激活"更多"菜单
        }
      },
      {
        path: 'trafficlog',
        name: 'TrafficLog',
        component: () => import('@/views/trafficLog/TrafficLog.vue'),
        meta: {
          titleKey: 'trafficLog.title',
          requiresAuth: true,
          activeNav: 'More' // 激活"更多"菜单
        },
        beforeEnter: (to, from, next) => {
          // 如果禁用了流量明细页面，则重定向到首页
          if (!TRAFFICLOG_CONFIG.enableTrafficLog) {
            next('/dashboard');
          } else {
            next();
          }
        }
      },
      {
        path: 'wallet/deposit',
        name: 'Deposit',
        component: () => import('@/views/wallet/WalletDeposit.vue'),
        meta: {
          titleKey: 'wallet.deposit.title',
          requiresAuth: true,
          activeNav: 'More' // 激活"更多"菜单
        },
        beforeEnter: (to, from, next) => {
          // 如果不是Xiao-V2board面板，则重定向到仪表盘
          if (!isXiaoV2board()) {
            next('/dashboard');
          } else {
            next();
          }
        }
      }
    ]
  },
  // 404 路由，需放在路由列表最后
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: {
      titleKey: 'errors.notFound',
      requiresAuth: false
    }
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  // 浏览器限制检查
  if (to.name !== 'BrowserRestricted' && isBrowserRestricted()) {
    next({ name: 'BrowserRestricted' });
    return;
  }
  
  // API可用性检查 - 在任何路由跳转前先检查API可用性
  // 如果需要API检测且不是前往API验证页面，则先重定向到API验证页面
  const { shouldCheckApiAvailability } = await import('@/utils/apiAvailabilityChecker');
  if (shouldCheckApiAvailability() && to.name !== 'ApiValidation') {
    // 检查是否已有可用的API URL
    const availableUrl = sessionStorage.getItem('ez_api_available_url');
    if (!availableUrl) {
      // 没有可用URL，需要进行检测
      // Preserve all current query params when jumping to ApiValidation so they can be passed back later
      const apiRedirectQuery = {
        redirect: to.path,
        ...to.query
      };
      next({ 
        name: 'ApiValidation',
        query: apiRedirectQuery
      });
      return;
    }
    // 有可用URL，继续正常路由
  }
  
  // 设置页面标题 - 使用i18n翻译标题
  const getTitle = () => {
    if (to.meta.titleKey) {
      try {
        const title = i18n.global.t(to.meta.titleKey);
        return `${title} - ${SITE_CONFIG.siteName}`;
      } catch (error) {
        // 安静地处理错误
        return SITE_CONFIG.siteName;
      }
    }
    return SITE_CONFIG.siteName;
  };
  
  document.title = getTitle();
  
  // 检查是否需要登录
  const token = localStorage.getItem('token');
  
  // 检查是否在登录状态发生变化的路由间跳转
  // 例如：从需要登录的页面到不需要登录的页面，或相反
  const loginStatusChanged = 
    (from.meta.requiresAuth && !to.meta.requiresAuth) || 
    (!from.meta.requiresAuth && to.meta.requiresAuth);
  
  if (loginStatusChanged) {
    // 如果登录状态发生变化，确保i18n消息被重新加载
    try {
      const { reloadMessages } = await import('@/i18n');
      await reloadMessages();
    } catch (error) {
      // 安静地处理错误
    }
  }
  
  if (to.meta.requiresAuth && !token) {
    next({ name: 'Login' });
  } else if (to.path === '/login' && token) {
    next({ path: '/dashboard' });
  } else {
    // 确保路由切换平滑
    document.body.classList.add('page-transitioning');
    
    // 处理页面缓存
    if (to.meta.keepAlive && to.name) {
      pageCache.addRouteToCache(to.name);
    } else if (to.name && to.meta.keepAlive === false) {
      pageCache.removeRouteFromCache(to.name);
    }
    
    next();
  }
});

// 全局后置钩子
router.afterEach(() => {
  // 短暂延迟，确保过渡动画完成
  setTimeout(() => {
    document.body.classList.remove('page-transitioning');
  }, 400);
});

// 根据配置决定使用自定义landing page还是默认landing page
function getCustomOrDefaultLandingPage() {
  // 如果没有设置自定义landing page，直接返回默认landing page
  if (!SITE_CONFIG.customLandingPage) {
    return LandingPage;
  }
  // 无需在路由阶段验证授权，组件内部已处理授权逻辑
  return CustomLandingPage;
}

export default router; 