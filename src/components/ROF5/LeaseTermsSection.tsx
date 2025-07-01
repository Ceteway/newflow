
import { DollarSign } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROF5FormData } from "@/hooks/useROF5Form";

interface LeaseTermsSectionProps {
  formData: ROF5FormData;
  onInputChange: (field: keyof ROF5FormData, value: string) => void;
}

const LeaseTermsSection = ({ formData, onInputChange }: LeaseTermsSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <DollarSign className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Lease Terms</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="leaseType">Lease Type *</Label>
          <Select value={formData.leaseType} onValueChange={(value) => onInputChange("leaseType", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Lease Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lease">Lease Agreement</SelectItem>
              <SelectItem value="licence">Licence Agreement</SelectItem>
              <SelectItem value="agreement-to-lease">Agreement to Lease</SelectItem>
              <SelectItem value="wayleave">Wayleave Agreement</SelectItem>
              <SelectItem value="easement">Easement Agreement</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="leaseTerm">Lease Term (Years) *</Label>
          <Input
            id="leaseTerm"
            type="number"
            value={formData.leaseTerm}
            onChange={(e) => onInputChange("leaseTerm", e.target.value)}
            placeholder="e.g., 10"
            required
          />
        </div>
        <div>
          <Label htmlFor="commencementDate">Commencement Date *</Label>
          <Input
            id="commencementDate"
            type="date"
            value={formData.commencementDate}
            onChange={(e) => onInputChange("commencementDate", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="monthlyRent">Monthly Rent (KES) *</Label>
          <Input
            id="monthlyRent"
            type="number"
            value={formData.monthlyRent}
            onChange={(e) => onInputChange("monthlyRent", e.target.value)}
            placeholder="e.g., 50000"
            required
          />
        </div>
        <div>
          <Label htmlFor="deposit">Security Deposit (KES)</Label>
          <Input
            id="deposit"
            type="number"
            value={formData.deposit}
            onChange={(e) => onInputChange("deposit", e.target.value)}
            placeholder="e.g., 100000"
          />
        </div>
        <div>
          <Label htmlFor="rentEscalation">Rent Escalation (% p.a.)</Label>
          <Input
            id="rentEscalation"
            type="number"
            value={formData.rentEscalation}
            onChange={(e) => onInputChange("rentEscalation", e.target.value)}
            placeholder="5"
          />
        </div>
      </div>
    </div>
  );
};

export default LeaseTermsSection;
