import React, { useState, useCallback } from "react";
import { DocumentsService } from "../services/documentsService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle, AlertCircle, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";

export default function UploadPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files).filter(file => {
      const isValidType = file.type === "application/pdf" || 
                         file.type.startsWith("image/") ||
                         file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                         file.type === "application/msword";
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB
      return isValidType && isValidSize;
    });

    if (selectedFiles.length !== e.target.files.length) {
      setError("חלק מהקבצים לא נתמכים או גדולים מדי (מקסימום 50MB)");
    }

    setFiles(prev => [...prev, ...selectedFiles.map(file => ({
      file,
      id: Math.random().toString(36),
      status: "pending"
    }))]);
    setError(null);
  }, []);

  const removeFile = useCallback((fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    setUploadProgress({});

    try {
      for (let i = 0; i < files.length; i++) {
        const fileItem = files[i];
        const progress = (i / files.length) * 100;
        
        setUploadProgress(prev => ({
          ...prev,
          [fileItem.id]: { status: 'uploading', progress: 0 }
        }));

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', fileItem.file);
        
        // For now, we'll simulate file upload and create document record
        // In production, you'd upload to cloud storage first
        
        const documentData = {
          title: fileItem.file.name.split('.')[0],
          description: `מסמך שהועלה: ${fileItem.file.name}`,
          fileName: fileItem.file.name,
          fileType: getFileType(fileItem.file.type),
          fileSize: fileItem.file.size,
          fileUrl: `temp://uploads/${fileItem.file.name}`, // This would be real URL in production
          thumbnailUrl: null,
          mimeType: fileItem.file.type,
          contentExtracted: '', // OCR would happen here
          categoryId: null,
          fileHash: await calculateFileHash(fileItem.file)
        };

        const document = await DocumentsService.createDocument(documentData);
        
        setUploadProgress(prev => ({
          ...prev,
          [fileItem.id]: { status: 'completed', progress: 100, document }
        }));
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/documents');
      }, 2000);

    } catch (error) {
      console.error("Upload error:", error);
      setError(`שגיאה בהעלאת המסמכים: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const getFileType = (mimeType) => {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('word')) return 'docx';
    return 'other';
  };

  const calculateFileHash = async (file) => {
    // Simple hash based on file name and size
    return `${file.name}-${file.size}-${Date.now()}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto text-center">
          <CardContent className="pt-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">הועלה בהצלחה!</h2>
            <p className="text-gray-600 mb-4">
              {files.length} מסמכים הועלו ונשמרו במערכת
            </p>
            <p className="text-sm text-gray-500">מעביר לדף המסמכים...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">העלאת מסמכים</h1>
          </div>
          <p className="text-gray-600">העלה מסמכים חדשים למערכת</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* File Upload Zone */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>בחר קבצים להעלאה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer block"
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  לחץ כאן לבחירת קבצים
                </p>
                <p className="text-gray-600">
                  או גרור קבצים לכאן
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  PDF, Word, תמונות - עד 50MB לקובץ
                </p>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* File List */}
        {files.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>קבצים נבחרים ({files.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {files.map((fileItem) => {
                  const progress = uploadProgress[fileItem.id];
                  return (
                    <div key={fileItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">{fileItem.file.name}</p>
                          <p className="text-sm text-gray-600">{formatFileSize(fileItem.file.size)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {progress?.status === 'uploading' && (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        )}
                        {progress?.status === 'completed' && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                        {!uploading && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(fileItem.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {files.length > 0 && !uploading && (
                <Button
                  onClick={uploadFiles}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                  disabled={files.length === 0}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  העלאת {files.length} קבצים
                </Button>
              )}

              {uploading && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">מעלה קבצים...</span>
                    <span className="text-sm text-gray-600">
                      {Object.values(uploadProgress).filter(p => p.status === 'completed').length} / {files.length}
                    </span>
                  </div>
                  <Progress 
                    value={(Object.values(uploadProgress).filter(p => p.status === 'completed').length / files.length) * 100} 
                    className="h-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => navigate('/documents')}
            className="mr-2"
          >
            <FileText className="w-4 h-4 mr-2" />
            צפיה במסמכים קיימים
          </Button>
        </div>
      </div>
    </div>
  );
}