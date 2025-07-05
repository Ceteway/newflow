
import { Zap, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormActionsProps {
  onSaveDraft?: () => void;
  isSubmitting?: boolean;
  onDownloadROF5?: () => void;
}

const FormActions = ({ onSaveDraft, isSubmitting = false, onDownloadROF5 }: FormActionsProps) => {
  return (
    <div className="flex justify-between items-center">
      <div className="flex space-x-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onSaveDraft}
          disabled={isSubmitting}
        >
          Save as Draft
        </Button>
        
        {onDownloadROF5 && (
          <Button 
            type="button" 
            variant="outline"
            onClick={onDownloadROF5}
            disabled={isSubmitting}
            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
          >
            <FileText className="w-4 h-4 mr-2" />
            Download ROF5 (Word)
          </Button>
        )}
      </div>
      
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
