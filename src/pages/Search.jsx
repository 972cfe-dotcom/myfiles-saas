
import React, { useState, useEffect, useCallback } from "react";
import { Document, User, SharedAccess } from "@/api/realEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, X, Tag, Sparkles, FileText, SortAsc, SortDesc, Eye, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import RequiredTagsFilter from "../components/search/RequiredTagsFilter";
import TagSearchBox from "../components/search/TagSearchBox";
import AllTagsFilter from "../components/search/AllTagsFilter";
import SearchResults from "../components/search/SearchResults";
import SavedSearches from "../components/search/SavedSearches";

export default function SearchPage() {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [userTagPreferences, setUserTagPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [textSearch, setTextSearch] = useState("");
  const [selectedRequiredTags, setSelectedRequiredTags] = useState({});
  const [selectedOptionalTags, setSelectedOptionalTags] = useState([]);
  const [sortBy, setSortBy] = useState("relevance"); // relevance, date, title
  const [sortOrder, setSortOrder] = useState("desc");
  
  const [searchStats, setSearchStats] = useState({
    total: 0,
    filtered: 0,
    searchTime: 0
  });

  // Bulk selection state
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user preferences
      const user = await User.me();
      const preferences = user.tagging_preferences || [];
      setUserTagPreferences(preferences);
      
      // Initialize required tags state
      const initialRequiredTags = {};
      preferences.forEach(group => {
        initialRequiredTags[group.id] = "";
      });
      setSelectedRequiredTags(initialRequiredTags);

      // Load documents accessible by the current user
      const ownDocsPromise = Document.filter({ created_by: user.email });
      const accessGrants = await SharedAccess.filter({ shared_with_email: user.email });
      const sharedDocumentIds = new Set(accessGrants.map(grant => grant.document_id));
      
      const ownerEmails = [...new Set(accessGrants.map(grant => grant.owner_email))];
      const sharedDocsPromises = ownerEmails.map(email => Document.filter({ created_by: email }));

      const [ownDocs, ...sharedDocsArrays] = await Promise.all([ownDocsPromise, ...sharedDocsPromises]);
      
      let sharedDocs = sharedDocsArrays.flat();
      sharedDocs = sharedDocs.filter(doc => sharedDocumentIds.has(doc.id));

      const allUserDocs = [...ownDocs, ...sharedDocs];
      const uniqueDocs = Array.from(new Map(allUserDocs.map(doc => [doc.id, doc])).values());
      
      setDocuments(uniqueDocs);
      setFilteredDocuments(uniqueDocs);
      
      // Extract all unique tags
      const uniqueTags = [...new Set(uniqueDocs.flatMap(doc => doc.tags || []))];
      setAllTags(uniqueTags);
      
      setSearchStats(prev => ({ ...prev, total: uniqueDocs.length, filtered: uniqueDocs.length }));
    } catch (error) {
      console.error('Error loading search data:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = useCallback(() => {
    const startTime = Date.now();
    let filtered = [...documents];

    // Text search in tags, title, organization, and extracted text
    if (textSearch.trim()) {
      const searchTerm = textSearch.toLowerCase();
      filtered = filtered.filter(doc => {
        return (
          doc.title?.toLowerCase().includes(searchTerm) ||
          doc.organization?.toLowerCase().includes(searchTerm) ||
          doc.extracted_text?.toLowerCase().includes(searchTerm) ||
          doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      });
    }

    // Filter by required tags (must match ALL selected required tags)
    Object.entries(selectedRequiredTags).forEach(([groupId, selectedTag]) => {
      if (selectedTag) {
        filtered = filtered.filter(doc => 
          doc.tags?.includes(selectedTag)
        );
      }
    });

    // Filter by optional tags (must match ANY of the selected optional tags)
    if (selectedOptionalTags.length > 0) {
      filtered = filtered.filter(doc =>
        selectedOptionalTags.some(tag => doc.tags?.includes(tag))
      );
    }

    // Calculate relevance score for sorting
    if (sortBy === "relevance") {
      filtered = filtered.map(doc => {
        let relevanceScore = 0;
        
        // Score for required tag matches
        Object.values(selectedRequiredTags).forEach(tag => {
          if (tag && doc.tags?.includes(tag)) {
            relevanceScore += 10;
          }
        });
        
        // Score for optional tag matches
        selectedOptionalTags.forEach(tag => {
          if (doc.tags?.includes(tag)) {
            relevanceScore += 5;
          }
        });
        
        // Score for text search matches
        if (textSearch.trim()) {
          const searchTerm = textSearch.toLowerCase();
          if (doc.title?.toLowerCase().includes(searchTerm)) relevanceScore += 8;
          if (doc.organization?.toLowerCase().includes(searchTerm)) relevanceScore += 6;
          if (doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm))) relevanceScore += 7;
          if (doc.extracted_text?.toLowerCase().includes(searchTerm)) relevanceScore += 3;
        }
        
        return { ...doc, _relevanceScore: relevanceScore };
      });
      
      // Sort by relevance score
      filtered.sort((a, b) => 
        sortOrder === "desc" 
          ? (b._relevanceScore || 0) - (a._relevanceScore || 0)
          : (a._relevanceScore || 0) - (b._relevanceScore || 0)
      );
    } else {
      // Sort by other criteria
      filtered.sort((a, b) => {
        let aVal = a[sortBy === "date" ? "created_date" : sortBy];
        let bVal = b[sortBy === "date" ? "created_date" : sortBy];
        
        if (sortBy === "date") {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }
        
        if (sortOrder === "desc") {
          return aVal > bVal ? -1 : 1;
        } else {
          return aVal > bVal ? 1 : -1;
        }
      });
    }

    const searchTime = Date.now() - startTime;
    setFilteredDocuments(filtered);
    setSearchStats({
      total: documents.length,
      filtered: filtered.length,
      searchTime
    });
    // Clear selection when filtered documents change
    setSelectedDocuments([]);
  }, [documents, textSearch, selectedRequiredTags, selectedOptionalTags, sortBy, sortOrder]);

  // Perform search when any search parameter changes
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const handleSelectDocument = (documentId, checked) => {
    if (checked) {
      setSelectedDocuments([...selectedDocuments, documentId]);
    } else {
      setSelectedDocuments(selectedDocuments.filter(id => id !== documentId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedDocuments(filteredDocuments.map(doc => doc.id));
    } else {
      setSelectedDocuments([]);
    }
  };

  const handleBulkDownload = async () => {
    setBulkActionLoading(true);
    try {
      const selectedDocs = filteredDocuments.filter(doc => selectedDocuments.includes(doc.id));
      
      for (const doc of selectedDocs) {
        const link = document.createElement('a');
        link.href = doc.file_url;
        link.download = doc.original_filename || `${doc.title || 'document'}.pdf`; // Fallback filename
        link.target = '_blank'; // Open in new tab/window for some browsers
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Add small delay between downloads to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setSelectedDocuments([]);
    } catch (error) {
      console.error('Error downloading files:', error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkView = () => {
    const selectedDocs = filteredDocuments.filter(doc => selectedDocuments.includes(doc.id));
    selectedDocs.forEach(doc => {
      window.open(doc.file_url, '_blank');
    });
    setSelectedDocuments([]);
  };

  const clearAllFilters = () => {
    setTextSearch("");
    const emptyRequiredTags = {};
    userTagPreferences.forEach(group => {
      emptyRequiredTags[group.id] = "";
    });
    setSelectedRequiredTags(emptyRequiredTags);
    setSelectedOptionalTags([]);
  };

  const hasActiveFilters = () => {
    return textSearch.trim() || 
           Object.values(selectedRequiredTags).some(tag => tag) ||
           selectedOptionalTags.length > 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Search className="w-8 h-8 text-blue-600" />
                חיפוש מתקדם
              </h1>
              <p className="text-slate-600 mt-1">חפש במסמכים שלך בעזרת תגיות חכמות וחיפוש מתקדם</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Bulk Actions */}
              {selectedDocuments.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800">
                    {selectedDocuments.length} נבחרו
                  </Badge>
                  <Button 
                    onClick={handleBulkView}
                    variant="outline" 
                    size="sm"
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    צפיה מרוכזת
                  </Button>
                  <Button 
                    onClick={handleBulkDownload}
                    disabled={bulkActionLoading}
                    variant="outline" 
                    size="sm"
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {bulkActionLoading ? 'מוריד...' : 'הורדה מרוכזת'}
                  </Button>
                  <Button 
                    onClick={() => setSelectedDocuments([])}
                    variant="outline" 
                    size="sm"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              <div className="text-sm text-slate-600 bg-white px-3 py-2 rounded-lg shadow-sm">
                {searchStats.filtered} מתוך {searchStats.total} מסמכים
                {searchStats.searchTime > 0 && (
                  <span className="text-slate-400"> • {searchStats.searchTime}ms</span>
                )}
              </div>
              
              {hasActiveFilters() && (
                <Button onClick={clearAllFilters} variant="outline" size="sm">
                  <X className="w-4 h-4 ml-2" />
                  נקה פילטרים
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Search Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Text Search */}
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-600" />
                  חיפוש כללי
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TagSearchBox
                  value={textSearch}
                  onChange={setTextSearch}
                  allTags={allTags}
                  placeholder="חפש במסמכים, תגיות, או תוכן..."
                />
              </CardContent>
            </Card>

            {/* Required Tags Filter */}
            {userTagPreferences.length > 0 && (
              <RequiredTagsFilter
                tagGroups={userTagPreferences}
                selectedTags={selectedRequiredTags}
                onTagChange={(groupId, tag) => {
                  setSelectedRequiredTags(prev => ({
                    ...prev,
                    [groupId]: tag
                  }));
                }}
              />
            )}

            {/* All Tags Filter */}
            <AllTagsFilter
              allTags={allTags}
              selectedTags={selectedOptionalTags}
              onTagsChange={setSelectedOptionalTags}
              excludeTags={Object.values(selectedRequiredTags).filter(Boolean)}
            />

            {/* Saved Searches */}
            <SavedSearches
              onLoadSearch={(search) => {
                setTextSearch(search.query || "");
                setSelectedOptionalTags(search.tags || []);
              }}
            />
          </div>

          {/* Results Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Sort Controls and Select All */}
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {filteredDocuments.length > 0 && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-600">בחר הכל</span>
                      </div>
                    )}
                    
                    <span className="text-sm font-medium text-slate-700">מיון:</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={sortBy === "relevance" ? "default" : "outline"}
                        onClick={() => setSortBy("relevance")}
                        className="text-xs"
                      >
                        <Sparkles className="w-3 h-3 ml-1" />
                        רלוונטיות
                      </Button>
                      <Button
                        size="sm"
                        variant={sortBy === "date" ? "default" : "outline"}
                        onClick={() => setSortBy("date")}
                        className="text-xs"
                      >
                        תאריך
                      </Button>
                      <Button
                        size="sm"
                        variant={sortBy === "title" ? "default" : "outline"}
                        onClick={() => setSortBy("title")}
                        className="text-xs"
                      >
                        שם
                      </Button>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  >
                    {sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Active Filters Display */}
            {hasActiveFilters() && (
              <Card className="border-0 shadow-md bg-blue-50/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">פילטרים פעילים:</span>
                    
                    {textSearch && (
                      <Badge className="bg-blue-100 text-blue-800">
                        טקסט: {textSearch}
                        <button
                          onClick={() => setTextSearch("")}
                          className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}
                    
                    {Object.entries(selectedRequiredTags).map(([groupId, tag]) => {
                      if (!tag) return null;
                      const group = userTagPreferences.find(g => g.id === groupId);
                      return (
                        <Badge key={groupId} className="bg-red-100 text-red-800">
                          {group?.group_name}: {tag}
                          <button
                            onClick={() => setSelectedRequiredTags(prev => ({
                              ...prev,
                              [groupId]: ""
                            }))}
                            className="ml-1 hover:bg-red-200 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      );
                    })}
                    
                    {selectedOptionalTags.map(tag => (
                      <Badge key={tag} className="bg-green-100 text-green-800">
                        {tag}
                        <button
                          onClick={() => setSelectedOptionalTags(prev => prev.filter(t => t !== tag))}
                          className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search Results */}
            <SearchResults
              documents={filteredDocuments}
              loading={loading}
              searchStats={searchStats}
              highlightTerms={[textSearch, ...Object.values(selectedRequiredTags).filter(Boolean), ...selectedOptionalTags]}
              selectedDocuments={selectedDocuments}
              onSelectDocument={handleSelectDocument}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
