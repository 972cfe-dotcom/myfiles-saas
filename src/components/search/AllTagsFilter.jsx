import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tags, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AllTagsFilter({ allTags, selectedTags, onTagsChange, excludeTags = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);

  const availableTags = allTags.filter(tag => !excludeTags.includes(tag));
  
  const filteredTags = searchTerm.trim()
    ? availableTags.filter(tag => 
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableTags;

  const displayTags = showAll ? filteredTags : filteredTags.slice(0, 20);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  return (
    <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Tags className="w-5 h-5 text-green-600" />
          תגיות נוספות
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-700">תגיות נבחרות:</div>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {selectedTags.map((tag) => (
                  <motion.div
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="inline-block"
                  >
                    <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                      {tag}
                      <button
                        onClick={() => toggleTag(tag)}
                        className="hover:bg-green-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Search Tags */}
        <div className="space-y-2">
          <Input
            placeholder="חפש בין התגיות הקיימות..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-sm"
          />
        </div>

        {/* Available Tags */}
        {displayTags.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-700">
              תגיות זמינות ({filteredTags.length}):
            </div>
            <div className="grid grid-cols-1 gap-1 max-h-60 overflow-y-auto">
              <AnimatePresence>
                {displayTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <motion.div
                      key={tag}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Button
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => toggleTag(tag)}
                        className={`justify-between text-xs h-8 w-full ${
                          isSelected
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                        }`}
                      >
                        <span>{tag}</span>
                        {isSelected ? (
                          <X className="w-3 h-3" />
                        ) : (
                          <Plus className="w-3 h-3" />
                        )}
                      </Button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {!showAll && filteredTags.length > 20 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(true)}
                className="w-full text-xs"
              >
                הצג עוד {filteredTags.length - 20} תגיות
              </Button>
            )}
          </div>
        )}

        {filteredTags.length === 0 && searchTerm && (
          <div className="text-center py-4 text-sm text-slate-500">
            לא נמצאו תגיות המתאימות לחיפוש "{searchTerm}"
          </div>
        )}
      </CardContent>
    </Card>
  );
}