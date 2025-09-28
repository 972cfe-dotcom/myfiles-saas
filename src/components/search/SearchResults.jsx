
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, Building, Tag, Eye, Download } from 'lucide-react';
import { safeFormatDate, getDocumentDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import DocumentViewerModal from '../common/DocumentViewerModal';

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

const documentTypeColors = {
  contract: "bg-purple-100 text-purple-800",
  invoice: "bg-blue-100 text-blue-800",
  bank_statement: "bg-green-100 text-green-800",
  tax_form: "bg-orange-100 text-orange-800",
  loan: "bg-red-100 text-red-800",
  mortgage: "bg-indigo-100 text-indigo-800",
  insurance: "bg-teal-100 text-teal-800",
  government: "bg-gray-100 text-gray-800",
  receipt: "bg-cyan-100 text-cyan-800",
  certificate: "bg-emerald-100 text-emerald-800",
  other: "bg-slate-100 text-slate-800"
};

function HighlightedText({ text, highlights }) {
  if (!text || !highlights.length) return text;
  
  let highlightedText = text;
  highlights.forEach(term => {
    if (term && term.trim()) {
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
    }
  });
  
  return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
}

export default function SearchResults({ 
  documents, 
  loading, 
  searchStats, 
  highlightTerms = [], 
  selectedDocuments = [], 
  onSelectDocument 
}) {
  const [viewingDocument, setViewingDocument] = useState(null);

  const handleViewDocument = (document) => {
    setViewingDocument(document);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array(5).fill(0).map((_, i) => (
          <Card key={i} className="animate-pulse border-0 shadow-md">
            <CardContent className="p-6">
              <div className="h-4 bg-slate-200 rounded mb-3"></div>
              <div className="h-3 bg-slate-200 rounded mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-12 text-center">
          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">לא נמצאו מסמכים</h3>
          <p className="text-slate-500">נסה לשנות את קריטריוני החיפוש או להסיר פילטרים</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {documents.map((document, index) => (
          <motion.div
            key={document.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Document Selection Checkbox */}
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        checked={selectedDocuments.includes(document.id)}
                        onChange={(e) => onSelectDocument(document.id, e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Document Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 text-lg mb-1">
                            <HighlightedText 
                              text={document.title || 'מסמך ללא כותרת'} 
                              highlights={highlightTerms} 
                            />
                          </h3>
                          
                          <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                            {document.document_number && (
                              <span>#{document.document_number}</span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {safeFormatDate(getDocumentDate(document), 'dd/MM/yyyy')}
                            </span>
                            {document.organization && (
                              <span className="flex items-center gap-1">
                                <Building className="w-4 h-4" />
                                <HighlightedText 
                                  text={document.organization} 
                                  highlights={highlightTerms} 
                                />
                              </span>
                            )}
                          </div>

                          {/* Document Type */}
                          {document.document_type && (
                            <Badge className={`${documentTypeColors[document.document_type]} mb-2`}>
                              {documentTypeLabels[document.document_type]}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      {document.tags && document.tags.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Tag className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">תגיות:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {document.tags.map((tag, tagIndex) => (
                              <Badge 
                                key={tagIndex} 
                                variant="outline" 
                                className="text-xs bg-slate-50"
                              >
                                <HighlightedText text={tag} highlights={highlightTerms} />
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Relevance Score (if available) */}
                      {document._relevanceScore > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">ציון רלוונטיות:</span>
                            <div className="flex items-center">
                              {Array(5).fill(0).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full mr-1 ${
                                    i < Math.min(5, Math.ceil(document._relevanceScore / 4))
                                      ? 'bg-blue-500'
                                      : 'bg-slate-200'
                                  }`}
                                />
                              ))}
                              <span className="text-xs text-slate-600 mr-2">
                                ({document._relevanceScore})
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Extracted Text Preview */}
                      {document.extracted_text && (
                        <div className="bg-slate-50 rounded-lg p-3 mb-4">
                          <div className="text-sm text-slate-600 line-clamp-2">
                            <HighlightedText 
                              text={document.extracted_text.substring(0, 200) + '...'} 
                              highlights={highlightTerms} 
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 mr-4">
                    <Button
                      size="sm"
                      onClick={() => handleViewDocument(document)}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                      <Eye className="w-4 h-4 ml-2" />
                      צפיה
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(document.file_url, '_blank')}
                    >
                      <Download className="w-4 h-4 ml-2" />
                      הורדה
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {viewingDocument && (
        <DocumentViewerModal
            document={viewingDocument}
            open={!!viewingDocument}
            onClose={() => setViewingDocument(null)}
        />
      )}
    </div>
  );
}
