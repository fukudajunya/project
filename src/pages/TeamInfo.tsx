import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Info as InfoIcon, User, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { TeamInfo } from '../types';

export default function TeamInfo() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [infos, setInfos] = useState<TeamInfo[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });

  const canManage = auth?.dancer?.role && ['代表', 'スタッフ'].includes(auth.dancer.role);

  useEffect(() => {
    fetchInfos();
  }, [auth?.team?.id]);

  const fetchInfos = async () => {
    if (!auth?.team?.id) return;

    const { data } = await supabase
      .from('team_infos')
      .select(`
        *,
        dancer:dancers(*)
      `)
      .eq('team_id', auth.team.id)
      .order('created_at', { ascending: false });

    if (data) {
      setInfos(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.team?.id || !auth?.dancer?.id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('team_infos')
        .insert({
          team_id: auth.team.id,
          created_by: auth.dancer.id,
          title: formData.title.trim(),
          content: formData.content.trim() || null
        });

      if (error) throw error;

      setFormData({
        title: '',
        content: ''
      });
      setShowAddForm(false);
      await fetchInfos();
    } catch (error) {
      console.error('Failed to create info:', error);
      alert('チームinfoの作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">チームinfo</h2>
            <p className="text-gray-600">{auth?.team?.name}のチーム情報</p>
          </div>
          {canManage && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              チームinfoを投稿
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {showAddForm && (
          <form onSubmit={handleSubmit} className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                タイトル
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                詳細
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({
                    title: '',
                    content: ''
                  });
                }}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? '投稿中...' : '投稿'}
              </button>
            </div>
          </form>
        )}

        <div className="grid gap-3">
          {infos.map(info => (
            <article
              key={info.id}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/team-info/${info.id}`)}
            >
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center flex-shrink-0">
                    {info.dancer?.avatar_url ? (
                      <img
                        src={info.dancer.avatar_url}
                        alt={info.dancer.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {info.dancer?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(info.created_at)}
                    </p>
                  </div>
                </div>

                <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-1">
                  {info.title}
                </h3>
              </div>
            </article>
          ))}

          {infos.length === 0 && (
            <div className="text-center py-12">
              <InfoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">まだチームinfoがありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}