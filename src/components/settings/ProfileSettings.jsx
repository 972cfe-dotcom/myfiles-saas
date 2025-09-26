import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, AtSign } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfileSettings({ user, setUser }) {
    if (!user) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-800">
                        <User className="w-6 h-6 text-blue-600" />
                        פרטי פרופיל
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="font-medium text-slate-700">שם מלא</Label>
                            <Input
                                id="fullName"
                                value={user.full_name || ''}
                                onChange={(e) => setUser({ ...user, full_name: e.target.value })}
                                placeholder="הזן את שמך המלא"
                                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="font-medium text-slate-700">דואר אלקטרוני</Label>
                            <div className="relative">
                                <AtSign className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="email"
                                    value={user.email || ''}
                                    disabled
                                    className="pr-10 bg-slate-100 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}