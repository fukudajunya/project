import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Item } from '../types';
import { Plus, Minus } from 'lucide-react';

interface InventoryItem extends Item {
  inventory: {
    id: string;
    quantity: number;
  } | null;
}

export default function Inventory() {
  const { auth } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingQuantity, setEditingQuantity] = useState<Record<string, string>>({});

  const canManage = auth?.dancer?.role && ['代表', 'スタッフ'].includes(auth.dancer.role);

  useEffect(() => {
    fetchItems();
  }, [auth?.team?.id]);

  const fetchItems = async () => {
    if (!auth?.team?.id) return;

    const { data } = await supabase
      .from('items')
      .select(`
        *,
        inventory (
          id,
          quantity
        )
      `)
      .eq('team_id', auth.team.id)
      .order('name');

    if (data) {
      setItems(data);
      // 編集中の数値をリセット
      setEditingQuantity({});
    }
  };

  const handleQuantityChange = async (itemId: string, delta: number) => {
    if (!canManage) return;

    setIsUpdating(true);
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      const currentQuantity = item.inventory?.quantity || 0;
      const newQuantity = Math.max(0, currentQuantity + delta);

      if (item.inventory?.id) {
        // 既存の在庫レコードを更新
        const { error } = await supabase
          .from('inventory')
          .update({ quantity: newQuantity })
          .eq('id', item.inventory.id);

        if (error) throw error;
      } else {
        // 新規の在庫レコードを作成
        const { error } = await supabase
          .from('inventory')
          .insert({
            item_id: itemId,
            quantity: newQuantity
          });

        if (error) throw error;
      }

      await fetchItems();
    } catch (error) {
      console.error('Failed to update inventory:', error);
      alert('在庫数の更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuantityInput = (itemId: string, value: string) => {
    setEditingQuantity(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const handleQuantitySubmit = async (itemId: string) => {
    if (!canManage) return;

    const value = editingQuantity[itemId];
    if (!value) return;

    const newQuantity = parseInt(value, 10);
    if (isNaN(newQuantity) || newQuantity < 0) {
      alert('有効な数値を入力してください');
      return;
    }

    setIsUpdating(true);
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      if (item.inventory?.id) {
        // 既存の在庫レコードを更新
        const { error } = await supabase
          .from('inventory')
          .update({ quantity: newQuantity })
          .eq('id', item.inventory.id);

        if (error) throw error;
      } else {
        // 新規の在庫レコードを作成
        const { error } = await supabase
          .from('inventory')
          .insert({
            item_id: itemId,
            quantity: newQuantity
          });

        if (error) throw error;
      }

      await fetchItems();
    } catch (error) {
      console.error('Failed to update inventory:', error);
      alert('在庫数の更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!canManage) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-center text-gray-500">
          このページにアクセスする権限がありません
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">在庫管理</h2>
          <p className="text-gray-600">{auth?.team?.name}の在庫一覧</p>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div>
                <h3 className="font-medium text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-500">
                  ¥{item.price.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editingQuantity[item.id] ?? (item.inventory?.quantity || 0)}
                    onChange={(e) => handleQuantityInput(item.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleQuantitySubmit(item.id);
                      }
                    }}
                    onBlur={() => handleQuantitySubmit(item.id)}
                    min="0"
                    className="w-20 px-2 py-1 text-right border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={isUpdating}
                  />
                  <span className="text-gray-600">個</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(item.id, -1)}
                    disabled={isUpdating || (item.inventory?.quantity || 0) <= 0}
                    className="p-1 text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleQuantityChange(item.id, 1)}
                    disabled={isUpdating}
                    className="p-1 text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              まだアイテムがありません
            </p>
          )}
        </div>
      </div>
    </div>
  );
}