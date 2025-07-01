
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search,
  Filter,
  Download
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";

const SearchFilterBar = () => {
  const { hasPermission } = useUser();

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-in-right">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search instructions by site code, landlord, or location..." 
              className="pl-10 border-0 bg-gray-50/50 focus:bg-white transition-colors duration-200"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="hover:scale-105 transition-transform duration-200">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            {hasPermission('generate-reports') && (
              <Button variant="outline" size="sm" className="hover:scale-105 transition-transform duration-200">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchFilterBar;
