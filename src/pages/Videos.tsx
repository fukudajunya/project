import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { VideoCategory, Video } from '../types';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, ExternalLink, Play } from 'lucide-react';

export default function Videos() {
  const { auth } = useAuth();
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<VideoCategory | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    youtube_url: ''
  });

  const canManage = auth?.dancer?.role && ['代表', 'スタッフ'].includes(auth.dancer.role);

  useEffect(() => {
    fetchCategories();
    fetchVideos();
  }, [auth?.team?.id]);

  const fetchCategories = async () => {
    if (!auth?.team?.id) return;
    const { data } = await supabase
      .from('video_categories')
      .select('*')
      .eq('team_id', auth.team.id)
      .order('name');
    if (data) setCategories(data);
  };

  const fetchVideos = async () => {
    if (!auth?.team?.id) return;
    const { data } = await supabase
      .from('videos')
      .select('*')
      .eq('team_id', auth.team.id)
      .order('created_at', { ascending: false });
    if (data) setVideos(data);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.team?.id || !auth?.dancer?.id) return;

    try {
      const { error } = await supabase
        .from('video_categories')
        .insert({
          team_id: auth.team.id,
          name: newCategoryName.trim(),
          created_by: auth.dancer.id
        });

      if (error) throw error;

      setNewCategoryName('');
      setShowAddCategory(false);
      await fetchCategories();
    } catch (error) {
      console.error('Failed to add category:', error);
      alert('カテゴリの追加に失敗しました');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !auth?.team?.id) return;

    try {
      const { error } = await supabase
        .from('video_categories')
        .update({ name: newCategoryName.trim() })
        .eq('id', editingCategory.id)
        .eq('team_id', auth.team.id);

      if (error) throw error;

      setNewCategoryName('');
      setEditingCategory(null);
      await fetchCategories();
    } catch (error) {
      console.error('Failed to update category:', error);
      alert('カテゴリの更新に失敗しました');
    }
  };

  const handleDeleteCategory = async (category: VideoCategory) => {
    if (!auth?.team?.id) return;

    const confirmed = window.confirm(
      `カテゴリ「${category.name}」を削除してもよろしいですか？\n所属する動画もすべて削除されます。`
    );
    if (!confirmed) return;

    try {
      // First delete all videos in this category
      const { error: videosError } = await supabase
        .from('videos')
        .delete()
        .eq('category_id', category.id)
        .eq('team_id', auth.team.id);

      if (videosError) throw videosError;

      // Then delete the category
      const { error: categoryError } = await supabase
        .from('video_categories')
        .delete()
        .eq('id', category.id)
        .eq('team_id', auth.team.id);

      if (categoryError) throw categoryError;

      await fetchCategories();
      await fetchVideos();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('カテゴリの削除に失敗しました');
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.team?.id || !auth?.dancer?.id || !selectedCategory) return;

    try {
      // Extract video ID from YouTube URL
      const url = new URL(videoForm.youtube_url);
      let videoId = '';
      if (url.hostname === 'youtu.be') {
        videoId = url.pathname.slice(1);
      } else {
        videoId = url.searchParams.get('v') || '';
      }

      if (!videoId) {
        alert('有効なYouTube URLを入力してください');
        return;
      }

      const { error } = await supabase
        .from('videos')
        .insert({
          team_id: auth.team.id,
          category_id: selectedCategory.id,
          title: videoForm.title.trim(),
          description: videoForm.description.trim(),
          youtube_url: videoId,
          created_by: auth.dancer.id
        });

      if (error) throw error;

      setVideoForm({ title: '', description: '', youtube_url: '' });
      setShowAddVideo(false);
      await fetchVideos();
    } catch (error) {
      console.error('Failed to add video:', error);
      alert('動画の追加に失敗しました');
    }
  };

  const handleDeleteVideo = async (video: Video) => {
    if (!auth?.team?.id) return;

    const confirmed = window.confirm('この動画を削除してもよろしいですか？');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', video.id)
        .eq('team_id', auth.team.id);

      if (error) throw error;

      await fetchVideos();
    } catch (error) {
      console.error('Failed to delete video:', error);
      alert('動画の削除に失敗しました');
    }
  };

  const startEditingVideo = (video: Video) => {
    setEditingVideo(video);
    setVideoForm({
      title: video.title,
      description: video.description || '',
      youtube_url: `https://www.youtube.com/watch?v=${video.youtube_url}`
    });
  };

  const handleUpdateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo || !auth?.team?.id) return;

    try {
      // Extract video ID from YouTube URL
      const url = new URL(videoForm.youtube_url);
      let videoId = '';
      if (url.hostname === 'youtu.be') {
        videoId = url.pathname.slice(1);
      } else {
        videoId = url.searchParams.get('v') || '';
      }

      if (!videoId) {
        alert('有効なYouTube URLを入力してください');
        return;
      }

      const { error } = await supabase
        .from('videos')
        .update({
          title: videoForm.title.trim(),
          description: videoForm.description.trim(),
          youtube_url: videoId
        })
        .eq('id', editingVideo.id)
        .eq('team_id', auth.team.id);

      if (error) throw error;

      setVideoForm({ title: '', description: '', youtube_url: '' });
      setEditingVideo(null);
      await fetchVideos();
    } catch (error) {
      console.error('Failed to update video:', error);
      alert('動画の更新に失敗しました');
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAddVideoClick = (category: VideoCategory) => {
    setSelectedCategory(category);
    setShowAddVideo(true);
    // カテゴリを展開する
    setExpandedCategories(prev => new Set([...prev, category.id]));
  };

  const getThumbnailUrl = (videoId: string) => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  const getYouTubeUrl = (videoId: string) => {
    return `https://www.youtube.com/watch?v=${videoId}`;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">動画</h2>
            <p className="text-gray-600">{auth?.team?.name}の動画一覧</p>
          </div>
          {canManage && (
            <button
              onClick={() => setShowAddCategory(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              カテゴリを追加
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {showAddCategory && (
          <form onSubmit={handleAddCategory} className="mb-6">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="カテゴリ名"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                追加
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategoryName('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </form>
        )}

        {editingCategory && (
          <form onSubmit={handleUpdateCategory} className="mb-6">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="カテゴリ名"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                更新
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setNewCategoryName('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {categories.map(category => (
            <div key={category.id} className="border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between p-4">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="flex items-center gap-2 text-lg font-medium text-gray-900"
                >
                  {expandedCategories.has(category.id) ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                  {category.name}
                </button>
                <div className="flex items-center gap-2">
                  {canManage && (
                    <>
                      <button
                        onClick={() => handleAddVideoClick(category)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingCategory(category);
                          setNewCategoryName(category.name);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {expandedCategories.has(category.id) && (
                <div className="border-t border-gray-200 p-4">
                  {showAddVideo && selectedCategory?.id === category.id && (
                    <form onSubmit={handleAddVideo} className="mb-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          タイトル
                        </label>
                        <input
                          type="text"
                          value={videoForm.title}
                          onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          説明
                        </label>
                        <textarea
                          value={videoForm.description}
                          onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          YouTube URL
                        </label>
                        <input
                          type="url"
                          value={videoForm.youtube_url}
                          onChange={(e) => setVideoForm({ ...videoForm, youtube_url: e.target.value })}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddVideo(false);
                            setSelectedCategory(null);
                            setVideoForm({ title: '', description: '', youtube_url: '' });
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          キャンセル
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                        >
                          追加
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {videos
                      .filter(video => video.category_id === category.id)
                      .map(video => (
                        <div
                          key={video.id}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          {editingVideo?.id === video.id ? (
                            <form onSubmit={handleUpdateVideo} className="p-4 space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  タイトル
                                </label>
                                <input
                                  type="text"
                                  value={videoForm.title}
                                  onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  説明
                                </label>
                                <textarea
                                  value={videoForm.description}
                                  onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                                  rows={3}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  YouTube URL
                                </label>
                                <input
                                  type="url"
                                  value={videoForm.youtube_url}
                                  onChange={(e) => setVideoForm({ ...videoForm, youtube_url: e.target.value })}
                                  placeholder="https://www.youtube.com/watch?v=..."
                                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  required
                                />
                              </div>
                              <div className="flex justify-end gap-4">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingVideo(null);
                                    setVideoForm({ title: '', description: '', youtube_url: '' });
                                  }}
                                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                  キャンセル
                                </button>
                                <button
                                  type="submit"
                                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                                >
                                  更新
                                </button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <div className="relative aspect-video group">
                                <a
                                  href={getYouTubeUrl(video.youtube_url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block w-full h-full"
                                >
                                  <img
                                    src={getThumbnailUrl(video.youtube_url)}
                                    alt={video.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                      const img = e.target as HTMLImageElement;
                                      if (img.src.includes('maxresdefault')) {
                                        img.src = img.src.replace('maxresdefault', 'hqdefault');
                                      }
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                                    <Play className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </a>
                              </div>
                              <div className="p-4">
                                <h3 className="font-medium text-gray-900 mb-2">{video.title}</h3>
                                {video.description && (
                                  <p className="text-sm text-gray-600 mb-4">{video.description}</p>
                                )}
                                <div className="flex items-center justify-between">
                                  <a
                                    href={getYouTubeUrl(video.youtube_url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1"
                                  >
                                    YouTubeで見る
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                  {canManage && (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => startEditingVideo(video)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteVideo(video)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                  </div>

                  {videos.filter(video => video.category_id === category.id).length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      まだ動画がありません
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}

          {categories.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              まだカテゴリがありません
            </p>
          )}
        </div>
      </div>
    </div>
  );
}