import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Eye, Download, Tag, Building, Edit, Trash2, MoreVertical } from "lucide-react";
import { safeFormatDate, getDocumentDate } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import DocumentEditDialog from "./DocumentEditDialog";
import DocumentDeleteDialog from "./DocumentDeleteDialog";
import DocumentViewerModal from "../common/DocumentViewerModal";

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
  contract: "bg-purple-100 text-purple-800 border-purple-200",
  invoice: "bg-blue-100 text-blue-800 border-blue-200",
  bank_statement: "bg-green-100 text-green-800 border-green-200",
  tax_form: "bg-orange-100 text-orange-800 border-orange-200",
  loan: "bg-red-100 text-red-800 border-red-200",
  mortgage: "bg-indigo-100 text-indigo-800 border-indigo-200",
  insurance: "bg-teal-100 text-teal-800 border-teal-200",
  government: "bg-gray-100 text-gray-800 border-gray-200",
  receipt: "bg-cyan-100 text-cyan-800 border-cyan-200",
  certificate: "bg-emerald-100 text-emerald-800 border-emerald-200",
  other: "bg-slate-100 text-slate-800 border-slate-200"
};

export default function DocumentCard({ document, viewMode, onView, onUpdate, onDelete }) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewer, setShowViewer] = useState(false);

  const handleView = () => {
    // Only log the view activity, don't open new tab
    if (onView) {
      onView();
    }
    setShowViewer(true);
  };

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleSaveEdit = (updatedDocument) => {
    onUpdate(updatedDocument);
    setShowEditDialog(false);
  };

  const handleConfirmDelete = () => {
    onDelete(document.id);
    setShowDeleteDialog(false);
  };

  const cardContent = (
    <>
      {viewMode === "grid" ? (
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-blue-700 transition-colors">
                    {document.title || 'מסמך ללא כותרת'}
                  </h3>
                  {document.document_number && (
                    <p className="text-xs text-slate-500 mt-1">{document.document_number}</p>
                  )}
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleView}>
                    <Eye className="w-4 h-4 ml-2" />
                    צפיה במסמך
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(document.file_url, '_blank')}>
                    <Download className="w-4 h-4 ml-2" />
                    הורדה
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="w-4 h-4 ml-2" />
                    עריכה
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    <Trash2 className="w-4 h-4 ml-2" />
                    מחיקה
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {document.document_type && (
                  <Badge className={`${documentTypeColors[document.document_type]} border text-xs`}>
                    {documentTypeLabels[document.document_type]}
                  </Badge>
                )}
                {document.processing_status === "processing" && (
                  <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                    מעבד...
                  </Badge>
                )}
              </div>

              {document.organization && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Building className="w-4 h-4" />
                  <span className="truncate">{document.organization}</span>
                </div>
              )}

              {document.tags && document.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {document.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-slate-50 text-slate-600">
                      <Tag className="w-3 h-3 ml-1" />
                      {tag}
                    </Badge>
                  ))}
                  {document.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600">
                      +{document.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Calendar className="w-3 h-3" />
                  {safeFormatDate(getDocumentDate(document), 'dd/MM/yy')}
                </div>
                
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleView}
                    className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleEdit}
                    className="h-8 w-8 p-0 hover:bg-emerald-50 hover:text-emerald-600"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="hover:shadow-md transition-all duration-200 border-0 shadow-sm bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-slate-900 hover:text-blue-700 transition-colors truncate">
                      {document.title || 'מסמך ללא כותרת'}
                    </h3>
                    
                    {document.document_type && (
                      <Badge className={`${documentTypeColors[document.document_type]} border text-xs`}>
                        {documentTypeLabels[document.document_type]}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    {document.document_number && (
                      <span>{document.document_number}</span>
                    )}
                    {document.organization && (
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {document.organization}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {safeFormatDate(getDocumentDate(document), 'dd/MM/yy')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleView}
                  className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleEdit}
                  className="h-8 w-8 p-0 hover:bg-emerald-50 hover:text-emerald-600"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => window.open(document.file_url, '_blank')}>
                      <Download className="w-4 h-4 ml-2" />
                      הורדה
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                      <Trash2 className="w-4 h-4 ml-2" />
                      מחיקה
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {showEditDialog && (
        <DocumentEditDialog
          document={document}
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <DocumentDeleteDialog
          document={document}
          open={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
      
      {/* Viewer Modal */}
      {showViewer && (
        <DocumentViewerModal
          document={document}
          open={showViewer}
          onClose={() => setShowViewer(false)}
        />
      )}
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {cardContent}
    </motion.div>
  );
}