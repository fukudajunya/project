import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import StartPage from './pages/StartPage';
import MainLayout from './layouts/MainLayout';
import Calendar from './pages/Calendar';
import MyAccount from './pages/MyAccount';
import MemberList from './pages/MemberList';
import Videos from './pages/Videos';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route element={<MainLayout />}>
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/my-account" element={<MyAccount />} />
            <Route path="/members" element={<MemberList />} />
            <Route path="/videos" element={<Videos />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}