import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Dancer } from '../types';
import { CheckCircle, XCircle, AlertCircle, User } from 'lucide-react';
import MemberProfile from './MemberProfile';

export default function MemberList() {
  const { auth } = useAuth();
  const [members, setMembers] = React.useState<Dancer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedMember, setSelectedMember] = React.useState<Dancer | null>(null);

  React.useEffect(() => {
    if (!auth?.team?.id) return;

    const fetchMembers = async () => {
      const { data, error } = await supabase
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
          bio
        `)
        .eq('team_id', auth.team!.id)
        .order('role', { ascending: false })
        .order('name');

      if (!error && data) {
        setMembers(data);
      }
      setLoading(false);
    };

    fetchMembers();
  }, [auth?.team?.id]);

  const canApprove = (member: Dancer) => {
    if (!auth?.dancer) return false;
    if (auth.dancer.role === '代表') return true;
    if (auth.dancer.role === 'スタッフ' && member.role === 'メンバー') return true;
    return false;
  };

  const handleApprovalToggle = async (member: Dancer) => {
    if (!canApprove(member) || !auth?.dancer || !auth?.team) return;

    const confirmed = window.confirm(
      member.is_approved
        ? `${member.name}さんの承認を取り消しますか？`
        : `${member.name}さんを承認しますか？`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('dancers')
        .update({
          is_approved: !member.is_approved,
          approved_by: !member.is_approved ? auth.dancer.id : null
        })
        .eq('id', member.id)
        .eq('team_id', auth.team.id);

      if (error) {
        console.error('Error updating approval status:', error);
        alert('承認状態の更新に失敗しました');
        return;
      }

      const { data: updatedMembers, error: fetchError } = await supabase
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
          bio
        `)
        .eq('team_id', auth.team.id)
        .order('role', { ascending: false })
        .order('name');

      if (!fetchError && updatedMembers) {
        setMembers(updatedMembers);
      }
    } catch (error) {
      console.error('Error in approval process:', error);
      alert('承認処理中にエラーが発生しました');
    }
  };

  const handleMemberUpdate = async () => {
    if (!auth?.team?.id) return;

    const { data: updatedMembers, error } = await supabase
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
        bio
      `)
      .eq('team_id', auth.team.id)
      .order('role', { ascending: false })
      .order('name');

    if (!error && updatedMembers) {
      setMembers(updatedMembers);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">メンバー一覧</h2>
        <p className="text-gray-600">{auth?.team?.name}のメンバー</p>
      </div>

      <div className="divide-y divide-gray-200">
        {members.map(member => (
          <div
            key={member.id}
            className="p-6 flex items-center justify-between hover:bg-gray-50"
          >
            <button
              onClick={() => setSelectedMember(member)}
              className="flex-1 flex items-center gap-4 text-left"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center">
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-purple-600" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium text-gray-900">
                    {member.name}
                  </span>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    member.role === '代表'
                      ? 'bg-purple-100 text-purple-800'
                      : member.role === 'スタッフ'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {member.role}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {member.is_approved ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className="text-sm text-gray-500">
                    {member.is_approved ? '承認済み' : '承認待ち'}
                  </span>
                </div>
              </div>
            </button>

            {canApprove(member) && member.id !== auth?.dancer?.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprovalToggle(member);
                }}
                className={`p-2 rounded-full ${
                  member.is_approved
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-green-600 hover:bg-green-50'
                }`}
              >
                {member.is_approved ? (
                  <XCircle className="w-6 h-6" />
                ) : (
                  <CheckCircle className="w-6 h-6" />
                )}
              </button>
            )}
          </div>
        ))}
      </div>

      {selectedMember && (
        <MemberProfile
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onUpdate={handleMemberUpdate}
        />
      )}
    </div>
  );
}