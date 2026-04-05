const normalizeEmails = (value) =>
  String(value || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const ADMIN_EMAILS = normalizeEmails(import.meta.env.VITE_ADMIN_EMAILS="eduman.000@gmail.com");

export const isAdminUser = (user) => {
  const email = user?.email?.trim?.().toLowerCase();
  return Boolean(email && ADMIN_EMAILS.includes(email));
};

