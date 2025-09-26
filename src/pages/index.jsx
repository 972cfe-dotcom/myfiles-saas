import Layout from "./Layout.jsx";
import Auth from "./Auth.jsx";
import Documents from "./Documents";
import Upload from "./Upload";
import Settings from "./Settings";
import Search from "./Search";
import { useAuth } from "@/components/auth/AuthProvider";

import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';

const PAGES = {
    
    Documents: Documents,
    
    Upload: Upload,
    
    Settings: Settings,
    
    Search: Search,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Protected Route wrapper
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    return children;
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    const { user } = useAuth();
    
    return (
        <Routes>
            <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <Auth />} />
            
            <Route path="/" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Documents />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <Layout currentPageName="Documents">
                        <Documents />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/documents" element={
                <ProtectedRoute>
                    <Layout currentPageName="Documents">
                        <Documents />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/upload" element={
                <ProtectedRoute>
                    <Layout currentPageName="Upload">
                        <Upload />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/search" element={
                <ProtectedRoute>
                    <Layout currentPageName="Search">
                        <Search />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
                <ProtectedRoute>
                    <Layout currentPageName="Settings">
                        <Settings />
                    </Layout>
                </ProtectedRoute>
            } />
        </Routes>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}