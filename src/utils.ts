export const isTouchDevice = () => {
  return (('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0) ||
    // @ts-ignore
    (navigator.msMaxTouchPoints > 0));
};

// パスワードをハッシュ化する関数
export const createHash = async (password: string): Promise<string> => {
  // ソルトを生成（実際のソルトは使用していませんが、将来の拡張性のために関数は残しています）
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// パスワードの強度をチェックする関数
export const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'パスワードは8文字以上で入力してください' };
  }
  
  if (!/[A-Za-z]/.test(password)) {
    return { isValid: false, message: 'パスワードにはアルファベットを含める必要があります' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'パスワードには数字を含める必要があります' };
  }
  
  return { isValid: true, message: '' };
};