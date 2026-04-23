import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Submission } from '../types';
import { Calendar, ExternalLink, Award, Clock, XCircle, Edit, X } from 'lucide-react';
import { useAlert } from './AlertModalProvider';
import { client } from "@/lib/edgespark";

interface SubmissionsTabProps {
  submissions: Submission[];
  userInfo: any;
  onRefresh: () => void;
}

const SubmissionsTab: React.FC<SubmissionsTabProps> = ({ submissions, userInfo, onRefresh }) => {
  const { t } = useTranslation();
  const { alert } = useAlert();
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
  const [projectUrl, setProjectUrl] = useState('');
  const [socialMediaUrl, setSocialMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-link/10 text-link';
      case 'not_awarded': return 'bg-error/10 text-error';
      case 'awarded': return 'bg-primary/10 text-primary';
      default: return 'bg-border text-textSecondary';
    }
  };

  const getStatusText = (status: string) => {
    return t(`submissions.statusLabels.${status}`, status);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <Clock className="w-4 h-4" />;
      case 'not_awarded': return <XCircle className="w-4 h-4" />;
      case 'awarded': return <Award className="w-4 h-4" />;
      default: return null;
    }
  };

  const openEditDialog = (submission: Submission) => {
    setEditingSubmission(submission);
    setProjectUrl(submission.project_url);
    setSocialMediaUrl(submission.social_media_url || '');
  };
  
  const closeEditDialog = () => {
    setEditingSubmission(null);
    setProjectUrl('');
    setSocialMediaUrl('');
  };
  
  const handleEditSubmission = async () => {
    if (!projectUrl.trim() || !socialMediaUrl.trim() || !editingSubmission) return;
    
    setIsSubmitting(true);
    try {
      const response = await client.api.fetch(`/api/submissions/${editingSubmission.id}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_url: projectUrl,
          social_media_url: socialMediaUrl,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        await alert({
          type: 'success',
          title: t('common.success', '成功'),
          message: t('submissions.editSuccess', '修改成功！')
        });
        closeEditDialog();
        onRefresh();
      } else {
        await alert({
          type: 'error',
          title: t('common.error', '错误'),
          message: t('submissions.editFailed', '修改失败：') + (result.error || '未知错误')
        });
      }
    } catch (error) {
      console.error('Error editing submission:', error);
      await alert({
        type: 'error',
        title: t('common.error', '错误'),
        message: t('admin.messages.tryAgain', '请稍后重试')
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Edit Dialog */}
      {editingSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-md">
          <div className="bg-surface rounded-lg shadow-level2 p-xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-lg">
              <h3 className="text-xl font-heading font-bold text-textPrimary">
                {t('common.edit', '编辑')}
              </h3>
              <button 
                onClick={closeEditDialog} 
                className="text-textSecondary hover:text-textPrimary"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-lg">
              <label className="block text-sm font-body font-bold text-textSecondary mb-xs">
                {t('submissions.projectUrl')}
              </label>
              <input
                type="text"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                className="w-full px-md py-sm border border-border rounded-md text-textPrimary font-body"
                placeholder="https://"
              />
            </div>
            
            <div className="mb-lg">
              <label className="block text-sm font-body font-bold text-textSecondary mb-xs">
                {t('submissions.socialMediaUrl')}
              </label>
              <input
                type="text"
                value={socialMediaUrl}
                onChange={(e) => setSocialMediaUrl(e.target.value)}
                className="w-full px-md py-sm border border-border rounded-md text-textPrimary font-body"
                placeholder={t('submissions.socialMediaPlaceholder')}
              />
            </div>
            
            <div className="flex justify-end gap-md">
              <button
                onClick={closeEditDialog}
                className="px-lg py-sm bg-secondary text-textSecondary rounded-md hover:bg-border font-body font-bold"
                disabled={isSubmitting}
              >
                {t('common.cancel', '取消')}
              </button>
              <button
                onClick={handleEditSubmission}
                className="px-lg py-sm bg-primary text-white rounded-md hover:bg-primary/90 font-body font-bold"
                disabled={isSubmitting || !projectUrl.trim() || !socialMediaUrl.trim()}
              >
                {isSubmitting ? t('common.submitting', '提交中...') : t('common.confirm', '确认')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        <div className="bg-primary/10 p-lg rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary font-body font-bold">{t('submissions.totalSubmissions')}</p>
              <p className="text-2xl font-heading font-bold text-primary">
                {submissions.length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-primary" />
          </div>
        </div>
        
        <div className="bg-primary/20 p-lg rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary font-body font-bold">{t('submissions.awards')}</p>
              <p className="text-2xl font-heading font-bold text-primary">
                {submissions.filter(s => s.submission_status === 'awarded').length}
              </p>
            </div>
            <Award className="w-8 h-8 text-primary" />
          </div>
        </div>
        
        <div className="bg-secondary p-lg rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-textSecondary font-body font-bold">{t('submissions.pending')}</p>
              <p className="text-2xl font-heading font-bold text-textPrimary">
                {submissions.filter(s => s.submission_status === 'submitted').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-textSecondary" />
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-lg">
        {submissions.length > 0 ? (
          submissions.map((submission) => (
            <div key={submission.id} className="bg-surface rounded-md shadow-level1 border border-border p-xl">
              <div className="flex justify-between items-start mb-lg">
                <div className="flex-1">
                  <h3 className="text-lg font-heading font-bold text-textPrimary mb-sm">
                    {submission.task_title}
                  </h3>
                  <div className="flex items-center gap-sm mb-sm">
                    <span className={`inline-flex items-center gap-xs px-sm py-xs text-xs font-body font-bold rounded-sm ${getStatusColor(submission.submission_status)}`}>
                      {getStatusIcon(submission.submission_status)}
                      {getStatusText(submission.submission_status)}
                    </span>
                    {submission.reward_amount && (
                      <span className="text-sm text-textSecondary font-body">
                        {t('submissions.bounty', { amount: submission.reward_amount })}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center text-sm text-textSecondary font-body mb-md">
                    <Calendar className="w-4 h-4 mr-xs" />
                    {t('submissions.submitTime', { time: new Date(submission.submitted_at).toLocaleString() })}
                  </div>
                  
                  <div className="flex items-center gap-md">
                    <a
                      href={submission.project_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-xs text-link hover:text-link/80 text-sm font-body font-bold"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {t('submissions.viewProject')}
                    </a>
                    
                    {/* 编辑按钮，仅在任务状态为Open时显示 */}
                    {submission.task_status === 'Open' && (
                      <button
                        onClick={() => openEditDialog(submission)}
                        className="inline-flex items-center gap-xs text-link hover:text-link/80 text-sm font-body font-bold"
                      >
                        <Edit className="w-4 h-4" />
                        {t('common.edit', '编辑')}
                      </button>
                    )}
                  </div>
                  
                  {submission.notes && (
                    <div className="mt-md p-md bg-secondary rounded-md">
                      <p className="text-sm text-textPrimary font-body">
                        <span className="font-bold">{t('submissions.reviewNotes')}</span>
                        {submission.notes}
                      </p>
                    </div>
                  )}
                </div>
                
                {submission.submission_status === 'awarded' && (
                  <div className="ml-lg">
                    <div className="bg-primary/10 text-primary px-md py-sm rounded-sm text-sm font-body font-bold">
                      {t('submissions.awardedWork')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-2xl text-textSecondary font-body">
            <Clock className="w-16 h-16 mx-auto mb-lg text-border" />
            <h3 className="text-lg font-heading font-bold mb-sm text-textPrimary">{t('submissions.noSubmissions')}</h3>
            <p>{t('submissions.noSubmissionsDesc')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionsTab;