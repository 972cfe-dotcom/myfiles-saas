import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SavedSearch } from '@/api/entities';
import { Bookmark, Plus, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function SavedSearches({ onLoadSearch }) {
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [searchName, setSearchName] = useState('');

  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = async () => {
    try {
      const searches = await SavedSearch.list('-created_date', 10);
      setSavedSearches(searches);
    } catch (error) {
      console.error('Error loading saved searches:', error);
    }
  };

  const handleSaveSearch = async () => {
    if (!searchName.trim()) {
      toast.warning('יש להזין שם לחיפוש השמור');
      return;
    }

    try {
      const currentUrl = new URL(window.location.href);
      const searchParams = new URLSearchParams(currentUrl.search);
      
      await SavedSearch.create({
        name: searchName,
        search_query: searchParams.get('q') || '',
        filters: {
          tags: searchParams.get('tags')?.split(',').filter(Boolean) || []
        }
      });
      
      toast.success('החיפוש נשמר בהצלחה');
      setSearchName('');
      setShowSaveForm(false);
      loadSavedSearches();
    } catch (error) {
      console.error('Error saving search:', error);
      toast.error('שגיאה בשמירת החיפוש');
    }
  };

  const handleDeleteSearch = async (searchId) => {
    try {
      await SavedSearch.delete(searchId);
      setSavedSearches(prev => prev.filter(s => s.id !== searchId));
      toast.success('החיפוש השמור נמחק');
    } catch (error) {
      console.error('Error deleting search:', error);
      toast.error('שגיאה במחיקת החיפוש');
    }
  };

  return (
    <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-600" />
            חיפושים שמורים
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSaveForm(!showSaveForm)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Save Search Form */}
        <AnimatePresence>
          {showSaveForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 p-3 bg-amber-50 rounded-lg border"
            >
              <Input
                placeholder="שם החיפוש..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveSearch()}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveSearch}>
                  שמור
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowSaveForm(false)}>
                  ביטול
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved Searches List */}
        <div className="space-y-2">
          <AnimatePresence>
            {savedSearches.map((search) => (
              <motion.div
                key={search.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => onLoadSearch({
                      query: search.search_query,
                      tags: search.filters?.tags || []
                    })}
                    className="text-left w-full"
                  >
                    <div className="font-medium text-sm text-slate-800 truncate">
                      {search.name}
                    </div>
                    {search.search_query && (
                      <div className="text-xs text-slate-500 truncate">
                        "{search.search_query}"
                      </div>
                    )}
                  </button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteSearch(search.id)}
                  className="text-slate-500 hover:text-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {savedSearches.length === 0 && (
            <div className="text-center py-4 text-sm text-slate-500">
              אין חיפושים שמורים
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}