import React, { createContext, useState, useContext, ReactNode } from 'react';
import AlertModal from './AlertModal';

interface AlertOptions {
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  confirmText?: string;
  showCancelButton?: boolean;
  cancelText?: string;
}

interface AlertContextType {
  alert: (options: AlertOptions) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertModalProviderProps {
  children: ReactNode;
}

export const AlertModalProvider: React.FC<AlertModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AlertOptions>({
    message: '',
    type: 'info',
  });
  
  // Use a resolver function to handle the Promise resolution
  const [resolver, setResolver] = useState<(value: boolean) => void>(() => () => {});

  const alert = (options: AlertOptions): Promise<boolean> => {
    setOptions(options);
    setIsOpen(true);
    
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  };
  
  const handleClose = () => {
    setIsOpen(false);
    resolver(false);
  };
  
  const handleConfirm = () => {
    setIsOpen(false);
    resolver(true);
  };
  
  const handleCancel = () => {
    setIsOpen(false);
    resolver(false);
  };

  return (
    <AlertContext.Provider value={{ alert }}>
      {children}
      <AlertModal
        isOpen={isOpen}
        title={options.title}
        message={options.message}
        type={options.type}
        onClose={handleClose}
        confirmText={options.confirmText}
        showCancelButton={options.showCancelButton}
        cancelText={options.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertModalProvider');
  }
  return context;
};