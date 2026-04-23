import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Task, Submission } from '../types';
import { Plus, Edit2, Trash2, Users, Calendar, Coins, Filter, Award, XCircle, CheckCircle, Square, CheckSquare, Upload, X, Clock, AlertCircle, CheckCircleIcon, MoreVertical, ExternalLink, ChevronLeft, ChevronRight, Timer, Settings } from 'lucide-react';
import { useAlert } from './AlertModalProvider';
import { client } from "@/lib/edgespark";

interface AdminTabProps {
  tasks: Task[];
  onRefresh: () => void;
}

const AdminTab: React.FC<AdminTabProps> = ({ tasks, onRefresh }) => {
  const { t } = useTranslation();
  const { alert } = useAlert();
  const [activeTab, setActiveTab] = useState<'Open' | 'Pending' | 'Closed' | 'Users' | 'Countdown'>('Open');
  
  // 添加调试日志
  console.log('AdminTab received tasks:', tasks?.length || 0);
  console.log('AdminTab tasks sample:', tasks?.slice(0, 3));
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [editingSubmissionId, setEditingSubmissionId] = useState<number | null>(null);
  const [editedProjectUrl, setEditedProjectUrl] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [editedNotes, setEditedNotes] = useState<string>('');
  
  // Batch submission management
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<number>>(new Set());
  const [selectAllSubmissions, setSelectAllSubmissions] = useState(false);
  const [batchOperation, setBatchOperation] = useState<'award' | 'not_award' | null>(null);

  // Countdown Management Component
  const CountdownManagement = () => {
    const [countdownSettings, setCountdownSettings] = useState({
      event_name: 'Open Task Participation',
      start_time: '',
      end_time: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
      fetchCountdownSettings();
    }, []);

    const fetchCountdownSettings = async () => {
      try {
        const response = await client.api.fetch('/api/public/countdown/settings');
        const result = await response.json();

        if (result.success && result.settings) {
          setCountdownSettings({
            event_name: result.settings.event_name || 'Open Task Participation',
            start_time: result.settings.start_time ? result.settings.start_time.slice(0, 16) : '',
            end_time: result.settings.end_time ? result.settings.end_time.slice(0, 16) : ''
          });
        }
      } catch (error) {
        console.error('Error fetching countdown settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const saveCountdownSettings = async () => {
      if (!countdownSettings.start_time || !countdownSettings.end_time) {
        await alert({
          type: 'warning',
          title: t('common.warning', '警告'),
          message: t('admin.countdown.setTimeRequired', '请设置开始时间和结束时间')
        });
        return;
      }

      const startTime = new Date(countdownSettings.start_time);
      const endTime = new Date(countdownSettings.end_time);

      if (endTime <= startTime) {
        await alert({
          type: 'warning',
          title: t('common.warning', '警告'),
          message: t('admin.countdown.endTimeAfterStart', '结束时间必须晚于开始时间')
        });
        return;
      }

      setIsSaving(true);
      try {
        const response = await client.api.fetch('/api/countdown/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_name: countdownSettings.event_name,
            start_time: countdownSettings.start_time + ':00.000Z',
            end_time: countdownSettings.end_time + ':00.000Z'
          })
        });

        const result = await response.json();
        
        if (result.success) {
          await alert({
            type: 'success',
            title: t('common.success', '成功'),
            message: t('admin.countdown.settingsUpdated', '倒计时设置已更新')
          });
        } else {
          throw new Error(result.error || t('admin.countdown.saveFailed', '保存失败'));
        }
      } catch (error) {
        console.error('Error saving countdown settings:', error);
        await alert({
          type: 'error',
          title: t('common.error', '错误'),
          message: error.message || t('admin.countdown.saveFailed', '保存失败')
        });
      } finally {
        setIsSaving(false);
      }
    };

    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-2xl">
          <div className="text-lg text-textSecondary">{t('admin.countdown.loading', 'Loading...')}</div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-surface border border-border rounded-lg p-xl">
          <div className="flex items-center gap-md mb-xl">
            <Timer className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-heading font-bold text-textPrimary">{t('admin.countdown.managementTitle', 'Countdown Management')}</h3>
          </div>

          <div className="space-y-lg">
            <div>
              <label className="block text-base font-body font-bold text-textPrimary mb-md">
                {t('admin.countdown.eventNameLabel', 'Event Name')}
              </label>
              <input
                type="text"
                value={countdownSettings.event_name}
                onChange={(e) => setCountdownSettings({ ...countdownSettings, event_name: e.target.value })}
                className="w-full px-md py-sm border border-border rounded-md font-body text-textPrimary bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t('admin.countdown.eventNamePlaceholder', '输入活动名称')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div>
                <label className="block text-base font-body font-bold text-textPrimary mb-md">
                  {t('admin.countdown.startTimeLabel', 'Start Time (UTC)')}
                </label>
                <input
                  type="datetime-local"
                  value={countdownSettings.start_time}
                  onChange={(e) => setCountdownSettings({ ...countdownSettings, start_time: e.target.value })}
                  className="w-full px-md py-sm border border-border rounded-md font-body text-textPrimary bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-base font-body font-bold text-textPrimary mb-md">
                  {t('admin.countdown.endTimeLabel', 'End Time (UTC)')}
                </label>
                <input
                  type="datetime-local"
                  value={countdownSettings.end_time}
                  onChange={(e) => setCountdownSettings({ ...countdownSettings, end_time: e.target.value })}
                  className="w-full px-md py-sm border border-border rounded-md font-body text-textPrimary bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="bg-background rounded-md p-md">
              <div className="flex items-start gap-sm">
                <Settings className="w-5 h-5 text-textSecondary mt-1" />
                <div className="text-sm text-textSecondary">
                  <p className="font-bold mb-sm">{t('admin.countdown.timezoneTitle', 'Timezone Notes:')}</p>
                  <ul className="list-disc list-inside space-y-xs">
                    <li>{t('admin.countdown.timezoneNote1', 'All times use the UTC-0 timezone')}</li>
                    <li>{t('admin.countdown.timezoneNote2', 'The countdown displays above the Mission Guidelines')}</li>
                    <li>{t('admin.countdown.timezoneNote3', 'Automatically hidden after the countdown ends')}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-lg border-t border-border">
              <button
                onClick={saveCountdownSettings}
                disabled={isSaving}
                className={`px-xl py-md rounded-lg font-body font-bold transition-colors flex items-center gap-sm ${
                  isSaving 
                    ? 'bg-background text-textSecondary cursor-not-allowed' 
                    : 'bg-primary text-surface hover:bg-primary/90'
                }`}
              >
                {isSaving ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin" />
                    {t('admin.countdown.saving', 'Saving...')}
                  </>
                ) : (
                  <>
                    <Settings className="w-5 h-5" />
                    {t('admin.countdown.saveButton', 'Save Settings')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // User Management Component
  const UserManagement = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState<Record<string, boolean>>({});
    const [loadingUsersList, setLoadingUsersList] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'blacklisted' | 'normal'>('all');
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [pagination, setPagination] = useState({
      currentPage: 1,
      totalPages: 1,
      totalUsers: 0,
      limit: 10,
      hasNextPage: false,
      hasPreviousPage: false
    });

    // Fetch users on component mount and when pagination changes
    useEffect(() => {
      fetchAllUsers(pagination.currentPage);
    }, [pagination.currentPage]);

    // Filter users based on search term and filter status
    useEffect(() => {
      let filtered = users;

      // Apply search filter
      if (searchTerm.trim()) {
        filtered = filtered.filter(user => 
          user.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.userYwId?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply status filter
      if (filterStatus === 'blacklisted') {
        filtered = filtered.filter(user => user.isBlacklisted);
      } else if (filterStatus === 'normal') {
        filtered = filtered.filter(user => !user.isBlacklisted);
      }

      setFilteredUsers(filtered);
    }, [users, searchTerm, filterStatus]);

    const fetchAllUsers = async (page: number = 1) => {
      setLoadingUsersList(true);
      try {
        const response = await client.api.fetch(`/api/admin/users?page=${page}&limit=10000`);
        const result = await response.json();
        
        if (result.success) {
          setUsers(result.users);
          setPagination(result.pagination);
        } else {
          await alert({
            type: 'error',
            title: t('admin.users.fetchFailed', '获取用户列表失败'),
            message: result.error || t('common.unknownError', '未知错误')
          });
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        await alert({
          type: 'error',
          title: t('admin.users.fetchFailed', '获取用户列表失败'),
          message: t('admin.messages.networkError', '网络错误，请稍后重试')
        });
      } finally {
        setLoadingUsersList(false);
      }
    };

    const handlePageChange = (newPage: number) => {
      if (newPage >= 1 && newPage <= pagination.totalPages) {
        setPagination(prev => ({ ...prev, currentPage: newPage }));
      }
    };

    const toggleUserBlacklist = async (userYwId: string, currentStatus: boolean) => {
      const action = currentStatus ? 'unblacklist' : 'blacklist';
      
      setLoadingUsers(prev => ({ ...prev, [userYwId]: true }));
      
      try {
        const response = await client.api.fetch(`/api/admin/users/${userYwId}/blacklist`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action })
        });

        const result = await response.json();
        
        if (result.success) {
          // Update the user in the local state
          setUsers(prev => prev.map(user => 
            user.userYwId === userYwId 
              ? { ...user, isBlacklisted: result.blacklistStatus }
              : user
          ));
          
          await alert({
            type: 'success',
            title: t('admin.users.operationSuccess', '操作成功'),
            message: result.message
          });
        } else {
          await alert({
            type: 'error',
            title: t('admin.users.operationFailed', '操作失败'),
            message: result.error || t('common.unknownError', '未知错误')
          });
        }
      } catch (error) {
        console.error('Error toggling user blacklist:', error);
        await alert({
          type: 'error',
          title: t('admin.users.operationFailed', '操作失败'),
          message: t('admin.messages.networkError', '网络错误，请稍后重试')
        });
      } finally {
        setLoadingUsers(prev => ({ ...prev, [userYwId]: false }));
      }
    };

    return (
      <div className="space-y-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-heading font-bold text-textPrimary">{t('admin.users.title', 'User Blacklist Management')}</h3>
          <div className="flex items-center gap-md">
            <button
              onClick={() => fetchAllUsers(pagination.currentPage)}
              disabled={loadingUsersList}
              className="px-md py-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors disabled:opacity-50 text-sm font-body font-bold"
            >
              {loadingUsersList ? t('admin.users.refreshing', '刷新中...') : t('admin.users.refresh', '刷新')}
            </button>
            <div className="text-sm text-textSecondary">
              {t('admin.users.totalUsers', { count: pagination.totalUsers, shown: filteredUsers.length, defaultValue: '{{count}} users total | Showing {{shown}} results' })}
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-surface rounded-lg shadow-level1 p-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none">
                <i className="hgi-stroke hgi-search-01 text-textSecondary" style={{fontSize: '18px'}}></i>
              </div>
              <input
                type="text"
                placeholder={t('admin.users.searchPlaceholder', 'Search username or user ID...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-xl pr-md py-sm border border-border rounded-md font-body text-textPrimary bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            {/* Filter Dropdown */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none">
                <i className="hgi-stroke hgi-filter text-textSecondary" style={{fontSize: '18px'}}></i>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'blacklisted' | 'normal')}
                className="w-full pl-xl pr-md py-sm border border-border rounded-md font-body text-textPrimary bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="all">{t('admin.users.allUsersFilter', 'All Users')}</option>
                <option value="blacklisted">{t('admin.users.blacklistedFilter', 'Blacklisted Users')}</option>
                <option value="normal">{t('admin.users.normalFilter', 'Normal Users')}</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-md flex items-center pointer-events-none">
                <i className="hgi-stroke hgi-arrow-down-01 text-textSecondary" style={{fontSize: '16px'}}></i>
              </div>
            </div>
          </div>
          
          {/* Clear Filters */}
          {(searchTerm || filterStatus !== 'all') && (
            <div className="mt-md pt-md border-t border-border">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
                className="text-sm text-textSecondary hover:text-primary transition-colors font-body flex items-center gap-xs"
              >
                <i className="hgi-stroke hgi-refresh" style={{fontSize: '14px'}}></i>
                {t('admin.users.clearFilters', 'Clear all filters')}
              </button>
            </div>
          )}
        </div>

        {loadingUsersList ? (
          <div className="text-center py-2xl">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-md"></div>
            <p className="text-textSecondary font-body">{t('admin.users.loadingList', 'Loading user list...')}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-2xl">
            <div className="w-16 h-16 mx-auto mb-lg rounded-full bg-background flex items-center justify-center">
              <Users className="w-8 h-8 text-textSecondary" />
            </div>
            <h3 className="text-lg font-heading font-bold text-textSecondary mb-sm">
              {users.length === 0 ? t('admin.users.emptyNoUsers', 'No user data') : t('admin.users.emptyNoMatch', 'No matching users found')}
            </h3>
            <p className="text-textSecondary font-body">
              {users.length === 0 ? t('admin.users.emptyHintNoUsers', 'The system currently has no user profiles') : t('admin.users.emptyHintNoMatch', 'Please try adjusting your search or filter')}
            </p>
          </div>
        ) : (
          <div className="bg-surface rounded-lg shadow-level1 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-lg py-md text-left font-body font-bold text-textPrimary">{t('admin.users.columnUser', 'User')}</th>
                    <th className="px-lg py-md text-center font-body font-bold text-textPrimary">{t('admin.users.columnSubmissions', 'Submissions')}</th>
                    <th className="px-lg py-md text-center font-body font-bold text-textPrimary">{t('admin.users.columnAwards', 'Awards')}</th>
                    <th className="px-lg py-md text-left font-body font-bold text-textPrimary">{t('admin.users.columnLastSubmission', 'Last Submission')}</th>
                    <th className="px-lg py-md text-left font-body font-bold text-textPrimary">{t('admin.users.columnStatus', 'Status')}</th>
                    <th className="px-lg py-md text-right font-body font-bold text-textPrimary">{t('admin.users.columnActions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const isLoading = loadingUsers[user.userYwId] || false;
                    
                    return (
                      <tr key={user.userYwId} className="border-b border-border hover:bg-background/50 transition-colors">
                        <td className="px-lg py-md">
                          <div className="flex items-center gap-md">
                            {user.userAvatar ? (
                              <img 
                                src={user.userAvatar} 
                                alt={user.userName}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="w-4 h-4 text-primary" />
                              </div>
                            )}
                            <div>
                              <div className="font-body font-bold text-textPrimary">
                                {user.userName}
                              </div>
                              <div className="font-mono text-xs text-textSecondary truncate max-w-32">
                                {user.userYwId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-lg py-md text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-body font-bold bg-primary/10 text-primary">
                            {user.participationCount}
                          </span>
                        </td>
                        <td className="px-lg py-md text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-body font-bold bg-yellow-500/10 text-yellow-600">
                            {user.awardCount}
                          </span>
                        </td>
                        <td className="px-lg py-md text-textSecondary font-body">
                          {user.lastSubmissionDate ? new Date(user.lastSubmissionDate).toLocaleDateString() : t('admin.users.neverSubmitted', 'Never submitted')}
                        </td>
                        <td className="px-lg py-md">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-body font-bold ${
                            user.isBlacklisted 
                              ? 'bg-error/10 text-error' 
                              : 'bg-success/10 text-success'
                          }`}>
                            {user.isBlacklisted ? t('admin.users.blacklistedStatus', 'Blacklisted') : t('admin.users.normalStatus', 'Normal')}
                          </span>
                        </td>
                        <td className="px-lg py-md text-right">
                          <button
                            onClick={() => toggleUserBlacklist(user.userYwId, user.isBlacklisted)}
                            disabled={isLoading}
                            className={`px-md py-sm rounded-md text-sm font-body font-bold transition-colors ${
                              user.isBlacklisted
                                ? 'bg-success/10 text-success hover:bg-success/20'
                                : 'bg-error/10 text-error hover:bg-error/20'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isLoading ? (
                              <div className="flex items-center gap-xs">
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                {t('admin.users.processing', 'Processing...')}
                              </div>
                            ) : (
                              user.isBlacklisted ? t('admin.users.unblacklistAction', 'Remove from Blacklist') : t('admin.users.blacklistAction', 'Add to Blacklist')
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="px-lg py-md border-t border-border bg-background/50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-textSecondary font-body">
                    {t('admin.users.paginationInfo', {
                      from: ((pagination.currentPage - 1) * pagination.limit) + 1,
                      to: Math.min(pagination.currentPage * pagination.limit, pagination.totalUsers),
                      total: pagination.totalUsers,
                      defaultValue: 'Showing {{from}} - {{to}} of {{total}}'
                    })}
                  </div>
                  
                  <div className="flex items-center gap-xs">
                    {/* Previous Page Button */}
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPreviousPage || loadingUsersList}
                      className="p-2 rounded-md text-textSecondary hover:text-textPrimary hover:bg-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    {/* Page Numbers */}
                    {(() => {
                      const pages = [];
                      const maxVisiblePages = 5;
                      let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
                      let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
                      
                      // Adjust start page if we're near the end
                      if (endPage - startPage < maxVisiblePages - 1) {
                        startPage = Math.max(1, endPage - maxVisiblePages + 1);
                      }
                      
                      // Add first page and ellipsis if needed
                      if (startPage > 1) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => handlePageChange(1)}
                            disabled={loadingUsersList}
                            className="px-3 py-1 rounded-md text-sm font-body text-textSecondary hover:text-textPrimary hover:bg-background transition-colors disabled:opacity-50"
                          >
                            1
                          </button>
                        );
                        if (startPage > 2) {
                          pages.push(
                            <span key="start-ellipsis" className="px-2 text-textSecondary">...</span>
                          );
                        }
                      }
                      
                      // Add visible page numbers
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => handlePageChange(i)}
                            disabled={loadingUsersList}
                            className={`px-3 py-1 rounded-md text-sm font-body transition-colors disabled:opacity-50 ${
                              i === pagination.currentPage
                                ? 'bg-primary text-surface font-bold'
                                : 'text-textSecondary hover:text-textPrimary hover:bg-background'
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }
                      
                      // Add ellipsis and last page if needed
                      if (endPage < pagination.totalPages) {
                        if (endPage < pagination.totalPages - 1) {
                          pages.push(
                            <span key="end-ellipsis" className="px-2 text-textSecondary">...</span>
                          );
                        }
                        pages.push(
                          <button
                            key={pagination.totalPages}
                            onClick={() => handlePageChange(pagination.totalPages)}
                            disabled={loadingUsersList}
                            className="px-3 py-1 rounded-md text-sm font-body text-textSecondary hover:text-textPrimary hover:bg-background transition-colors disabled:opacity-50"
                          >
                            {pagination.totalPages}
                          </button>
                        );
                      }
                      
                      return pages;
                    })()}
                    
                    {/* Next Page Button */}
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage || loadingUsersList}
                      className="p-2 rounded-md text-textSecondary hover:text-textPrimary hover:bg-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // New task form
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    cover_image: '',
    cover_image_path: '',
    reward_amount: '',
    created_at: '', // 发布日期
    winner_url: '', // 获奖项目URL
    participants_count: 0, // 实际参与人数（已弃用，保留兼容性）
    initial_participants_count: 0, // 初始参与人数
  });
  const [newTaskImageFile, setNewTaskImageFile] = useState<File | null>(null);
  const [newTaskImagePreview, setNewTaskImagePreview] = useState<string>('');
  const [editTaskImageFile, setEditTaskImageFile] = useState<File | null>(null);
  const [editTaskImagePreview, setEditTaskImagePreview] = useState<string>('');

  useEffect(() => {
    if (selectedTaskId) {
      fetchTaskSubmissions(selectedTaskId);
    }
  }, [selectedTaskId]);

  const fetchTaskSubmissions = async (taskId: number) => {
    try {
      const response = await client.api.fetch(`/api/public/submissions?taskId=${taskId}`);
      const result = await response.json();
      
      if (result.success) {
        setSubmissions(result.submissions);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const uploadImage = async (file: File): Promise<{ filePath: string; previewUrl: string | null }> => {
    const response = await client.api.fetch('/api/upload/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
      }),
    });

    console.log('Upload presign response status:', response.status);
    const result = await response.json();
    console.log('Upload presign response data:', result);

    if (!result.success) {
      console.error('Upload presign failed with error:', result.error);
      throw new Error(result.error || 'Upload presign failed');
    }

    const uploadHeadersEntries = Object.entries(result.requiredHeaders || {});
    const uploadHeaders: Record<string, string> = {};
    for (const [key, value] of uploadHeadersEntries) {
      if (typeof key === 'string' && typeof value === 'string') {
        uploadHeaders[key] = value;
      }
    }
    const hasContentType = Object.keys(uploadHeaders).some((headerKey) => headerKey.toLowerCase() === 'content-type');
    if (!hasContentType && file.type) {
      uploadHeaders['Content-Type'] = file.type;
    }

    const uploadResponse = await fetch(result.uploadUrl, {
      method: 'PUT',
      headers: uploadHeaders,
      body: file,
    });

    if (!uploadResponse.ok) {
      console.error('Upload to storage failed:', uploadResponse.status, uploadResponse.statusText);
      throw new Error(`Upload failed with status ${uploadResponse.status}`);
    }

    return {
      filePath: result.filePath,
      previewUrl: result.previewUrl || null,
    };
  };

  const createTask = async () => {
    if (!newTask.title || !newTask.description || !newTask.reward_amount) {
      await alert({
        type: 'warning',
        title: t('common.warning', '警告'),
        message: t('admin.messages.fillComplete')
      });
      return;
    }

    try {
      let coverImagePath = (newTask.cover_image_path || '').trim();
      let coverImageManual = (newTask.cover_image || '').trim();
      let imageUploadFailed = false;
      
      if (newTaskImageFile) {
        try {
          const uploadResult = await uploadImage(newTaskImageFile);
          coverImagePath = uploadResult.filePath;
          setNewTask((prev) => ({ ...prev, cover_image_path: uploadResult.filePath }));
          if (uploadResult.previewUrl) {
            setNewTaskImagePreview(uploadResult.previewUrl);
          }
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          imageUploadFailed = true;
          
          const continueWithoutImage = confirm(
            t('admin.messages.imageUploadFailedCreate', 'Image upload failed. Continue creating the mission?\n\nClick "OK" to continue without image\nClick "Cancel" to retry image upload')
          );
          
          if (!continueWithoutImage) {
            return;
          }
          
          coverImagePath = '';
          console.log('Continuing task creation without image');
        }
      }

      if (!coverImagePath) {
        // 如果没有存储路径，使用手动输入的 URL
        coverImagePath = '';
      }

      const response = await client.api.fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newTask,
          cover_image: coverImageManual,
          cover_image_path: coverImagePath,
          reward_amount: parseInt(newTask.reward_amount),
          created_at: newTask.created_at || undefined, // 如果没有设置，则发送undefined让后端使用默认值
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        let successMessage = t('admin.messages.createSuccess');
        if (imageUploadFailed) {
          successMessage += t('admin.messages.imageUploadFailedNote', '\nNote: Image upload failed, the mission was created without a cover image.');
        }
        await alert({
          type: 'success',
          title: t('common.success', '成功'),
          message: successMessage
        });
        setShowCreateTask(false);
        setNewTask({ title: '', description: '', cover_image: '', cover_image_path: '', reward_amount: '', created_at: '', winner_url: '', participants_count: 0, initial_participants_count: 0 });
        setNewTaskImageFile(null);
        setNewTaskImagePreview('');
        onRefresh();
      } else {
        await alert({
          type: 'error',
          title: t('common.error', '错误'),
          message: t('admin.messages.createFailed') + result.error
        });
      }
    } catch (error) {
      console.error('Error creating task:', error);
      await alert({
        type: 'error',
        title: t('common.error', '错误'),
        message: t('admin.messages.tryAgain')
      });
    }
  };

  const handleNewTaskImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        await alert({
          type: 'warning',
          title: t('common.warning', '警告'),
          message: t('admin.messages.selectImageFile', 'Please select an image file')
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        await alert({
          type: 'warning',
          title: t('common.warning', '警告'),
          message: t('admin.messages.imageTooLarge', 'Image size cannot exceed 5MB')
        });
        return;
      }
      
      setNewTaskImageFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewTaskImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      setNewTask({ ...newTask, cover_image: '', cover_image_path: '' });
    }
  };

  const removeNewTaskImage = () => {
    setNewTaskImageFile(null);
    setNewTaskImagePreview('');
    setNewTask((prev) => ({ ...prev, cover_image_path: '', cover_image: '' }));
  };

  const handleEditTaskImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        await alert({
          type: 'warning',
          title: t('common.warning', '警告'),
          message: t('admin.messages.selectImageFile', 'Please select an image file')
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        await alert({
          type: 'warning',
          title: t('common.warning', '警告'),
          message: t('admin.messages.imageTooLarge', 'Image size cannot exceed 5MB')
        });
        return;
      }
      
      setEditTaskImageFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditTaskImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      if (editingTask) {
        setEditingTask({ ...editingTask, cover_image: '', cover_image_path: '' });
      }
    }
  };

  const removeEditTaskImage = () => {
    setEditTaskImageFile(null);
    setEditTaskImagePreview('');
    if (editingTask) {
      setEditingTask({ ...editingTask, cover_image: '', cover_image_path: '' });
    }
  };

  const updateTask = async (taskId: number, updates: Partial<Task>) => {
    try {
      // Remove computed fields that shouldn't be sent to the database
      const { display_participants_count, ...filteredUpdates } = updates;
      let updatedData = { ...filteredUpdates };
      let imageUploadFailed = false;
      
      if (editTaskImageFile) {
        try {
          const uploadResult = await uploadImage(editTaskImageFile);
          updatedData.cover_image_path = uploadResult.filePath;
          updatedData.cover_image = '';
          setEditingTask((prev) => prev ? { ...prev, cover_image_path: uploadResult.filePath } : prev);
          if (uploadResult.previewUrl) {
            setEditTaskImagePreview(uploadResult.previewUrl);
          }
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          imageUploadFailed = true;
          
          const continueWithoutImage = confirm(
            t('admin.messages.imageUploadFailedEdit', 'Image upload failed. Continue saving other changes?\n\nClick "OK" to continue saving without image\nClick "Cancel" to retry image upload')
          );
          
          if (!continueWithoutImage) {
            return;
          }
          
          console.log('Continuing save without image update');
        }
      }

      const currentCoverPath = (editingTask?.cover_image_path || '').trim();
      const currentCoverManual = (editingTask?.cover_image || '').trim();
      const hasCoverImageUpdate = Object.prototype.hasOwnProperty.call(updates, 'cover_image') || Object.prototype.hasOwnProperty.call(updates, 'cover_image_path') || Object.prototype.hasOwnProperty.call(updatedData, 'cover_image_path');
      if (hasCoverImageUpdate) {
        const coverPath = typeof updatedData.cover_image_path === 'string' ? updatedData.cover_image_path.trim() : '';
        const coverManual = typeof updatedData.cover_image === 'string' ? updatedData.cover_image.trim() : '';
        if (coverPath) {
          updatedData.cover_image_path = coverPath;
          updatedData.cover_image = '';
        } else if (coverManual) {
          updatedData.cover_image = coverManual;
          delete updatedData.cover_image_path;
        } else {
          updatedData.cover_image = '';
          delete updatedData.cover_image_path;
        }
      } else {
        delete updatedData.cover_image_path;
        delete updatedData.cover_image;
      }

      console.log('Updating task with data:', updatedData);

      const response = await client.api.fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const result = await response.json();
      console.log('Task update response:', result);
      
      if (result.success) {
        let successMessage = t('admin.messages.taskUpdated', 'Mission updated successfully!');
        if (imageUploadFailed) {
          successMessage += t('admin.messages.taskUpdatedImageFailed', '\nNote: Image upload failed, but other information has been saved.');
        }
        await alert({
          type: 'success',
          title: t('common.success', '成功'),
          message: successMessage
        });
        
        // Make sure we clear editing state before refreshing data
        setEditingTask(null);
        setEditTaskImageFile(null);
        setEditTaskImagePreview('');
        
        // Add a small delay before refreshing to ensure the backend has completed processing
        setTimeout(() => {
          console.log('Refreshing task data...');
          onRefresh();
        }, 300);
      } else {
        await alert({
          type: 'error',
          title: t('common.error', '错误'),
          message: t('admin.messages.updateFailedPrefix', 'Update failed: ') + result.error
        });
        console.error('Update failed:', result);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      await alert({
        type: 'error',
        title: t('common.error', '错误'),
        message: t('admin.messages.updateFailedRetry', 'Update failed, please try again later')
      });
    }
  };

  const deleteTask = async (taskId: number) => {
    if (!confirm(t('admin.confirmDelete'))) {
      return;
    }

    try {
      const response = await client.api.fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        await alert({
          type: 'success',
          message: t('admin.messages.deleteSuccess')
        });
        onRefresh();
      } else {
        await alert({
          type: 'error',
          message: t('admin.messages.deleteFailed') + result.error
        });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      await alert({
        type: 'error',
        message: t('admin.messages.tryAgain')
      });
    }
  };

  const updateSubmissionUrl = async (submissionId: number, project_url: string) => {
    try {
      const response = await client.api.fetch(`/api/submissions/${submissionId}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_url
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        await alert({
          type: 'success',
          message: t('admin.messages.submissionUrlUpdated', 'Submission link updated!')
        });
        if (selectedTaskId) {
          fetchTaskSubmissions(selectedTaskId);
        }
      } else {
        await alert({
          type: 'error',
          message: t('admin.messages.updateFailedPrefix', 'Update failed: ') + result.error
        });
      }
    } catch (error) {
      console.error('Error updating submission URL:', error);
      await alert({
        type: 'error',
        message: t('admin.messages.updateFailedRetry', 'Update failed, please try again later')
      });
    }
  };

  const openNotesEditor = (submission: Submission) => {
    setEditingNotesId(submission.id);
    setEditedNotes(submission.notes || '');
  };

  const closeNotesEditor = () => {
    setEditingNotesId(null);
    setEditedNotes('');
  };

  const saveNotes = async () => {
    if (!editingNotesId) return;
    
    try {
      const response = await client.api.fetch(`/api/submissions/${editingNotesId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: editedNotes,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        await alert({
          type: 'success',
          message: t('admin.messages.reviewNotesUpdated', 'Review Notes updated!')
        });
        if (selectedTaskId) {
          fetchTaskSubmissions(selectedTaskId);
        }
        closeNotesEditor();
      } else {
        await alert({
          type: 'error',
          message: t('admin.messages.updateFailedPrefix', 'Update failed: ') + result.error
        });
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      await alert({
        type: 'error',
        message: t('admin.messages.updateFailedRetry', 'Update failed, please try again later')
      });
    }
  };

  const getDefaultNotes = (status: string) => {
    switch (status) {
      case 'awarded':
        return t('admin.submissions.defaultNotes.awarded', 'Congratulations! Your project performed excellently in this task and has been recognized by the review committee. Thank you for your wonderful creation!');
      case 'not_awarded':
        return t('admin.submissions.defaultNotes.notAwarded', 'Thank you for your participation and efforts! Although you did not win this time, we have seen your creativity and dedication. We look forward to your continued excellence in future tasks!');
      case 'submitted':
        return t('admin.submissions.defaultNotes.submitted', 'Your submission has been received and we are currently reviewing it. Please wait patiently for the results.');
      default:
        return '';
    }
  };

  const deleteSubmission = async (submissionId: number) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      if (confirm(t('admin.messages.confirmDeleteSubmission', 'Are you sure you want to delete this submission? This action cannot be undone.'))) {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await client.api.fetch(`/api/submissions/${submissionId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        await alert({
          type: 'success',
          message: t('admin.messages.submissionDeleted', 'Submission record deleted!')
        });
        if (selectedTaskId) {
          fetchTaskSubmissions(selectedTaskId);
        }
      } else {
        await alert({
          type: 'error',
          message: t('admin.messages.deleteFailedPrefix', 'Deletion failed: ') + result.error
        });
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
      await alert({
        type: 'error',
        message: t('admin.messages.deleteFailedRetry', 'Deletion failed, please try again later')
      });
    }
  };

  const updateSubmissionStatus = async (submissionId: number, status: string, notes?: string) => {
    try {
      const requestBody: any = {
        submission_status: status,
      };
      
      // Only include notes if explicitly provided, otherwise use default notes
      if (notes !== undefined) {
        requestBody.notes = notes;
      } else {
        // Add default notes for status changes
        const defaultNotes = getDefaultNotes(status);
        if (defaultNotes) {
          requestBody.notes = defaultNotes;
        }
      }
      
      const response = await client.api.fetch(`/api/submissions/${submissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      
      if (result.success) {
        await alert({
          type: 'success',
          message: t('admin.messages.reviewResultUpdated', 'Review result updated!')
        });
        if (selectedTaskId) {
          fetchTaskSubmissions(selectedTaskId);
        }
      } else {
        if (result.existingAwardedId) {
          await alert({
            type: 'error',
            message: t('admin.messages.updateFailedPrefix', 'Update failed: ') + result.error
          });
        } else {
          await alert({
            type: 'error',
            message: t('admin.messages.updateFailedPrefix', 'Update failed: ') + result.error
          });
        }
      }
    } catch (error) {
      console.error('Error updating submission:', error);
      await alert({
        type: 'error',
        message: t('admin.messages.updateFailedRetry', 'Update failed, please try again later')
      });
    }
  };

  // Batch submission operations
  const toggleSubmissionSelection = (submissionId: number) => {
    const newSelected = new Set(selectedSubmissions);
    if (newSelected.has(submissionId)) {
      newSelected.delete(submissionId);
    } else {
      newSelected.add(submissionId);
    }
    setSelectedSubmissions(newSelected);
    setSelectAllSubmissions(newSelected.size === submissions.length);
  };

  const toggleSelectAllSubmissions = () => {
    if (selectAllSubmissions) {
      setSelectedSubmissions(new Set());
      setSelectAllSubmissions(false);
    } else {
      setSelectedSubmissions(new Set(submissions.map(sub => sub.id)));
      setSelectAllSubmissions(true);
    }
  };

  const batchUpdateSubmissions = async (status: 'awarded' | 'not_awarded') => {
    if (selectedSubmissions.size === 0) {
      await alert({
        type: 'warning',
        message: t('admin.batchOperations.noSubmissionsSelected', 'Please select submissions to batch operate on first')
      });
      return;
    }

    // Check if setting multiple to 'awarded' in same task (not allowed)
    if (status === 'awarded' && selectedSubmissions.size > 1) {
      await alert({
        type: 'warning',
        message: t('admin.batchOperations.onlyOneAwarded', 'Only one submission per mission can be awarded. Please select a single submission.')
      });
      return;
    }

    const statusText = status === 'awarded'
      ? t('admin.batchOperations.statusAwarded', 'Awarded')
      : t('admin.batchOperations.statusNotAwarded', 'Not Awarded');
    const confirmed = await new Promise<boolean>((resolve) => {
      const result = confirm(t('admin.batchOperations.confirmBatchStatusSubmissions', {
        count: selectedSubmissions.size,
        status: statusText,
        defaultValue: 'Are you sure you want to set {{count}} selected submissions to {{status}} status?'
      }));
      resolve(result);
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await client.api.fetch('/api/submissions/batch', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submission_ids: Array.from(selectedSubmissions),
          submission_status: status,
          task_id: selectedTaskId
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        await alert({
          type: 'success',
          message: t('admin.batchOperations.batchSubmissionSuccess', {
            count: selectedSubmissions.size,
            status: statusText,
            defaultValue: 'Successfully set {{count}} submissions to {{status}} status'
          })
        });

        // Clear selections
        setSelectedSubmissions(new Set());
        setSelectAllSubmissions(false);

        // Refresh submissions
        if (selectedTaskId) {
          fetchTaskSubmissions(selectedTaskId);
        }
      } else {
        await alert({
          type: 'error',
          message: t('admin.batchOperations.batchFailed', 'Batch operation failed: ') + result.error
        });
      }
    } catch (error) {
      console.error('Error batch updating submissions:', error);
      await alert({
        type: 'error',
        message: t('admin.batchOperations.batchFailedGeneric', 'Batch operation failed, please try again later')
      });
    }
  };

  const toggleTaskSelection = (taskId: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
    setSelectAll(newSelected.size === currentTabTasks.length);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedTasks(new Set());
      setSelectAll(false);
    } else {
      setSelectedTasks(new Set(currentTabTasks.map(task => task.id)));
      setSelectAll(true);
    }
  };

  const batchUpdateTaskStatus = async (status: 'Open' | 'Pending' | 'Closed') => {
    if (selectedTasks.size === 0) {
      await alert({
        type: 'warning',
        message: t('admin.batchOperations.noTasksSelected', 'Please select missions to batch operate on first')
      });
      return;
    }

    const confirmed = await alert({
      type: 'warning',
      message: t('admin.batchOperations.confirmBatchStatus', {
        count: selectedTasks.size,
        status,
        defaultValue: 'Are you sure you want to change the status of {{count}} selected missions to {{status}}?'
      }),
      showCancelButton: true,
      confirmText: t('common.confirm', 'Confirm'),
      cancelText: t('common.cancel', 'Cancel')
    });

    if (!confirmed) {
      return;
    }

    try {
      for (const taskId of selectedTasks) {
        await updateTask(taskId, { status });
      }
      await alert({
        type: 'success',
        message: t('admin.batchOperations.batchSuccess', {
          count: selectedTasks.size,
          defaultValue: 'Successfully updated {{count}} missions'
        })
      });
      setSelectedTasks(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error('Error batch updating:', error);
      await alert({
        type: 'error',
        message: t('admin.batchOperations.batchUpdateFailedGeneric', 'Batch update failed, please try again later')
      });
    }
  };

  // Filter tasks by active tab
  const currentTabTasks = tasks.filter(task => task.status === activeTab);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open': return <CheckCircleIcon className="w-4 h-4 text-primary" />;
      case 'Pending': return <Clock className="w-4 h-4 text-primary" />;
      case 'Closed': return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-primary/10 text-primary border-primary/20';
      case 'Pending': return 'bg-primary/10 text-primary border-primary/20';
      case 'Closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      {/* Notes Editor Modal */}
      {editingNotesId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-md">
          <div className="bg-surface rounded-lg shadow-level2 p-xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-lg">
              <h3 className="text-xl font-heading font-bold text-textPrimary">
                {t('admin.submissions.editNotes', '编辑Review Notes')}
              </h3>
              <button 
                onClick={closeNotesEditor} 
                className="text-textSecondary hover:text-textPrimary"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-lg">
              <label className="block text-sm font-body font-bold text-textSecondary mb-xs">
                {t('admin.submissions.notes', 'Review Notes')}
              </label>
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                rows={4}
                className="w-full px-md py-sm border border-border rounded-md text-textPrimary font-body resize-none"
                placeholder={t('admin.submissions.notesPlaceholder', '请输入评审备注...')}
              />
            </div>
            
            <div className="flex justify-end gap-md">
              <button
                onClick={closeNotesEditor}
                className="px-lg py-sm bg-secondary text-textSecondary rounded-md hover:bg-border font-body font-bold"
              >
                {t('common.cancel', '取消')}
              </button>
              <button
                onClick={saveNotes}
                className="px-lg py-sm bg-primary text-white rounded-md hover:bg-primary/90 font-body font-bold"
              >
                {t('common.save', '保存')}
              </button>
            </div>
          </div>
        </div>
      )}

    <div className="space-y-xl">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-heading font-bold text-textPrimary">{t('admin.operations')}</h2>
        <button
          onClick={() => setShowCreateTask(true)}
          className="bg-primary text-surface px-lg py-md rounded-lg hover:bg-primary/90 flex items-center gap-sm font-body font-bold shadow-level1 transition-all"
        >
          <Plus className="w-5 h-5" />
          {t('admin.publishTask')}
        </button>
      </div>

      {/* Status Tabs */}
      <div className="bg-surface rounded-lg shadow-level1 overflow-hidden">
        <div className="flex border-b border-border">
          {(['Open', 'Pending', 'Closed', 'Users', 'Countdown'] as const).map((status) => {
            const taskCount = (status === 'Users' || status === 'Countdown') ? 0 : tasks.filter(task => task.status === status).length;
            return (
              <button
                key={status}
                onClick={() => {
                  setActiveTab(status as any);
                  setSelectedTasks(new Set());
                  setSelectAll(false);
                }}
                className={`flex-1 px-xl py-lg font-body font-bold text-sm transition-all relative ${
                  activeTab === status
                    ? 'bg-primary/5 text-primary border-b-2 border-primary'
                    : 'text-textSecondary hover:text-textPrimary hover:bg-background'
                }`}
              >
                <div className="flex items-center justify-center gap-sm">
                  {status === 'Users' ? <Users className="w-4 h-4" /> : status === 'Countdown' ? <Timer className="w-4 h-4" /> : getStatusIcon(status)}
                  {status === 'Users'
                    ? t('admin.tabs.users', 'User Management')
                    : status === 'Countdown'
                      ? t('admin.tabs.countdown', 'Countdown Settings')
                      : t(`tasks.statusOptions.${status}`)}
                  {status !== 'Users' && status !== 'Countdown' && (
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(status)}`}>
                      {taskCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-xl">
          {activeTab === 'Users' ? (
            <UserManagement />
          ) : activeTab === 'Countdown' ? (
            <CountdownManagement />
          ) : currentTabTasks.length === 0 ? (
            <div className="text-center py-2xl">
              <div className="w-16 h-16 mx-auto mb-lg rounded-full bg-background flex items-center justify-center">
                {getStatusIcon(activeTab)}
              </div>
              <h3 className="text-lg font-heading font-bold text-textSecondary mb-sm">
                {t('admin.tabs.emptyTitle', { status: t(`tasks.statusOptions.${activeTab}`), defaultValue: 'No {{status}} missions' })}
              </h3>
              <p className="text-textSecondary font-body">
                {activeTab === 'Open' && t('admin.tabs.emptyOpen', 'No missions are currently open. Click the button above to create a new mission.')}
                {activeTab === 'Pending' && t('admin.tabs.emptyPending', 'No missions are currently pending review.')}
                {activeTab === 'Closed' && t('admin.tabs.emptyClosed', 'No missions have been closed.')}
              </p>
            </div>
          ) : (
            <>
              {/* Batch Operations */}
              <div className="mb-xl bg-background rounded-lg p-lg border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-md">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center gap-xs px-md py-sm bg-surface border border-border rounded-md text-sm hover:bg-secondary font-body transition-colors"
                    >
                      {selectAll ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      {selectAll ? t('admin.batchOperations.unselectAll', 'Unselect All') : t('admin.batchOperations.selectAll', 'Select All')}
                    </button>
                    <span className="text-sm text-textSecondary font-body">
                      {t('admin.batchOperations.selectedTasks', { selected: selectedTasks.size, total: currentTabTasks.length, defaultValue: 'Selected {{selected}} / {{total}} missions' })}
                    </span>
                  </div>
                  
                  <div className="flex gap-sm">
                    <button
                      onClick={() => batchUpdateTaskStatus('Open')}
                      disabled={selectedTasks.size === 0}
                      className="px-md py-sm bg-primary/10 text-primary rounded-md text-sm hover:bg-primary/20 font-body font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {t('admin.batchOperations.batchOpen', 'Batch Open')}
                    </button>
                    <button
                      onClick={() => batchUpdateTaskStatus('Pending')}
                      disabled={selectedTasks.size === 0}
                      className="px-md py-sm bg-primary/10 text-primary rounded-md text-sm hover:bg-primary/20 font-body font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {t('admin.batchOperations.batchPending', 'Batch Review')}
                    </button>
                    <button
                      onClick={() => batchUpdateTaskStatus('Closed')}
                      disabled={selectedTasks.size === 0}
                      className="px-md py-sm bg-gray-100 text-gray-800 rounded-md text-sm hover:bg-gray-200 font-body font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {t('admin.batchOperations.batchClose', 'Batch Close')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Task Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                {currentTabTasks.map((task) => (
                  <div key={task.id} className="bg-surface border border-border rounded-lg shadow-level1 hover:shadow-level2 transition-all overflow-hidden">
                    {/* Card Header with Checkbox */}
                    <div className="p-lg pb-0">
                      <div className="flex items-start justify-between mb-md">
                        <button
                          onClick={() => toggleTaskSelection(task.id)}
                          className="flex items-center justify-center w-5 h-5 rounded border-2 transition-colors"
                          style={{
                            backgroundColor: selectedTasks.has(task.id) ? '#3B82F6' : 'transparent',
                            borderColor: selectedTasks.has(task.id) ? '#3B82F6' : '#D1D5DB'
                          }}
                        >
                          {selectedTasks.has(task.id) && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </button>
                        
                        <div className="flex items-center gap-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(task.status)}`}>
                            {t(`tasks.statusOptions.${task.status}`)}
                          </span>
                          <div className="relative">
                            <button className="p-1 rounded-full hover:bg-background text-textSecondary">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cover Image - Fixed Height Container */}
                    <div className="px-lg mb-md h-32">
                      {task.cover_image ? (
                        <img
                          src={task.cover_image}
                          alt={task.title}
                          className="w-full h-full object-cover rounded-lg bg-background"
                        />
                      ) : (
                        <div className="w-full h-full bg-background rounded-lg"></div>
                      )}
                    </div>

                    {/* Task Content - Fixed Layout Structure */}
                    <div className="px-lg pb-lg flex flex-col">
                      {/* Title - Fixed Height */}
                      <div className="h-12 mb-sm">
                        <h3 className="font-heading font-bold text-textPrimary line-clamp-2 h-full">
                          {task.title}
                        </h3>
                      </div>
                      
                      {/* Description - Fixed Height */}
                      <div className="h-16 mb-md">
                        <p className="text-textSecondary text-sm font-body line-clamp-3 h-full">
                          {task.description}
                        </p>
                      </div>

                      {/* Task Meta - Fixed Height Container */}
                      <div className="h-32 mb-lg">
                        <div className="space-y-sm">
                          <div className="flex items-center gap-sm text-sm text-textSecondary">
                            <span className="px-2 py-1 bg-background text-textSecondary text-xs rounded-full font-mono">
                              ID: {task.id}
                            </span>
                          </div>
                          <div className="flex items-center gap-sm text-sm text-textSecondary">
                            <Coins className="w-4 h-4 text-primary" />
                            <span className="font-bold text-primary">${task.reward_amount}</span>
                          </div>
                          <div className="flex items-center gap-sm text-sm text-textSecondary">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(task.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-sm text-sm text-textSecondary">
                            <Users className="w-4 h-4" />
                            <span>{t('admin.taskCard.participants', { count: task.participants_count || 0, defaultValue: '{{count}} participants' })}</span>
                          </div>
                          {/* 获奖项目URL显示 - 固定位置 */}
                          <div className="flex items-center gap-sm text-sm text-textSecondary min-h-[20px]">
                            {task.winner_url ? (
                              <>
                                <Award className="w-4 h-4 text-yellow-500" />
                                <a 
                                  href={task.winner_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline max-w-[200px] truncate"
                                >
                                  {t('admin.taskCard.winnerLink', 'Winning Project Link')}
                                </a>
                              </>
                            ) : (
                              <span className="text-transparent">-</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Fixed at Bottom */}
                      <div className="flex gap-sm mt-auto">
                        <button
                          onClick={() => setSelectedTaskId(task.id)}
                          className="flex-1 bg-primary/10 text-primary px-md py-sm rounded-md text-sm font-body font-bold hover:bg-primary/20 transition-colors"
                        >
                          <Users className="w-4 h-4 inline mr-1" />
                          {t('admin.taskCard.viewSubmissions', 'View Submissions')}
                        </button>
                        <button
                          onClick={() => {
                            console.log('Edit button clicked for task:', task);
                            setEditingTask({ ...task, cover_image_path: task.cover_image_path || '' });
                            console.log('EditingTask state set to:', task);
                          }}
                          className="px-md py-sm bg-background text-textSecondary rounded-md hover:bg-secondary transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="px-md py-sm bg-background text-error rounded-md hover:bg-error/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Fixed Header */}
            <div className="sticky top-0 bg-surface border-b border-border p-xl flex items-center justify-between z-10">
              <h3 className="text-xl font-heading font-bold text-textPrimary">{t('admin.createTask.title')}</h3>
              <button
                onClick={() => {
                  setShowCreateTask(false);
                  setNewTask({ title: '', description: '', cover_image: '', cover_image_path: '', reward_amount: '', created_at: '', winner_url: '', participants_count: 0, initial_participants_count: 0 });
                  setNewTaskImageFile(null);
                  setNewTaskImagePreview('');
                }}
                className="p-2 hover:bg-background rounded-md transition-colors text-textSecondary hover:text-textPrimary"
              >
                <i className="hgi-stroke hgi-cancel-01 text-lg"></i>
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-xl">
              <div className="space-y-lg">
                <div>
                  <label className="block text-base font-body font-bold text-textPrimary mb-md">
                    {t('admin.createTask.taskTitle')}
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-md py-sm border border-border rounded-md font-body text-textPrimary bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('admin.createTask.titlePlaceholder', 'Enter mission title')}
                  />
                </div>

                <div>
                  <label className="block text-base font-body font-bold text-textPrimary mb-md">
                    {t('admin.createTask.taskDescription')}
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={4}
                    className="w-full px-md py-sm border border-border rounded-md font-body text-textPrimary bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('admin.createTask.descriptionPlaceholder', 'Describe mission requirements and content in detail')}
                  />
                </div>

                <div>
                  <label className="block text-base font-body font-bold text-textPrimary mb-md">
                    {t('admin.createTask.coverImage')}
                  </label>
                  <div className="space-y-sm">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleNewTaskImageUpload}
                      className="hidden"
                      id="new-task-image-upload"
                    />
                    <div className="flex gap-sm">
                      <label
                        htmlFor="new-task-image-upload"
                        className="px-md py-sm bg-background border border-border rounded-md text-sm font-body cursor-pointer hover:bg-secondary transition-colors"
                      >
                        <Upload className="w-4 h-4 inline mr-sm" />
                        {t('admin.createTask.uploadImage', 'Upload Image')}
                      </label>
                      <span className="text-sm text-textSecondary self-center">{t('admin.createTask.orSeparator', 'or')}</span>
                      <input
                        type="url"
                        value={newTask.cover_image}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewTask({ ...newTask, cover_image: value, cover_image_path: '' });
                          if (value) {
                            setNewTaskImageFile(null);
                            setNewTaskImagePreview('');
                          }
                        }}
                        className="flex-1 px-md py-sm border border-border rounded-md font-body text-textPrimary bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder={t('admin.createTask.imageUrlPlaceholder', 'Or enter image URL')}
                        disabled={!!newTaskImageFile}
                      />
                    </div>
                    {newTaskImagePreview && (
                      <div className="relative">
                        <img src={newTaskImagePreview} alt="Preview" className="w-full h-40 object-cover rounded-md" />
                        <button
                          onClick={removeNewTaskImage}
                          className="absolute top-2 right-2 p-1 bg-error text-white rounded-full hover:bg-error/90"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-base font-body font-bold text-textPrimary mb-md">
                    {t('admin.createTask.bountyAmount')}
                  </label>
                  <input
                    type="number"
                    value={newTask.reward_amount}
                    onChange={(e) => setNewTask({ ...newTask, reward_amount: e.target.value })}
                    className="w-full px-md py-sm border border-border rounded-md font-body text-textPrimary bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('admin.createTask.bountyPlaceholder', 'Enter bounty amount')}
                    min="0"
                  />
                </div>
                
                {/* Publish date selection */}
                <div>
                  <label className="block text-base font-body font-bold text-textPrimary mb-md">
                    {t('admin.createTask.publishDateLabel', 'Publish Date')}
                  </label>
                  <input
                    type="datetime-local"
                    value={newTask.created_at}
                    onChange={(e) => setNewTask({ ...newTask, created_at: e.target.value })}
                    className="w-full px-md py-sm border border-border rounded-md font-body text-textPrimary bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-textSecondary mt-xs">
                    {t('admin.createTask.publishDateHint', 'If not set, the current time will be used as the publish time')}
                  </p>
                </div>

                {/* Initial participants */}
                <div>
                  <label className="block text-base font-body font-bold text-textPrimary mb-md">
                    {t('admin.createTask.initialParticipantsLabel', 'Initial Participants')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newTask.initial_participants_count || 0}
                    onChange={(e) => setNewTask({ ...newTask, initial_participants_count: parseInt(e.target.value) || 0 })}
                    className="w-full px-md py-sm border border-border rounded-md font-body text-textPrimary bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('admin.createTask.initialParticipantsPlaceholder', 'Set initial participant count (optional)')}
                  />
                  <p className="text-xs text-textSecondary mt-xs">
                    {t('admin.createTask.initialParticipantsHint', "Sets the mission's initial participant count, which updates automatically based on actual submissions")}
                  </p>
                </div>

                {/* Winner URL */}
                <div>
                  <label className="block text-base font-body font-bold text-textPrimary mb-md">
                    {t('admin.createTask.winnerUrlLabel', 'Winning Project URL')}
                  </label>
                  <input
                    type="url"
                    value={newTask.winner_url}
                    onChange={(e) => setNewTask({ ...newTask, winner_url: e.target.value })}
                    className="w-full px-md py-sm border border-border rounded-md font-body text-textPrimary bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('admin.createTask.winnerUrlPlaceholder', 'Enter the winning project URL (optional)')}
                  />
                  <p className="text-xs text-textSecondary mt-xs">
                    {t('admin.createTask.winnerUrlHint', 'After setting the winning project URL, the mission status will automatically change to Closed')}
                  </p>
                </div>
              </div>

              <div className="flex gap-sm justify-end mt-xl pt-lg border-t border-border">
                <button
                  onClick={() => {
                    setShowCreateTask(false);
                    setNewTask({ title: '', description: '', cover_image: '', cover_image_path: '', reward_amount: '', created_at: '', winner_url: '', participants_count: 0, initial_participants_count: 0 });
                    setNewTaskImageFile(null);
                    setNewTaskImagePreview('');
                  }}
                  className="px-lg py-sm border border-border rounded-md font-body font-bold text-textSecondary hover:bg-background transition-colors"
                >
                  {t('admin.createTask.cancel')}
                </button>
                <button
                  onClick={createTask}
                  className="px-lg py-sm bg-primary text-surface rounded-md font-body font-bold hover:bg-primary/90 transition-colors"
                >
                  {t('admin.createTask.publish')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Fixed Header */}
            <div className="sticky top-0 bg-surface border-b border-border p-xl flex items-center justify-between z-10">
              <h3 className="text-xl font-heading font-bold text-textPrimary">{t('admin.editTask.title')}</h3>
              <button
                onClick={() => setEditingTask(null)}
                className="p-2 hover:bg-background rounded-md transition-colors text-textSecondary hover:text-textPrimary"
              >
                <i className="hgi-stroke hgi-cancel-01 text-lg"></i>
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-xl">
              <div className="space-y-lg">
                <div>
                  <label className="block text-base font-body font-bold text-textPrimary mb-md">
                    {t('admin.editTask.taskTitle')}
                  </label>
                  <input
                    type="text"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    className="w-full px-md py-sm border border-border rounded-md font-body text-textPrimary bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('admin.editTask.taskTitlePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-base font-body font-bold text-textPrimary mb-md">
                    {t('admin.editTask.taskDescription')}
                  </label>
                  <textarea
                    value={editingTask.description}
                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                    rows={4}
                    className="w-full px-md py-sm border border-border rounded-md font-body text-textPrimary bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('admin.editTask.taskDescriptionPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-base font-body font-bold text-textPrimary mb-md">
                    {t('admin.editTask.coverImage')}
                  </label>
                  <div className="space-y-sm">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditTaskImageUpload}
                      className="hidden"
                      id="edit-task-image-upload"
                    />
                    <div className="flex gap-sm">
                      <label
                        htmlFor="edit-task-image-upload"
                        className="px-md py-sm bg-background border border-border rounded-md text-sm font-body cursor-pointer hover:bg-secondary transition-colors"
                      >
                        <Upload className="w-4 h-4 inline mr-sm" />
                        {t('admin.editTask.uploadImage', 'Upload Image')}
                      </label>
                      <span className="text-sm text-textSecondary self-center">{t('admin.editTask.orSeparator', 'or')}</span>
                      <input
                        type="url"
                        value={editingTask.cover_image}
                        onChange={(e) => {
                          const value = e.target.value;
                          setEditingTask({ ...editingTask, cover_image: value, cover_image_path: '' });
                          if (value) {
                            setEditTaskImageFile(null);
                            setEditTaskImagePreview('');
                          }
                        }}
                        className="flex-1 px-md py-sm border border-border rounded-md font-body text-textPrimary bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder={t('admin.editTask.coverImagePlaceholder')}
                        disabled={!!editTaskImageFile}
                      />
                    </div>
                    {(editTaskImagePreview || editingTask.cover_image) && (
                      <div className="relative">
                        <img 
                          src={editTaskImagePreview || editingTask.cover_image} 
                          alt="Preview" 
                          className="w-full h-40 object-cover rounded-md" 
                        />
                        <button
                          onClick={removeEditTaskImage}
                          className="absolute top-2 right-2 p-1 bg-error text-white rounded-full hover:bg-error/90"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-base font-body font-bold text-textPrimary mb-md">
                    {t('admin.editTask.bountyAmount')}
                  </label>
                  <input
                    type="number"
                    value={editingTask.reward_amount}
                    onChange={(e) => setEditingTask({ ...editingTask, reward_amount: parseInt(e.target.value) })}
                    className="w-full px-md py-sm border border-border rounded-md font-body text-textPrimary bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('admin.editTask.bountyAmountPlaceholder')}
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-body font-bold text-textPrimary mb-sm">
                    {t('admin.editTask.taskStatus')}
                  </label>
                  <select
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as 'Open' | 'Pending' | 'Closed' })}
                    className="w-full px-md py-sm border border-border rounded-md font-body text-textPrimary bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Open">{t('tasks.statusOptions.Open')}</option>
                    <option value="Pending">{t('tasks.statusOptions.Pending')}</option>
                    <option value="Closed">{t('tasks.statusOptions.Closed')}</option>
                  </select>
                </div>
                
                {/* Edit publish date */}
                <div>
                  <label className="block text-base font-body font-bold text-textPrimary mb-md">
                    {t('admin.editTask.publishDateLabel', 'Publish Date')}
                  </label>
                  <input
                    type="datetime-local"
                    value={editingTask.created_at ? new Date(editingTask.created_at).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditingTask({ ...editingTask, created_at: e.target.value })}
                    className="w-full px-md py-sm border border-border rounded-md font-body text-textPrimary bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-textSecondary mt-xs">
                    {t('admin.editTask.publishDateHint', "Changing the publish date will affect the mission's order in lists")}
                  </p>
                </div>

                {/* Participant statistics */}
                <div>
                  <label className="block text-base font-body font-bold text-textPrimary mb-md">
                    {t('admin.editTask.participantsStatsLabel', 'Participant Statistics')}
                  </label>

                  {/* Initial participants - editable */}
                  <div className="mb-md">
                    <label className="block text-sm font-body font-bold text-textSecondary mb-xs">
                      {t('admin.editTask.initialParticipantsEditableLabel', 'Initial Participants (editable)')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editingTask.initial_participants_count || 0}
                      onChange={(e) => setEditingTask({ ...editingTask, initial_participants_count: parseInt(e.target.value) || 0 })}
                      className="w-full px-md py-sm border border-border rounded-md font-body text-textPrimary bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Actual submissions - read only */}
                  <div className="mb-md">
                    <label className="block text-sm font-body font-bold text-textSecondary mb-xs">
                      {t('admin.editTask.actualSubmissionsLabel', 'Actual Submissions (auto-counted)')}
                    </label>
                    <div className="w-full px-md py-sm border border-border rounded-md bg-secondary text-textPrimary font-body">
                      {editingTask.participants_count || 0}
                    </div>
                  </div>

                  {/* Display total - computed */}
                  <div className="mb-md">
                    <label className="block text-sm font-body font-bold text-textSecondary mb-xs">
                      {t('admin.editTask.displayTotalLabel', 'Displayed Total (auto-calculated)')}
                    </label>
                    <div className="w-full px-md py-sm border border-primary rounded-md bg-primary/5 text-primary font-body font-bold">
                      {(editingTask.initial_participants_count || 0) + (editingTask.participants_count || 0)}
                    </div>
                  </div>

                  <p className="text-xs text-textSecondary">
                    {t('admin.editTask.displayTotalHint', 'Displayed Total = Initial Participants + Actual Submissions. Only Initial Participants is manually editable.')}
                  </p>
                </div>

                {/* Edit winner URL */}
                <div>
                  <label className="block text-base font-body font-bold text-textPrimary mb-md">
                    {t('admin.editTask.winnerUrlLabel', 'Winning Project URL')}
                  </label>
                  <input
                    type="url"
                    value={editingTask.winner_url || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, winner_url: e.target.value })}
                    className="w-full px-md py-sm border border-border rounded-md font-body text-textPrimary bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('admin.editTask.winnerUrlPlaceholder', 'Enter the winning project URL')}
                  />
                  <p className="text-xs text-textSecondary mt-xs">
                    {t('admin.editTask.winnerUrlHint', 'After setting the winning project URL, the mission status will automatically change to Closed')}
                  </p>
                </div>
              </div>

              <div className="flex gap-sm justify-end mt-xl pt-lg border-t border-border">
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setEditTaskImageFile(null);
                    setEditTaskImagePreview('');
                  }}
                  className="px-lg py-sm border border-border rounded-md font-body font-bold text-textSecondary hover:bg-background transition-colors"
                >
                  {t('admin.editTask.cancel')}
                </button>
                <button
                  onClick={async () => {
                    console.log('Save button clicked. EditingTask:', editingTask);
                    console.log('About to call updateTask with ID:', editingTask.id);
                    console.log('Update data:', editingTask);
                    try {
                      await updateTask(editingTask.id, editingTask);
                      console.log('updateTask completed successfully');
                    } catch (error) {
                      console.error('updateTask failed:', error);
                    }
                  }}
                  className="px-lg py-sm bg-primary text-surface rounded-md font-body font-bold hover:bg-primary/90 transition-colors"
                >
                  {t('admin.editTask.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Submissions Modal */}
      {selectedTaskId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl">
            <div className="p-xl border-b border-border">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-heading font-bold text-textPrimary">
                  {t('admin.submissions.title')}
                </h3>
                <button
                  onClick={() => {
                    setSelectedTaskId(null);
                    // Clear batch selections when closing modal
                    setSelectedSubmissions(new Set());
                    setSelectAllSubmissions(false);
                  }}
                  className="p-sm rounded-full hover:bg-background text-textSecondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Batch Operations Controls */}
              {submissions.length > 0 && (
                <div className="mt-lg bg-background rounded-lg p-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-md">
                      <button
                        onClick={toggleSelectAllSubmissions}
                        className="flex items-center gap-xs px-md py-sm bg-surface border border-border rounded-md text-sm hover:bg-secondary font-body transition-colors"
                      >
                        {selectAllSubmissions ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        {selectAllSubmissions ? t('admin.batchOperations.unselectAll', 'Unselect All') : t('admin.batchOperations.selectAll', 'Select All')}
                      </button>
                      <span className="text-sm text-textSecondary font-body">
                        {t('admin.batchOperations.selectedSubmissions', { selected: selectedSubmissions.size, total: submissions.length, defaultValue: 'Selected {{selected}} / {{total}} submissions' })}
                      </span>
                    </div>
                    
                    <div className="flex gap-sm">
                      <button
                        onClick={() => batchUpdateSubmissions('awarded')}
                        disabled={selectedSubmissions.size === 0 || selectedSubmissions.size > 1}
                        className="px-md py-sm bg-primary/10 text-primary rounded-md text-sm hover:bg-primary/20 font-body font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-xs"
                        title={selectedSubmissions.size > 1 ? t('admin.batchOperations.onlyOneAwardedTitle', 'Only one submission per mission can be awarded') : ''}
                      >
                        <Award className="w-4 h-4" />
                        {t('admin.batchOperations.batchAward', 'Batch Award')} {selectedSubmissions.size > 1 && t('admin.batchOperations.onlySingleHint', '(single selection only)')}
                      </button>
                      <button
                        onClick={() => batchUpdateSubmissions('not_awarded')}
                        disabled={selectedSubmissions.size === 0}
                        className="px-md py-sm bg-red-100 text-red-800 rounded-md text-sm hover:bg-red-200 font-body font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-xs"
                      >
                        <XCircle className="w-4 h-4" />
                        {t('admin.batchOperations.batchNotAward', 'Batch Not Award')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-xl">
              {submissions.length === 0 ? (
                <div className="text-center py-2xl">
                  <Users className="w-16 h-16 mx-auto text-textSecondary mb-lg" />
                  <p className="text-textSecondary font-body">{t('admin.submissions.noSubmissions')}</p>
                </div>
              ) : (
                <div className="space-y-lg">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="bg-background rounded-lg p-lg border border-border relative">
                      {/* Selection Checkbox */}
                      <div className="absolute top-lg left-lg">
                        <button
                          onClick={() => toggleSubmissionSelection(submission.id)}
                          className="flex items-center justify-center w-5 h-5 rounded border-2 transition-colors"
                          style={{
                            backgroundColor: selectedSubmissions.has(submission.id) ? '#3B82F6' : 'transparent',
                            borderColor: selectedSubmissions.has(submission.id) ? '#3B82F6' : '#D1D5DB'
                          }}
                        >
                          {selectedSubmissions.has(submission.id) && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </button>
                      </div>
                      
                      <div className="ml-xl">
                        <div className="flex justify-between items-start mb-md">
                          <div>
                            <h4 className="font-body font-bold text-textPrimary">{submission.submitter_name}</h4>
                            <p className="text-sm text-textSecondary">
                              {new Date(submission.submitted_at).toLocaleString()}
                            </p>
                          </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          submission.submission_status === 'awarded' 
                            ? 'bg-primary bg-opacity-20 text-primary' 
                            : submission.submission_status === 'not_awarded'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {t(`submissions.statusLabels.${submission.submission_status}`)}
                        </span>
                      </div>
                      
                      <div className="mb-md">
                        <div className="flex items-center gap-sm">
                          <span className="text-sm font-body font-bold text-textSecondary">{t('admin.submissions.projectLinkLabel', 'Project Link:')}</span>
                          {editingSubmissionId === submission.id ? (
                            <div className="flex-1 flex gap-sm">
                              <input
                                type="url"
                                value={editedProjectUrl}
                                onChange={(e) => setEditedProjectUrl(e.target.value)}
                                className="flex-1 px-md py-xs border border-border rounded-md text-sm font-body"
                                placeholder={t('admin.submissions.editUrlPlaceholder', 'Enter new project link')}
                              />
                              <button
                                onClick={() => {
                                  updateSubmissionUrl(submission.id, editedProjectUrl);
                                  setEditingSubmissionId(null);
                                  setEditedProjectUrl('');
                                }}
                                className="px-md py-xs bg-primary text-surface rounded-md text-sm hover:bg-primary/90"
                              >
                                {t('admin.submissions.saveEdit', 'Save')}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingSubmissionId(null);
                                  setEditedProjectUrl('');
                                }}
                                className="px-md py-xs bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
                              >
                                {t('admin.submissions.cancelEdit', 'Cancel')}
                              </button>
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center gap-sm">
                              <a
                                href={submission.project_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline font-body text-sm flex items-center gap-xs"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {submission.project_url}
                              </a>
                              <button
                                onClick={() => {
                                  setEditingSubmissionId(submission.id);
                                  setEditedProjectUrl(submission.project_url);
                                }}
                                className="p-1 rounded-full hover:bg-secondary text-textSecondary"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mb-md">
                        <div className="flex items-center justify-between mb-xs">
                          <span className="text-sm font-body font-bold text-textSecondary">
                            {t('admin.submissions.notes')}
                          </span>
                          <button
                            onClick={() => openNotesEditor(submission)}
                            className="flex items-center gap-xs text-xs text-link hover:text-link/80 font-body font-bold"
                          >
                            <Edit2 className="w-3 h-3" />
                            {t('common.edit', '编辑')}
                          </button>
                        </div>
                        {submission.notes ? (
                          <p className="text-sm text-textPrimary font-body bg-secondary p-sm rounded-md">{submission.notes}</p>
                        ) : (
                          <p className="text-sm text-textSecondary font-body italic bg-secondary p-sm rounded-md">{t('admin.submissions.noNotes', '暂无评审备注')}</p>
                        )}
                      </div>

                      <div className="flex gap-sm">
                        <button
                          onClick={() => updateSubmissionStatus(submission.id, 'awarded')}
                          className="flex items-center gap-xs px-md py-sm bg-primary text-white rounded-md text-sm hover:bg-primary hover:brightness-90 font-body font-bold"
                          disabled={submission.submission_status === 'awarded'}
                        >
                          <Award className="w-4 h-4" />
                          {t('admin.submissions.award')}
                        </button>
                        <button
                          onClick={() => updateSubmissionStatus(submission.id, 'not_awarded')}
                          className="flex items-center gap-xs px-md py-sm bg-red-100 text-red-800 rounded-md text-sm hover:bg-red-200 font-body font-bold"
                          disabled={submission.submission_status === 'not_awarded'}
                        >
                          <XCircle className="w-4 h-4" />
                          {t('admin.submissions.notAward')}
                        </button>
                        <button
                          onClick={() => deleteSubmission(submission.id)}
                          className="flex items-center gap-xs px-md py-sm bg-gray-100 text-gray-800 rounded-md text-sm hover:bg-red-100 hover:text-red-800 font-body font-bold transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('admin.submissions.deleteSubmission', 'Delete Submission')}
                        </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default AdminTab;