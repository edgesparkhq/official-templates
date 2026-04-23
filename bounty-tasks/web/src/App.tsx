import React, { useState, useEffect, useRef, lazy, Suspense, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, LogOut, X } from 'lucide-react';
import BountyIntroduction from './components/BountyIntroduction';
import { AlertModalProvider } from './components/AlertModalProvider';
import { UserInfo, Task, Submission } from './types';
import { client } from "@/lib/edgespark";

// 懒加载大型组件，带预加载策略
const TasksTab = lazy(() => import('./components/TasksTab'));
const SubmissionsTab = lazy(() => 
  import('./components/SubmissionsTab').then(module => {
    // 预加载相关组件
    import('./components/ProfileTab');
    return module;
  })
);
const AdminTab = lazy(() => import('./components/AdminTab'));
const ProfileTab = lazy(() => import('./components/ProfileTab'));

// 预加载策略：在空闲时间预加载组件
if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
  const preloadComponents = () => {
    // 预加载非关键组件
    import('./components/SubmissionsTab');
    import('./components/ProfileTab');
    // 延迟预加载管理员组件
    setTimeout(() => {
      import('./components/AdminTab');
    }, 2000);
  };
  
  window.requestIdleCallback?.(preloadComponents, { timeout: 1000 });
}

function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('tasks');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const authContainerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!authOpen || !authContainerRef.current) return;
    const mounted = client.authUI.mount(authContainerRef.current, {
      onSuccess: () => {
        setAuthOpen(false);
        fetchUserInfo();
      },
    });
    return () => {
      mounted.destroy();
    };
  }, [authOpen]);

  const handleSignOut = useCallback(async () => {
    try {
      await client.auth.signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
    setUserInfo(null);
  }, []);

  // Fetch user info
  useEffect(() => {
    fetchUserInfo();
  }, []);

  // Fetch tasks and admin status when user info is available
  useEffect(() => {
    if (userInfo) {
      fetchTasks();
      setIsAdmin(!!userInfo.isAdmin);
      fetchUserSubmissions();
      fetchUnreadNotificationCount();
    } else {
      setIsAdmin(false);
    }
  }, [userInfo]);

  // Fetch unread notification count periodically
  useEffect(() => {
    if (userInfo) {
      const interval = setInterval(fetchUnreadNotificationCount, 30000); // 每30秒检查一次
      return () => clearInterval(interval);
    }
  }, [userInfo]);

  const fetchUserInfo = useCallback(async () => {
    try {
      const response = await client.api.fetch('/api/public/me');
      const result = await response.json();

      if (result.success && result.user) {
        setUserInfo(result.user);
      } else {
        setUserInfo(null);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      setUserInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      console.log('Fetching all tasks...');
      // Fetch all tasks by setting a very large limit for admin purposes
      // Use 10000 to ensure we get all tasks even if there are many more than 1000
      const response = await client.api.fetch('/api/public/tasks?limit=10000');
      
      console.log('API response status:', response.status);
      console.log('API response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API response data:', result);
      
      if (result.success) {
        console.log('Tasks fetched successfully:', result.tasks.length);
        console.log('Sample tasks:', result.tasks.slice(0, 3));
        setTasks(result.tasks);
      } else {
        console.error('Failed to fetch tasks:', result);
        // 如果API返回错误，设置空数组避免界面崩溃
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      // 如果请求完全失败，设置空数组
      setTasks([]);
    }
  }, []);

  const fetchUserSubmissions = useCallback(async () => {
    try {
      const response = await client.api.fetch('/api/public/submissions');
      const result = await response.json();

      if (result.success) {
        setSubmissions(result.submissions);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  }, []);

  const fetchUnreadNotificationCount = async () => {
    try {
      const response = await client.api.fetch('/api/notifications/unread-count');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, url: ${response.url}`);
      }

      const result = await response.json();

      if (result.success) {
        setUnreadNotificationCount(result.unreadCount);
      } else {
        console.error('API returned error:', result.error);
        // Set count to 0 if there's an API error but don't show error to user
        setUnreadNotificationCount(0);
      }
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      // Set count to 0 as fallback - don't break the UI
      setUnreadNotificationCount(0);
    }
  };

  const refreshData = useCallback(() => {
    fetchTasks();
    fetchUserSubmissions();
    fetchUnreadNotificationCount();
  }, [fetchTasks, fetchUserSubmissions, fetchUnreadNotificationCount]);

  const changeLanguage = useCallback(async (language: string) => {
    // 显示加载状态（如果需要）
    try {
      await i18n.changeLanguage(language);
    } catch (error) {
      console.error('Language change failed:', error);
    }
  }, [i18n]);

  // 优化语言选项，避免重复渲染
  const languageOptions = useMemo(() => [
    { value: 'en', label: 'English' },
    { value: 'ja', label: '日本語' },
    { value: 'zh', label: '中文' },
    { value: 'ko', label: '한국어' },
    { value: 'es', label: 'Español' },
    { value: 'pt', label: 'Português' }
  ], []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg text-textSecondary font-body">{t('app.loading')}</div>
      </div>
    );
  }

  return (
    <AlertModalProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
      <header className="sticky top-0 z-50 bg-surface shadow-level1 border-b border-border">
        <div className="max-w-7xl mx-auto px-lg sm:px-xl lg:px-2xl">
          <div className="flex justify-between items-center py-md">
            <h1 className="text-2xl font-heading font-bold text-textPrimary">{t('app.title')}</h1>
            <div className="flex items-center gap-lg">
              {/* Language Selector */}
              <div className="flex items-center gap-sm">
                <Globe className="w-4 h-4 text-textSecondary" />
                <select
                  value={i18n.language}
                  onChange={(e) => changeLanguage(e.target.value)}
                  className="px-sm py-xs border border-border rounded-sm text-sm font-body text-textPrimary bg-surface"
                >
                  {languageOptions.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              
              {userInfo ? (
                <div className="flex items-center gap-md">
                  {userInfo.photo_url && (
                    <img
                      src={userInfo.photo_url}
                      alt="Avatar"
                      className="w-8 h-8 rounded-md"
                    />
                  )}
                  <span className="text-textSecondary font-body">
                    {userInfo.display_name || userInfo.email || t('user.user')}
                  </span>
                  {isAdmin && (
                    <span className="px-sm py-xs bg-error/10 text-error text-xs font-bold rounded-sm">
                      {t('user.admin')}
                    </span>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-xs px-sm py-xs text-sm font-body text-textSecondary hover:text-textPrimary border border-border rounded-sm hover:bg-surface"
                    title={t('user.signOut', 'Sign out')}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="px-md py-sm bg-primary text-surface rounded-md font-body font-bold hover:bg-primary/90"
                >
                  {t('user.signIn', 'Sign in')}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-lg sm:px-xl lg:px-2xl py-2xl pt-0">
        {/* Introduction Section */}
        <BountyIntroduction />

        {/* Tab Navigation */}
        <div className="mt-2xl">
          <div className="sticky top-[73px] z-40 bg-background border-b border-border w-full left-0">
            <div className="max-w-7xl mx-auto px-lg sm:px-xl lg:px-2xl">
              <nav className="-mb-px flex space-x-2xl">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`py-md px-lg border-b-3 font-body font-bold text-sm rounded-t-md transition-all duration-200 ${
                  activeTab === 'tasks'
                    ? 'border-primary text-primary bg-primary/10 shadow-sm transform -translate-y-0.5'
                    : 'border-transparent text-textSecondary hover:text-textPrimary hover:border-border hover:bg-surface/50'
                }`}
              >
                {t('nav.tasks')}
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`py-md px-lg border-b-3 font-body font-bold text-sm rounded-t-md transition-all duration-200 ${
                  activeTab === 'submissions'
                    ? 'border-primary text-primary bg-primary/10 shadow-sm transform -translate-y-0.5'
                    : 'border-transparent text-textSecondary hover:text-textPrimary hover:border-border hover:bg-surface/50'
                }`}
              >
                {t('nav.submissions')}
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-md px-lg border-b-3 font-body font-bold text-sm rounded-t-md transition-all duration-200 relative ${
                  activeTab === 'profile'
                    ? 'border-primary text-primary bg-primary/10 shadow-sm transform -translate-y-0.5'
                    : 'border-transparent text-textSecondary hover:text-textPrimary hover:border-border hover:bg-surface/50'
                }`}
              >
                {t('nav.profile')}
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
              </button>
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`py-md px-lg border-b-3 font-body font-bold text-sm rounded-t-md transition-all duration-200 ${
                    activeTab === 'admin'
                      ? 'border-primary text-primary bg-primary/10 shadow-sm transform -translate-y-0.5'
                      : 'border-transparent text-textSecondary hover:text-textPrimary hover:border-border hover:bg-surface/50'
                  }`}
                >
                  {t('nav.admin')}
                </button>
              )}
            </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-xl">
            <Suspense fallback={
              <div className="flex items-center justify-center py-2xl">
                <div className="text-lg text-textSecondary font-body">{t('app.loading')}</div>
              </div>
            }>
              {activeTab === 'tasks' && (
                <TasksTab 
                  tasks={tasks} 
                  userInfo={userInfo} 
                  onRefresh={refreshData}
                />
              )}
              {activeTab === 'submissions' && (
                <SubmissionsTab 
                  submissions={submissions}
                  userInfo={userInfo}
                  onRefresh={refreshData}
                />
              )}
              {activeTab === 'profile' && (
                <ProfileTab userInfo={userInfo} onNotificationRead={fetchUnreadNotificationCount} />
              )}
              {activeTab === 'admin' && isAdmin && (
                <AdminTab 
                  tasks={tasks}
                  onRefresh={refreshData}
                />
              )}
            </Suspense>
          </div>
        </div>
      </main>
      
      {authOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-md"
          onClick={() => setAuthOpen(false)}
        >
          <div
            className="bg-surface rounded-md shadow-level3 w-full max-w-md p-lg relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setAuthOpen(false)}
              className="absolute top-sm right-sm p-xs text-textSecondary hover:text-textPrimary"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div ref={authContainerRef} />
          </div>
        </div>
      )}
      </div>
    </AlertModalProvider>
  );
}

export default App;