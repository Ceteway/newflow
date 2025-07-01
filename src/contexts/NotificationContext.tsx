
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  type: 'reminder' | 'deadline' | 'overdue' | 'status_change' | 'assignment';
  title: string;
  message: string;
  instructionId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  createdAt: string;
  dueDate?: string;
  actionRequired?: boolean;
}

export interface Reminder {
  id: string;
  instructionId: string;
  title: string;
  message: string;
  dueDate: string;
  frequency: 'once' | 'daily' | 'weekly';
  active: boolean;
  lastSent?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  reminders: Reminder[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  clearAllNotifications: () => void;
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  updateReminder: (reminderId: string, updates: Partial<Reminder>) => void;
  deleteReminder: (reminderId: string) => void;
  checkOverdueInstructions: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const { toast } = useToast();

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show toast for high priority notifications
    if (notification.priority === 'high' || notification.priority === 'critical') {
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.priority === 'critical' ? 'destructive' : 'default'
      });
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const addReminder = (reminder: Omit<Reminder, 'id'>) => {
    const newReminder: Reminder = {
      ...reminder,
      id: `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setReminders(prev => [...prev, newReminder]);
  };

  const updateReminder = (reminderId: string, updates: Partial<Reminder>) => {
    setReminders(prev => 
      prev.map(reminder => 
        reminder.id === reminderId ? { ...reminder, ...updates } : reminder
      )
    );
  };

  const deleteReminder = (reminderId: string) => {
    setReminders(prev => prev.filter(r => r.id !== reminderId));
  };

  const checkOverdueInstructions = () => {
    // This function will be called manually or triggered by external components
    // We removed the automatic dependency on WorkflowContext to prevent circular dependencies
    console.log('Checking overdue instructions - this should be triggered by external components');
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      reminders,
      unreadCount,
      addNotification,
      markAsRead,
      clearAllNotifications,
      addReminder,
      updateReminder,
      deleteReminder,
      checkOverdueInstructions
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
