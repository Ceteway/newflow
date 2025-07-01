import React, { useState } from 'react';
import { Plus, Bell, Trash2, Edit, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useNotifications, Reminder } from '@/contexts/NotificationContext';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { useToast } from '@/hooks/use-toast';

const ReminderManager = () => {
  const { reminders, addReminder, updateReminder, deleteReminder } = useNotifications();
  const { instructions } = useWorkflow();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [formData, setFormData] = useState({
    instructionId: '',
    title: '',
    message: '',
    dueDate: '',
    frequency: 'once' as 'once' | 'daily' | 'weekly',
    active: true
  });

  const resetForm = () => {
    setFormData({
      instructionId: '',
      title: '',
      message: '',
      dueDate: '',
      frequency: 'once',
      active: true
    });
    setEditingReminder(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.instructionId || !formData.title || !formData.dueDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (editingReminder) {
      updateReminder(editingReminder.id, formData);
      toast({
        title: "Reminder Updated",
        description: "The reminder has been updated successfully"
      });
    } else {
      addReminder(formData);
      toast({
        title: "Reminder Created",
        description: "The reminder has been created successfully"
      });
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      instructionId: reminder.instructionId,
      title: reminder.title,
      message: reminder.message,
      dueDate: reminder.dueDate,
      frequency: reminder.frequency,
      active: reminder.active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (reminderId: string) => {
    deleteReminder(reminderId);
    toast({
      title: "Reminder Deleted",
      description: "The reminder has been deleted successfully"
    });
  };

  const toggleActive = (reminderId: string, active: boolean) => {
    updateReminder(reminderId, { active });
    toast({
      title: active ? "Reminder Activated" : "Reminder Deactivated",
      description: `The reminder has been ${active ? 'activated' : 'deactivated'}`
    });
  };

  const getInstructionTitle = (instructionId: string) => {
    const instruction = instructions.find(i => i.id === instructionId);
    return instruction ? `${instruction.id} - ${instruction.siteLocation}` : instructionId;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getFrequencyBadge = (frequency: string) => {
    switch (frequency) {
      case 'once':
        return <Badge variant="outline">Once</Badge>;
      case 'daily':
        return <Badge variant="secondary">Daily</Badge>;
      case 'weekly':
        return <Badge variant="default">Weekly</Badge>;
      default:
        return <Badge variant="outline">{frequency}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reminder Management</h2>
          <p className="text-gray-600">Manage reminders for workflow instructions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingReminder ? 'Edit Reminder' : 'Create New Reminder'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="instructionId">Instruction *</Label>
                <Select 
                  value={formData.instructionId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, instructionId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an instruction" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructions.map(instruction => (
                      <SelectItem key={instruction.id} value={instruction.id}>
                        {instruction.id} - {instruction.siteLocation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Reminder title"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Reminder message"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select 
                  value={formData.frequency} 
                  onValueChange={(value: 'once' | 'daily' | 'weekly') => 
                    setFormData(prev => ({ ...prev, frequency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                />
                <Label htmlFor="active">Active</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingReminder ? 'Update' : 'Create'} Reminder
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {reminders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reminders yet</h3>
              <p className="text-gray-600 mb-4">Create your first reminder to stay on top of important tasks</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Reminder
              </Button>
            </CardContent>
          </Card>
        ) : (
          reminders.map((reminder) => (
            <Card key={reminder.id} className={`${!reminder.active ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{reminder.title}</CardTitle>
                    <p className="text-sm text-gray-600">
                      {getInstructionTitle(reminder.instructionId)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getFrequencyBadge(reminder.frequency)}
                    <Switch
                      checked={reminder.active}
                      onCheckedChange={(checked) => toggleActive(reminder.id, checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {reminder.message && (
                  <p className="text-sm text-gray-700 mb-3">{reminder.message}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Due: {formatDate(reminder.dueDate)}</span>
                    </div>
                    {reminder.lastSent && (
                      <span>Last sent: {formatDate(reminder.lastSent)}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(reminder)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(reminder.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ReminderManager;
