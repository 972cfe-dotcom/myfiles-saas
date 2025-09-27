import React, { useState, useEffect } from 'react';
import { Document, User } from '@/api/realEntities';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Loader2, Plus, X, Tag } from 'lucide-react';
import { toast } from 'sonner';

const documentTypeLabels = {
  contract: "חוזה",
  invoice: "חשבונית", 
  bank_statement: "אישור בנק",
  tax_form: "טופס מס",
  loan: "הלוואה",
  mortgage: "משכנתא",
  insurance: "ביטוח",
  government: "רשות ממשלתית",
  receipt: "קבלה",
  certificate: "אישור",
  other: "אחר"
};

export default function DocumentEditDialog({ document, open, onClose, onSave }) {
  const [editedDoc, setEditedDoc] = useState(document);
  const [userPreferences, setUserPreferences] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const user = await User.me();
        setUserPreferences(user.tagging_preferences || []);
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    };
    
    if (open) {
      setEditedDoc(document);
      loadUserPreferences();
    }
  }, [document, open]);

  const handleAddTag = (tag) => {
    if (tag && !editedDoc.tags?.includes(tag)) {
      setEditedDoc({
        ...editedDoc,
        tags: [...(editedDoc.tags || []), tag]
      });
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setEditedDoc({
      ...editedDoc,
      tags: (editedDoc.tags || []).filter(tag => tag !== tagToRemove)
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedDoc = await Document.update(document.id, editedDoc);
      onSave(updatedDoc);
      toast.success('המסמך עודכן בהצלחה');
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('שגיאה בעדכון המסמך');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">עריכת מסמך</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">כותרת המסמך</Label>
              <Input
                id="title"
                value={editedDoc.title || ''}
                onChange={(e) => setEditedDoc({...editedDoc, title: e.target.value})}
                placeholder="הזן כותרת למסמך"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="document_number">מספר מסמך</Label>
              <Input
                id="document_number"
                value={editedDoc.document_number || ''}
                onChange={(e) => setEditedDoc({...editedDoc, document_number: e.target.value})}
                placeholder="מספר מסמך ייחודי"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="document_type">סוג המסמך</Label>
              <Select
                value={editedDoc.document_type || ''}
                onValueChange={(value) => setEditedDoc({...editedDoc, document_type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר סוג מסמך" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(documentTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="organization">גוף/חברה</Label>
              <Input
                id="organization"
                value={editedDoc.organization || ''}
                onChange={(e) => setEditedDoc({...editedDoc, organization: e.target.value})}
                placeholder="שם הגוף או החברה"
              />
            </div>
          </div>

          {/* Tags Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">תגיות</Label>
            
            {/* Current Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(editedDoc.tags || []).map((tag, index) => (
                <Badge key={index} className="flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100">
                  <Tag className="w-3 h-3" />
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="rounded-full hover:bg-blue-200 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {/* Add New Tag */}
            <div className="flex gap-2">
              <Input
                placeholder="הוסף תגית חדשה..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag(newTag)}
                className="flex-1"
              />
              <Button
                onClick={() => handleAddTag(newTag)}
                variant="outline"
                size="sm"
                disabled={!newTag}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Suggested Tags from User Preferences */}
            {userPreferences.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-slate-600">תגיות מהעדפות שלך:</Label>
                <div className="space-y-2">
                  {userPreferences.map((group) => (
                    <div key={group.id} className="space-y-1">
                      <p className="text-xs text-slate-500 font-medium">{group.group_name}:</p>
                      <div className="flex flex-wrap gap-1">
                        {group.tags.map((tag) => (
                          <Button
                            key={tag}
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => handleAddTag(tag)}
                            disabled={(editedDoc.tags || []).includes(tag)}
                          >
                            {tag}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes/Description */}
          <div className="space-y-2">
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              value={editedDoc.notes || ''}
              onChange={(e) => setEditedDoc({...editedDoc, notes: e.target.value})}
              placeholder="הוסף הערות או תיאור נוסף למסמך..."
              className="h-24"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-600 to-blue-700">
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
            ) : (
              <Save className="w-4 h-4 ml-2" />
            )}
            שמור שינויים
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}