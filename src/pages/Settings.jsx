import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2, User as UserIcon, Settings, LogOut, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user && profile) {
      setFormData({
        fullName: profile.fullName || user.fullName || '',
        email: user.email || ''
      });
    }
  }, [user, profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { data, error: updateError } = await updateProfile({
        fullName: formData.fullName
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('שגיאה בעדכון הפרופיל');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    if (window.confirm('האם אתה בטוח שברצונך להתנתק?')) {
      await signOut();
      navigate('/auth');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-600 rounded-xl flex items-center justify-center shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">הגדרות</h1>
          </div>
          <p className="text-gray-600">ניהול הפרופיל וההגדרות שלך</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Settings */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  פרטי חשבון
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Success Alert */}
                {success && (
                  <Alert className="mb-4 border-green-200 bg-green-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-green-800">הפרופיל עודכן בהצלחה!</AlertDescription>
                  </Alert>
                )}

                {/* Error Alert */}
                {error && (
                  <Alert className="mb-4 border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">שם מלא</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="הזן את השם המלא שלך"
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">כתובת אימייל</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      disabled={true}
                      className="bg-gray-50"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      לא ניתן לשנות את כתובת האימייל
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        שומר...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        שמירת שינויים
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Account Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>פעולות חשבון</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-900 mb-2">מידע על החשבון</h3>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>סוג חשבון:</strong> בסיסי</p>
                    <p><strong>הצטרפות:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('he-IL') : 'לא ידוע'}</p>
                    <p><strong>מזהה משתמש:</strong> {user?.id}</p>
                  </div>
                </div>

                <Button
                  onClick={handleSignOut}
                  variant="destructive"
                  className="w-full"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  התנתקות מהחשבון
                </Button>
              </CardContent>
            </Card>

            {/* Storage Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>נתוני אחסון</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">שטח בשימוש:</span>
                    <span className="text-sm font-medium">0 MB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">שטח כולל:</span>
                    <span className="text-sm font-medium">1 GB</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    0% מהשטח בשימוש
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Settings */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>הגדרות נוספות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">העדפות תצוגה</h3>
                <p className="text-sm text-gray-600 mb-3">התאם את ממשק המשתמש לפי ההעדפות שלך</p>
                <Button variant="outline" size="sm" disabled>
                  בקרוב
                </Button>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">הודעות ואזעקות</h3>
                <p className="text-sm text-gray-600 mb-3">נהל את ההודעות והתזכורות שאתה מקבל</p>
                <Button variant="outline" size="sm" disabled>
                  בקרוב
                </Button>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">אבטחה ופרטיות</h3>
                <p className="text-sm text-gray-600 mb-3">נהל את הגדרות האבטחה והפרטיות שלך</p>
                <Button variant="outline" size="sm" disabled>
                  בקרוב
                </Button>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">ייצוא נתונים</h3>
                <p className="text-sm text-gray-600 mb-3">הורד עותק של כל המידע שלך</p>
                <Button variant="outline" size="sm" disabled>
                  בקרוב
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}