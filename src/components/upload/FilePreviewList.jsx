import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FilePreviewList({ files, onRemove }) {
    if (files.length === 0) return null;

    return (
        <Card className="mt-6 border-0 shadow-md">
            <CardHeader>
                <CardTitle>קבצים להעלאה</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <AnimatePresence>
                        {files.map((fileItem) => (
                            <motion.div
                                key={fileItem.id}
                                layout
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex items-center justify-between p-3 rounded-lg border bg-slate-50"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-800 text-sm">{fileItem.file.name}</span>
                                        <span className="text-xs text-slate-500">
                                            {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onRemove(fileItem.id)}
                                    className="text-slate-500 hover:bg-red-50 hover:text-red-600"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </CardContent>
        </Card>
    );
}