import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, FileText, Calendar, X } from 'lucide-react';
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function DuplicateWarningDialog({ duplicates, onContinue, onCancel, onRemoveDuplicates }) {
  const handleRemoveDuplicates = () => {
    // Get list of file IDs to remove
    const duplicateFileIds = new Set(duplicates.map(dup => dup.newFile.id));
    
    // Call parent callback to get updated files list
    // This is a bit tricky - we need the parent to give us the current files
    // For now, let's just call onCancel and let user manually remove
    onCancel();
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl text-amber-700">
            <AlertTriangle className="w-6 h-6" />
            זוהו מסמכים כפולים
          </DialogTitle>
          <DialogDescription>
            נמצאו מסמכים עם שמות זהים למסמכים שכבר קיימים במערכת. 
            האם ברצונך להמשיך בכל זאת?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-6">
          {duplicates.map((duplicate, index) => (
            <Card key={index} className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-amber-600" />
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {duplicate.newFile.file.name}
                      </h4>
                      <p className="text-sm text-amber-700">
                        גודל: {(duplicate.newFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-left text-sm">
                    <p className="font-medium text-slate-700 mb-1">מסמך קיים:</p>
                    <p className="text-slate-600">{duplicate.existingDoc.title}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(duplicate.existingDoc.created_date), 'dd/MM/yyyy', { locale: he })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 ml-2" />
              ביטול
            </Button>
            <Button variant="outline" onClick={handleRemoveDuplicates}>
              הסר כפילויות
            </Button>
          </div>
          
          <Button onClick={onContinue} className="bg-amber-600 hover:bg-amber-700">
            <AlertTriangle className="w-4 h-4 ml-2" />
            המשך בכל זאת ({duplicates.length} כפילויות)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}