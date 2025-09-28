import React, { useState, useEffect } from "react";
import { DocumentsService } from "../services/documentsService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, FileText, Loader2, AlertCircle, Calendar, Eye } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useAuth } from "@/components/auth/AuthProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SearchPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const results = await DocumentsService.searchDocuments(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching documents:', error);
      setError('שגיאה בחיפוש המסמכים');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Search className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">חיפוש מסמכים</h1>
          </div>
          <p className="text-gray-600">חפש במסמכים שלך לפי תוכן, שם או תיאור</p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSearch}>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="הזן מונח חיפוש..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                    disabled={loading}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading || !searchTerm.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      מחפש...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      חיפוש
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Search Results */}
        {hasSearched && (
          <Card>
            <CardHeader>
              <CardTitle>תוצאות חיפוש</CardTitle>
              {searchResults.length > 0 && (
                <p className="text-sm text-gray-600">
                  נמצאו {searchResults.length} מסמכים עבור "{searchTerm}"
                </p>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-3" />
                  <span className="text-gray-600">מחפש במסמכים...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">לא נמצאו תוצאות</h3>
                  <p className="text-gray-600">
                    לא נמצאו מסמכים המכילים את המונח "{searchTerm}"
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    נסה מונחי חיפוש שונים או ביטול חלק מהמילים
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.map((document) => (
                    <div key={document.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {getFileTypeIcon(document.file_type)}
                          <div>
                            <h3 className="font-medium text-gray-900">{document.title}</h3>
                            <p className="text-sm text-gray-600">{document.file_name}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span>{formatFileSize(document.file_size || 0)}</span>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {document.created_at ? format(new Date(document.created_at), 'dd/MM/yyyy', { locale: he }) : 'לא ידוע'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {document.file_type && (
                            <Badge variant="secondary">{document.file_type.toUpperCase()}</Badge>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            צפייה
                          </Button>
                        </div>
                      </div>
                      
                      {document.description && (
                        <p className="text-sm text-gray-600 mt-3 border-t pt-3">
                          {document.description}
                        </p>
                      )}
                      
                      {/* Search Relevance Preview */}
                      {document.content_extracted && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-200">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">תוכן רלוונטי:</span>
                            {" "}
                            {document.content_extracted.length > 200 
                              ? document.content_extracted.substring(0, 200) + "..."
                              : document.content_extracted
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Search Tips */}
        {!hasSearched && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="font-medium text-blue-900 mb-3">טיפים לחיפוש יעיל:</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• השתמש במילים ספציפיות לתוצאות מדויקות יותר</li>
                <li>• החיפוש מתבצע בכותרת, תיאור ותוכן המסמכים</li>
                <li>• ניתן לחפש חלקי מילים או ביטויים</li>
                <li>• החיפוש אינו רגיש לרישיות</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}