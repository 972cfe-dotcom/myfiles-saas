

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { FileText, Search, Upload, Users, Activity, Menu, LogOut, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";

const navigationItems = [
  {
    title: "מסמכים",
    url: createPageUrl("Documents"),
    icon: FileText,
  },
  {
    title: "חיפוש מתקדם",
    url: createPageUrl("Search"),
    icon: Search,
  },
  {
    title: "העלאת מסמכים",
    url: createPageUrl("Upload"),
    icon: Upload,
  },
  {
    title: "ניהול משתמשים",
    url: createPageUrl("Users"),
    icon: Users,
  },
  {
    title: "פעילות",
    url: createPageUrl("Activity"),
    icon: Activity,
  },
  {
    title: "הגדרות",
    url: createPageUrl("Settings"),
    icon: Settings,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      console.log('Layout: Handling logout...');
      await signOut();
      console.log('Layout: Logout completed');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <style>{`
        :root {
          --primary-navy: #1e293b;
          --secondary-slate: #475569;
          --accent-emerald: #10b981;
          --bg-light: #f8fafc;
          --text-primary: #0f172a;
          --text-secondary: #64748b;
          --border-light: #e2e8f0;
        }
      `}</style>
      <Toaster position="top-center" richColors />
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <Sidebar className="border-l border-slate-200 bg-white shadow-lg" side="right">
            <SidebarHeader className="border-b border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-lg">MyFiles SaaS</h2>
                  <p className="text-xs text-slate-500">ניהול מסמכים חכם</p>
                </div>
              </div>
            </SidebarHeader>
            
            <SidebarContent className="p-3">
              <SidebarGroup>
                <SidebarGroupLabel className="text-sm font-semibold text-slate-600 px-3 py-2">
                  ניווט ראשי
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {navigationItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`
                            hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-xl mb-1
                            ${location.pathname === item.url ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-700'}
                          `}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium text-sm">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-100 p-4">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start p-3 h-auto hover:bg-slate-50">
                      <div className="flex items-center gap-3 w-full">
                        <Avatar className="h-10 w-10 bg-gradient-to-br from-emerald-400 to-emerald-600">
                          <AvatarFallback className="bg-transparent text-white font-semibold">
                            {user.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-right">
                          <p className="font-semibold text-slate-900 text-sm">{user.full_name}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56" side="top">
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Settings")}>
                        <Settings className="w-4 h-4 ml-2" />
                        הגדרות
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="w-4 h-4 ml-2" />
                      התנתקות
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col">
            {/* Header for mobile */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 md:hidden shadow-sm">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-lg font-bold text-slate-900">מערכת מסמכים</h1>
                </div>
              </div>
            </header>

            {/* Main content area */}
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}

