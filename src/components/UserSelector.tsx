
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User, Settings } from "lucide-react";
import { useUser, User as UserType } from "@/contexts/UserContext";

const UserSelector = () => {
  const { currentUser, setCurrentUser, getUsersByRole } = useUser();
  
  const allUsers = [
    ...getUsersByRole('IC'),
    ...getUsersByRole('EC'),
    ...getUsersByRole('POA'),
    ...getUsersByRole('Admin')
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'IC': return 'bg-blue-100 text-blue-800';
      case 'EC': return 'bg-green-100 text-green-800';
      case 'POA': return 'bg-purple-100 text-purple-800';
      case 'Admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUserChange = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Settings className="w-4 h-4" />
          <span>Current User</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Select value={currentUser?.id} onValueChange={handleUserChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select user..." />
            </SelectTrigger>
            <SelectContent>
              {allUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>{user.name}</span>
                    <Badge className={getRoleColor(user.role)} variant="outline">
                      {user.role}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {currentUser && (
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center justify-between">
                <span>Role:</span>
                <Badge className={getRoleColor(currentUser.role)}>
                  {currentUser.role}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Department:</span>
                <span className="text-right">{currentUser.department}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserSelector;
