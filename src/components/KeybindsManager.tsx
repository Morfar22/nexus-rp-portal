import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Keyboard, Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Keybind {
  id: string;
  key_name: string;
  key_code: string;
  action_name: string;
  description: string | null;
  category: string;
  is_active: boolean;
  order_index: number;
}

const CATEGORIES = ['general', 'vehicle', 'communication', 'emotes', 'movement'];

export default function KeybindsManager() {
  const [keybinds, setKeybinds] = useState<Keybind[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKeybind, setEditingKeybind] = useState<Keybind | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    key_name: '',
    key_code: '',
    action_name: '',
    description: '',
    category: 'general',
    is_active: true,
    order_index: 0,
  });

  const fetchKeybinds = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('keybinds')
        .select('*')
        .order('order_index');

      if (error) throw error;
      setKeybinds(data || []);
    } catch (error: any) {
      console.error('Error fetching keybinds:', error);
      toast({
        title: 'Error',
        description: 'Failed to load keybinds',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeybinds();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingKeybind) {
        const { error } = await supabase
          .from('keybinds')
          .update(formData)
          .eq('id', editingKeybind.id);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Keybind updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('keybinds')
          .insert([formData]);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Keybind created successfully',
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchKeybinds();
    } catch (error: any) {
      console.error('Error saving keybind:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save keybind',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('keybinds')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Keybind deleted successfully',
      });
      fetchKeybinds();
    } catch (error: any) {
      console.error('Error deleting keybind:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete keybind',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      key_name: '',
      key_code: '',
      action_name: '',
      description: '',
      category: 'general',
      is_active: true,
      order_index: 0,
    });
    setEditingKeybind(null);
  };

  const openEditDialog = (keybind: Keybind) => {
    setEditingKeybind(keybind);
    setFormData({
      key_name: keybind.key_name,
      key_code: keybind.key_code,
      action_name: keybind.action_name,
      description: keybind.description || '',
      category: keybind.category,
      is_active: keybind.is_active,
      order_index: keybind.order_index,
    });
    setDialogOpen(true);
  };

  return (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Keyboard className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Keybinds Manager</h2>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Keybind
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingKeybind ? 'Edit Keybind' : 'Add New Keybind'}
              </DialogTitle>
              <DialogDescription>
                Configure a keybind for the server
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="key_name">Key Name *</Label>
                  <Input
                    id="key_name"
                    value={formData.key_name}
                    onChange={(e) => setFormData({ ...formData, key_name: e.target.value })}
                    placeholder="E.g., E, F, Tab"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key_code">Key Code *</Label>
                  <Input
                    id="key_code"
                    value={formData.key_code}
                    onChange={(e) => setFormData({ ...formData, key_code: e.target.value })}
                    placeholder="E.g., KeyE, KeyF"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="action_name">Action Name *</Label>
                <Input
                  id="action_name"
                  value={formData.action_name}
                  onChange={(e) => setFormData({ ...formData, action_name: e.target.value })}
                  placeholder="E.g., Interact, Open Inventory"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of what this key does"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="capitalize">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order_index">Order Index</Label>
                  <Input
                    id="order_index"
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingKeybind ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {keybinds.map((keybind) => (
            <Card key={keybind.id} className="p-4 bg-gaming-dark border-gaming-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg">{keybind.key_name}</span>
                      <Badge variant="outline" className="capitalize">
                        {keybind.category}
                      </Badge>
                      {!keybind.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground font-medium">
                      {keybind.action_name}
                    </p>
                    {keybind.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {keybind.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Code: {keybind.key_code} | Order: {keybind.order_index}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(keybind)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Keybind</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the keybind for "{keybind.key_name}"?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(keybind.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}
