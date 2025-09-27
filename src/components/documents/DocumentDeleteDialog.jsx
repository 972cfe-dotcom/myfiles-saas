import React, { useState } from 'react';
import { Document } from '@/api/realEntities';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentDeleteDialog({ document, open, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await Document.delete(document.id);
      onConfirm();
      toast.success('המסמך נמחק בהצלחה');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('שגיאה במחיקת המסמך');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="w-6 h-6" />
            מחיקת מסמך
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-slate-700">
            האם אתה בטוח שברצונך למחוק את המסמך <strong>"{document.title}"</strong>?
          </p>
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-800">
              <strong>אזהרה:</strong> פעולה זו אינה הפיכה. המסמך יימחק לצמיתות מהמערכת.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            ביטול
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
            ) : (
              <AlertTriangle className="w-4 h-4 ml-2" />
            )}
            מחק מסמך
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}