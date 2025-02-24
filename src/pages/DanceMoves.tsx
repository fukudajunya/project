import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Ambulance as Dance, ChevronRight, User, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { DanceMove, DanceMoveCompletion, Dancer } from '../types';

interface DanceMoveWithStats extends DanceMove {
  completions: DanceMoveCompletion[];
  totalDancers: number;
}

export default function DanceMoves() {
  const { auth } = useAuth();
  const [moves, setMoves] = useState<DanceMoveWithStats[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMove, setEditingMove] = useState<DanceMove | null>(null);
  const [selectedMove, setSelectedMove] = useState<DanceMoveWithStats | null>(null);
  const [dancers, setDancers] = useState<Dancer[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const canManage = auth?.dancer?.role && ['代表', 'スタッフ'].includes(auth.dancer.role);

  useEffect(() => {
    if (auth?.team?.id) {
      fetchMoves();
      fetchDancers();
    }
  }, [auth?.team?.id]);

  const fetchDancers = async () => {
    if (!auth?.team?.id) return;

    const { data } = await supabase
      .from('dancers')
      .select('*')
      .eq('team_id', auth.team.id)
      .eq('is_approved', true);

    if (data) {
      setDancers(data);
      // Refresh moves to update the total dancer count
      fetchMoves();
    }
  };

  const fetchMoves = async () => {
    if (!auth?.team?.id) return;

    const { data: movesData } = await supabase
      .from('dance_moves')
      .select(`
        *,
        dancer:dancers(*)
      `)
      .eq('team_id', auth.team.id)
      .order('created_at', { ascending: true });

    if (movesData) {
      const { data: completions } = await supabase
        .from('dance_move_completions')
        .select('*, dancer:dancers(*)')
        .in('dance_move_id', movesData.map(m => m.id));

      const approvedDancersCount = dancers.length;

      const movesWithStats = movesData.map(move => ({
        ...move,
        completions: completions?.filter(c => c.dance_move_id === move.id) || [],
        totalDancers: approvedDancersCount
      }));

      setMoves(movesWithStats);

      // Update selected move if exists
      if (selectedMove) {
        const updatedMove = movesWithStats.find(m => m.id === selectedMove.id);
        if (updatedMove) {
          setSelectedMove(updatedMove);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.team?.id || !auth?.dancer?.id) return;

    setIsSubmitting(true);
    try {
      if (editingMove) {
        const { error } = await supabase
          .from('dance_moves')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null
          })
          .eq('id', editingMove.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('dance_moves')
          .insert({
            team_id: auth.team.id,
            created_by: auth.dancer.id,
            name: formData.name.trim(),
            description: formData.description.trim() || null
          });

        if (error) throw error;
      }

      setFormData({
        name: '',
        description: ''
      });
      setShowAddForm(false);
      setEditingMove(null);
      await fetchMoves();
    } catch (error) {
      console.error('Failed to save dance move:', error);
      alert('振りの保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (move: DanceMove) => {
    if (!auth?.team?.id) return;

    const confirmed = window.confirm(`振り「${move.name}」を削除してもよろしいですか？`);
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('dance_moves')
        .delete()
        .eq('id', move.id);

      if (error) throw error;

      await fetchMoves();
      if (selectedMove?.id === move.id) {
        setSelectedMove(null);
      }
    } catch (error) {
      console.error('Failed to delete dance move:', error);
      alert('振りの削除に失敗しました');
    }
  };

  const handleToggleComplete = async (moveId: string) => {
    if (!auth?.dancer?.id) return;

    try {
      const completion = selectedMove?.completions.find(c => c.dancer_id === auth.dancer.id);
      
      if (completion) {
        // Remove completion
        const { error } = await supabase
          .from('dance_move_completions')
          .delete()
          .eq('id', completion.id);

        if (error) throw error;
      } else {
        // Add completion
        const { error } = await supabase
          .from('dance_move_completions')
          .insert({
            dance_move_id: moveId,
            dancer_id: auth.dancer.id
          });

        if (error) throw error;
      }

      await fetchMoves();
    } catch (error) {
      console.error('Failed to toggle completion:', error);
      alert('振り落とし状態の更新に失敗しました');
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

  const truncateDescription = (description: string | null) => {
    if (!description) return '';
    return description.length > 10 ? description.slice(0, 10) + '...' : description;
  };

  if (selectedMove) {
    const isCompleted = selectedMove.completions.some(c => c.dancer_id === auth?.dancer?.id);
    const completedDancers = dancers.filter(d => 
      selectedMove.completions.some(c => c.dancer_id === d.id)
    );
    const incompleteDancers = dancers.filter(d => 
      !selectedMove.completions.some(c => c.dancer_id === d.id)
    );

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedMove(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              ← 振り一覧に戻る
            </button>
            {canManage && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingMove(selectedMove);
                    setFormData({
                      name: selectedMove.name,
                      description: selectedMove.description || ''
                    });
                    setSelectedMove(null);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(selectedMove)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{selectedMove.name}</h2>
          {selectedMove.description && (
            <p className="text-gray-600 mb-6 whitespace-pre-wrap">{selectedMove.description}</p>
          )}

          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500">
              {formatDate(selectedMove.created_at)}
            </p>
            <button
              onClick={() => handleToggleComplete(selectedMove.id)}
              className={`px-4 py-2 rounded-md transition-colors ${
                isCompleted
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isCompleted ? 'OK' : '振り落とし完了'}
            </button>
          </div>

          {canManage && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    振り落とし完了 ({completedDancers.length}人)
                  </h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {completedDancers.map(dancer => (
                    <div
                      key={dancer.id}
                      className="flex items-center justify-between py-2 px-3 bg-white rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center">
                          {dancer.avatar_url ? (
                            <img
                              src={dancer.avatar_url}
                              alt={dancer.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                        <span className="font-medium text-gray-900">{dancer.name}</span>
                      </div>
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                  ))}
                  {completedDancers.length === 0 && (
                    <p className="text-gray-500 text-center py-2">
                      まだ振り落とし完了者がいません
                    </p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    未完了 ({incompleteDancers.length}人)
                  </h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {incompleteDancers.map(dancer => (
                    <div
                      key={dancer.id}
                      className="flex items-center justify-between py-2 px-3 bg-white rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center">
                          {dancer.avatar_url ? (
                            <img
                              src={dancer.avatar_url}
                              alt={dancer.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                        <span className="font-medium text-gray-900">{dancer.name}</span>
                      </div>
                      <X className="w-5 h-5 text-red-600" />
                    </div>
                  ))}
                  {incompleteDancers.length === 0 && (
                    <p className="text-gray-500 text-center py-2">
                      未完了者はいません
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">振り落とし確認</h2>
            <p className="text-gray-600">{auth?.team?.name}の振り一覧</p>
          </div>
          {canManage && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              振りを追加
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {(showAddForm || editingMove) && (
          <form onSubmit={handleSubmit} className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                振り名
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                説明
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingMove(null);
                  setFormData({
                    name: '',
                    description: ''
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
                {isSubmitting ? '保存中...' : (editingMove ? '更新' : '追加')}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {moves.map(move => {
            const isCompleted = move.completions.some(c => c.dancer_id === auth?.dancer?.id);
            return (
              <button
                key={move.id}
                onClick={() => setSelectedMove(move)}
                className="w-full text-left border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-medium text-gray-900">{move.name}</h3>
                      {isCompleted && (
                        <span className="px-2 py-0.5 text-sm rounded-full bg-green-100 text-green-700">
                          OK
                        </span>
                      )}
                      {canManage && (
                        <div className="px-2 py-0.5 text-sm rounded-full bg-gray-100">
                          {move.completions.length}/{dancers.length}人完了
                        </div>
                      )}
                    </div>
                    {move.description && (
                      <p className="text-gray-600 mb-2">{truncateDescription(move.description)}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      {formatDate(move.created_at)}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            );
          })}

          {moves.length === 0 && (
            <div className="text-center py-12">
              <Dance className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">まだ振りが登録されていません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}