import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ItemPurchase, Item, Inventory } from '../types';
import { Package, Check, User, Undo2, Plus, Minus } from 'lucide-react';

export default function ItemDelivery() {
  const { auth } = useAuth();
  const [purchases, setPurchases] = useState<ItemPurchase[]>([]);
  const [inventory, setInventory] = useState<Record<string, Inventory>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingInventory, setIsUpdatingInventory] = useState(false);

  useEffect(() => {
    if (auth?.team?.id) {
      fetchPurchases();
      fetchInventory();
    }
  }, [auth?.team?.id]);

  const fetchPurchases = async () => {
    if (!auth?.team?.id) return;

    const { data } = await supabase
      .from('item_purchases')
      .select(`
        *,
        item:items!inner(*),
        dancer:dancers!item_purchases_dancer_id_fkey(*),
        delivered_dancer:dancers!item_purchases_delivered_by_fkey(*)
      `)
      .eq('items.team_id', auth.team.id)
      .order('created_at', { ascending: false });

    if (data) {
      setPurchases(data);
    }
  };

  const fetchInventory = async () => {
    if (!auth?.team?.id) return;

    const { data } = await supabase
      .from('inventory')
      .select(`
        *,
        item:items!inner(*)
      `)
      .eq('items.team_id', auth.team.id);

    if (data) {
      const inventoryMap = data.reduce((acc, inv) => {
        acc[inv.item_id] = inv;
        return acc;
      }, {} as Record<string, Inventory>);
      setInventory(inventoryMap);
    }
  };

  const handleDeliveryComplete = async (purchase: ItemPurchase) => {
    if (!auth?.dancer?.id) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('item_purchases')
        .update({
          is_delivered: true,
          delivered_at: new Date().toISOString(),
          delivered_by: auth.dancer.id
        })
        .eq('id', purchase.id);

      if (error) throw error;

      await fetchPurchases();
      await fetchInventory(); // 在庫数も更新
    } catch (error) {
      console.error('Failed to update delivery status:', error);
      alert('受け渡し状態の更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeliveryUndo = async (purchase: ItemPurchase) => {
    if (!auth?.dancer?.id) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('item_purchases')
        .update({
          is_delivered: false,
          delivered_at: null,
          delivered_by: null
        })
        .eq('id', purchase.id);

      if (error) throw error;

      await fetchPurchases();
      await fetchInventory(); // 在庫数も更新
    } catch (error) {
      console.error('Failed to update delivery status:', error);
      alert('受け渡し状態の更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateInventory = async (itemId: string, increment: boolean) => {
    if (!auth?.dancer?.id) return;

    setIsUpdatingInventory(true);
    try {
      const currentInventory = inventory[itemId];
      if (!currentInventory) return;

      const newQuantity = increment ? currentInventory.quantity + 1 : Math.max(0, currentInventory.quantity - 1);

      const { error } = await supabase
        .from('inventory')
        .update({ quantity: newQuantity })
        .eq('item_id', itemId);

      if (error) throw error;

      await fetchInventory();
    } catch (error) {
      console.error('Failed to update inventory:', error);
      alert('在庫数の更新に失敗しました');
    } finally {
      setIsUpdatingInventory(false);
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

  if (!auth?.dancer?.role || !['代表', 'スタッフ'].includes(auth.dancer.role)) {
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">アイテム受け渡し管理</h2>
            <p className="text-gray-600">{auth?.team?.name}の購入履歴</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {purchases.map(purchase => {
            const itemInventory = inventory[purchase.item_id];
            return (
              <div
                key={purchase.id}
                className={`border rounded-lg p-4 ${
                  purchase.is_delivered ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center">
                      {purchase.dancer?.avatar_url ? (
                        <img
                          src={purchase.dancer.avatar_url}
                          alt={purchase.dancer.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {purchase.dancer?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(purchase.created_at)}
                      </p>
                    </div>
                  </div>
                  {!purchase.is_delivered ? (
                    <button
                      onClick={() => handleDeliveryComplete(purchase)}
                      disabled={isUpdating}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      <Check className="w-3.5 h-3.5" />
                      完了
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDeliveryUndo(purchase)}
                      disabled={isUpdating}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      取消
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {purchase.item?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {purchase.quantity}個 × ¥{purchase.item?.price.toLocaleString()}
                      = ¥{((purchase.item?.price || 0) * purchase.quantity).toLocaleString()}
                    </p>
                  </div>
                  {purchase.is_delivered && (
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-green-600">
                        <Check className="w-3.5 h-3.5" />
                        <span className="text-sm font-medium">受け渡し済み</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDate(purchase.delivered_at!)}
                      </p>
                      <p className="text-xs text-gray-500">
                        by {purchase.delivered_dancer?.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* 在庫管理 */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      現在の在庫: {itemInventory?.quantity || 0}個
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateInventory(purchase.item_id, false)}
                        disabled={isUpdatingInventory || (itemInventory?.quantity || 0) <= 0}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleUpdateInventory(purchase.item_id, true)}
                        disabled={isUpdatingInventory}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {purchases.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">まだ購入履歴がありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}