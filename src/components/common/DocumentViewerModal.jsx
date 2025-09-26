import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, X, FileText } from 'lucide-react';
import PDFViewer from '../viewer/PDFViewer';
import { fileStorage } from '../../utils/fileStorage';

export default function DocumentViewerModal({ document, open, onClose }) {
  if (!document) return null;

  const handleDownload = async () => {
    try {
      if (document.stored_file_id) {
        // Use our file storage system
        const fileData = await fileStorage.getFileBlob(document.stored_file_id);
        const url = URL.createObjectURL(fileData.blob);
        
        const link = window.document.createElement('a');
        link.href = url;
        link.download = document.original_filename || document.file_name || document.name || 'document';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Fallback for old documents
        const link = window.document.createElement('a');
        link.href = document.file_url;
        link.download = document.original_filename || document.title || 'document';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  // Determine file type
  const fileType = document.file_type || (document.file_name?.toLowerCase().endsWith('.pdf') ? 'pdf' : 'other');
  
  console.log('Document in viewer:', document); // Debug log
  console.log('File type:', fileType, 'Stored file ID:', document.stored_file_id); // Debug log

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[95vh] flex flex-col p-0">
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b">
          <div className="flex-1">
            <DialogTitle className="truncate text-lg font-semibold">
              {document.title || document.name || 'תצוגת מסמך'}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              {document.original_filename || document.file_name || document.title}
            </DialogDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="ml-4"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden p-4">
          {document.stored_file_id && fileType === 'pdf' ? (
            <PDFViewer 
              fileId={document.stored_file_id} 
              fileName={document.original_filename || document.file_name || document.name}
            />
          ) : document.stored_file_id && fileType !== 'pdf' ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-50 p-4 rounded-lg">
              <div className="text-center">
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">תצוגת קובץ</h3>
                <p className="text-slate-500 mb-4">
                  {document.original_filename || document.file_name || document.name}
                </p>
                <p className="text-sm text-slate-400">
                  סוג קובץ: {fileType}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-50 p-4 rounded-lg">
              <div className="text-center">
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">מסמך לא זמין</h3>
                <p className="text-slate-500 mb-4">
                  המסמך אינו זמין לתצוגה או שהוא מסוג לא נתמך
                </p>
                <p className="text-sm text-slate-400">
                  זהו מסמך ישן ממערכת קודמת
                </p>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between items-center p-4 border-t bg-slate-50">
          <div className="text-sm text-slate-500">
            גודל: {document.size || document.file_size || 'לא ידוע'}
          </div>
          <div className="flex gap-2">
            {document.stored_file_id && (
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 ml-2" />
                הורד קובץ
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}