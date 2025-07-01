
import { Separator } from "@/components/ui/separator";
import { ROF5FormData } from "@/hooks/useROF5Form";
import SiteInformationSection from "./SiteInformationSection";
import TitleDetailsSection from "./TitleDetailsSection";
import LandlordInformationSection from "./LandlordInformationSection";
import LeaseTermsSection from "./LeaseTermsSection";
import DocumentsReceivedSection from "./DocumentsReceivedSection";
import AdditionalInformationSection from "./AdditionalInformationSection";

interface FormSectionsProps {
  formData: ROF5FormData;
  onInputChange: (field: keyof ROF5FormData, value: string) => void;
  onDocumentCheck: (document: string, checked: boolean) => void;
}

const FormSections = ({ formData, onInputChange, onDocumentCheck }: FormSectionsProps) => {
  return (
    <div className="lg:col-span-2 space-y-8">
      <SiteInformationSection 
        formData={formData} 
        onInputChange={onInputChange} 
      />
      
      <Separator />
      
      <TitleDetailsSection 
        formData={formData} 
        onInputChange={onInputChange} 
      />
      
      <Separator />
      
      <LandlordInformationSection 
        formData={formData} 
        onInputChange={onInputChange} 
      />
      
      <Separator />
      
      <LeaseTermsSection 
        formData={formData} 
        onInputChange={onInputChange} 
      />
      
      <Separator />
      
      <DocumentsReceivedSection 
        formData={formData} 
        onDocumentCheck={onDocumentCheck} 
      />
      
      <Separator />
      
      <AdditionalInformationSection 
        formData={formData} 
        onInputChange={onInputChange} 
      />
    </div>
  );
};

export default FormSections;
