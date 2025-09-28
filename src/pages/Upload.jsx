import React, { useState, useCallback } from "react";
import { Document, DocumentActivity, User } from "@/api/realEntities";
import { UploadFile, ExtractDataFromUploadedFile, InvokeLLM } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, Image, CheckCircle, AlertCircle, ArrowRight, Sparkles, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

import FileUploadZone from "../components/upload/FileUploadZone";
import FilePreviewList from "../components/upload/FilePreviewList";
import ProcessingProgress from "../components/upload/ProcessingProgress";
import DocumentPreview from "../components/upload/DocumentPreview";
import DuplicateWarningDialog from "../components/upload/DuplicateWarningDialog";

export default function UploadPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState("upload"); // upload, processing, preview, done
  const [processedDocuments, setProcessedDocuments] = useState([]);
  const [allSystemTags, setAllSystemTags] = useState([]);
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [error, setError] = useState(null);
  const [processProgress, setProcessProgress] = useState(0);

  const handleFileSelect = useCallback((selectedFiles) => {
    const newFiles = Array.from(selectedFiles).filter(file => {
      const isValidType = file.type === "application/pdf" || file.type.startsWith("image/");
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB
      return isValidType && isValidSize;
    });

    if (newFiles.length !== selectedFiles.length) {
      setError("חלק מהקבצים לא נתמכים או גדולים מדי (מקסימום 50MB)");
    }

    setFiles(prev => [...prev, ...newFiles.map(file => ({
      file,
      id: Math.random().toString(36),
      status: "pending"
    }))]);
    setError(null);
  }, []);

  const removeFile = useCallback((fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const generateDocumentNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getTime()).slice(-6);
    return `DOC-${year}${month}${day}-${time}`;
  };

  const checkForDuplicates = async () => {
    try {
      // Load existing documents
      const user = await User.me();
      const existingDocs = await Document.filter({ created_by: user.email });
      setExistingDocuments(existingDocs);

      // Check for duplicate filenames
      const duplicates = [];
      files.forEach(fileItem => {
        const filename = fileItem.file.name;
        const existingDoc = existingDocs.find(doc => 
          doc.original_filename === filename || doc.title === filename.split('.')[0]
        );
        if (existingDoc) {
          duplicates.push({
            newFile: fileItem,
            existingDoc: existingDoc
          });
        }
      });

      if (duplicates.length > 0) {
        setDuplicateWarning(duplicates);
        return false; // Don't proceed
      }
      return true; // OK to proceed
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return true; // If error, proceed anyway
    }
  };

  const processDocuments = async (skipDuplicateCheck = false) => {
    if (files.length === 0) return;

    // Check for duplicates first (unless explicitly skipping)
    if (!skipDuplicateCheck) {
      const canProceed = await checkForDuplicates();
      if (!canProceed) return; // Stop if duplicates found
    }

    setProcessing(true);
    setCurrentStep("processing");
    setError(null);
    
    const processed = [];
    const totalFiles = files.length;

    try {
      // Load user preferences at the start
      const user = await User.me();
      const userPreferences = user.tagging_preferences || [];

      for (let i = 0; i < files.length; i++) {
        const fileItem = files[i];
        setProcessProgress((i / totalFiles) * 100);

        // Upload file
        const uploadResult = await UploadFile(fileItem.file);
        const file_url = uploadResult.url;

        // Extract basic data using OCR
        const extractedData = await ExtractDataFromUploadedFile({
          file_url,
          json_schema: {
            type: "object",
            properties: {
              extracted_text: { type: "string" },
              document_type: { type: "string" },
              organization: { type: "string" },
              amounts: { type: "array", items: { type: "number" } },
              dates: { type: "array", items: { type: "string" } }
            }
          }
        });

        let documentData = {
          title: fileItem.file.name.split('.')[0],
          document_number: generateDocumentNumber(),
          original_filename: fileItem.file.name,
          file_url: file_url,
          stored_file_id: uploadResult.id, // Store the file ID for retrieval
          file_type: fileItem.file.type.startsWith('image/') ? 'image' : (fileItem.file.type === 'application/pdf' ? 'pdf' : 'other'),
          file_size: fileItem.file.size,
          processing_status: "processing",
          tags: [], // Initialize tags array
        };

        if (extractedData.status === "success" && extractedData.output) {
          const extracted = extractedData.output;
          
          // Use AI to suggest tags and improve classification
          try {
            // Build context from user preferences for better AI analysis
            const userTagsContext = userPreferences.map(group => 
              `${group.group_name}: ${group.tags.join(', ')}`
            ).join('\n');

            const aiAnalysis = await InvokeLLM({
              prompt: `נתח את המסמך הבא וקבע:
              1. סוג המסמך (חוזה, חשבונית, אישור בנק, טופס מס, הלוואה, משכנתא, ביטוח, רשות ממשלתית, קבלה, אישור, אחר)
              2. הגוף/החברה המעורבים
              3. תגיות רלוונטיות - בעיקר תגיות מהקבוצות הבאות שהמשתמש הגדיר:
              ${userTagsContext}
              4. כותרת מתאימה למסמך
              
              טקסט המסמך: ${extracted.extracted_text?.substring(0, 2000)}`,
              response_json_schema: {
                type: "object",
                properties: {
                  document_type: { type: "string" },
                  organization: { type: "string" },
                  suggested_tags: { type: "array", items: { type: "string" } },
                  suggested_title: { type: "string" }
                }
              }
            });

            if (aiAnalysis) {
              documentData = {
                ...documentData,
                title: aiAnalysis.suggested_title || documentData.title,
                document_type: aiAnalysis.document_type,
                organization: aiAnalysis.organization,
                ai_suggested_tags: aiAnalysis.suggested_tags || [],
                tags: [], // Start empty to force user to select required tags
                extracted_text: extracted.extracted_text,
                amounts: extracted.amounts || [],
                processing_status: "processed"
              };
            }
          } catch (aiError) {
            console.warn("AI analysis failed:", aiError);
            documentData = {
              ...documentData,
              extracted_text: extracted.extracted_text,
              amounts: extracted.amounts || [],
              processing_status: "processed"
            };
          }
        }

        processed.push(documentData);
      }
      
      // Fetch existing tags for suggestions
      const allDocs = await Document.list(); // Get all documents for tags
      const existingTags = [...new Set(allDocs.flatMap(doc => doc.tags || []))];
      setAllSystemTags(existingTags);

      setProcessProgress(100);
      setProcessedDocuments(processed);
      setCurrentStep("preview");
    } catch (error) {
      console.error("Processing error:", error);
      setError(`שגיאה בעיבוד המסמכים: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const saveDocuments = async (docsToSave) => {
    try {
      console.log('Starting save process for documents:', docsToSave);
      setProcessing(true);
      
      // Get current user
      const user = await User.me();
      console.log('Current user for document save:', user);
      
      if (!user || !user.id) {
        throw new Error('לא נמצא משתמש מחובר. אנא התחבר מחדש.');
      }
      
      for (const docData of docsToSave) {
        console.log('Saving document:', docData.title);
        
        // Prepare document data with proper field mapping
        const documentToSave = {
          // Basic info
          title: docData.title,
          description: docData.description || '',
          
          // File info
          original_filename: docData.original_filename,
          file_type: docData.file_type,
          file_size: docData.file_size,
          file_url: docData.file_url,
          stored_file_id: docData.stored_file_id,
          mime_type: getMimeTypeFromFileType(docData.file_type),
          
          // Document metadata
          document_number: docData.document_number,
          document_type: docData.document_type,
          organization: docData.organization,
          processing_status: docData.processing_status || 'processed',
          
          // Content
          extracted_text: docData.extracted_text || '',
          amounts: docData.amounts || [],
          
          // Tags
          tags: docData.tags || [],
          ai_suggested_tags: docData.ai_suggested_tags || [],
          
          // User association
          user_id: user.id
        };
        
        console.log('Document data prepared for save:', documentToSave);
        
        const savedDoc = await Document.create(documentToSave);
        console.log('Document saved successfully:', savedDoc);
        
        // Log activity
        await DocumentActivity.create({
          document_id: savedDoc.id,
          action_type: "uploaded",
          user_email: user.email,
          details: `הועלה מסמך: ${docData.title}`
        });
      }

      console.log('All documents saved successfully');
      setCurrentStep("done");
    } catch (error) {
      console.error("Save error:", error);
      setError(`שגיאה בשמירת המסמכים: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };
  
  // Helper function to get MIME type from file type
  const getMimeTypeFromFileType = (fileType) => {
    const typeMap = {
      'pdf': 'application/pdf',
      'image': 'image/jpeg',
      'png': 'image/png', 
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg'
    };
    return typeMap[fileType] || 'application/octet-stream';
  };

  const startOver = () => {
    setFiles([]);
    setProcessedDocuments([]);
    setCurrentStep("upload");
    setError(null);
    setProcessProgress(0);
    setAllSystemTags([]);
    setDuplicateWarning(null);
    setExistingDocuments([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">העלאת מסמכים</h1>
          </motion.div>
          <p className="text-slate-600">העלה מסמכים וקבל ניתוח חכם אוטומטי עם תיוג מתקדם</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            {["upload", "processing", "preview", "done"].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all
                  ${currentStep === step 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : index < ["upload", "processing", "preview", "done"].indexOf(currentStep)
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-500'
                  }
                `}>
                  {index < ["upload", "processing", "preview", "done"].indexOf(currentStep) ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {index < 3 && (
                  <ArrowRight className="w-4 h-4 text-slate-400 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {currentStep === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <FileUploadZone onFileSelect={handleFileSelect} />
              
              {files.length > 0 && (
                <>
                  <FilePreviewList files={files} onRemove={removeFile} />
                  
                  <div className="flex justify-center mt-6">
                    <Button
                      onClick={() => processDocuments(false)}
                      disabled={processing || files.length === 0}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg gap-2 px-8 py-3"
                    >
                      <Sparkles className="w-5 h-5" />
                      עיבוד חכם של המסמכים
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {currentStep === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ProcessingProgress progress={processProgress} />
            </motion.div>
          )}

          {currentStep === "preview" && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <DocumentPreview 
                documents={processedDocuments}
                allSystemTags={allSystemTags}
                onSave={saveDocuments}
                onBack={startOver}
                processing={processing}
              />
            </motion.div>
          )}

          {currentStep === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">המסמכים נשמרו בהצלחה!</h2>
              <p className="text-slate-600 mb-8">
                {processedDocuments.length} מסמכים עובדו ונשמרו במערכת עם תיוג אוטומטי
              </p>
              
              <div className="flex justify-center gap-4">
                <Button
                  onClick={startOver}
                  variant="outline"
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  העלאת מסמכים נוספים
                </Button>
                <Button
                  onClick={() => navigate(createPageUrl("Documents"))}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 gap-2"
                >
                  <FileText className="w-4 h-4" />
                  צפיה במסמכים
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Duplicate Warning Dialog */}
        {duplicateWarning && (
          <DuplicateWarningDialog
            duplicates={duplicateWarning}
            onContinue={() => {
              setDuplicateWarning(null);
              processDocuments(true); // Skip duplicate check this time
            }}
            onCancel={() => {
              setDuplicateWarning(null);
            }}
            onRemoveDuplicates={(filesToKeep) => {
              setFiles(filesToKeep);
              setDuplicateWarning(null);
            }}
          />
        )}
      </div>
    </div>
  );
}