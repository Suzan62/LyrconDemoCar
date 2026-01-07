import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../store/slices/userSlice';

import { Menu } from 'lucide-react';
import { Button } from './ui/Button';

export default function Layout() {
    const dispatch = useDispatch();
    const { currentUser } = useSelector(state => state.auth);
    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    React.useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Hydrate user profile on mount / auth change
    useEffect(() => {
        if (currentUser) {
            // 1. Try to load custom profile pic from local storage
            const storedPic = localStorage.getItem(`profilePic_${currentUser.email}`);

            // 2. Prepare payload (merge current user info with stored pic)
            const payload = {
                name: currentUser.name || "Admin User",
                email: currentUser.email,
                role: currentUser.role || "Manager",
                ...currentUser, // spread other fields
            };

            if (storedPic) {
                payload.profilePic = storedPic;
            }

            // 3. Update Redux State
            dispatch(updateUserProfile(payload));
        }
    }, [currentUser, dispatch]);

    return (
        <div className="flex h-screen w-full bg-[#f4f7f6] overflow-hidden">
            <Sidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
                <TopBar onMenuClick={() => setSidebarOpen(true)} isMobile={isMobile} />
                <main className="flex-1 overflow-auto p-4 md:p-6 scroll-smooth w-full">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
