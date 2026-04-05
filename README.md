# Nuevo-Eccomerce

## Acceso al panel admin

El panel `/admin` está protegido y solo permite usuarios aprobados por email.

Configurá las listas de emails autorizados:

- **Frontend (Vite):** variable `VITE_ADMIN_EMAILS` (emails separados por coma).
- **Backend (Express):** variable `ADMIN_EMAILS` (emails separados por coma).

Ejemplo:

```bash
VITE_ADMIN_EMAILS=admin@tuapp.com,owner@tuapp.com
ADMIN_EMAILS=admin@tuapp.com,owner@tuapp.com
```
