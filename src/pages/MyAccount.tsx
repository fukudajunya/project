import React, { useState, useRef, useEffect } from 'react';
import { User, Camera, Pencil, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function MyAccount() {
  const { auth, setAuth } = useAuth();
  const navigate = useNavigate();
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [bio, setBio] = useState('');
  const [name, setName] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (auth?.dancer?.bio) {
      setBio(auth.dancer.bio);
    }
    if (auth?.dancer?.name) {
      setName(auth.dancer.name);
    }
  }, [auth?.dancer?.bio, auth?.dancer?.name]);

  if (!auth?.dancer) return null;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth?.dancer?.id) return;

    // ファイルサイズチェック (5MB以下)
    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてください');
      return;
    }

    // 画像ファイルのみ許可
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // 古いアバター画像を削除
      if (auth.dancer.avatar_url) {
        const oldPath = new URL(auth.dancer.avatar_url).pathname.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([oldPath]);
        }
      }

      // 新しいアバター画像をアップロード
      const fileExt = file.name.split('.').pop();
      const fileName = `${auth.dancer.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // ダンサー情報を更新
      const { data: updatedDancer, error: updateError } = await supabase
        .from('dancers')
        .update({ avatar_url: publicUrl })
        .eq('id', auth.dancer.id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (updatedDancer) {
        setAuth({
          ...auth,
          dancer: updatedDancer
        });
      }
    } catch (error) {
      console.error('Failed to update avatar:', error);
      alert('アバターの更新に失敗しました');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleBioSave = async () => {
    if (!auth?.dancer?.id) return;

    setIsSavingBio(true);
    try {
      const { data: updatedDancer, error } = await supabase
        .from('dancers')
        .update({ bio: bio.trim() })
        .eq('id', auth.dancer.id)
        .select()
        .single();

      if (error) throw error;

      if (updatedDancer) {
        setAuth({
          ...auth,
          dancer: updatedDancer
        });
      }
      setIsEditingBio(false);
    } catch (error) {
      console.error('Failed to update bio:', error);
      alert('自己紹介の更新に失敗しました');
    } finally {
      setIsSavingBio(false);
    }
  };

  const handleNameSave = async () => {
    if (!auth?.dancer?.id || !name.trim()) return;

    setIsSavingName(true);
    try {
      const { data: updatedDancer, error } = await supabase
        .from('dancers')
        .update({ name: name.trim() })
        .eq('id', auth.dancer.id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          alert('この踊り子名は既に使用されています');
          return;
        }
        throw error;
      }

      if (updatedDancer) {
        setAuth({
          ...auth,
          dancer: updatedDancer
        });
      }
      setIsEditingName(false);
    } catch (error) {
      console.error('Failed to update name:', error);
      alert('踊り子名の更新に失敗しました');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleDelete = async () => {
    if (!auth?.dancer?.id) return;

    const confirmed = window.confirm(
      '本当に退会しますか？\n退会すると、アカウントに関連するすべての情報が削除され、元に戻すことはできません。'
    );

    if (!confirmed) return;

    try {
      // アバター画像を削除
      if (auth.dancer.avatar_url) {
        const oldPath = new URL(auth.dancer.avatar_url).pathname.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([oldPath]);
        }
      }

      // ダンサー情報を削除
      const { error } = await supabase
        .from('dancers')
        .delete()
        .eq('id', auth.dancer.id);

      if (error) throw error;

      // ログアウト処理
      setAuth(null);
      navigate('/');
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('退会処理に失敗しました');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative group">
          <div
            className={`w-16 h-16 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center relative ${
              isUploadingAvatar ? 'opacity-50' : ''
            }`}
          >
            {auth.dancer.avatar_url ? (
              <img
                src={auth.dancer.avatar_url}
                alt={auth.dancer.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.onerror = null; // 無限ループを防ぐ
                  img.src = ''; // エラー時は空の画像を表示
                }}
              />
            ) : (
              <User className="w-8 h-8 text-purple-600" />
            )}
          </div>
          <button
            onClick={handleAvatarClick}
            disabled={isUploadingAvatar}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
          >
            <Camera className="w-5 h-5 text-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">マイアカウント</h2>
          <p className="text-gray-600">アカウント情報の確認</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">踊り子名</h3>
            {!isEditingName && (
              <button
                onClick={() => setIsEditingName(true)}
                className="p-1 text-gray-400 hover:text-gray-500"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
          {isEditingName ? (
            <div className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="踊り子名を入力してください"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsEditingName(false);
                    setName(auth.dancer.name);
                  }}
                  className="p-2 text-gray-500 hover:text-gray-600"
                  disabled={isSavingName}
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNameSave}
                  disabled={isSavingName || !name.trim()}
                  className="p-2 text-green-600 hover:text-green-700"
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-lg text-gray-900">{auth.dancer.name}</p>
          )}
        </div>

        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">所属チーム</h3>
          <p className="text-lg text-gray-900">{auth.team?.name}</p>
        </div>

        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">役職</h3>
          <p className="text-lg text-gray-900">{auth.dancer.role}</p>
        </div>

        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">自己紹介</h3>
            {!isEditingBio && (
              <button
                onClick={() => setIsEditingBio(true)}
                className="p-1 text-gray-400 hover:text-gray-500"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
          {isEditingBio ? (
            <div className="space-y-3">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="自己紹介を入力してください"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsEditingBio(false);
                    setBio(auth.dancer.bio || '');
                  }}
                  className="p-2 text-gray-500 hover:text-gray-600"
                  disabled={isSavingBio}
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={handleBioSave}
                  disabled={isSavingBio}
                  className="p-2 text-green-600 hover:text-green-700"
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap">
              {auth.dancer.bio || '自己紹介が未設定です'}
            </p>
          )}
        </div>

        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">ステータス</h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            auth.dancer.is_approved
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {auth.dancer.is_approved ? '承認済み' : '承認待ち'}
          </span>
        </div>

        <div>
          <button
            onClick={handleDelete}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            退会する
          </button>
          <p className="mt-2 text-sm text-gray-500 text-center">
            退会すると、アカウントに関連するすべての情報が削除され、元に戻すことはできません。
          </p>
        </div>
      </div>
    </div>
  );
}