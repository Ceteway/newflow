
import { FileText, Zap } from "lucide-react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FormHeaderProps {
  aiEnabled: boolean;
  onToggleAI: () => void;
}

const FormHeader = ({ aiEnabled, onToggleAI }: FormHeaderProps) => {
  return (
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="w-6 h-6" />
          <span>Request for Opinion Form 5 (ROF 5)</span>
          <Badge variant="outline" className="ml-2">Property Instruction</Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleAI}
            className={aiEnabled ? "bg-blue-50 border-blue-200" : ""}
          >
            <Zap className="w-4 h-4 mr-2" />
            AI {aiEnabled ? "On" : "Off"}
          </Button>
        </div>
      </CardTitle>
    </CardHeader>
  );
};

export default FormHeader;
