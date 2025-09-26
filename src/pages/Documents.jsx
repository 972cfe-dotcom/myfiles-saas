
import React, { useState, useEffect, useCallback } from "react";
import { Document, DocumentActivity, SharedAccess } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, FileText, Download, Eye, Calendar, Tag, Filter, Plus, SortAsc, SortDesc } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { he } from "date-fns/locale";

import DocumentCard from "../components/documents/DocumentCard";
import DocumentStats from "../components/documents/DocumentStats";
import QuickFilters from "../components/documents/QuickFilters";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("all");
  const [sortBy, setSortBy] = useState("created_date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const user = await User.me();

      // 1. Fetch user's own documents
      const ownDocsPromise = Document.filter({ created_by: user.email });

      // 2. Fetch grants for documents shared WITH the current user
      const accessGrants = await SharedAccess.filter({ shared_with_email: user.email });
      const ownerEmails = accessGrants.map(grant => grant.owner_email);

      // 3. Fetch documents from owners who shared access
      let sharedDocsPromises = [];
      if (ownerEmails.length > 0) {
        // Assuming the SDK can't handle an 'in' query, we fetch one by one.
        // This is not ideal for performance but safe for SDK compatibility.
        // We'll filter for actual documents that are shared with the user after fetching all.
        sharedDocsPromises = ownerEmails.map(email => Document.filter({ created_by: email }));
      }

      const [ownDocs, ...sharedDocsArrays] = await Promise.all([ownDocsPromise, ...sharedDocsPromises]);
      
      let sharedDocs = sharedDocsArrays.flat();

      // Further filter sharedDocs to only include documents that have an active SharedAccess record
      // This is important if Document.filter({ created_by: email }) fetches all documents by that owner,
      // not just the ones specifically shared with the current user.
      const sharedDocumentIds = new Set(accessGrants.map(grant => grant.document_id));
      sharedDocs = sharedDocs.filter(doc => sharedDocumentIds.has(doc.id));


      // 4. Combine and remove duplicates
      const allDocs = [...ownDocs, ...sharedDocs];
      const uniqueDocs = Array.from(new Map(allDocs.map(doc => [doc.id, doc])).values());

      setDocuments(uniqueDocs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = useCallback(() => {
    let filtered = [...documents];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.document_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.extracted_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by document type
    if (selectedType !== "all") {
      filtered = filtered.filter(doc => doc.document_type === selectedType);
    }

    // Sort documents
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === "created_date") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredDocuments(filtered);
  }, [documents, searchTerm, selectedType, sortBy, sortOrder]);

  useEffect(() => {
    filterDocuments();
  }, [filterDocuments]); // Now depends on the memoized filterDocuments function

  const handleDocumentView = async (document) => {
    try {
      const user = await User.me(); 
      await DocumentActivity.create({
        document_id: document.id,
        action_type: "viewed",
        user_email: user.email, 
        details: `צפה במסמך: ${document.title}`
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
    // Remove the window.open call from here since DocumentCard now handles viewing internally
  };

  const handleDocumentUpdate = (updatedDocument) => {
    // Update the document in the local state
    setDocuments(prevDocs => 
      prevDocs.map(doc => doc.id === updatedDocument.id ? updatedDocument : doc)
    );
  };

  const handleDocumentDelete = (documentId) => {
    // Remove the document from local state
    setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">מסמכים</h1>
            <p className="text-slate-600">ניהול וארגון המסמכים שלך בצורה חכמה</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="gap-2"
            >
              {sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              מיון
            </Button>
            
            <Link to={createPageUrl("Upload")}>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md gap-2">
                <Plus className="w-5 h-5" />
                העלאת מסמך חדש
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <DocumentStats documents={documents} />

        {/* Search and Filters */}
        <Card className="mb-6 border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="חיפוש מסמכים לפי שם, תוכן או תגיות..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <QuickFilters 
                selectedType={selectedType}
                onTypeChange={setSelectedType}
              />
            </div>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-slate-600">
            {loading ? "טוען..." : `נמצאו ${filteredDocuments.length} מסמכים`}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              תצוגת כרטיסיות
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              תצוגת רשימה
            </Button>
          </div>
        </div>

        {/* Documents Grid/List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-slate-200 rounded mb-3"></div>
                  <div className="h-3 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {filteredDocuments.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  viewMode={viewMode}
                  onView={() => handleDocumentView(document)}
                  onUpdate={handleDocumentUpdate}
                  onDelete={handleDocumentDelete}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Empty State */}
        {!loading && filteredDocuments.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">לא נמצאו מסמכים</h3>
            <p className="text-slate-500 mb-6">נסה לשנות את קריטריוני החיפוש או העלה מסמכים חדשים</p>
            <Link to={createPageUrl("Upload")}>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700">
                העלאת מסמך ראשון
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
