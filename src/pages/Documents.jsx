import React, { useState, useEffect } from "react";
import { DocumentsService } from "../services/documentsService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, FileText, Download, Eye, Calendar, Plus, Loader2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useAuth } from "@/components/auth/AuthProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const documents = await DocumentsService.getUserDocuments();
      setDocuments(documents);
    } catch (error) {
      console.error('Error loading documents:', error);
      setError('שגיאה בטעינת המסמכים');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (fileType) => {
    return <FileText className="w-5 h-5 text-blue-600" />;
  };

  const handleDeleteDocument = async (documentId) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את המסמך?')) {
      try {
        await DocumentsService.deleteDocument(documentId);
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('שגיאה במחיקת המסמך');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg font-medium text-gray-700">טוען מסמכים...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">המסמכים שלי</h1>
            <p className="text-gray-600">ניהול וארגון המסמכים שלך</p>
          </div>
          
          <Link to="/upload">
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Plus className="w-5 h-5" />
              העלאת מסמך חדש
            </Button>
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">סך הכל מסמכים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{documents.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">גודל כולל</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatFileSize(documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">מסמכים שנוספו השבוע</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {documents.filter(doc => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(doc.createdAt) > weekAgo;
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="חיפוש מסמכים לפי שם או תיאור..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <div className="space-y-4">
          {filteredDocuments.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {documents.length === 0 ? 'אין מסמכים עדיין' : 'לא נמצאו מסמכים'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {documents.length === 0 
                    ? 'התחל על ידי העלאת המסמך הראשון שלך'
                    : 'נסה לשנות את מונחי החיפוש'
                  }
                </p>
                {documents.length === 0 && (
                  <Link to="/upload">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      העלאת מסמך ראשון
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredDocuments.map((document) => (
              <Card key={document.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getFileTypeIcon(document.fileType)}
                      <div>
                        <h3 className="font-medium text-gray-900">{document.title}</h3>
                        <p className="text-sm text-gray-600">{document.fileName}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>{formatFileSize(document.fileSize || 0)}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {document.createdAt ? format(new Date(document.createdAt), 'dd/MM/yyyy', { locale: he }) : 'לא ידוע'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {document.fileType && (
                        <Badge variant="secondary">{document.fileType.toUpperCase()}</Badge>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        צפייה
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDocument(document.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        מחיקה
                      </Button>
                    </div>
                  </div>
                  
                  {document.description && (
                    <p className="text-sm text-gray-600 mt-3 border-t pt-3">
                      {document.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Results Summary */}
        {filteredDocuments.length > 0 && (
          <div className="text-center mt-8 text-sm text-gray-600">
            מציג {filteredDocuments.length} מתוך {documents.length} מסמכים
          </div>
        )}
      </div>
    </div>
  );
}