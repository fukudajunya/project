import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthState } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  auth: AuthState | null;
  setAuth: (auth: AuthState | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(() => {
    const saved = localStorage.getItem('festa_auth');
    return saved ? JSON.parse(saved) : null;
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (auth) {
      localStorage.setItem('festa_auth', JSON.stringify(auth));
    } else {
      localStorage.removeItem('festa_auth');
    }
  }, [auth]);

  useEffect(() => {
    const validateAuth = async () => {
      const saved = localStorage.getItem('festa_auth');
      if (!saved) {
        if (location.pathname !== '/') {
          navigate('/');
        }
        return;
      }

      const savedAuth: AuthState = JSON.parse(saved);
      if (!savedAuth?.dancer?.id || !savedAuth?.team?.id) {
        setAuth(null);
        navigate('/');
        return;
      }

      // 保存された認証情報を検証
      const { data: dancer } = await supabase
        .from('dancers')
        .select(`
          id,
          name,
          team_id,
          role,
          is_approved,
          created_at,
          approved_by,
          avatar_url,
          bio,
          team:teams(*)
        `)
        .eq('id', savedAuth.dancer.id)
        .eq('team_id', savedAuth.team.id)
        .single();

      if (dancer) {
        // 認証情報が有効な場合、最新の情報で更新
        setAuth({
          dancer: {
            id: dancer.id,
            name: dancer.name,
            team_id: dancer.team_id,
            role: dancer.role,
            is_approved: dancer.is_approved,
            created_at: dancer.created_at,
            approved_by: dancer.approved_by,
            avatar_url: dancer.avatar_url,
            bio: dancer.bio
          },
          team: dancer.team
        });

        // スタートページにいる場合はカレンダーページにリダイレクト
        if (location.pathname === '/') {
          navigate('/calendar');
        }
      } else {
        // 認証情報が無効な場合、ログアウト
        setAuth(null);
        navigate('/');
      }
    };

    validateAuth();
  }, [navigate, location.pathname]);

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}