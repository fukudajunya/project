import React, { useState, useEffect } from 'react';
import { Schedule, ScheduleParticipant, ScheduleComment } from '../types';
import { MapPin, Globe, Calendar, Clock, Users, Check, Trash2, Edit2, MessageCircle, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ScheduleForm from './ScheduleForm';

interface ScheduleModalProps {
  schedule: Schedule;
  onClose: () => void;
  onDelete?: () => void;
  onUpdate?: () => void;
}

// 日本のタイムゾーンオフセット（分）
const JST_OFFSET = 9 * 60;

// 日付をJSTに変換する関数
function toJST(date: Date): Date {
  return new Date(date.getTime() + (JST_OFFSET * 60 * 1000));
}

export default function ScheduleModal({ schedule, onClose, onDelete, onUpdate }: ScheduleModalProps) {
  const { auth } = useAuth();
  const [participants, setParticipants] = useState<ScheduleParticipant[]>([]);
  const [comments, setComments] = useState<ScheduleComment[]>([]);
  const [isParticipating, setIsParticipating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const startTime = toJST(new Date(schedule.start_time));
  const endTime = toJST(new Date(schedule.end_time));

  const canEdit = auth?.dancer?.role && ['代表', 'スタッフ'].includes(auth.dancer.role);

  useEffect(() => {
    fetchParticipants();
    fetchComments();
  }, [schedule.id]);

  const fetchParticipants = async () => {
    const { data: participantsData } = await supabase
      .from('schedule_participants')
      .select('*, dancer:dancers(*)')
      .eq('schedule_id', schedule.id);

    if (participantsData) {
      setParticipants(participantsData);
      setIsParticipating(
        participantsData.some(p => p.dancer_id === auth?.dancer?.id)
      );
    }
  };

  const fetchComments = async () => {
    const { data: commentsData } = await supabase
      .from('schedule_comments')
      .select('*, dancer:dancers(*)')
      .eq('schedule_id', schedule.id)
      .order('created_at', { ascending: true });

    if (commentsData) {
      setComments(commentsData);
    }
  };

  const handleParticipation = async () => {
    if (!auth?.dancer?.id) return;
    setIsLoading(true);

    try {
      if (isParticipating) {
        await supabase
          .from('schedule_participants')
          .delete()
          .eq('schedule_id', schedule.id)
          .eq('dancer_id', auth.dancer.id);
      } else {
        await supabase
          .from('schedule_participants')
          .insert({
            schedule_id: schedule.id,
            dancer_id: auth.dancer.id
          });
      }
      await fetchParticipants();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canEdit) return;

    const confirmed = window.confirm('この予定を削除してもよろしいですか？\n削除すると元に戻すことはできません。');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      // 参加者の削除
      const { error: participantsError } = await supabase
        .from('schedule_participants')
        .delete()
        .eq('schedule_id', schedule.id);

      if (participantsError) throw participantsError;

      // コメントの削除
      const { error: commentsError } = await supabase
        .from('schedule_comments')
        .delete()
        .eq('schedule_id', schedule.id);

      if (commentsError) throw commentsError;

      // 予定の削除
      const { error: scheduleError } = await supabase
        .from('schedules')
        .delete()
        .eq('id', schedule.id);

      if (scheduleError) throw scheduleError;

      onDelete?.();
      onClose();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      alert('予定の削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async (formData: any) => {
    if (!canEdit) return;

    try {
      const { error } = await supabase
        .from('schedules')
        .update({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          location_url: formData.location_url,
          start_time: new Date(formData.start_time).toISOString(),
          end_time: new Date(formData.end_time).toISOString(),
          color: formData.color
        })
        .eq('id', schedule.id);

      if (error) throw error;

      onUpdate?.();
      setShowEditForm(false);
      onClose();
    } catch (error) {
      console.error('Failed to update schedule:', error);
      alert('予定の更新に失敗しました');
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.dancer?.id || !newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const { error } = await supabase
        .from('schedule_comments')
        .insert({
          schedule_id: schedule.id,
          dancer_id: auth.dancer.id,
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment('');
      await fetchComments();
    } catch (error) {
      console.error('Failed to submit comment:', error);
      alert('コメントの投稿に失敗しました');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!auth?.dancer?.id) return;

    const confirmed = window.confirm('このコメントを削除してもよろしいですか？');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('schedule_comments')
        .delete()
        .eq('id', commentId)
        .eq('dancer_id', auth.dancer.id);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      await fetchComments();
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('コメントの削除に失敗しました');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (showEditForm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">予定を編集</h3>
              <button
                onClick={() => setShowEditForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>
            <ScheduleForm
              onSubmit={handleUpdate}
              onCancel={() => setShowEditForm(false)}
              initialData={{
                title: schedule.title,
                description: schedule.description || '',
                category: schedule.category,
                location: schedule.location || '',
                location_url: schedule.location_url || '',
                start_time: new Date(schedule.start_time).toISOString().slice(0, 16),
                end_time: new Date(schedule.end_time).toISOString().slice(0, 16),
                color: schedule.color
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: schedule.color }}
              />
              <span className="px-2 py-1 text-sm rounded-full bg-gray-100">
                {schedule.category}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && (
                <>
                  <button
                    onClick={() => setShowEditForm(true)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="予定を編集"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="予定を削除"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">{schedule.title}</h2>

          {schedule.description && (
            <p className="text-gray-600 mb-6 whitespace-pre-wrap">
              {schedule.description}
            </p>
          )}

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">{formatDate(startTime)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-600">
                    {formatTime(startTime)} 〜 {formatTime(endTime)}
                  </p>
                </div>
              </div>
            </div>

            {schedule.location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">{schedule.location}</p>
                  {schedule.location_url && (
                    <div className="flex items-center gap-2 mt-1">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <a
                        href={schedule.location_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-700 hover:underline"
                      >
                        場所を確認
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span className="font-medium">
                    参加者 ({participants.length}人)
                  </span>
                </div>
                <button
                  onClick={handleParticipation}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                    isParticipating
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  } transition-colors`}
                >
                  {isParticipating && <Check className="w-4 h-4" />}
                  {isParticipating ? '参加中' : '参加する'}
                </button>
              </div>

              <div className="space-y-2">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50"
                  >
                    <span className="text-gray-900">{participant.dancer?.name}</span>
                    <span className="text-sm text-gray-500">
                      {participant.dancer?.role}
                    </span>
                  </div>
                ))}
                {participants.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    まだ参加者がいません
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center justify-between w-full mb-4"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-gray-400" />
                  <span className="font-medium">
                    コメント ({comments.length}件)
                  </span>
                </div>
                {showComments ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {showComments && (
                <div className="space-y-4">
                  <form onSubmit={handleSubmitComment} className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="コメントを入力..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={isSubmittingComment}
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingComment || !newComment.trim()}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900">
                              {comment.dancer?.name}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatCommentDate(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                        {comment.dancer_id === auth?.dancer?.id && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 text-gray-400 hover:text-red-500"
                            title="コメントを削除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="text-gray-500 text-center py-4">
                        まだコメントがありません
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}