import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Image as ImageIcon, Youtube, User, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Blog } from '../types';

export default function Blogs() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    youtube_url: ''
  });

  const canManage = auth?.dancer?.role && ['代表', 'スタッフ'].includes(auth.dancer.role);

  useEffect(() => {
    fetchBlogs();
  }, [auth?.team?.id]);

  const fetchBlogs = async () => {
    if (!auth?.team?.id) return;

    const { data } = await supabase
      .from('blogs')
      .select(`
        *,
        dancer:dancers(*)
      `)
      .eq('team_id', auth.team.id)
      .order('created_at', { ascending: false });

    if (data) {
      setBlogs(data);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.team?.id || !auth?.dancer?.id) return;

    setIsSubmitting(true);
    try {
      let image_url = null;

      if (selectedImage) {
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
        .insert({
          team_id: auth.team.id,
          created_by: auth.dancer.id,
          title: formData.title.trim(),
          content: formData.content.trim() || null,
          image_url,
          youtube_url: youtubeId
        });

      if (error) throw error;

      setFormData({
        title: '',
        content: '',
        youtube_url: ''
      });
      setSelectedImage(null);
      setShowAddForm(false);
      await fetchBlogs();
    } catch (error) {
      console.error('Failed to create blog:', error);
      alert('ブログの作成に失敗しました');
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

  const truncateContent = (content: string | null) => {
    if (!content) return '';
    return content.length > 10 ? content.slice(0, 10) + '...' : content;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">ブログ</h2>
            <p className="text-gray-600">{auth?.team?.name}のブログ</p>
          </div>
          {canManage && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              ブログを投稿
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
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({
                    title: '',
                    content: '',
                    youtube_url: ''
                  });
                  setSelectedImage(null);
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
          {blogs.map(blog => (
            <article
              key={blog.id}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/blogs/${blog.id}`)}
            >
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center flex-shrink-0">
                    {blog.dancer?.avatar_url ? (
                      <img
                        src={blog.dancer.avatar_url}
                        alt={blog.dancer.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {blog.dancer?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(blog.created_at)}
                    </p>
                  </div>
                </div>

                <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-1">
                  {blog.title}
                </h3>

                {blog.content && (
                  <p className="text-sm text-gray-600 mb-2">
                    {truncateContent(blog.content)}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {blog.image_url && (
                    <div className="flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      画像
                    </div>
                  )}
                  {blog.youtube_url && (
                    <div className="flex items-center gap-1">
                      <Youtube className="w-3 h-3" />
                      動画
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}

          {blogs.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">まだブログがありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}