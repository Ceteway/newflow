
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Zap } from "lucide-react";
import { useWorkflow } from "@/contexts/WorkflowContext";

const LocationMap = () => {
  const { instructions } = useWorkflow();

  // Group instructions by location for the map
  const locationData = instructions.reduce((acc, instruction) => {
    const location = instruction.siteLocation;
    if (!acc[location]) {
      acc[location] = {
        count: 0,
        instructions: [],
        coordinates: { lat: Math.random() * 2 - 1, lng: Math.random() * 2 - 1 } // Mock coordinates
      };
    }
    acc[location].count++;
    acc[location].instructions.push(instruction);
    return acc;
  }, {} as any);

  return (
    <Card className="bg-slate-800 border-slate-700 text-white">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-orange-400" />
          <span>Property Locations</span>
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-96 bg-slate-900 rounded-lg overflow-hidden">
          {/* Simulated Map Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900">
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
          </div>

          {/* Location Pins */}
          {Object.entries(locationData).map(([location, data]: [string, any], index) => (
            <div
              key={location}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{
                left: `${50 + data.coordinates.lng * 30}%`,
                top: `${50 + data.coordinates.lat * 30}%`
              }}
            >
              {/* Pin */}
              <div className="relative">
                <div className="w-6 h-6 bg-orange-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{data.count}</span>
                </div>
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-orange-500 rotate-45"></div>
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-700 rounded-lg p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                <p className="font-semibold text-sm">{location}</p>
                <p className="text-xs text-slate-300">{data.count} active instructions</p>
                <div className="mt-2 space-y-1">
                  {data.instructions.slice(0, 3).map((instruction: any) => (
                    <div key={instruction.id} className="text-xs text-slate-400">
                      {instruction.id} - {instruction.stage}
                    </div>
                  ))}
                  {data.count > 3 && (
                    <div className="text-xs text-orange-400">+{data.count - 3} more</div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Controls */}
          <div className="absolute top-4 right-4 space-y-2">
            <button className="w-8 h-8 bg-slate-700 rounded border border-slate-600 flex items-center justify-center text-slate-300 hover:bg-slate-600">
              <Navigation className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 bg-slate-700 rounded border border-slate-600 flex items-center justify-center text-slate-300 hover:bg-slate-600">
              <Zap className="w-4 h-4" />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-slate-700/90 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-slate-300">Active Instructions</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationMap;
