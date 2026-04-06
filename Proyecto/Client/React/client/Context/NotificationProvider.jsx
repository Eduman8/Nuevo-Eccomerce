import { useCallback, useMemo, useState } from "react";
import { NotificationContext } from "./notificationContext";

function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const pushNotification = useCallback((type, message) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setNotifications((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      removeNotification(id);
    }, 3800);
  }, [removeNotification]);

  const value = useMemo(
    () => ({
      info: (message) => pushNotification("info", message),
      warning: (message) => pushNotification("warning", message),
      error: (message) => pushNotification("error", message),
      success: (message) => pushNotification("success", message),
    }),
    [pushNotification],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}

      <div className="notification-stack" aria-live="polite" aria-atomic="true">
        {notifications.map((notification) => (
          <div key={notification.id} className={`notification-toast ${notification.type}`}>
            <span>{notification.message}</span>
            <button onClick={() => removeNotification(notification.id)} aria-label="Cerrar notificación">
              ✕
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export default NotificationProvider;
