
import { User } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROF5FormData } from "@/hooks/useROF5Form";

interface LandlordInformationSectionProps {
  formData: ROF5FormData;
  onInputChange: (field: keyof ROF5FormData, value: string) => void;
}

const LandlordInformationSection = ({ formData, onInputChange }: LandlordInformationSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <User className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Landlord Information</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="landlordName">Landlord Name *</Label>
          <Input
            id="landlordName"
            value={formData.landlordName}
            onChange={(e) => onInputChange("landlordName", e.target.value)}
            placeholder="Full name or company name"
            required
          />
        </div>
        <div>
          <Label htmlFor="landlordType">Landlord Type *</Label>
          <Select value={formData.landlordType} onValueChange={(value) => onInputChange("landlordType", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="government">Government Entity</SelectItem>
              <SelectItem value="cooperative">Cooperative</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="landlordAddress">Landlord Address *</Label>
          <Textarea
            id="landlordAddress"
            value={formData.landlordAddress}
            onChange={(e) => onInputChange("landlordAddress", e.target.value)}
            placeholder="Complete postal address"
            required
          />
        </div>
        <div>
          <Label htmlFor="landlordPhone">Phone Number</Label>
          <Input
            id="landlordPhone"
            value={formData.landlordPhone}
            onChange={(e) => onInputChange("landlordPhone", e.target.value)}
            placeholder="e.g., +254 700 000 000"
          />
        </div>
        <div>
          <Label htmlFor="landlordEmail">Email Address</Label>
          <Input
            id="landlordEmail"
            type="email"
            value={formData.landlordEmail}
            onChange={(e) => onInputChange("landlordEmail", e.target.value)}
            placeholder="landlord@example.com"
          />
        </div>
        <div>
          <Label htmlFor="landlordId">ID/Registration Number</Label>
          <Input
            id="landlordId"
            value={formData.landlordId}
            onChange={(e) => onInputChange("landlordId", e.target.value)}
            placeholder="ID or company registration number"
          />
        </div>
      </div>
    </div>
  );
};

export default LandlordInformationSection;
