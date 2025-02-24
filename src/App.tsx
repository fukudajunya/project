import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import StartPage from './pages/StartPage';
import MainLayout from './layouts/MainLayout';
import Calendar from './pages/Calendar';
import MyAccount from './pages/MyAccount';
import MemberList from './pages/MemberList';
import Videos from './pages/Videos';
import Items from './pages/Items';
import ItemDelivery from './pages/ItemDelivery';
import Inventory from './pages/Inventory';
import Blogs from './pages/Blogs';
import BlogDetail from './pages/BlogDetail';
import TeamInfoPage from './pages/TeamInfoPage';
import TeamInfoDetail from './pages/TeamInfoDetail';
import DanceMoves from './pages/DanceMoves';

export default function App() {
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
            <Route path="/items" element={<Items />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/item-delivery" element={<ItemDelivery />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/blogs/:id" element={<BlogDetail />} />
            <Route path="/team-info" element={<TeamInfoPage />} />
            <Route path="/team-info/:id" element={<TeamInfoDetail />} />
            <Route path="/dance-moves" element={<DanceMoves />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}