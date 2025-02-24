import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, User, Plus, Minus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Item, ItemPurchase } from '../types';

interface ItemDetailsProps {
  item: Item;
  onClose: () => void;
  onPurchaseComplete?: () => void;
}

export default function ItemDetails({ item, onClose, onPurchaseComplete }: ItemDetailsProps) {
  const { auth } = useAuth();
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchases, setPurchases] = useState<ItemPurchase[]>([]);

  useEffect(() => {
    if (auth?.dancer?.id) {
      fetchPurchases();
    }
  }, [item.id, auth?.dancer?.id]);

  const fetchPurchases = async () => {
    if (!auth?.dancer?.id) return;

    const { data } = await supabase
      .from('item_purchases')
      .select(`
        *,
        dancer:dancers!item_purchases_dancer_id_fkey(*),
        delivered_dancer:dancers!item_purchases_delivered_by_fkey(*)
      `)
      .eq('item_id', item.id)
      .eq('dancer_id', auth.dancer.id)
      .order('created_at', { ascending: false });

    if (data) {
      setPurchases(data);
    }
  };

  const handlePurchase = async () => {
    if (!auth?.dancer?.id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('item_purchases')
        .insert({
          item_id: item.id,
          dancer_id: auth.dancer.id,
          quantity
        });

      if (error) throw error;

      setShowPurchaseForm(false);
      setQuantity(1);
      await fetchPurchases();
      onPurchaseComplete?.();
    } catch (error) {
      console.error('Failed to purchase item:', error);
      alert('購入に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{item.name}</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-3xl font-bold text-purple-600">
                ¥{item.price.toLocaleString()}
              </p>
            </div>

            {item.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">説明</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{item.description}</p>
              </div>
            )}

            {!showPurchaseForm ? (
              <button
                onClick={() => setShowPurchaseForm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                購入する
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    購入個数
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      className="w-20 px-4 py-2 text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(1)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">合計金額</p>
                  <p className="text-xl font-bold text-purple-600">
                    ¥{(item.price * quantity).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowPurchaseForm(false);
                      setQuantity(1);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                    disabled={isSubmitting}
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handlePurchase}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? '購入中...' : '購入を確定'}
                  </button>
                </div>
              </div>
            )}

            {auth?.dancer?.id && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">購入履歴</h3>
                <div className="space-y-4">
                  {purchases.map(purchase => (
                    <div
                      key={purchase.id}
                      className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50"
                    >
                      <div>
                        <p className="text-sm text-gray-500">
                          {formatDate(purchase.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {purchase.quantity}個
                        </p>
                        <p className="text-sm text-gray-500">
                          ¥{(item.price * purchase.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}

                  {purchases.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      まだ購入履歴がありません
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}