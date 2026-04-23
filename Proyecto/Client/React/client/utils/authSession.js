export const SESSION_EXPIRED_MESSAGE = "Tu sesión expiró. Volvé a iniciar sesión.";

export const clearStoredAuth = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
};

export const isUnauthorizedResponse = (response) => response?.status === 401;

export const buildAuthHeaders = (headers = {}) => {
  const token = localStorage.getItem("authToken");

  if (!token) {
    return { ...headers };
  }

  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
};
