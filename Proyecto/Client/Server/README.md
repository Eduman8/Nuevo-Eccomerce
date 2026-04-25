# Server - Configuración de pagos con Mercado Pago

## 1) Configurar variables de entorno

1. Copiá el archivo de ejemplo:

```bash
cp .env.example .env
```

2. Completá tu `MP_ACCESS_TOKEN` (o `MERCADOPAGO_ACCESS_TOKEN`) en `.env`.
   Ejemplo:

```env
MP_ACCESS_TOKEN=APP_USR-tu-token-acá
RESEND_API_KEY=re_tu_api_key
EMAIL_FROM=onboarding@resend.dev
EMAIL_ADMIN_TO=ventas@tu-tienda.com,owner@tu-tienda.com
```

> El token de prueba suele empezar con `TEST-` y el de producción con `APP_USR-`.
> Para emails transaccionales se usa Resend y `EMAIL_FROM` debe estar verificado en tu cuenta.

## 2) ¿Dónde obtener el access token?

En Mercado Pago Developers:

- **Credenciales de prueba**: para sandbox.
- **Credenciales de producción**: para cobros reales.

Copiá el **Access Token** y pegalo en el backend (`.env` del server).

## 3) Levantar el backend

```bash
npm install
npm run dev
```

## 4) Verificar que el token quedó activo

Con el server prendido, abrí:

- `GET http://localhost:3000/payments/mercadopago/status`

Respuesta esperada:

- `configured: true`
- `tokenFormatValid: true`

## 5) Flujo de checkout implementado

1. El frontend crea una orden pendiente (`POST /orders`).
2. El backend crea la preferencia de Checkout Pro (`POST /orders/:orderId/checkout-pro-preference`).
3. Mercado Pago redirige al frontend con `payment_id`.
4. El frontend confirma la compra (`POST /orders/:orderId/confirm-mercadopago`).
5. El backend valida el pago y marca la orden como `paid`.

## Errores comunes

- **"Mercado Pago no configurado..."**: falta token en `.env`.
- **"formato inválido"**: el token no empieza con `TEST-` o `APP_USR-`.
- **Webhook/redirección incorrecta**: revisá `FRONTEND_BASE_URL` y `BACKEND_BASE_URL`.
