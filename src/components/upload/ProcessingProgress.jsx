import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

export default function ProcessingProgress({ progress }) {
    return (
        <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    מעבד מסמכים...
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
                <p className="text-slate-600 mb-4">זה עשוי לקחת מספר רגעים, אנא המתן.</p>
                <div className="w-full">
                    <Progress value={progress} className="h-2" />
                    <p className="text-center text-sm font-medium mt-2 text-blue-700">{Math.round(progress)}%</p>
                </div>
            </CardContent>
        </Card>
    );
}