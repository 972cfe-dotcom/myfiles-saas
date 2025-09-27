import React, { useState, useEffect } from 'react';
import { SharedAccess, User } from '@/api/realEntities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Trash2, Loader2, Send } from 'lucide-react';
import { toast } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

export default function AccessManagement() {
    const [sharedUsers, setSharedUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [newEmail, setNewEmail] = useState('');
    const [newPermission, setNewPermission] = useState('view');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = await User.me();
            setCurrentUser(user);
            const grants = await SharedAccess.filter({ owner_email: user.email });
            setSharedUsers(grants);
        } catch (error) {
            console.error("Failed to load access management data", error);
            toast.error("שגיאה בטעינת הרשאות גישה");
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async () => {
        if (!newEmail || !currentUser) {
            toast.warning("יש להזין כתובת דוא\"ל");
            return;
        }
        if (newEmail === currentUser.email) {
            toast.warning("אינך יכול להוסיף את עצמך");
            return;
        }
        if (sharedUsers.some(u => u.shared_with_email === newEmail)) {
            toast.warning("משתמש זה כבר קיים ברשימה");
            return;
        }

        setIsSubmitting(true);
        try {
            const newGrant = await SharedAccess.create({
                owner_email: currentUser.email,
                shared_with_email: newEmail,
                permission_level: newPermission,
            });
            setSharedUsers([...sharedUsers, newGrant]);
            setNewEmail('');
            toast.success("ההרשאה נוספה בהצלחה");
        } catch (error) {
            console.error("Failed to add user", error);
            toast.error("שגיאה בהוספת המשתמש");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveUser = async (grantId, email) => {
        try {
            await SharedAccess.delete(grantId);
            setSharedUsers(sharedUsers.filter(u => u.id !== grantId));
            toast.success("ההרשאה הוסרה");
        } catch (error) {
            console.error("Failed to remove user", error);
            toast.error("שגיאה בהסרת המשתמש");
        }
    };
    
    if (loading) {
        return (
            <Card className="border-0 shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-800">
                        <Users className="w-6 h-6 text-blue-600" />
                        ניהול גישה
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </CardContent>
            </Card>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-800">
                        <Users className="w-6 h-6 text-blue-600" />
                        ניהול גישה
                    </CardTitle>
                    <CardDescription>
                        הזמן משתמשים נוספים לצפות במסמכים שלך או לנהל אותם
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="p-4 border rounded-lg bg-slate-50/50">
                            <h3 className="font-semibold mb-3 text-slate-700">הזמן משתמש חדש</h3>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Input
                                    type="email"
                                    placeholder="הזן כתובת דואל"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="flex-grow"
                                />
                                <Select value={newPermission} onValueChange={setNewPermission}>
                                    <SelectTrigger className="w-full sm:w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="view">צפיה</SelectItem>
                                        <SelectItem value="edit">עריכה</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button onClick={handleAddUser} disabled={isSubmitting} className="sm:w-auto">
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    <span className="ml-2">שלח הזמנה</span>
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <AnimatePresence>
                                {sharedUsers.map(grant => (
                                    <motion.div
                                        key={grant.id}
                                        layout
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="flex items-center justify-between p-3 rounded-lg border bg-white"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 bg-slate-200">
                                                <AvatarFallback className="bg-transparent text-slate-600 font-semibold">
                                                    {grant.shared_with_email.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-slate-800 text-sm">{grant.shared_with_email}</p>
                                                <p className="text-xs text-slate-500">
                                                    רמת הרשאה: {grant.permission_level === 'view' ? 'צפיה' : 'עריכה'}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveUser(grant.id, grant.shared_with_email)}
                                            className="text-slate-500 hover:bg-red-50 hover:text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {sharedUsers.length === 0 && (
                                <p className="text-center text-sm text-slate-500 py-4">
                                    עדיין לא שיתפת גישה עם אף אחד
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}