
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag, AlertCircle } from 'lucide-react';

export default function RequiredTagsFilter({ tagGroups, selectedTags, onTagChange }) {
  if (!tagGroups || tagGroups.length === 0) return null;

  // Filter to show only required groups
  // A group is considered required if 'is_required' is true or undefined/null (default to required)
  // It's not required only if 'is_required' is explicitly false.
  const requiredGroups = tagGroups.filter(group => group.is_required !== false);
  
  if (requiredGroups.length === 0) return null;

  return (
    <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          תגיות חובה
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {requiredGroups.map((group) => {
          const selectedTag = selectedTags[group.id];
          return (
            <div key={group.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-700 text-sm">{group.group_name}</h4>
                {selectedTag && (
                  <Badge className="bg-red-100 text-red-800 text-xs">
                    {selectedTag}
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-1">
                {group.tags.map((tag) => (
                  <Button
                    key={tag}
                    size="sm"
                    variant={selectedTag === tag ? "default" : "outline"}
                    onClick={() => onTagChange(group.id, selectedTag === tag ? "" : tag)}
                    className={`justify-start text-xs h-8 ${
                      selectedTag === tag 
                        ? "bg-red-600 hover:bg-red-700 text-white" 
                        : "hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                    }`}
                  >
                    <Tag className="w-3 h-3 ml-2" />
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
