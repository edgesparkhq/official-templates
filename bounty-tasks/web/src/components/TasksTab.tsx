import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Task, UserInfo, Comment } from '../types';
import { Calendar, Coins, Users, MessageSquare, ExternalLink, Send, MoreHorizontal, ChevronLeft, ChevronRight, Award, Clock, Timer, CheckCircle } from 'lucide-react';
import { useAlert } from './AlertModalProvider';
import { client } from "@/lib/edgespark";

interface TasksTabProps {
  tasks: Task[];
  userInfo: UserInfo | null;
  onRefresh: () => void;
}

interface WinningSubmission {
  task_id: number;
  project_url: string;
  submitter_name: string;
}

interface TasksResponse {
  success: boolean;
  tasks: Task[];
  pagination: {
    totalTasks: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  availableDates: string[];
  winningSubmissions: WinningSubmission[];
  statusStats: {
    Open: number;
    Pending: number;
    Closed: number;
  };
}

const TasksTab: React.FC<TasksTabProps> = ({ tasks: initialTasks, userInfo, onRefresh }) => {
  const { t } = useTranslation();
  const { alert } = useAlert();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [sortBy, setSortBy] = useState('created_at');
  const [statusFilter, setStatusFilter] = useState('Open');
  // 设置默认日期：开始日期为2025/08/01，结束日期为当日
  const getToday = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [startDateFilter, setStartDateFilter] = useState<string>('2025-08-01');
  const [endDateFilter, setEndDateFilter] = useState<string>(getToday());
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tasksByDate, setTasksByDate] = useState<{[date: string]: Task[]}>({});
  const [winningSubmissions, setWinningSubmissions] = useState<{[taskId: number]: WinningSubmission}>({});
  const [statusStats, setStatusStats] = useState<{Open: number; Pending: number; Closed: number}>({ Open: 0, Pending: 0, Closed: 0 });
  const [comments, setComments] = useState<Comment[]>([]);
  const [taskCommentCounts, setTaskCommentCounts] = useState<{[key: number]: number}>({});
  const [totalComments, setTotalComments] = useState<number>(0);
  const [newComment, setNewComment] = useState('');
  const [showCommentModal, setShowCommentModal] = useState<number | null>(null);
  const [replyToComment, setReplyToComment] = useState<Comment | null>(null);
  const [submitDialogTask, setSubmitDialogTask] = useState<Task | null>(null);
  const [projectUrl, setProjectUrl] = useState('');
  const [socialMediaUrl, setSocialMediaUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch tasks with filters and pagination
  const fetchTasks = async () => {
    setLoading(true);
    try {
      let url = `/api/public/tasks?page=${currentPage}&limit=10000&sortBy=${sortBy}`;

      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }

      if (startDateFilter) {
        url += `&startDate=${startDateFilter}`;
      }

      if (endDateFilter) {
        url += `&endDate=${endDateFilter}`;
      }

      const response = await client.api.fetch(url);
      const data: TasksResponse = await response.json();
      
      if (data.success) {
        setTasks(data.tasks);
        setTotalPages(data.pagination.totalPages);
        setAvailableDates(data.availableDates);
        
        // 更新状态统计数据
        if (data.statusStats) {
          setStatusStats(data.statusStats);
        }
        
        // Process winning submissions
        const winningMap: {[taskId: number]: WinningSubmission} = {};
        data.winningSubmissions.forEach(submission => {
          winningMap[submission.task_id] = submission;
        });
        setWinningSubmissions(winningMap);
        
        // Group tasks by date
        const taskGroups: {[date: string]: Task[]} = {};
        data.tasks.forEach(task => {
          const taskDate = new Date(task.created_at).toLocaleDateString();
          if (!taskGroups[taskDate]) {
            taskGroups[taskDate] = [];
          }
          taskGroups[taskDate].push(task);
        });
        
        // Sort tasks within each date group by created_at
        Object.keys(taskGroups).forEach(date => {
          taskGroups[date].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
        
        setTasksByDate(taskGroups);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial load and when filters change
  useEffect(() => {
    fetchTasks();
  }, [currentPage, sortBy, statusFilter, startDateFilter, endDateFilter]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, statusFilter, startDateFilter, endDateFilter]);
  
  // Set default date filters to cover a reasonable range
  useEffect(() => {
    if (availableDates.length > 0) {
      if (!startDateFilter) {
        // Set start date to the earliest available date
        const sortedDates = [...availableDates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        setStartDateFilter(sortedDates[0]);
      }
      if (!endDateFilter) {
        // Set end date to the latest available date
        const sortedDates = [...availableDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        setEndDateFilter(sortedDates[0]);
      }
    }
  }, [availableDates]);
  
  // Effect to fetch comment counts for all tasks when they load
  useEffect(() => {
    if (tasks.length > 0) {
      tasks.forEach(task => {
        fetchCommentCount(task.id);
      });
    }
  }, [tasks]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-primary text-white min-w-[80px] justify-center';
      case 'Pending': return 'bg-primary bg-opacity-60 text-white min-w-[80px] justify-center';
      case 'Closed': return 'bg-gray-400 text-white min-w-[80px] justify-center';
      default: return 'bg-border text-textSecondary min-w-[80px] justify-center';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open': return <Clock className="w-4 h-4" />;
      case 'Pending': return <Timer className="w-4 h-4" />;
      case 'Closed': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    return t(`tasks.statusLabels.${status}`, status);
  };

  const fetchComments = async (taskId: number) => {
    try {
      const response = await client.api.fetch(`/api/public/comments?taskId=${taskId}`);
      const result = await response.json();
      
      if (result.success) {
        setComments(result.comments);
        setTotalComments(result.totalComments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };
  
  const fetchCommentCount = async (taskId: number) => {
    try {
      const response = await client.api.fetch(`/api/public/comments?taskId=${taskId}&countOnly=true`);
      const result = await response.json();
      
      if (result.success) {
        setTaskCommentCounts(prev => ({
          ...prev,
          [taskId]: result.totalComments
        }));
      }
    } catch (error) {
      console.error('Error fetching comment count:', error);
    }
  };
  
  const openCommentModal = async (taskId: number) => {
    setShowCommentModal(taskId);
    await fetchComments(taskId);
  };

  const submitComment = async (taskId: number) => {
    if (!newComment.trim() || !userInfo) return;

    try {
      const response = await client.api.fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: taskId,
          content: newComment,
          commenter_name: userInfo.display_name,
          commenter_avatar: userInfo.photo_url,
          parent_id: replyToComment ? replyToComment.id : null
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setNewComment('');
        setReplyToComment(null);
        
        // Refresh comment count for the task
        await fetchCommentCount(taskId);
        
        if (showCommentModal === taskId) {
          await fetchComments(taskId);
        }
      } else {
        await alert({
          type: 'error',
          title: t('common.error', '错误'),
          message: t('admin.messages.commentFailed') + result.error
        });
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      await alert({
        type: 'error',
        title: t('common.error', '错误'),
        message: t('admin.messages.tryAgain')
      });
    }
  };
  
  const likeComment = async (commentId: number) => {
    if (!userInfo) {
      await alert({
        type: 'warning',
        title: t('common.warning', '警告'),
        message: t('admin.messages.loginRequired')
      });
      return;
    }
    
    try {
      const response = await client.api.fetch('/api/comments/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment_id: commentId
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        if (showCommentModal !== null) {
          await fetchComments(showCommentModal);
        }
      } else {
        await alert({
          type: 'error',
          title: t('common.error', '错误'),
          message: t('admin.messages.tryAgain', '请稍后重试')
        });
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      await alert({
        type: 'error',
        title: t('common.error', '错误'),
        message: t('admin.messages.tryAgain')
      });
    }
  };

  const openSubmitDialog = async (task: Task) => {
    if (!userInfo?.display_name) {
      await alert({
        type: 'warning',
        title: t('common.warning', '警告'),
        message: t('admin.messages.loginRequired')
      });
      return;
    }
    
    // 检查任务是否已关闭或者有获奖项目
    const hasWinner = winningSubmissions[task.id];
    if (task.status !== 'Open' || hasWinner || task.winner_url) {
      await alert({
        type: 'warning',
        title: t('common.warning', '警告'),
        message: t('admin.messages.cannotSubmit', 'This task is currently not accepting new submissions')
      });
      return;
    }

    setSubmitDialogTask(task);
    setProjectUrl('');
    setSocialMediaUrl('');
  };

  const validateProjectUrl = (url: string): boolean => {
    try {
      const u = new URL(url);
      return u.protocol === 'https:' && u.hostname.length > 0;
    } catch {
      return false;
    }
  };

  const validateSocialMediaUrl = (url: string): boolean => {
    // 简化验证：只要是有效的 HTTPS URL 即可
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:' && urlObj.hostname.length > 0;
    } catch {
      return false;
    }
  };

  const submitTask = async () => {
    if (!projectUrl.trim() || !socialMediaUrl.trim() || !submitDialogTask || !userInfo) return;
    
    if (!validateProjectUrl(projectUrl.trim())) {
      await alert({
        type: 'error',
        title: t('common.error', 'Error'),
        message: t('tasks.submitDialog.invalidUrl', 'Please enter a valid https:// URL')
      });
      return;
    }

    // 验证社媒URL是否有效
    if (!validateSocialMediaUrl(socialMediaUrl.trim())) {
      await alert({
        type: 'error',
        title: t('common.error', '错误'),
        message: t('tasks.submitDialog.invalidSocialUrl', '请提供有效的社媒分享链接（支持任何社交媒体平台）')
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await client.api.fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: submitDialogTask.id,
          project_url: projectUrl,
          social_media_url: socialMediaUrl,
          submitter_name: userInfo.display_name,
          submitter_avatar: userInfo.photo_url,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        const successMessage = result.isResubmission 
          ? t('admin.messages.resubmitSuccess', '重新提交成功！您的新项目已更新')
          : t('admin.messages.submitSuccess', '提交成功！');
          
        await alert({
          type: 'success',
          title: t('common.success', '成功'),
          message: successMessage
        });
        setSubmitDialogTask(null);
        onRefresh();
      } else {
        await alert({
          type: 'error',
          title: t('common.error', '错误'),
          message: t('admin.messages.submitFailed') + result.error
        });
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      await alert({
        type: 'error',
        title: t('common.error', '错误'),
        message: t('admin.messages.tryAgain')
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-xl">
      {/* Filters */}
      <div className="flex flex-wrap gap-lg p-lg bg-surface rounded-md shadow-level1">
        <div className="flex items-center gap-sm">
          <label className="text-sm font-body font-bold text-textPrimary">{t('tasks.sort')}</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-md py-xs border border-border rounded-md text-sm font-body text-textPrimary bg-surface"
          >
            <option value="created_at">{t('tasks.sortOptions.created_at')}</option>
            <option value="reward_amount">{t('tasks.sortOptions.reward_amount')}</option>
          </select>
        </div>
        
        <div className="flex flex-wrap items-center gap-md">
          <div className="flex items-center gap-sm">
            <label className="text-sm font-body font-bold text-textPrimary">{t('tasks.startDate')}</label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="px-md py-xs border border-border rounded-md text-sm font-body text-textPrimary bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-sm">
            <label className="text-sm font-body font-bold text-textPrimary">{t('tasks.endDate')}</label>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="px-md py-xs border border-border rounded-md text-sm font-body text-textPrimary bg-surface focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
      </div>
      {/* Status Tabs */}
      <div className="bg-surface rounded-lg shadow-level1 overflow-hidden">
        <div className="flex border-b border-border">
          {(['Open', 'Pending', 'Closed'] as const).map((status) => {
            // 从后端返回的状态统计中获取任务数量
            const taskCount = statusStats[status] || 0;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex-1 px-xl py-lg font-body font-bold text-sm transition-all relative ${
                  statusFilter === status
                    ? 'bg-primary/5 text-primary border-b-2 border-primary'
                    : 'text-textSecondary hover:text-textPrimary hover:bg-background'
                }`}
              >
                <div className="flex items-center justify-center gap-sm">
                  {getStatusIcon(status)}
                  {t(`tasks.statusOptions.${status}`)}
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(status)}`}>
                    {taskCount}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {/* Task List By Date */}
      <div className="space-y-xl">
        {loading ? (
          <div className="text-center py-xl">
            <p className="text-textSecondary font-body">{t('tasks.loading')}</p>
          </div>
        ) : (
          <>
            {Object.keys(tasksByDate).length > 0 ? (
              Object.keys(tasksByDate)
                .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                .map(date => (
                <div key={date} className="space-y-md">
                  <h2 className="text-lg font-heading font-bold text-textPrimary border-b border-border pb-xs">
                    {new Date(date).toLocaleDateString()}
                  </h2>
                  
                  <div className="grid gap-md">
                    {tasksByDate[date].map((task, index) => {
                      const hasWinner = winningSubmissions[task.id];
                      const isCompleted = hasWinner || task.status === 'Closed' || task.winner_url;
                      
                      return (
                        <div key={task.id} className="bg-surface rounded-md shadow-level1 border border-border relative">
                          <div className="flex flex-col md:flex-row">
                            {/* Task Number Badge */}
                            <div className="absolute top-2 left-2 bg-primary text-surface text-xs font-bold px-2 py-1 rounded-md z-10">
                              #{task.id}
                            </div>
                            

                          
                          {/* Task Cover */}
                          {task.cover_image && (
                            <div className="md:w-64 h-48 md:h-auto relative" style={{ aspectRatio: '4/3' }}>
                              <img
                                src={task.cover_image}
                                alt={task.title}
                                className="w-full h-full object-cover rounded-t-md md:rounded-l-md md:rounded-t-none absolute inset-0"
                              />
                            </div>
                          )}
                          
                          {/* Task Content */}
                          <div className="flex-1 p-xl">
                            <div className="flex justify-between items-start mb-lg relative">
                              <div>
                                <h3 className="text-xl font-heading font-bold text-textPrimary mb-sm">
                                  {task.title}
                                </h3>
                              </div>
                              <div className="absolute top-0 right-0">
                                <span className={`inline-flex items-center gap-xs px-md py-sm text-sm font-body font-bold rounded-md ${getStatusColor(task.status)}`}>
                                  {getStatusIcon(task.status)}
                                  {getStatusText(task.status)}
                                </span>
                              </div>
                            </div>
                            
                            <p className="text-textSecondary font-body mb-lg line-clamp-5">
                              {task.description}
                            </p>
                            
                            <div className="flex items-center justify-between text-sm text-textSecondary font-body mb-lg">
                              <div className="flex items-center gap-lg">
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-xs" style={{ color: '#55644A' }} />
                                  <span className="text-base font-semibold" style={{ color: '#55644A' }}>
                                    {Math.floor((new Date().getTime() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24))}{t('tasks.daysAgo')}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <Users className="w-4 h-4 mr-xs" style={{ color: '#55644A' }} />
                                  <span className="text-base font-semibold" style={{ color: '#55644A' }}>
                                    {task.display_participants_count || task.participants_count} {t('tasks.participants')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Action Buttons and Rewards */}
                            <div className="flex justify-between items-center">
                              <div className="flex gap-md">
                                <button
                                  onClick={() => openSubmitDialog(task)}
                                  disabled={(task.status !== 'Open' || !userInfo?.display_name || !!winningSubmissions[task.id])}
                                  className={`px-lg py-sm rounded-md font-body font-bold ${
                                    task.status === 'Open' && userInfo?.display_name && !winningSubmissions[task.id]
                                      ? 'bg-primary text-surface hover:bg-primary/90'
                                      : 'bg-border text-textSecondary cursor-not-allowed'
                                  }`}
                                >
                                  {task.status === 'Open' && !winningSubmissions[task.id] ? t('tasks.submitTask') : t('tasks.cannotSubmit')}
                                </button>
                                
                                <button
                                  onClick={() => openCommentModal(task.id)}
                                  className="px-lg py-sm bg-secondary text-textPrimary rounded-md hover:bg-border flex items-center gap-sm font-body font-bold"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  {t('tasks.comment')}
                                  {taskCommentCounts[task.id] > 0 && (
                                    <span className="ml-1 bg-primary text-surface text-xs px-1.5 py-0.5 rounded-full">
                                      {taskCommentCounts[task.id]}
                                    </span>
                                  )}
                                </button>
                                
                                {/* View Winner Project Button */}
                                {(hasWinner || task.winner_url) && (
                                  <button
                                    onClick={() => window.open(task.winner_url || hasWinner?.project_url, '_blank')}
                                    className="px-lg py-sm bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-sm font-body font-bold"
                                  >
                                    <Award className="w-4 h-4" />
                                    {t('tasks.viewWinnerProject')}
                                  </button>
                                )}
                              </div>
                              
                              <div className="text-right">
                                <div className="flex items-center text-primary font-heading font-bold text-2xl">
                                  <Coins className="w-6 h-6 mr-sm" />
                                  ${task.reward_amount}
                                </div>
                              </div>
                            </div>
                          </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-2xl text-textSecondary font-body">
                <p>{t('tasks.noTasks')}</p>
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-md mt-xl">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-sm rounded-md ${currentPage === 1 ? 'text-textSecondary cursor-not-allowed' : 'text-textPrimary hover:bg-secondary'}`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="text-sm font-body">
                  {t('tasks.pagination', { current: currentPage, total: totalPages })}
                </div>
                
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`p-sm rounded-md ${currentPage === totalPages ? 'text-textSecondary cursor-not-allowed' : 'text-textPrimary hover:bg-secondary'}`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {/* Submit Dialog */}
      {submitDialogTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-md p-xl w-full max-w-md shadow-level3">
            <h3 className="text-lg font-heading font-bold mb-lg text-textPrimary">{t('tasks.submitDialog.title', { title: submitDialogTask.title })}</h3>
            
            <div className="mb-lg">
              <label className="block text-sm font-body font-bold text-textPrimary mb-sm">
                {t('tasks.submitDialog.projectUrl')}
              </label>
              <input
                type="url"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                placeholder={t('tasks.submitDialog.placeholder')}
                className="w-full px-md py-sm border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary font-body text-textPrimary bg-surface"
              />
              <p className="text-xs text-textSecondary font-body mt-xs">
                {t('tasks.submitDialog.note')}
              </p>
            </div>
            
            <div className="mb-lg">
              <label className="block text-sm font-body font-bold text-textPrimary mb-sm">
                {t('tasks.submitDialog.socialMediaUrl')} 
              </label>
              <input
                type="url"
                value={socialMediaUrl}
                onChange={(e) => setSocialMediaUrl(e.target.value)}
                placeholder={t('tasks.submitDialog.socialMediaPlaceholder')}
                className="w-full px-md py-sm border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary font-body text-textPrimary bg-surface"
                required
              />
              <p className="text-xs text-textSecondary font-body mt-xs">
                {t('tasks.submitDialog.socialMediaNote')}
              </p>
            </div>
            
            <div className="flex gap-md">
              <button
                onClick={submitTask}
                disabled={!projectUrl.trim() || !socialMediaUrl.trim() || submitting}
                className={`flex-1 py-sm rounded-md font-body font-bold ${
                  projectUrl.trim() && socialMediaUrl.trim() && !submitting
                    ? 'bg-primary text-surface hover:bg-primary/90'
                    : 'bg-border text-textSecondary cursor-not-allowed'
                }`}
              >
                {submitting ? t('tasks.submitDialog.submitting') : t('tasks.submitDialog.submit')}
              </button>
              <button
                onClick={() => setSubmitDialogTask(null)}
                className="px-lg py-sm bg-secondary text-textPrimary rounded-md hover:bg-border font-body font-bold"
              >
                {t('tasks.submitDialog.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Comments Modal */}
      {showCommentModal !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <i className="hgi-stroke hgi-bubble-chat text-primary w-4 h-4"></i>
                </div>
                <div>
                  <h3 className="text-lg font-heading font-bold text-textPrimary">
                    {t('tasks.comments.title', '评论详情')}
                  </h3>
                  <p className="text-sm text-textSecondary">
                    {totalComments > 0 ? t('tasks.comments.allComments', {count: totalComments}) : t('tasks.comments.noComments')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCommentModal(null);
                  setReplyToComment(null);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-textSecondary hover:text-textPrimary hover:bg-secondary transition-colors"
              >
                <i className="hgi-stroke hgi-cancel-01 w-4 h-4"></i>
              </button>
            </div>
            
            {/* Add Comment */}
            {userInfo?.display_name && (
              <div className="mb-6 bg-background rounded-lg p-4 border border-border">
                {replyToComment && (
                  <div className="bg-primary/5 border border-primary/20 p-3 mb-3 rounded-md flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <i className="hgi-stroke hgi-mail-reply-01 text-primary w-4 h-4"></i>
                      <span className="text-sm text-textPrimary">
                        {t('tasks.comments.replyingTo', '回复 {{name}}', { name: replyToComment.commenter_name || t('tasks.comments.anonymous', '匿名用户') })}
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        setReplyToComment(null);
                        setNewComment('');
                      }}
                      className="text-xs text-textSecondary hover:text-error px-2 py-1 rounded-md hover:bg-error/10 transition-colors flex items-center gap-1"
                    >
                      <i className="hgi-stroke hgi-cancel-01 w-3 h-3"></i>
                      {t('common.cancel', '取消')}
                    </button>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    {userInfo.photo_url ? (
                      <img
                        src={userInfo.photo_url}
                        alt="Your Avatar"
                        className="w-10 h-10 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold text-sm">
                          {userInfo.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={t('tasks.comments.placeholder', '写评论 (最多50个字符)...')}
                      maxLength={50}
                      rows={3}
                      className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary font-body text-textPrimary bg-surface resize-none"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          submitComment(showCommentModal);
                        }
                      }}
                    />
                    
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-textSecondary">
                        {newComment.length}/50
                      </span>
                      
                      <button
                        onClick={() => submitComment(showCommentModal)}
                        disabled={!newComment.trim()}
                        className={`px-4 py-2 rounded-md flex items-center gap-2 font-body font-medium text-sm transition-colors ${
                          newComment.trim()
                            ? 'bg-primary text-white hover:bg-primary/90'
                            : 'bg-border text-textSecondary cursor-not-allowed'
                        }`}
                      >
                        <i className="hgi-stroke hgi-arrow-right-01 w-4 h-4"></i>
                        {t('tasks.comments.send', '发布')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Comments List */}
            <div className="space-y-3 overflow-y-auto flex-1 pr-2">
              {(() => {
                // 组织评论为树状结构
                const topLevelComments = comments.filter(comment => !comment.parent_id);
                const replyComments = comments.filter(comment => comment.parent_id);
                
                // 为每个顶级评论找到其回复
                const commentTree = topLevelComments.map(parent => ({
                  ...parent,
                  replies: replyComments.filter(reply => reply.parent_id === parent.id)
                }));
                
                // 渲染评论组件
                const renderComment = (comment: Comment, isReply = false) => (
                  <div key={comment.id} className={`${isReply ? 'ml-12 mt-3' : ''}`}>
                    <div className={`flex gap-3 p-3 rounded-lg transition-colors ${
                      isReply 
                        ? 'bg-surface hover:bg-secondary/20 border-l-2 border-primary/20' 
                        : 'bg-background hover:bg-secondary/30'
                    }`}>
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {comment.commenter_avatar ? (
                          <img
                            src={comment.commenter_avatar}
                            alt="Avatar"
                            className={`rounded-full object-cover border-2 border-border ${
                              isReply ? 'w-8 h-8' : 'w-10 h-10'
                            }`}
                          />
                        ) : (
                          <div className={`rounded-full bg-primary/10 flex items-center justify-center ${
                            isReply ? 'w-8 h-8' : 'w-10 h-10'
                          }`}>
                            <span className={`text-primary font-bold ${isReply ? 'text-xs' : 'text-sm'}`}>
                              {(comment.commenter_name || t('tasks.comments.anonymous', '匿名用户')).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Comment Content */}
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-semibold text-textPrimary truncate ${
                            isReply ? 'text-xs' : 'text-sm'
                          }`}>
                            {comment.commenter_name || t('tasks.comments.anonymous', '匿名用户')}
                          </span>
                          <span className="text-xs text-textSecondary whitespace-nowrap">
                            {new Date(comment.created_at).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: 'numeric',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        
                        {/* Comment Text */}
                        <p className={`text-textPrimary mb-3 leading-relaxed ${
                          isReply ? 'text-xs' : 'text-sm'
                        }`}>
                          {comment.content}
                        </p>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => likeComment(comment.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
                              comment.likes_count && comment.likes_count > 0 
                                ? 'text-primary hover:bg-primary/10 bg-primary/5' 
                                : 'text-textSecondary hover:text-primary hover:bg-secondary'
                            }`}
                          >
                            <i className="hgi-stroke hgi-thumbs-up w-3.5 h-3.5"></i>
                            <span className="font-medium">
                              {comment.likes_count && comment.likes_count > 0 ? `${comment.likes_count} ` : ''}{t('tasks.comments.like', '点赞')}
                            </span>
                          </button>
                          
                          {!isReply && (
                            <button
                              onClick={() => {
                                setReplyToComment(comment);
                                setNewComment(`@${comment.commenter_name || t('tasks.comments.anonymous', '匿名用户')} `);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-textSecondary hover:text-primary hover:bg-secondary transition-colors"
                            >
                              <i className="hgi-stroke hgi-mail-reply-01 w-3.5 h-3.5"></i>
                              <span className="font-medium">{t('tasks.comments.reply', '回复')}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
                
                return (
                  <>
                    {commentTree.map(parentComment => (
                      <div key={parentComment.id}>
                        {/* 渲染父评论 */}
                        {renderComment(parentComment, false)}
                        
                        {/* 渲染回复评论 */}
                        {parentComment.replies.map(reply => renderComment(reply, true))}
                      </div>
                    ))}
                    
                    {comments.length === 0 && (
                      <div className="text-center py-12">
                        <div className="flex justify-center mb-4">
                          <i className="hgi-stroke hgi-bubble-chat text-textSecondary/30 w-16 h-16"></i>
                        </div>
                        <p className="text-textSecondary text-sm font-body">
                          {t('tasks.comments.noComments', '还没有评论，快来抢沙发吧～')}
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksTab;