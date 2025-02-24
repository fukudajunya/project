import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Schedule, ScheduleFormData } from '../types';
import { Plus } from 'lucide-react';
import ScheduleForm from '../components/ScheduleForm';
import ScheduleModal from '../components/ScheduleModal';
import ScheduleListModal from '../components/ScheduleListModal';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

// 日本のタイムゾーンオフセット（分）
const JST_OFFSET = 9 * 60;

// 日付をJSTに変換する関数
function toJST(date: Date): Date {
  return new Date(date.getTime() + (JST_OFFSET * 60 * 1000));
}

// UTCに変換する関数
function toUTC(date: Date): Date {
  return new Date(date.getTime() - (JST_OFFSET * 60 * 1000));
}

export default function CalendarPage() {
  const { auth } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [showScheduleList, setShowScheduleList] = useState(false);
  const [selectedDateSchedules, setSelectedDateSchedules] = useState<Schedule[]>([]);

  const fetchSchedules = async () => {
    if (!auth?.team?.id) return;

    const { data } = await supabase
      .from('schedules')
      .select('*')
      .eq('team_id', auth.team.id)
      .order('start_time');

    if (data) {
      setSchedules(data);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [auth?.team?.id]);

  const handleDateClick = (value: Value) => {
    if (value instanceof Date) {
      const dateSchedules = schedules.filter(schedule => {
        const scheduleDate = toJST(new Date(schedule.start_time));
        return (
          scheduleDate.getFullYear() === value.getFullYear() &&
          scheduleDate.getMonth() === value.getMonth() &&
          scheduleDate.getDate() === value.getDate()
        );
      });

      if (dateSchedules.length > 0) {
        setSelectedDateSchedules(dateSchedules);
        setShowScheduleList(true);
      } else {
        // 選択された日付をJSTで設定
        const jstDate = new Date(value);
        jstDate.setHours(0, 0, 0, 0);
        setSelectedDate(jstDate);
        if (auth?.dancer?.role && ['代表', 'スタッフ'].includes(auth.dancer.role)) {
          setShowAddForm(true);
        }
      }
    }
  };

  const handleAddSchedule = async (formData: ScheduleFormData) => {
    if (!auth?.team?.id || !auth?.dancer?.id) return;

    // 開始時間と終了時間をUTCに変換
    const startDate = toUTC(new Date(formData.start_time));
    const endDate = toUTC(new Date(formData.end_time));

    const { error } = await supabase
      .from('schedules')
      .insert({
        team_id: auth.team.id,
        created_by: auth.dancer.id,
        ...formData,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString()
      });

    if (!error) {
      await fetchSchedules();
      setShowAddForm(false);
      setSelectedDate(null);
    }
  };

  const handleScheduleDelete = async () => {
    await fetchSchedules();
  };

  const handleScheduleUpdate = async () => {
    await fetchSchedules();
  };

  const tileContent = ({ date }: { date: Date }) => {
    const dateSchedules = schedules.filter(schedule => {
      const scheduleDate = toJST(new Date(schedule.start_time));
      return (
        scheduleDate.getFullYear() === date.getFullYear() &&
        scheduleDate.getMonth() === date.getMonth() &&
        scheduleDate.getDate() === date.getDate()
      );
    });

    if (dateSchedules.length === 0) return null;

    return (
      <div className="flex flex-col items-center mt-1">
        <div className="flex gap-1 mb-1">
          {dateSchedules.slice(0, 3).map((schedule, index) => (
            <div
              key={schedule.id}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: schedule.color }}
            />
          ))}
          {dateSchedules.length > 3 && (
            <div className="w-2 h-2 rounded-full bg-gray-300" />
          )}
        </div>
        <div className="text-xs text-gray-600 truncate w-full text-center px-1">
          {dateSchedules[0].title}
          {dateSchedules.length > 1 && ` 他${dateSchedules.length - 1}件`}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">カレンダー</h2>
            <p className="text-gray-600">{auth?.team?.name}のスケジュール</p>
          </div>
          {auth?.dancer?.role && ['代表', 'スタッフ'].includes(auth.dancer.role) && (
            <button
              onClick={() => {
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                setSelectedDate(now);
                setShowAddForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              予定を追加
            </button>
          )}
        </div>
      </div>

      <div className="calendar-container">
        <Calendar
          locale="ja-JP"
          className="rounded-lg border-0 shadow-sm w-full max-w-3xl mx-auto"
          tileContent={tileContent}
          onClickDay={handleDateClick}
          navigationLabel={({ date }) => {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            return `${year}年${month}月`;
          }}
          onClickMonth={() => {}} // 月表示のクリックを無効化
          minDetail="month" // 年の選択を無効
          prev2Label={null} // 前年ボタンを非表示
          next2Label={null} // 次年ボタンを非表示
        />
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                予定を追加
              </h3>
              <ScheduleForm
                onSubmit={handleAddSchedule}
                onCancel={() => {
                  setShowAddForm(false);
                  setSelectedDate(null);
                }}
                initialData={
                  selectedDate
                    ? {
                        start_time: new Date(
                          selectedDate.getFullYear(),
                          selectedDate.getMonth(),
                          selectedDate.getDate(),
                          9, // デフォルトで9時から
                          0
                        ).toISOString().slice(0, 16),
                        end_time: new Date(
                          selectedDate.getFullYear(),
                          selectedDate.getMonth(),
                          selectedDate.getDate(),
                          10, // デフォルトで10時まで
                          0
                        ).toISOString().slice(0, 16),
                      }
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      )}

      {selectedSchedule && (
        <ScheduleModal
          schedule={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
          onDelete={handleScheduleDelete}
          onUpdate={handleScheduleUpdate}
        />
      )}

      {showScheduleList && (
        <ScheduleListModal
          schedules={selectedDateSchedules}
          onClose={() => setShowScheduleList(false)}
          onSelectSchedule={(schedule) => {
            setSelectedSchedule(schedule);
            setShowScheduleList(false);
          }}
        />
      )}

      <style>{`
        .calendar-container .react-calendar {
          border: none;
          font-family: sans-serif;
        }
        .react-calendar__tile {
          height: 100px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          padding-top: 8px;
        }
        .react-calendar__tile--active {
          background: #9333ea !important;
        }
        .react-calendar__tile--now {
          background: #f3e8ff;
        }
        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background-color: #e9d5ff;
        }
        .react-calendar__navigation__label {
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}