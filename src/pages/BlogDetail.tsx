import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, ArrowLeft, ExternalLink, Edit2, Trash2, Play } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Blog } from '../types';

export default function BlogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    youtube_url: ''
  });

  const canManage = auth?.dancer?.role && ['代表', 'スタッフ'].includes(auth.dancer.role);

  useEffect(() => {
    fetchBlog();
  }, [id]);

  useEffect(() => {
    if (blog) {
      setFormData({
        title: blog.title,
        content: blog.content || '',
        youtube_url: blog.youtube_url ? `https://www.youtube.com/watch?v=${blog.youtube_url}` : ''
      });
    }
  }, [blog]);

  const extractYoutubeId = (url: string): string | null => {
    if (!url) return null;
    
    try {
      // Handle youtu.be format
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        return id || null;
      }
      
      // Handle youtube.com format
      if (url.includes('youtube.com/watch')) {
        const urlObj = new URL(url);
        return urlObj.searchParams.get('v');
      }
      
      // Already a video ID
      if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
      }
      
      return null;
    } catch {
      return null;
    }
  };

  const fetchBlog = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('blogs')
        .select(`
          *,
          dancer:dancers(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setBlog(data);
    } catch (error) {
      console.error('Error fetching blog:', error);
      navigate('/blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blog || !auth?.team?.id || !auth?.dancer?.id) return;

    setIsSubmitting(true);
    try {
      let image_url = blog.image_url;

      if (selectedImage) {
        // Delete old image if exists
        if (blog.image_url) {
          const oldPath = new URL(blog.image_url).pathname.split('/').pop();
          if (oldPath) {
            await supabase.storage
              .from('blogs')
              .remove([oldPath]);
          }
        }

        // Upload new image
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${auth.team.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('blogs')
          .upload(fileName, selectedImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('blogs')
          .getPublicUrl(fileName);

        image_url = publicUrl;
      }

      // Extract YouTube video ID before saving
      const youtubeId = extractYoutubeId(formData.youtube_url);

      const { error } = await supabase
        .from('blogs')
        .update({
          title: formData.title.trim(),
          content: formData.content.trim() || null,
          image_url,
          youtube_url: youtubeId
        })
        .eq('id', blog.id);

      if (error) throw error;

      setShowEditForm(false);
      await fetchBlog();
    } catch (error) {
      console.error('Failed to update blog:', error);
      alert('ブログの更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!blog || !auth?.team?.id) return;

    const confirmed = window.confirm('このブログを削除してもよろしいですか？');
    if (!confirmed) return;

    try {
      // Delete image if exists
      if (blog.image_url) {
        const oldPath = new URL(blog.image_url).pathname.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('blogs')
            .remove([oldPath]);
        }
      }

      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', blog.id);

      if (error) throw error;

      navigate('/blogs');
    } catch (error) {
      console.error('Failed to delete blog:', error);
      alert('ブログの削除に失敗しました');
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

  const getYoutubeThumbnail = (videoId: string) => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-center text-gray-500">ブログが見つかりません</p>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                画像
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {blog.image_url && !selectedImage && (
                <p className="mt-1 text-sm text-gray-500">
                  現在の画像を保持する場合は、新しい画像を選択しないでください
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                YouTube URL
              </label>
              <input
                type="url"
                value={formData.youtube_url}
                onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
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
            onClick={() => navigate('/blogs')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            ブログ一覧に戻る
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
            {blog.dancer?.avatar_url ? (
              <img
                src={blog.dancer.avatar_url}
                alt={blog.dancer.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-purple-600" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{blog.dancer?.name}</p>
            <p className="text-sm text-gray-500">{formatDate(blog.created_at)}</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">{blog.title}</h1>

        {blog.content && (
          <div className="prose max-w-none mb-8">
            <p className="whitespace-pre-wrap text-gray-700">{blog.content}</p>
          </div>
        )}

        {blog.image_url && (
          <div className="mb-8 px-4">
            <div className="max-w-lg mx-auto">
              <img
                src={blog.image_url}
                alt={blog.title}
                className="w-full h-auto rounded-lg"
                style={{ maxHeight: '400px', objectFit: 'contain' }}
              />
            </div>
          </div>
        )}

        {blog.youtube_url && (
          <div className="mb-8 px-4">
            <div className="max-w-lg mx-auto">
              <a
                href={`https://www.youtube.com/watch?v=${blog.youtube_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative group"
              >
                <img
                  src={getYoutubeThumbnail(blog.youtube_url)}
                  alt={blog.title}
                  className="w-full h-auto rounded-lg"
                  style={{ maxHeight: '200px', objectFit: 'cover' }}
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (img.src.includes('maxresdefault')) {
                      img.src = img.src.replace('maxresdefault', 'hqdefault');
                    }
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity">
                  <Play className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="mt-2 flex items-center gap-2 text-purple-600 hover:text-purple-700">
                  <ExternalLink className="w-4 h-4" />
                  <span>YouTubeで見る</span>
                </div>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}