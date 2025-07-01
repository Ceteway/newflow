
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'IC' | 'EC' | 'POA' | 'Admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
}

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  hasPermission: (action: string) => boolean;
  getUsersByRole: (role: UserRole) => User[];
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@safaricom.co.ke',
    role: 'IC',
    department: 'Legal - In-House Counsel'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@lawfirm.co.ke',
    role: 'EC',
    department: 'External Counsel'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.johnson@safaricom.co.ke',
    role: 'POA',
    department: 'Property Operations'
  },
  {
    id: '4',
    name: 'Admin User',
    email: 'admin@safaricom.co.ke',
    role: 'Admin',
    department: 'System Administration'
  }
];

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(mockUsers[0]); // Default to IC user

  const rolePermissions = {
    IC: ['create-instruction', 'view-dashboard', 'assign-external-counsel', 'approve-documents', 'generate-reports'],
    EC: ['view-assigned-instructions', 'upload-documents', 'update-status', 'generate-documents'],
    POA: ['view-all-instructions', 'manage-properties', 'generate-reports'],
    Admin: ['manage-users', 'view-all', 'system-settings', 'manage-templates', 'generate-reports']
  };

  const hasPermission = (action: string): boolean => {
    if (!currentUser) return false;
    return rolePermissions[currentUser.role]?.includes(action) || false;
  };

  const getUsersByRole = (role: UserRole): User[] => {
    return mockUsers.filter(user => user.role === role);
  };

  return (
    <UserContext.Provider value={{
      currentUser,
      setCurrentUser,
      hasPermission,
      getUsersByRole
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
