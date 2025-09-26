import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Tag } from 'lucide-react';

export default function TagSearchBox({ value, onChange, allTags, placeholder }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredTags, setFilteredTags] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (value.trim() && allTags.length > 0) {
      const searchTerm = value.toLowerCase();
      const filtered = allTags
        .filter(tag => tag.toLowerCase().includes(searchTerm))
        .slice(0, 10); // Limit to 10 suggestions
      setFilteredTags(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredTags([]);
    }
  }, [value, allTags]);

  const handleTagSelect = (tag) => {
    onChange(tag);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value.trim() && setShowSuggestions(filteredTags.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          className="pr-10"
        />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-slate-500 mb-2 px-2">תגיות מתאימות:</div>
            {filteredTags.map((tag) => (
              <Button
                key={tag}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm h-8 mb-1"
                onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                onClick={() => handleTagSelect(tag)}
              >
                <Tag className="w-3 h-3 ml-2 text-slate-400" />
                {tag}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}