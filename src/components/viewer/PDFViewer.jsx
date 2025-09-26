import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ZoomIn, ZoomOut, RotateCw, Download, FileText, Loader2 } from 'lucide-react';
import { fileStorage } from '../../utils/fileStorage';

export default function PDFViewer({ fileId, fileName }) {
  const [pdf, setPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef(null);
  const [pdfJS, setPdfJS] = useState(null);

  useEffect(() => {
    const loadPDFJS = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
        setPdfJS(pdfjsLib);
      } catch (error) {
        setError(`שגיאה בטעינת PDF.js: ${error.message}`);
      }
    };
    
    loadPDFJS();
  }, []);

  useEffect(() => {
    if (pdfJS && fileId) {
      loadPDF();
    }
  }, [pdfJS, fileId]);

  useEffect(() => {
    if (pdf && currentPage) {
      renderPage();
    }
  }, [pdf, currentPage, scale, rotation]);

  const loadPDF = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fileData = await fileStorage.getFileBlob(fileId);
      
      if (fileData.blob.type !== 'application/pdf') {
        throw new Error('הקובץ אינו PDF');
      }
      
      const arrayBuffer = await fileData.blob.arrayBuffer();
      const pdfDocument = await pdfJS.getDocument({ data: arrayBuffer }).promise;
      
      setPdf(pdfDocument);
      setTotalPages(pdfDocument.numPages);
      setCurrentPage(1);
      
    } catch (error) {
      console.error('Error loading PDF:', error);
      setError(`שגיאה בטעינת PDF: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderPage = async () => {
    if (!pdf || !canvasRef.current) return;

    try {
      const page = await pdf.getPage(currentPage);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Calculate viewport with scale and rotation
      let viewport = page.getViewport({ scale, rotation });
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      
    } catch (error) {
      console.error('Error rendering page:', error);
      setError(`שגיאה בהצגת העמוד: ${error.message}`);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = async () => {
    try {
      const fileData = await fileStorage.getFileBlob(fileId);
      const url = URL.createObjectURL(fileData.blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">טוען PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-6 text-center border-red-200">
          <FileText className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">שגיאה בצפייה במסמך</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button variant="outline" onClick={loadPDF}>
            נסה שוב
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="bg-slate-100 border rounded-t-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button size="sm" variant="outline" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-slate-300 mx-2" />
          
          <Button size="sm" variant="outline" onClick={handleRotate}>
            <RotateCw className="w-4 h-4" />
          </Button>
          
          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            עמוד קודם
          </Button>
          
          <span className="text-sm font-medium px-3 py-1 bg-white rounded border">
            {currentPage} מתוך {totalPages}
          </span>
          
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            עמוד הבא
          </Button>
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="border-x border-b rounded-b-lg bg-white overflow-auto max-h-[70vh]">
        <div className="flex justify-center p-4">
          <canvas
            ref={canvasRef}
            className="shadow-lg border border-slate-200"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </div>
    </div>
  );
}