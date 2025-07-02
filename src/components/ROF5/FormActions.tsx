
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormActionsProps {
  onSaveDraft?: () => void;
  isSubmitting?: boolean;
}

const FormActions = ({ onSaveDraft, isSubmitting = false }: FormActionsProps) => {
  return (
    <div className="flex justify-end space-x-4">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onSaveDraft}
        disabled={isSubmitting}
      >
        Save as Draft
      </Button>
      <Button 
        type="submit" 
        className="bg-blue-600 hover:bg-blue-700"
        disabled={isSubmitting}
      >
        <Zap className="w-4 h-4 mr-2" />
        {isSubmitting ? "Submitting..." : "Submit ROF 5 & Generate Documents"}
      </Button>
    </div>
  );
};

export default FormActions;
