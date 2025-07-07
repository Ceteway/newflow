import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import TemplateCleanupManager from "./TemplateCleanupManager";

const SystemTemplateCleanup = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
          <Trash2 className="w-4 h-4 mr-2" />
          Cleanup System Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>System Template Cleanup</DialogTitle>
        </DialogHeader>
        <TemplateCleanupManager />
      </DialogContent>
    </Dialog>
  );
};

export default SystemTemplateCleanup;