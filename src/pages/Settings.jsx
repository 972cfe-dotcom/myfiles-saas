
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Save, Loader2, User as UserIcon, Tags } from "lucide-react";
import ProfileSettings from "../components/settings/ProfileSettings";
import TaggingPreferences from "../components/settings/TaggingPreferences";
import AccessManagement from "../components/settings/AccessManagement";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function SettingsPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await User.me();
                setUser({
                    ...currentUser,
                    tagging_preferences: currentUser.tagging_preferences?.map(group => ({
                        ...group,
                        id: group.id || Math.random().toString(36)
                    })) || []
                });
            } catch (error) {
                console.error("Failed to fetch user", error);
                toast.error("שגיאה בטעינת נתוני המשתמש.");
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await User.updateMyUserData({
                full_name: user.full_name,
                tagging_preferences: user.tagging_preferences,
            });
            toast.success("ההגדרות נשמרו בהצלחה!");
        } catch (error) {
            console.error("Failed to save settings", error);
            toast.error("שגיאה בשמירת ההגדרות.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="max-w-4xl mx-auto p-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                                <UserIcon className="w-8 h-8 text-blue-600" />
                                הגדרות
                            </h1>
                            <p className="text-slate-600 mt-1">נהל את פרטי הפרופיל, העדפות התיוג והרשאות הגישה</p>
                        </div>
                        <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
                            {saving ? (
                                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 ml-2" />
                            )}
                            שמור שינויים
                        </Button>
                    </div>

                    <div className="space-y-8">
                        <ProfileSettings user={user} setUser={setUser} />
                        <TaggingPreferences user={user} setUser={setUser} />
                        <AccessManagement />
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
