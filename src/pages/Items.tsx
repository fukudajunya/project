import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Item } from '../types';
import { Plus, Edit2, Trash2, ShoppingBag } from 'lucide-react';
import ItemDetails from '../components/ItemDetails';

export default function Items() {
  const { auth } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [itemForm, setItemForm] = useState({
    name: '',
    price: '',
    description: ''
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const canManage = auth?.dancer?.role && 
    ['代表', 'スタッフ'].includes(auth.dancer.role) && 
    auth.dancer.is_approved;

  useEffect(() => {
    fetchItems();
  }, [auth?.team?.id]);

  const fetchItems = async () => {
    if (!auth?.team?.id) return;
    const { data } = await supabase
      .from('items')
      .select('*')
      .eq('team_id', auth.team.id)
      .order('created_at', { ascending: false });
    if (data) setItems(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.team?.id || !auth?.dancer?.id || !canManage) return;

    setIsSubmitting(true);
    try {
      let image_url = null;

      if (selectedImage) {
        // Delete old image if exists
        if (editingItem?.image_url) {
          const oldPath = new URL(editingItem.image_url).pathname.split('/').pop();
          if (oldPath) {
            await supabase.storage
              .from('items')
              .remove([oldPath]);
          }
        }

        // Upload new image
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${auth.team.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('items')
          .upload(fileName, selectedImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('items')
          .getPublicUrl(fileName);

        image_url = publicUrl;
      }

      const itemData = {
        team_id: auth.team.id,
        name: itemForm.name.trim(),
        price: parseInt(itemForm.price),
        description: itemForm.description.trim() || null,
        image_url: image_url || editingItem?.image_url,
        created_by: auth.dancer.id
      };

      if (editingItem) {
        const { error } = await supabase
          .from('items')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('items')
          .insert(itemData);

        if (error) throw error;
      }

      setItemForm({
        name: '',
        price: '',
        description: ''
      });
      setSelectedImage(null);
      setShowAddForm(false);
      setEditingItem(null);
      await fetchItems();
    } catch (error) {
      console.error('Failed to save item:', error);
      alert('アイテムの保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: Item) => {
    if (!auth?.team?.id || !canManage) return;

    const confirmed = window.confirm('このアイテムを削除してもよろしいですか？');
    if (!confirmed) return;

    try {
      // Delete image if exists
      if (item.image_url) {
        const oldPath = new URL(item.image_url).pathname.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('items')
            .remove([oldPath]);
        }
      }

      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      await fetchItems();
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('アイテムの削除に失敗しました');
    }
  };

  const startEditing = (item: Item) => {
    if (!canManage) return;
    setEditingItem(item);
    setItemForm({
      name: item.name,
      price: item.price.toString(),
      description: item.description || ''
    });
    setShowAddForm(true);
  };

  const truncateDescription = (description: string | null) => {
    if (!description) return '';
    return description.length > 10 ? description.slice(0, 10) + '...' : description;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">アイテム</h2>
            <p className="text-gray-600">{auth?.team?.name}のアイテム一覧</p>
          </div>
          {canManage && (
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingItem(null);
                setItemForm({
                  name: '',
                  price: '',
                  description: ''
                });
                setSelectedImage(null);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              アイテムを追加
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {showAddForm && canManage && (
          <form onSubmit={handleSubmit} className="mb-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                アイテム名
              </label>
              <input
                type="text"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                価格
              </label>
              <input
                type="number"
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                説明
              </label>
              <textarea
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                rows={3}
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
              {editingItem?.image_url && !selectedImage && (
                <p className="mt-1 text-sm text-gray-500">
                  現在の画像を保持する場合は、新しい画像を選択しないでください
                </p>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingItem(null);
                  setItemForm({
                    name: '',
                    price: '',
                    description: ''
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
                {isSubmitting ? '保存中...' : (editingItem ? '更新' : '追加')}
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(item => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedItem(item)}
            >
              {item.image_url && (
                <div className="aspect-square p-2">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 text-sm mb-1">{item.name}</h3>
                <p className="text-base font-bold text-purple-600 mb-2">
                  ¥{item.price.toLocaleString()}
                </p>
                {item.description && (
                  <p className="text-xs text-gray-600 mb-3">{truncateDescription(item.description)}</p>
                )}
                {canManage && (
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(item);
                      }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item);
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">まだアイテムがありません</p>
          </div>
        )}

        {selectedItem && (
          <ItemDetails
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onPurchaseComplete={fetchItems}
          />
        )}
      </div>
    </div>
  );
}