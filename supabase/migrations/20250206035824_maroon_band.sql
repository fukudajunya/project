/*
  # スケジュール管理機能の追加

  1. 新しいテーブル
    - `schedules`
      - `id` (uuid, primary key)
      - `team_id` (uuid, foreign key to teams)
      - `title` (text) - 予定のタイトル
      - `description` (text) - 予定の詳細
      - `category` (text) - 予定区分（練習・イベント・その他）
      - `location` (text) - 場所
      - `location_url` (text) - 場所のURL
      - `start_time` (timestamptz) - 開始時間
      - `end_time` (timestamptz) - 終了時間
      - `color` (text) - カレンダー表示色
      - `created_by` (uuid, foreign key to dancers) - 作成者
      - `created_at` (timestamptz) - 作成日時

  2. セキュリティ
    - RLSを有効化
    - 代表とスタッフのみが予定を追加可能
    - チームメンバーは予定の閲覧のみ可能
*/

CREATE TABLE schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('練習', 'イベント', 'その他')),
  location text,
  location_url text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  color text NOT NULL,
  created_by uuid REFERENCES dancers(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- 閲覧ポリシー：同じチームのメンバーは予定を閲覧可能
CREATE POLICY "Team members can view schedules"
  ON schedules FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.team_id = schedules.team_id
    )
  );

-- 作成ポリシー：代表とスタッフのみが予定を作成可能
CREATE POLICY "Representatives and staff can create schedules"
  ON schedules FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = schedules.created_by
      AND dancers.team_id = schedules.team_id
      AND dancers.role IN ('代表', 'スタッフ')
    )
  );

-- 更新ポリシー：代表とスタッフのみが予定を更新可能
CREATE POLICY "Representatives and staff can update schedules"
  ON schedules FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = schedules.created_by
      AND dancers.team_id = schedules.team_id
      AND dancers.role IN ('代表', 'スタッフ')
    )
  );

-- 削除ポリシー：代表とスタッフのみが予定を削除可能
CREATE POLICY "Representatives and staff can delete schedules"
  ON schedules FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM dancers
      WHERE dancers.id = schedules.created_by
      AND dancers.team_id = schedules.team_id
      AND dancers.role IN ('代表', 'スタッフ')
    )
  );