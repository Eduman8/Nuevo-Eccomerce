import { createContext, useCallback, useContext, useMemo, useState } from "react";
import "./notifications.css";

const NotificationContext = createContext(null);

const DEFAULT_DURATION = 3500;

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const dismiss = useCallback((id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(({ type = "info", title, message, duration = DEFAULT_DURATION }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    setNotifications((prev) => [...prev, { id, type, title, message }]);

    if (duration > 0) {
      window.setTimeout(() => {
        dismiss(id);
      }, duration);
    }

    return id;
  }, [dismiss]);

  const api = useMemo(() => ({
    notify,
    dismiss,
    success: (message, title = "Éxito") => notify({ type: "success", title, message }),
    error: (message, title = "Error") => notify({ type: "error", title, message }),
    info: (message, title = "Información") => notify({ type: "info", title, message }),
    warning: (message, title = "Atención") => notify({ type: "warning", title, message }),
  }), [dismiss, notify]);

  return (
    <NotificationContext.Provider value={api}>
      {children}

      <aside className="notification-center" aria-live="polite" aria-label="Notificaciones">
        {notifications.map((item) => (
          <article key={item.id} className={`notification notification-${item.type}`}>
            <div>
              <p className="notification-title">{item.title}</p>
              <p className="notification-message">{item.message}</p>
            </div>
            <button
              className="notification-close"
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Cerrar notificación"
            >
              ✕
            </button>
          </article>
        ))}
      </aside>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotification debe usarse dentro de NotificationProvider");
  }

  return context;
}
