import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tags, Plus, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TagGroup = ({ group, onUpdate, onDelete }) => {
    const [newTag, setNewTag] = React.useState('');

    const handleAddTag = () => {
        if (newTag && !group.tags.includes(newTag)) {
            onUpdate(group.id, { ...group, tags: [...group.tags, newTag] });
            setNewTag('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        onUpdate(group.id, { ...group, tags: group.tags.filter(t => t !== tagToRemove) });
    };

    const handleRequiredChange = (checked) => {
        onUpdate(group.id, { ...group, is_required: checked });
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`p-4 border rounded-lg ${group.is_required !== false ? 'bg-red-50/30 border-red-200' : 'bg-slate-50/50 border-slate-200'}`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 space-y-3">
                    <Input
                        value={group.group_name}
                        onChange={(e) => onUpdate(group.id, { ...group, group_name: e.target.value })}
                        placeholder="שם קבוצת התיוג (למשל, בני משפחה)"
                        className="font-semibold text-md"
                    />
                    
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id={`required-${group.id}`}
                            checked={group.is_required !== false}
                            onCheckedChange={handleRequiredChange}
                        />
                        <label
                            htmlFor={`required-${group.id}`}
                            className={`text-sm font-medium cursor-pointer ${
                                group.is_required !== false ? 'text-red-700' : 'text-slate-600'
                            }`}
                        >
                            {group.is_required !== false ? 'תגית חובה ⚠️' : 'תגית אופציונלית'}
                        </label>
                    </div>
                </div>
                
                <Button variant="ghost" size="icon" onClick={() => onDelete(group.id)} className="text-red-500 hover:bg-red-50 hover:text-red-600 ml-2">
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>

            <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                        {group.tags.map(tag => (
                            <motion.div
                                key={tag}
                                layout
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                            >
                                <Badge className={`flex items-center gap-1 text-sm py-1 px-2 ${
                                    group.is_required !== false 
                                        ? 'bg-red-100 text-red-800' 
                                        : 'bg-blue-100 text-blue-800'
                                }`}>
                                    {tag}
                                    <button onClick={() => handleRemoveTag(tag)} className="rounded-full hover:bg-white/20 p-0.5">
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
                <div className="flex gap-2">
                    <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        placeholder="הוסף תגית חדשה..."
                        className="flex-1"
                    />
                    <Button onClick={handleAddTag} size="sm" variant="outline">הוסף</Button>
                </div>
            </div>
        </motion.div>
    );
};

export default function TaggingPreferences({ user, setUser }) {
    if (!user) return null;

    const handleAddGroup = () => {
        setUser({
            ...user,
            tagging_preferences: [
                ...(user.tagging_preferences || []),
                { id: Math.random().toString(36), group_name: '', tags: [], is_required: true }
            ]
        });
    };

    const handleUpdateGroup = (id, updatedGroup) => {
        setUser({
            ...user,
            tagging_preferences: user.tagging_preferences.map(g => g.id === id ? updatedGroup : g)
        });
    };

    const handleDeleteGroup = (id) => {
        setUser({
            ...user,
            tagging_preferences: user.tagging_preferences.filter(g => g.id !== id)
        });
    };

    const requiredGroups = user.tagging_preferences?.filter(g => g.is_required !== false) || [];
    const optionalGroups = user.tagging_preferences?.filter(g => g.is_required === false) || [];

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
        >
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-800">
                        <Tags className="w-6 h-6 text-blue-600" />
                        הגדרות תיוג חכם
                    </CardTitle>
                    <CardDescription>
                        הגדר קבוצות תיוג ותגיות מותאמות אישית. ציין איזה קבוצות הן חובה (כל מסמך חייב להיות מתויג מהן) ואיזה אופציונליות.
                        לדוגמה, קבוצה "בני משפחה" עם שמותיהם כחובה, או קבוצה "סוג הוצאה" כאופציונלית.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {requiredGroups.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                                ⚠️ קבוצות חובה ({requiredGroups.length})
                            </h4>
                            <div className="space-y-4">
                                <AnimatePresence>
                                    {requiredGroups.map(group => (
                                        <TagGroup
                                            key={group.id}
                                            group={group}
                                            onUpdate={handleUpdateGroup}
                                            onDelete={handleDeleteGroup}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                    
                    {optionalGroups.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-slate-600 mb-2 flex items-center gap-2">
                                📝 קבוצות אופציונליות ({optionalGroups.length})
                            </h4>
                            <div className="space-y-4">
                                <AnimatePresence>
                                    {optionalGroups.map(group => (
                                        <TagGroup
                                            key={group.id}
                                            group={group}
                                            onUpdate={handleUpdateGroup}
                                            onDelete={handleDeleteGroup}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                    
                    <Button onClick={handleAddGroup} variant="outline" className="w-full border-dashed gap-2">
                        <Plus className="w-4 h-4" />
                        הוסף קבוצת תיוג
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
}