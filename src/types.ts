export interface Team {
  id: string;
  name: string;
  created_at: string;
}

export interface Dancer {
  id: string;
  name: string;
  team_id: string;
  role: '代表' | 'スタッフ' | 'メンバー';
  is_approved: boolean;
  created_at: string;
  approved_by?: string;
  avatar_url?: string;
  bio?: string;
}

export interface AuthState {
  dancer: Dancer | null;
  team: Team | null;
}

export interface Schedule {
  id: string;
  team_id: string;
  title: string;
  description: string | null;
  category: '練習' | 'イベント' | 'その他';
  location: string | null;
  location_url: string | null;
  start_time: string;
  end_time: string;
  color: string;
  created_by: string;
  created_at: string;
}

export interface ScheduleParticipant {
  id: string;
  schedule_id: string;
  dancer_id: string;
  dancer?: Dancer;
  created_at: string;
}

export interface ScheduleFormData {
  title: string;
  description: string;
  category: '練習' | 'イベント' | 'その他';
  location: string;
  location_url: string;
  start_time: string;
  end_time: string;
  color: string;
}

export interface ScheduleComment {
  id: string;
  schedule_id: string;
  dancer_id: string;
  dancer?: Dancer;
  content: string;
  created_at: string;
}

export interface VideoCategory {
  id: string;
  team_id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface Video {
  id: string;
  team_id: string;
  category_id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  created_by: string;
  created_at: string;
}

export interface Item {
  id: string;
  team_id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  created_by: string;
  created_at: string;
}

export interface ItemPurchase {
  id: string;
  item_id: string;
  dancer_id: string;
  quantity: number;
  is_delivered: boolean;
  delivered_at?: string;
  delivered_by?: string;
  created_at: string;
  item?: Item;
  dancer?: Dancer;
  delivered_dancer?: Dancer;
}

export interface Blog {
  id: string;
  team_id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  youtube_url: string | null;
  created_by: string;
  created_at: string;
  dancer?: Dancer;
}

export interface TeamInfo {
  id: string;
  team_id: string;
  title: string;
  content: string | null;
  created_by: string;
  created_at: string;
  dancer?: Dancer;
}

export interface DanceMove {
  id: string;
  team_id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  dancer?: Dancer;
}

export interface DanceMoveCompletion {
  id: string;
  dance_move_id: string;
  dancer_id: string;
  created_at: string;
  dancer?: Dancer;
}

export interface Inventory {
  id: string;
  item_id: string;
  quantity: number;
  updated_at: string;
  item?: Item;
}