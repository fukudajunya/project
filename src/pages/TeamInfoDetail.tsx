import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { TeamInfo } from '../types';

export default function TeamInfoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [info, setInfo] = useState<TeamInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });

  const canManage = auth?.dancer?.role && ['代表', 'スタッフ'].includes(auth.dancer.role);

  useEffect(() => {
    fetchInfo();
  }, [id]);

  useEffect(() => {
    if (info) {
      setFormData({
        title: info.title,
        content: info.content || ''
      });
    }
  }, [info]);

  const fetchInfo = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('team_infos')
        .select(`
          *,
          dancer:dancers(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setInfo(data);
    } catch (error) {
      console.error('Error fetching info:', error);
      navigate('/team-info');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!info || !auth?.team?.id || !auth?.dancer?.id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('team_infos')
        .update({
          title: formData.title.trim(),
          content: formData.content.trim() || null
        })
        .eq('id', info.id);

      if (error) throw error;

      setShowEditForm(false);
      await fetchInfo();
    } catch (error) {
      console.error('Failed to update info:', error);
      alert('チームinfoの更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!info || !auth?.team?.id) return;

    const confirmed = window.confirm('このチームinfoを削除してもよろしいですか？');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('team_infos')
        .delete()
        .eq('id', info.id);

      if (error) throw error;

      navigate('/team-info');
    } catch (error) {
      console.error('Failed to delete info:', error);
      alert('チームinfoの削除に失敗しました');
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-center text-gray-500">チームinfoが見つかりません</p>
      </div>
    );
  }

  if (showEditForm) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 sm:p-6">
          <button
            onClick={() => setShowEditForm(false)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            戻る
          </button>

          <form onSubmit={handleUpdate} className="space-y-4">
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
                onClick={() => setShowEditForm(false)}
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
                {isSubmitting ? '更新中...' : '更新'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/team-info')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            チームinfo一覧に戻る
          </button>

          {canManage && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditForm(true)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="編集"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="削除"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center">
            {info.dancer?.avatar_url ? (
              <img
                src={info.dancer.avatar_url}
                alt={info.dancer.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-purple-600" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{info.dancer?.name}</p>
            <p className="text-sm text-gray-500">{formatDate(info.created_at)}</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">{info.title}</h1>

        {info.content && (
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap text-gray-700">{info.content}</p>
          </div>
        )}
      </div>
    </div>
  );
}