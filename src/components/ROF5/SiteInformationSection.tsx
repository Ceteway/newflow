
import { MapPin } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROF5FormData } from "@/hooks/useROF5Form";

interface SiteInformationSectionProps {
  formData: ROF5FormData;
  onInputChange: (field: keyof ROF5FormData, value: string) => void;
}

const SiteInformationSection = ({ formData, onInputChange }: SiteInformationSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <MapPin className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Site Information</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="siteName">Site Name *</Label>
          <Input
            id="siteName"
            value={formData.siteName}
            onChange={(e) => onInputChange("siteName", e.target.value)}
            placeholder="e.g., Westlands Plaza"
            required
          />
        </div>
        <div>
          <Label htmlFor="siteCode">Site Code *</Label>
          <Input
            id="siteCode"
            value={formData.siteCode}
            onChange={(e) => onInputChange("siteCode", e.target.value)}
            placeholder="e.g., NBI001"
            required
          />
        </div>
        <div>
          <Label htmlFor="siteLocation">Site Location *</Label>
          <Input
            id="siteLocation"
            value={formData.siteLocation}
            onChange={(e) => onInputChange("siteLocation", e.target.value)}
            placeholder="e.g., Westlands, Nairobi"
            required
          />
        </div>
      </div>
    </div>
  );
};

export default SiteInformationSection;
