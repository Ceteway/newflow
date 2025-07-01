
import { Building } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROF5FormData } from "@/hooks/useROF5Form";

interface TitleDetailsSectionProps {
  formData: ROF5FormData;
  onInputChange: (field: keyof ROF5FormData, value: string) => void;
}

const TitleDetailsSection = ({ formData, onInputChange }: TitleDetailsSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Building className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Title Details</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="titleNumber">Title Number *</Label>
          <Input
            id="titleNumber"
            value={formData.titleNumber}
            onChange={(e) => onInputChange("titleNumber", e.target.value)}
            placeholder="e.g., NAIROBI/BLOCK1/123"
            required
          />
        </div>
        <div>
          <Label htmlFor="titleType">Title Type *</Label>
          <Select value={formData.titleType} onValueChange={(value) => onInputChange("titleType", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Title Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="freehold">Freehold</SelectItem>
              <SelectItem value="leasehold">Leasehold</SelectItem>
              <SelectItem value="sectional">Sectional Title</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="registrationSection">Registration Section</Label>
          <Input
            id="registrationSection"
            value={formData.registrationSection}
            onChange={(e) => onInputChange("registrationSection", e.target.value)}
            placeholder="Enter registration section"
          />
        </div>
        <div>
          <Label htmlFor="landArea">Land Area</Label>
          <Input
            id="landArea"
            value={formData.landArea}
            onChange={(e) => onInputChange("landArea", e.target.value)}
            placeholder="e.g., 0.5 hectares"
          />
        </div>
        <div>
          <Label htmlFor="landUse">Land Use</Label>
          <Select value={formData.landUse} onValueChange={(value) => onInputChange("landUse", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Land Use" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
              <SelectItem value="mixed">Mixed Use</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default TitleDetailsSection;
