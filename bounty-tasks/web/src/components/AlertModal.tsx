import React, { useEffect, useState } from 'react';
import { X, Check, AlertTriangle, Info, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AlertModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  confirmText?: string;
  showCancelButton?: boolean;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  title,
  message,
  type = 'info',
  onClose,
  confirmText,
  showCancelButton = false,
  cancelText,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  if (!isOpen && !isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Check className="w-6 h-6 text-primary" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-error" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      default:
        return <Info className="w-6 h-6 text-primary" />;
    }
  };

  const getHeaderColor = () => {
    switch (type) {
      case 'success':
        return 'bg-primary/10';
      case 'error':
        return 'bg-red-100';
      case 'warning':
        return 'bg-yellow-100';
      default:
        return 'bg-blue-100';
    }
  };

  const getBtnClass = () => {
    switch (type) {
      case 'success':
        return 'bg-primary hover:bg-primary/90 text-white';
      case 'error':
        return 'bg-error hover:bg-error/90 text-white';
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      default:
        return 'bg-primary hover:bg-primary/90 text-white';
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div 
        className={`bg-surface rounded-lg shadow-level3 w-full max-w-md transform transition-transform ${
          isOpen ? 'scale-100' : 'scale-95'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`flex items-center gap-3 p-4 ${getHeaderColor()} rounded-t-lg`}>
          {getIcon()}
          <h3 className="text-lg font-heading font-bold text-black">
            {title || (type === 'success' ? t('common.success', '成功') : type === 'error' ? t('common.error', '错误') : type === 'warning' ? t('common.warning', '警告') : t('common.info', '提示'))}
          </h3>
          <button
            onClick={onClose}
            className="ml-auto text-gray-600 hover:text-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-black font-body whitespace-pre-wrap text-base leading-relaxed">{message}</p>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-border">
          {showCancelButton && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-body font-medium"
            >
              {cancelText || t('common.cancel', '取消')}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-md font-body font-medium ${getBtnClass()}`}
          >
            {confirmText || t('common.confirm', '确定')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;