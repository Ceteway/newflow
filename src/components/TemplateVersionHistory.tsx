import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SystemTemplate } from "@/services/systemTemplateService";
import { TemplateVersionService, TemplateVersion } from "@/services/templateVersionService";
import { 
  History, 
  Download, 
  Clock, 
  User,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Loader2
} from "lucide-react";

interface TemplateVersionHistoryProps {
  template: SystemTemplate;
  onClose: () => void;
}

const TemplateVersionHistory = ({ template, onClose }: TemplateVersionHistoryProps) => {
  const { toast } = useToast();
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<TemplateVersion | null>(null);
  const [comparing, setComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<{
    added: number;
    removed: number;
    changed: number;
    details: string;
  } | null>(null);

  useEffect(() => {
    loadVersionHistory();
  }, [template.id]);

  const loadVersionHistory = async () => {
    try {
      setLoading(true);
      const versionHistory = await TemplateVersionService.getVersionHistory(template.id);
      setVersions(versionHistory);
      
      // Add current version to the list
      const currentVersion: TemplateVersion = {
        id: 'current',
        template_id: template.id,
        version_number: versionHistory.length + 1,
        file_data: template.file_data,
        content_type: template.content_type,
        created_at: template.updated_at,
        created_by: template.uploaded_by || null,
        notes: 'Current version',
        is_current: true
      };
      
      setVersions([currentVersion, ...versionHistory]);
    } catch (error) {
      console.error('Failed to load version history:', error);
      toast({
        title: "Error",
        description: "Failed to load version history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadVersion = async (version: TemplateVersion) => {
    try {
      await TemplateVersionService.downloadVersion(version);
      toast({
        title: "Download Started",
        description: `Downloading version ${version.version_number}`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download the template version",
        variant: "destructive"
      });
    }
  };

  const handleCompareWithCurrent = async (version: TemplateVersion) => {
    if (version.is_current) return;
    
    try {
      setComparing(true);
      const result = await TemplateVersionService.compareVersions(version.id, 'current');
      setComparisonResult(result);
    } catch (error) {
      toast({
        title: "Comparison Failed",
        description: "Could not compare template versions",
        variant: "destructive"
      });
      setComparisonResult(null);
    } finally {
      setComparing(false);
    }
  };

  const handleRestoreVersion = async (version: TemplateVersion) => {
    if (version.is_current) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to restore version ${version.version_number}? This will create a new version based on this historical version.`
    );
    
    if (!confirmed) return;
    
    try {
      await TemplateVersionService.restoreVersion(version.id);
      toast({
        title: "Version Restored",
        description: `Version ${version.version_number} has been restored as the current version`,
      });
      onClose(); // Close and refresh
    } catch (error) {
      toast({
        title: "Restore Failed",
        description: "Could not restore the template version",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <History className="w-5 h-5" />
              <span>Version History: {template.name}</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 max-h-[calc(90vh-100px)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No version history available for this template.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Version List */}
              <div className="space-y-4">
                {versions.map((version) => (
                  <Card 
                    key={version.id} 
                    className={`hover:shadow-md transition-shadow ${
                      version.is_current ? 'border-blue-300 bg-blue-50' : ''
                    } ${selectedVersion?.id === version.id ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">
                              Version {version.version_number}
                            </h3>
                            {version.is_current && (
                              <Badge className="bg-blue-100 text-blue-800">
                                Current
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatDate(version.created_at)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>{version.created_by || 'Unknown user'}</span>
                            </div>
                          </div>
                          
                          {version.notes && (
                            <p className="text-sm text-gray-700 mb-3 bg-gray-50 p-2 rounded">
                              {version.notes}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          {!version.is_current && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCompareWithCurrent(version)}
                              className="text-blue-600"
                            >
                              <ArrowRight className="w-4 h-4 mr-1" />
                              Compare
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadVersion(version)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          {!version.is_current && (
                            <Button
                              size="sm"
                              onClick={() => handleRestoreVersion(version)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Restore
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Comparison Results */}
              {comparing && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
                  <span>Comparing versions...</span>
                </div>
              )}
              
              {comparisonResult && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Comparison Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-green-600 font-bold text-lg">{comparisonResult.added}</div>
                        <div className="text-sm text-gray-600">Additions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-red-600 font-bold text-lg">{comparisonResult.removed}</div>
                        <div className="text-sm text-gray-600">Removals</div>
                      </div>
                      <div className="text-center">
                        <div className="text-amber-600 font-bold text-lg">{comparisonResult.changed}</div>
                        <div className="text-sm text-gray-600">Changes</div>
                      </div>
                    </div>
                    
                    <div className="text-sm bg-white p-3 rounded border max-h-48 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-xs">
                        {comparisonResult.details}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Templates
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateVersionHistory;