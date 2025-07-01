
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ROF5FormData } from "@/hooks/useROF5Form";

interface DocumentsReceivedSectionProps {
  formData: ROF5FormData;
  onDocumentCheck: (document: string, checked: boolean) => void;
}

const documentTypes = [
  "Title Deed Copy",
  "Survey Plan",
  "Consent to Lease",
  "Rates Clearance",
  "Land Control Board Consent",
  "Environmental Impact Assessment",
  "Building Plan Approval",
  "Other Permits"
];

const DocumentsReceivedSection = ({ formData, onDocumentCheck }: DocumentsReceivedSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Documents Received</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documentTypes.map((doc) => (
          <div key={doc} className="flex items-center space-x-2">
            <Checkbox
              id={doc}
              checked={formData.documentsReceived.includes(doc)}
              onCheckedChange={(checked) => onDocumentCheck(doc, checked as boolean)}
            />
            <Label htmlFor={doc} className="text-sm">{doc}</Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentsReceivedSection;
