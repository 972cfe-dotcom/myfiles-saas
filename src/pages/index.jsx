import Layout from "./Layout.jsx";

import Documents from "./Documents";

import Upload from "./Upload";

import Settings from "./Settings";

import Search from "./Search";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

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

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Documents />} />
                
                
                <Route path="/Documents" element={<Documents />} />
                
                <Route path="/Upload" element={<Upload />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Search" element={<Search />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}