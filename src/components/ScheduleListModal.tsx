import React from 'react';
import { Schedule } from '../types';
import { Clock } from 'lucide-react';

interface ScheduleListModalProps {
  schedules: Schedule[];
  onClose: () => void;
  onSelectSchedule: (schedule: Schedule) => void;
}

// 日本のタイムゾーンオフセット（分）
const JST_OFFSET = 9 * 60;

// 日付をJSTに変換する関数
function toJST(date: Date): Date {
  return new Date(date.getTime() + (JST_OFFSET * 60 * 1000));
}

export default function ScheduleListModal({
  schedules,
  onClose,
  onSelectSchedule,
}: ScheduleListModalProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const firstScheduleDate = toJST(new Date(schedules[0].start_time));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {formatDate(firstScheduleDate)}の予定
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {schedules.map((schedule) => {
              const startTime = toJST(new Date(schedule.start_time));
              return (
                <button
                  key={schedule.id}
                  onClick={() => onSelectSchedule(schedule)}
                  className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: schedule.color }}
                    />
                    <span className="px-2 py-0.5 text-sm rounded-full bg-gray-100">
                      {schedule.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {schedule.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(startTime)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}