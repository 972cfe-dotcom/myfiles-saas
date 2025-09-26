
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, ChevronLeft, ChevronRight, Loader2, Tags, X, Plus, Sparkles, Eye } from 'lucide-react';
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

const RequiredTagGroup = ({ group, selectedTags, onTagChange, aiSuggestedTags = [] }) => {
  const selectedFromGroup = selectedTags.filter(tag => group.tags.includes(tag));
  const hasSelection = selectedFromGroup.length > 0;
  const isRequired = group.is_required !== false; // Default to true if undefined or null

  return (
    <div className={`p-4 border rounded-lg transition-colors ${
      isRequired 
        ? hasSelection 
          ? 'border-green-200 bg-green-50/30' 
          : 'border-red-200 bg-red-50/30'
        : hasSelection
          ? 'border-blue-200 bg-blue-50/30'
          : 'border-slate-200 bg-slate-50/30'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-3 h-3 rounded-full ${
          isRequired 
            ? hasSelection ? 'bg-green-500' : 'bg-red-500'
            : hasSelection ? 'bg-blue-500' : 'bg-slate-400'
        }`} />
        <h5 className="font-semibold text-slate-800">
          {group.group_name} 
          {isRequired && <span className="text-red-500">*</span>}
          {!isRequired && <span className="text-slate-400 text-xs">(אופציונלי)</span>}
        </h5>
        {isRequired && !hasSelection && (
          <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded">חובה לבחור</span>
        )}
      </div>
      
      <div className="space-y-2">
        {/* Current selection */}
        {selectedFromGroup.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedFromGroup.map(tag => (
              <Badge key={tag} className="bg-green-100 text-green-800 flex items-center gap-1">
                {tag}
                <button onClick={() => {
                  const newTags = selectedTags.filter(t => t !== tag);
                  onTagChange(newTags);
                }} className="rounded-full hover:bg-green-200 p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        
        {/* Available options */}
        <div className="flex flex-wrap gap-1">
          {group.tags.map(tag => {
            const isSelected = selectedFromGroup.includes(tag);
            const isAiSuggested = aiSuggestedTags.includes(tag);
            return (
              <Button
                key={tag}
                size="sm"
                variant={isSelected ? "default" : "outline"}
                className={`text-xs h-7 transition-all ${
                  isSelected 
                    ? "bg-green-600 hover:bg-green-700 text-white" 
                    : isAiSuggested 
                      ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                      : "hover:bg-slate-50"
                }`}
                onClick={() => {
                  if (isSelected) {
                    const newTags = selectedTags.filter(t => t !== tag);
                    onTagChange(newTags);
                  } else {
                    const otherGroupTags = selectedTags.filter(t => !group.tags.includes(t));
                    onTagChange([...otherGroupTags, tag]);
                  }
                }}
              >
                {isAiSuggested && <Sparkles className="w-3 h-3 ml-1" />}
                {tag}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const TagManager = ({ 
  tags = [], 
  allSystemTags = [], 
  suggestedTags = [], 
  requiredTagGroups = [],
  optionalTagGroups = [], // New prop for optional tag groups
  onTagsChange 
}) => {
  const [newTag, setNewTag] = useState('');

  // Combine all group tags (required and optional) for filtering free-form tags
  const allGroupTags = [...requiredTagGroups, ...optionalTagGroups].flatMap(group => group.tags);

  // Separate tags that are not part of any defined group (these are "optional individual tags")
  const optionalTags = tags.filter(tag => 
    !allGroupTags.includes(tag)
  );

  const addOptionalTag = (tag) => {
    if (tag && !tags.includes(tag)) {
      onTagsChange([...tags, tag]);
    }
  };

  const handleAddTag = () => {
    addOptionalTag(newTag);
    setNewTag('');
  };

  const removeOptionalTag = (tagToRemove) => {
    onTagsChange(tags.filter(t => t !== tagToRemove));
  };

  // Filter available system/suggested tags, ensuring they are not already selected or part of any group
  const availableSystemTags = allSystemTags.filter(t => 
    !tags.includes(t) && !allGroupTags.includes(t)
  );
  const availableSuggestedTags = suggestedTags.filter(t => 
    !tags.includes(t) && !allGroupTags.includes(t)
  );

  // Check if all required groups have selections
  const missingRequiredGroups = requiredTagGroups.filter(group => 
    !group.tags.some(tag => tags.includes(tag))
  );

  return (
    <div className="space-y-6">
      {/* Required Tag Groups */}
      {requiredTagGroups.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Tags className="w-5 h-5 text-red-600" />
            <h4 className="font-semibold text-slate-800">תגיות חובה</h4>
            {missingRequiredGroups.length > 0 && (
              <Badge className="bg-red-100 text-red-700 text-xs">
                חסרות {missingRequiredGroups.length} תגיות חובה
              </Badge>
            )}
          </div>
          
          {requiredTagGroups.map((group) => (
            <RequiredTagGroup
              key={group.id}
              group={group}
              selectedTags={tags}
              onTagChange={onTagsChange}
              aiSuggestedTags={suggestedTags}
            />
          ))}
        </div>
      )}

      {/* Optional Tag Groups */}
      {optionalTagGroups.length > 0 && (
        <div className="space-y-4 pt-6 mt-6 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <Tags className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-slate-800">קבוצות תגיות אופציונליות</h4>
          </div>
          {optionalTagGroups.map((group) => (
            <RequiredTagGroup
              key={group.id}
              group={group}
              selectedTags={tags}
              onTagChange={onTagsChange}
              aiSuggestedTags={suggestedTags}
            />
          ))}
        </div>
      )}

      {/* Optional Individual Tags Section */}
      <div className="space-y-4 rounded-lg border bg-slate-50/70 p-4 mt-6">
        <div className="flex items-center gap-2">
          <Tags className="w-5 h-5 text-slate-600" />
          <h4 className="font-semibold text-slate-800">תגיות נוספות (פרטניות)</h4>
        </div>

        {/* Current Optional Tags */}
        <div className="flex flex-wrap gap-2 min-h-[30px]">
          <AnimatePresence>
            {optionalTags.map((tag) => (
              <motion.div key={tag} layout initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                <Badge className="flex items-center gap-1 bg-blue-100 text-blue-800 text-sm py-1 px-3">
                  {tag}
                  <button onClick={() => removeOptionalTag(tag)} className="rounded-full hover:bg-black/10 p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add New Optional Tag */}
        <div className="flex gap-2">
          <Input
            placeholder="הוסף תגית נוספת..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
          />
          <Button onClick={handleAddTag} variant="outline" size="icon" className="shrink-0">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Suggested Optional Tags */}
        {(availableSuggestedTags.length > 0 || availableSystemTags.length > 0) && (
          <div className="space-y-3 pt-3 border-t">
            {availableSuggestedTags.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500" />הצעות AI:
                </p>
                <div className="flex flex-wrap gap-1">
                  {availableSuggestedTags.map(tag => (
                    <Button key={tag} size="sm" variant="outline" className="text-xs h-7" onClick={() => addOptionalTag(tag)}>
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {availableSystemTags.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2">תגיות קיימות:</p>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {availableSystemTags.map(tag => (
                    <Button key={tag} size="sm" variant="outline" className="text-xs h-7" onClick={() => addOptionalTag(tag)}>
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function DocumentPreview({ documents, allSystemTags, onSave, onBack, processing }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [editableDocuments, setEditableDocuments] = useState(documents);
    const [userTagPreferences, setUserTagPreferences] = useState([]);
    const [viewingDocument, setViewingDocument] = useState(null);
    const currentDoc = editableDocuments[currentIndex];

    // Load user tagging preferences on mount
    useEffect(() => {
        const loadUserPreferences = async () => {
            try {
                const { User } = await import('@/api/entities');
                const user = await User.me();
                setUserTagPreferences(user.tagging_preferences || []);
            } catch (error) {
                console.error('Error loading user preferences:', error);
            }
        };
        loadUserPreferences();
    }, []);

    const handleUpdate = (field, value) => {
        const newDocs = [...editableDocuments];
        newDocs[currentIndex][field] = value;
        setEditableDocuments(newDocs);
    };

    const handleTagsChange = (newTags) => {
        handleUpdate('tags', newTags);
    };

    // Filter user preferences into required and optional groups
    const requiredTagGroups = userTagPreferences.filter(group => group.is_required !== false);
    const optionalTagGroups = userTagPreferences.filter(group => group.is_required === false);

    // Check if all documents have required tags (only check required groups)
    const canSave = editableDocuments.every(doc => {
        const currentDocTags = doc.tags || [];
        return requiredTagGroups.every(group => 
            group.tags.some(tag => currentDocTags.includes(tag))
        );
    });

    const missingRequiredTagsCount = editableDocuments.reduce((count, doc) => {
        const currentDocTags = doc.tags || [];
        const missingGroups = requiredTagGroups.filter(group => 
            !group.tags.some(tag => currentDocTags.includes(tag))
        );
        return count + missingGroups.length;
    }, 0);

    if (!currentDoc) {
      return (
        <Card className="text-center p-8">
          <CardTitle>אין מסמכים לסקור</CardTitle>
          <Button onClick={onBack} variant="outline" className="mt-4">חזור</Button>
        </Card>
      );
    }

    console.log('Current document in preview:', currentDoc); // Debug log

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-3">
                                מסמך {currentIndex + 1} מתוך {editableDocuments.length}
                                {/* כפתור העין לצפיה */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setViewingDocument(currentDoc)}
                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                    title="צפה במסמך"
                                >
                                    <Eye className="w-4 h-4" />
                                </Button>
                            </CardTitle>
                            <CardDescription>
                                ערוך את פרטי המסמך ונהל את התגיות לפני השמירה במערכת
                            </CardDescription>
                        </div>
                        
                        <div className="flex gap-2">
                            <Button onClick={() => setCurrentIndex(p => p - 1)} variant="outline" disabled={currentIndex === 0}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => setCurrentIndex(p => p + 1)} variant="outline" disabled={currentIndex === editableDocuments.length - 1}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">כותרת</label>
                        <Input
                            value={currentDoc.title}
                            onChange={(e) => handleUpdate('title', e.target.value)}
                            className="font-semibold text-base"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">סוג המסמך</label>
                          <Select value={currentDoc.document_type || ''} onValueChange={(value) => handleUpdate('document_type', value)}>
                              <SelectTrigger>
                                  <SelectValue placeholder="בחר סוג" />
                              </SelectTrigger>
                              <SelectContent>
                                  {Object.entries(documentTypeLabels).map(([key, label]) => (
                                      <SelectItem key={key} value={key}>{label}</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">גוף / חברה</label>
                          <Input
                              value={currentDoc.organization || ''}
                              onChange={(e) => handleUpdate('organization', e.target.value)}
                              placeholder="שם הגוף או החברה"
                          />
                      </div>
                    </div>
                    <TagManager
                      tags={currentDoc.tags || []}
                      suggestedTags={currentDoc.ai_suggested_tags || []}
                      allSystemTags={allSystemTags}
                      requiredTagGroups={requiredTagGroups}
                      optionalTagGroups={optionalTagGroups}
                      onTagsChange={handleTagsChange}
                    />
                </CardContent>
            </Card>

            <div className="flex justify-between items-center">
                <Button onClick={onBack} variant="outline" className="gap-2">
                    <ChevronRight className="w-4 h-4" />
                    התחל מחדש
                </Button>
                
                <div className="flex flex-col items-end gap-2">
                    {!canSave && missingRequiredTagsCount > 0 && (
                        <p className="text-xs text-red-600 bg-red-50 px-3 py-1 rounded">
                            חסרות {missingRequiredTagsCount} תגיות חובה
                        </p>
                    )}
                    <Button 
                        onClick={() => onSave(editableDocuments)} 
                        disabled={processing || !canSave} 
                        className={`shadow-lg gap-2 transition-all ${
                            canSave 
                                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700" 
                                : "bg-gray-400 cursor-not-allowed"
                        }`}
                    >
                        {processing ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                        שמור את כל {editableDocuments.length} המסמכים
                    </Button>
                </div>
            </div>
            
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
