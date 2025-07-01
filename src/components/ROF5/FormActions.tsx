
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormActionsProps {
  onSaveDraft?: () => void;
}

const FormActions = ({ onSaveDraft }: FormActionsProps) => {
  return (
    <div className="flex justify-end space-x-4">
      <Button type="button" variant="outline" onClick={onSaveDraft}>
        Save as Draft
      </Button>
      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
        <Zap className="w-4 h-4 mr-2" />
        Submit ROF 5 & Generate Documents
      </Button>
    </div>
  );
};

export default FormActions;
