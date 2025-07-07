import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { TemplateBackupService, TemplateBackup } from "@/utils/templateBackup";
import { 
  AlertTriangle, 
  Download, 
  Trash2, 
  CheckCircle, 
  Loader2,
  Shield,
  Database,
  RefreshCw
} from "lucide-react";

const TemplateCleanupManager = () => {
  const { toast } = useToast();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [backupCreated, setBackupCreated] = useState(false);
  const [removalComplete, setRemovalComplete] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    remainingCount: number;
    details: string;
  } | null>(null);

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    try {
      const backup = await TemplateBackupService.createBackup();
      TemplateBackupService.downloadBackup(backup);
      setBackupCreated(true);
      
      toast({
        title: "Backup Created Successfully",
        description: `Backed up ${backup.templates.length} system templates. Download started automatically.`,
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: error instanceof Error ? error.message : "Could not create backup",
        variant: "destructive"
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRemoveAllTemplates = async () => {
    if (!backupCreated) {
      toast({
        title: "Backup Required",
        description: "Please create a backup before removing templates",
        variant: "destructive"
      });
      return;
    }

    const confirmed = window.confirm(
      "⚠️ WARNING: This will permanently remove ALL system templates from the database.\n\n" +
      "Are you absolutely sure you want to proceed?\n\n" +
      "This action cannot be undone!"
    );

    if (!confirmed) return;

    setIsRemoving(true);
    try {
      const removedCount = await TemplateBackupService.removeAllTemplates();
      setRemovalComplete(true);
      
      toast({
        title: "Templates Removed Successfully",
        description: `Removed ${removedCount} system templates from the database.`,
      });
    } catch (error) {
      toast({
        title: "Removal Failed",
        description: error instanceof Error ? error.message : "Could not remove all templates",
        variant: "destructive"
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const handleVerifyRemoval = async () => {
    setIsVerifying(true);
    try {
      const result = await TemplateBackupService.verifyRemoval();
      setVerificationResult(result);
      
      if (result.success) {
        toast({
          title: "Verification Successful",
          description: "All system templates have been successfully removed",
        });
      } else {
        toast({
          title: "Verification Warning",
          description: `${result.remainingCount} templates still remain in the system`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Could not verify template removal",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>System Template Cleanup Manager</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warning Alert */}
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Important:</strong> This tool will permanently remove ALL system templates from your database. 
              Always create a backup before proceeding. This action cannot be undone.
            </AlertDescription>
          </Alert>

          {/* Step 1: Create Backup */}
          <Card className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span>Step 1: Create Backup</span>
                {backupCreated && <Badge className="bg-green-100 text-green-800">✓ Complete</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Create a complete backup of all system templates before removal. This backup can be used to restore templates if needed.
              </p>
              <Button 
                onClick={handleCreateBackup}
                disabled={isBackingUp}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isBackingUp ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Backup...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Create & Download Backup
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Step 2: Remove Templates */}
          <Card className="border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                <span>Step 2: Remove All Templates</span>
                {removalComplete && <Badge className="bg-green-100 text-green-800">✓ Complete</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Permanently remove all system templates from the database. This will clear the template storage completely.
              </p>
              <Button 
                onClick={handleRemoveAllTemplates}
                disabled={isRemoving || !backupCreated}
                variant="destructive"
              >
                {isRemoving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Removing Templates...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove All Templates
                  </>
                )}
              </Button>
              {!backupCreated && (
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ Backup required before removal
                </p>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Verify Removal */}
          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Step 3: Verify Removal</span>
                {verificationResult?.success && <Badge className="bg-green-100 text-green-800">✓ Verified</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Verify that all system templates have been successfully removed from the database.
              </p>
              <Button 
                onClick={handleVerifyRemoval}
                disabled={isVerifying || !removalComplete}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Verify Removal
                  </>
                )}
              </Button>
              
              {verificationResult && (
                <div className={`mt-4 p-3 rounded-lg ${
                  verificationResult.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm ${
                    verificationResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {verificationResult.details}
                  </p>
                  {!verificationResult.success && verificationResult.remainingCount > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      You may need to manually remove the remaining templates or check for permission issues.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Steps */}
          {verificationResult?.success && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-blue-800">System Ready for New Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-700 mb-3">
                  All system templates have been successfully removed. Your system is now ready for new template installation.
                </p>
                <div className="space-y-2 text-sm text-blue-600">
                  <p>✓ Template storage cleared</p>
                  <p>✓ Database cleaned</p>
                  <p>✓ Ready for new templates</p>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateCleanupManager;