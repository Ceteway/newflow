
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROF5FormData } from "@/hooks/useROF5Form";

interface AdditionalInformationSectionProps {
  formData: ROF5FormData;
  onInputChange: (field: keyof ROF5FormData, value: string) => void;
}

const AdditionalInformationSection = ({ formData, onInputChange }: AdditionalInformationSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Additional Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="instructingCounsel">Instructing Counsel *</Label>
          <Input
            id="instructingCounsel"
            value={formData.instructingCounsel}
            onChange={(e) => onInputChange("instructingCounsel", e.target.value)}
            placeholder="Name of instructing counsel"
            required
          />
        </div>
        <div>
          <Label htmlFor="urgencyLevel">Urgency Level</Label>
          <Select value={formData.urgencyLevel} onValueChange={(value) => onInputChange("urgencyLevel", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="expectedCompletionDate">Expected Completion Date</Label>
          <Input
            id="expectedCompletionDate"
            type="date"
            value={formData.expectedCompletionDate}
            onChange={(e) => onInputChange("expectedCompletionDate", e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="specialConditions">Special Conditions/Notes</Label>
        <Textarea
          id="specialConditions"
          value={formData.specialConditions}
          onChange={(e) => onInputChange("specialConditions", e.target.value)}
          placeholder="Any special conditions, requirements, or notes..."
          rows={4}
        />
      </div>
    </div>
  );
};

export default AdditionalInformationSection;
