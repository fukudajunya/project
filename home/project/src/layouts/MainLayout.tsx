import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Menu, X, Calendar, User, Users, LogOut, Video } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function MainLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { auth, setAuth } = useAuth();
  const navigate = useNavigate();

  if (!auth) {
    navigate('/');
    return null;
  }

  const handleLogout = () => {
    setAuth(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Festa</h1>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <div
        className={`fixed inset-0 transform ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } transition-transform duration-300 ease-in-out z-30`}
      >
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75" onClick={() => setIsMenuOpen(false)} />
        <nav className="relative bg-white h-full w-64 max-w-sm ml-auto flex flex-col">
          <div className="flex-1 px-4 py-6 space-y-1">
            <Link
              to="/calendar"
              className="flex items-center px-4 py-2 text-gray-600 rounded-md hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              <Calendar className="mr-3 h-5 w-5" />
              カレンダー
            </Link>
            <Link
              to="/videos"
              className="flex items-center px-4 py-2 text-gray-600 rounded-md hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              <Video className="mr-3 h-5 w-5" />
              動画
            </Link>
            <Link
              to="/my-account"
              className="flex items-center px-4 py-2 text-gray-600 rounded-md hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              <User className="mr-3 h-5 w-5" />
              マイアカウント
            </Link>
            <Link
              to="/members"
              className="flex items-center px-4 py-2 text-gray-600 rounded-md hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              <Users className="mr-3 h-5 w-5" />
              メンバー一覧
            </Link>
          </div>
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-gray-600 rounded-md hover:bg-gray-100 w-full"
            >
              <LogOut className="mr-3 h-5 w-5" />
              ログアウト
            </button>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}