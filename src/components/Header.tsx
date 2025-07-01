
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Users,
  Plus,
  Zap
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import UserSelector from "@/components/UserSelector";
import { useUser } from "@/contexts/UserContext";

interface HeaderProps {
  onNewInstruction?: () => void;
}

const Header = ({ onNewInstruction }: HeaderProps) => {
  const { hasPermission } = useUser();

  return (
    <header className="relative bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 animate-fade-in">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Fanisi Workflow
            </h1>
            <p className="text-sm text-gray-600">Property Instruction Automation</p>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors">
            <Zap className="w-3 h-3 mr-1" />
            AI-Powered
          </Badge>
        </div>
        <div className="flex items-center space-x-3 animate-fade-in animation-delay-200">
          <NotificationBell />
          <UserSelector />
          {hasPermission('manage-users') && (
            <Button variant="outline" size="sm" className="hover:scale-105 transition-transform duration-200">
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </Button>
          )}
          {hasPermission('create-instruction') && (
            <Button 
              onClick={onNewInstruction}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Instruction
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
