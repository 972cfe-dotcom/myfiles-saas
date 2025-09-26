import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, X } from 'lucide-react';

export default function DocumentViewerModal({ document, open, onClose }) {
  if (!document) return null;

  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = document.file_url;
    link.download = document.original_filename || document.title || 'document';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  // Determine file type from URL if not explicitly set
  const fileType = document.file_type || (document.file_url?.includes('.pdf') ? 'pdf' : 'image');
  
  // Use Google Docs Viewer for PDF files
  const pdfViewerUrl = fileType === 'pdf' 
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(document.file_url)}&embedded=true`
    : document.file_url;

  console.log('Document in viewer:', document); // Debug log
  console.log('File type:', fileType, 'URL:', document.file_url); // Debug log

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[95vh] flex flex-col p-0">
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b">
          <div className="flex-1">
            <DialogTitle className="truncate text-lg font-semibold">
              {document.title || 'תצוגת מסמך'}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              {document.original_filename || document.title}
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
        
        <div className="flex-1 overflow-hidden">
          {fileType === 'pdf' ? (
            <iframe
              src={pdfViewerUrl}
              className="w-full h-full border-0"
              title={document.title}
              style={{ minHeight: '500px' }}
              onLoad={() => console.log('PDF iframe loaded')}
              onError={(e) => console.error('PDF iframe error:', e)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-50 p-4">
              <img
                src={document.file_url}
                alt={document.title}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                style={{ maxHeight: 'calc(100vh - 200px)' }}
                onLoad={() => console.log('Image loaded')}
                onError={(e) => console.error('Image error:', e)}
              />
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between items-center p-4 border-t bg-slate-50">
          <div className="text-sm text-slate-500">
            גודל: {document.file_size ? (document.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'לא ידוע'}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open(document.file_url, '_blank')}>
              <ExternalLink className="w-4 h-4 ml-2" />
              פתח בחלון חדש
            </Button>
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4 ml-2" />
              הורד קובץ
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}