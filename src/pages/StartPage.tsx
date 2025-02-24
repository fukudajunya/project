import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Ambulance as Dance, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Team } from '../types';
import { createHash } from '../utils';

type Step = 'select' | 'team' | 'dancer' | 'login' | 'reset-password';

export default function StartPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [step, setStep] = useState<Step>('select');
  const [teamName, setTeamName] = useState('');
  const [dancerName, setDancerName] = useState('');
  const [password, setPassword] = useState('');
  const [secretPhrase, setSecretPhrase] = useState('');
  const [role, setRole] = useState<'代表' | 'スタッフ' | 'メンバー'>('メンバー');
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      const { data } = await supabase
        .from('teams')
        .select('*')
        .order('name');
      if (data) {
        setTeams(data);
      }
    };
    fetchTeams();
  }, []);

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data: team, error } = await supabase
        .from('teams')
        .insert({ name: teamName })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          setError('このチーム名は既に登録されています');
        } else {
          setError('エラーが発生しました');
        }
        return;
      }

      if (team) {
        alert('チームを登録しました');
        setTeamName('');
        setStep('select');
        // チーム一覧を更新
        const { data: updatedTeams } = await supabase
          .from('teams')
          .select('*')
          .order('name');
        if (updatedTeams) {
          setTeams(updatedTeams);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDancerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }

    if (!secretPhrase) {
      setError('秘密の合言葉を入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      const passwordHash = await createHash(password);

      const { data: dancer, error } = await supabase
        .from('dancers')
        .insert({
          name: dancerName,
          team_id: selectedTeam.id,
          role,
          is_approved: role === '代表' ? true : false,
          password_hash: passwordHash,
          secret_phrase: secretPhrase
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          setError('この踊り子名は既にこのチームで使用されています');
        } else {
          setError('エラーが発生しました');
        }
        return;
      }

      if (dancer) {
        alert('踊り子を登録しました');
        setDancerName('');
        setPassword('');
        setSecretPhrase('');
        setRole('メンバー');
        setSelectedTeam(null);
        setError('');
        setStep('select');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) {
      setError('チームを選択してください');
      return;
    }

    setIsSubmitting(true);
    try {
      const passwordHash = await createHash(password);

      const { data: dancers, error } = await supabase
        .from('dancers')
        .select(`
          *,
          team:teams(*)
        `)
        .eq('team_id', selectedTeam.id)
        .eq('name', dancerName)
        .eq('role', role)
        .eq('password_hash', passwordHash);

      if (error) {
        setError('エラーが発生しました');
        return;
      }

      if (!dancers || dancers.length === 0) {
        setError('踊り子名またはパスワードまたは役職が正しくありません');
        return;
      }

      const dancer = dancers[0];

      if (!dancer.is_approved && dancer.role !== '代表') {
        setError('まだ承認されていません');
        return;
      }

      setAuth({ dancer, team: dancer.team });
      navigate('/calendar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) {
      setError('チームを選択してください');
      return;
    }

    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }

    if (!secretPhrase) {
      setError('秘密の合言葉を入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      // 踊り子情報を確認
      const { data: dancers, error: fetchError } = await supabase
        .from('dancers')
        .select('*')
        .eq('team_id', selectedTeam.id)
        .eq('name', dancerName)
        .eq('role', role)
        .eq('secret_phrase', secretPhrase);

      if (fetchError) {
        setError('エラーが発生しました');
        return;
      }

      if (!dancers || dancers.length === 0) {
        setError('入力された情報が正しくありません');
        return;
      }

      // パスワードを更新
      const passwordHash = await createHash(password);
      const { error: updateError } = await supabase
        .from('dancers')
        .update({ password_hash: passwordHash })
        .eq('id', dancers[0].id);

      if (updateError) {
        setError('パスワードの更新に失敗しました');
        return;
      }

      alert('パスワードを更新しました');
      setDancerName('');
      setPassword('');
      setSecretPhrase('');
      setRole('メンバー');
      setSelectedTeam(null);
      setError('');
      setStep('select');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Festa</h1>
        </div>

        {step === 'select' && (
          <div className="space-y-4">
            <button
              onClick={() => setStep('team')}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              チーム登録
            </button>
            <button
              onClick={() => {
                setRole('メンバー');
                setStep('dancer');
              }}
              className="w-full bg-pink-600 text-white py-3 px-4 rounded-md hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
            >
              <Dance className="w-5 h-5" />
              踊り子登録
            </button>
            <button
              onClick={() => setStep('login')}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              ログイン
            </button>
          </div>
        )}

        {step === 'team' && (
          <form onSubmit={handleTeamSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                チーム名
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setStep('select');
                  setError('');
                }}
                className="flex-1 bg-gray-100 text-gray-600 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                戻る
              </button>
              <button
                type="submit"
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? '処理中...' : '完了'}
              </button>
            </div>
          </form>
        )}

        {step === 'dancer' && (
          <form onSubmit={handleDancerSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                チーム
              </label>
              <select
                value={selectedTeam?.id || ''}
                onChange={(e) => {
                  const team = teams.find(t => t.id === e.target.value);
                  setSelectedTeam(team || null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">チームを選択してください</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                踊り子名
              </label>
              <input
                type="text"
                value={dancerName}
                onChange={(e) => setDancerName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                minLength={8}
              />
              <p className="mt-1 text-sm text-gray-500">8文字以上で入力してください</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                秘密の合言葉
              </label>
              <input
                type="text"
                value={secretPhrase}
                onChange={(e) => setSecretPhrase(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              <p className="mt-1 text-sm text-gray-500">パスワードを忘れた場合に必要です</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                役職
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="メンバー">メンバー</option>
                <option value="スタッフ">スタッフ</option>
                <option value="代表">代表</option>
              </select>
            </div>
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setStep('select');
                  setError('');
                }}
                className="flex-1 bg-gray-100 text-gray-600 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                戻る
              </button>
              <button
                type="submit"
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? '登録中...' : '登録'}
              </button>
            </div>
          </form>
        )}

        {step === 'login' && (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                チーム
              </label>
              <select
                value={selectedTeam?.id || ''}
                onChange={(e) => {
                  const team = teams.find(t => t.id === e.target.value);
                  setSelectedTeam(team || null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">チームを選択してください</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                踊り子名
              </label>
              <input
                type="text"
                value={dancerName}
                onChange={(e) => setDancerName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                役職
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="メンバー">メンバー</option>
                <option value="スタッフ">スタッフ</option>
                <option value="代表">代表</option>
              </select>
            </div>
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setStep('select');
                  setError('');
                }}
                className="flex-1 bg-gray-100 text-gray-600 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                戻る
              </button>
              <button
                type="submit"
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'ログイン中...' : 'ログイン'}
              </button>
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setStep('reset-password');
                  setError('');
                }}
                className="text-sm text-purple-600 hover:text-purple-700 hover:underline"
              >
                パスワードを忘れた場合はこちら
              </button>
            </div>
          </form>
        )}

        {step === 'reset-password' && (
          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                チーム
              </label>
              <select
                value={selectedTeam?.id || ''}
                onChange={(e) => {
                  const team = teams.find(t => t.id === e.target.value);
                  setSelectedTeam(team || null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">チームを選択してください</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                踊り子名
              </label>
              <input
                type="text"
                value={dancerName}
                onChange={(e) => setDancerName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                役職
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="メンバー">メンバー</option>
                <option value="スタッフ">スタッフ</option>
                <option value="代表">代表</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                秘密の合言葉
              </label>
              <input
                type="text"
                value={secretPhrase}
                onChange={(e) => setSecretPhrase(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                新しいパスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                minLength={8}
              />
              <p className="mt-1 text-sm text-gray-500">8文字以上で入力してください</p>
            </div>
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setStep('login');
                  setError('');
                }}
                className="flex-1 bg-gray-100 text-gray-600 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                戻る
              </button>
              <button
                type="submit"
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? '更新中...' : 'パスワードを更新'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}