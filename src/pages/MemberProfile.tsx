import React, { useState } from 'react';
import { User, X, Check } from 'lucide-react';
import { Dancer } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface MemberProfileProps {
  member: Dancer;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function MemberProfile({ member, onClose, onUpdate }: MemberProfileProps) {
  const { auth } = useAuth();
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'代表' | 'スタッフ' | 'メンバー'>(member.role);
  const [isSaving, setIsSaving] = useState(false);

  const canEditRole = auth?.dancer?.role === '代表';

  const handleRoleSave = async () => {
    if (!auth?.dancer?.id || !canEditRole) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('dancers')
        .update({ role: selectedRole })
        .eq('id', member.id)
        .eq('team_id', auth.team?.id);

      if (error) throw error;

      onUpdate?.();
      setIsEditingRole(false);
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('役職の更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center">
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-purple-600" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{member.name}</h2>
                <p className="text-gray-600">アカウント情報</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">役職</h3>
                {canEditRole && !isEditingRole && member.id !== auth?.dancer?.id && (
                  <button
                    onClick={() => setIsEditingRole(true)}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    編集
                  </button>
                )}
              </div>
              {isEditingRole ? (
                <div className="space-y-3">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as '代表' | 'スタッフ' | 'メンバー')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="代表">代表</option>
                    <option value="スタッフ">スタッフ</option>
                    <option value="メンバー">メンバー</option>
                  </select>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setIsEditingRole(false);
                        setSelectedRole(member.role);
                      }}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-md"
                      disabled={isSaving}
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleRoleSave}
                      disabled={isSaving || selectedRole === member.role}
                      className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? '保存中...' : '保存'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-lg text-gray-900">{member.role}</p>
              )}
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">ステータス</h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                member.is_approved
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {member.is_approved ? '承認済み' : '承認待ち'}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">自己紹介</h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {member.bio || '自己紹介が未設定です'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}