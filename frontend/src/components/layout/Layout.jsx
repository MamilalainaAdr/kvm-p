import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import bg from '../../assets/background.jpg';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) setSidebarOpen(false);
  }, [user]);

  return (
    <div className={`min-h-screen bg-center bg-no-repeat ${
        user ? 'bg-background' : 'bg-cover'
      }`}
      style={{
        backgroundImage: !user ? `url(${bg})` : 'none',
      }}
    >
      <Navbar onToggle={() => setSidebarOpen(s => !s)} sidebarOpen={sidebarOpen} />
      {user && <Sidebar open={sidebarOpen} />}
      <div className={`${sidebarOpen && user ? 'md:ml-64' : 'md:ml-0'} transition-all duration-300 pt-16`}>
        <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}