import React from 'react';
import { Notification } from '../types';
import { Bell, BellOff, Check, AlertCircle } from 'lucide-react';

interface NotificationsCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onSelectStyle: (styleId: string) => void;
}

export default function NotificationsCenter({
  notifications,
  onMarkAsRead,
  onClearAll,
  onSelectStyle
}: NotificationsCenterProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative">
      {/* Bell Trigger */}
      <button
        id="btn-bell-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            id="bell-unread-indicator"
            className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white font-mono text-[9px] font-extrabold rounded-full flex items-center justify-center animate-bounce"
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification popover */}
      {isOpen && (
        <div
          id="notifications-popover-panel"
          className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-40 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2">
            <h3 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-slate-500" />
              Thông báo ({unreadCount} mới)
            </h3>
            {notifications.length > 0 && (
              <button
                id="btn-clear-all-notifications"
                onClick={onClearAll}
                className="text-[10px] text-blue-600 hover:text-blue-800 font-sans font-bold cursor-pointer"
              >
                Đánh dấu đọc tất cả
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-slate-400 font-sans text-xs flex flex-col items-center gap-1">
                <BellOff className="w-6 h-6 text-slate-300" />
                Không có thông báo mới nào.
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  id={`notif-item-${notif.id}`}
                  className={`p-2.5 rounded-xl border transition-all text-xs flex gap-2 items-start relative ${
                    notif.isRead
                      ? 'bg-white border-slate-100 text-slate-500'
                      : 'bg-blue-50/40 border-blue-100 text-slate-700 font-medium'
                  }`}
                >
                  <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${notif.isRead ? 'text-slate-400' : 'text-blue-500'}`} />
                  
                  <div className="space-y-1 flex-1 pr-4">
                    <p className="font-sans leading-relaxed">{notif.message}</p>
                    <p className="text-[9px] text-slate-400 font-mono">
                      {new Date(notif.createdAt).toLocaleTimeString('vi-VN')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="absolute right-2 top-2 flex flex-col gap-1">
                    {!notif.isRead && (
                      <button
                        id={`btn-notif-mark-read-${notif.id}`}
                        onClick={() => onMarkAsRead(notif.id)}
                        className="p-1 hover:bg-blue-100 rounded-md text-blue-600 shrink-0"
                        title="Đánh dấu đã đọc"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {notif.relatedStyleId && (
                      <button
                        id={`btn-notif-goto-${notif.id}`}
                        onClick={() => {
                          if (notif.relatedStyleId) onSelectStyle(notif.relatedStyleId);
                          setIsOpen(false);
                        }}
                        className="text-[9px] bg-slate-900 text-white font-semibold font-sans px-1.5 py-0.5 rounded uppercase hover:bg-slate-800 transition-all shrink-0"
                      >
                        Xem
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
