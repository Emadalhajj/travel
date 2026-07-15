import React, { useState } from "react";
import { Bell } from "lucide-react";

export default function NotificationsDropdown({ notifications = [] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}>
        <Bell className="w-6 h-6 text-blue-600" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white border rounded-lg shadow-lg z-50">
          {notifications.length === 0 ? (
            <p className="p-3 text-gray-500 text-center">لا إشعارات</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className="p-3 border-b hover:bg-gray-100 text-sm cursor-pointer"
                >
                  🟢 {n.userName} بدأ محادثة جديدة
                  <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
