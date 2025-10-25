// frontend/src/components/layout/Header.tsx
import React, { useEffect, useState, useRef } from 'react';
import { Bell, Search, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService';
import type { Notification } from '../../types';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getAll();
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleOpen = () => {
    setOpen(v => !v);
  };

  const handleClickNotification = async (n: Notification) => {
    if (!n.isRead) {
      try {
        await notificationService.markRead(n.id);
        setNotifications(prev => prev.map(i => (i.id === n.id ? { ...i, isRead: true } : i)));
      } catch (err) {
        console.error('Failed mark read', err);
      }
    }
    // optional: open related page — none for generic uploads
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex-1 max-w-2xl relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative" ref={ref}>
            <button onClick={handleOpen} className="relative p-2 text-gray-400 hover:text-gray-600">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-xs bg-danger-500 text-white rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="font-medium">Notifications</div>
                  <button
                    className="text-sm text-primary-600"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await notificationService.markAllRead();
                      setNotifications(prev => prev.map(p => ({ ...p, isRead: true })));
                    }}
                  >
                    Mark all read
                  </button>
                </div>

                <div className="max-h-80 overflow-auto">
                  {loading ? (
                    <div className="p-4 text-center">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleClickNotification(n)}
                        className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${n.isRead ? '' : 'bg-gray-50'}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">{n.title}</div>
                            <div className="text-xs text-gray-600 mt-1 line-clamp-2">{n.content}</div>
                          </div>
                          <div className="text-xs text-gray-400 ml-3">{new Date(n.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 text-center border-t border-gray-100">
                  <button className="text-sm text-gray-600 hover:underline" onClick={() => { setOpen(false); }}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-primary-600" />
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-900">{user?.nama}</div>
              <div className="text-gray-500 capitalize">{user?.role.toLowerCase()}</div>
            </div>

            <button
              onClick={logout}
              aria-label="Logout"
              title="Logout"
              className="ml-2 inline-flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-300 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};