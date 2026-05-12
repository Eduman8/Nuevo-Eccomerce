# #HARTA — Full Stack E-Commerce Platform

Modern full-stack e-commerce application focused on scalability, clean architecture, secure authentication, and real payment processing.

Built with React, Node.js, Express and PostgreSQL.

---

# 🚀 Features

## Storefront

- Product catalog
- Dynamic categories
- Product detail pages
- Related products
- Responsive design
- Dark / light UI support
- Search & filtering system
- Shopping cart
- Stock-aware checkout
- Mobile optimized experience

---

## Authentication & Security

- JWT authentication
- Google Sign-In integration
- Protected routes
- Role-based authorization
- Admin-only endpoints
- Secure backend validation
- Ownership validation for orders

---

## Checkout & Payments

- Mercado Pago integration
- Real payment processing
- Cash payment option
- Checkout validation
- Shipping methods
- Pickup & home delivery flows
- Order confirmation system
- Payment status synchronization
- Webhook handling

---

## Admin Panel

- Product management
- Category management
- Order management
- Manual order status updates
- Stock control
- Product activation/deactivation
- Real-time order monitoring

---

## Inventory & Order Logic

- Multi-step stock validation
- Automatic stock updates
- Prevents overselling
- Cart synchronization
- Transaction-safe order processing
- Business-rule based order transitions

---

# 🛠 Tech Stack

## Frontend

- React
- Redux
- JavaScript
- HTML5
- CSS3

## Backend

- Node.js
- Express.js
- PostgreSQL

## Authentication

- JWT
- Google OAuth

## Payments

- Mercado Pago SDK

## Development Tools

- Git
- GitHub
- VS Code
- Thunder Client
- npm

---

# 📦 Project Structure

```bash
Proyecto/
│
├── Client/
│   └── React/
│       └── client/
│
└── Server/
    ├── modules/
    ├── middlewares/
    ├── services/
    ├── utils/
    └── config/
```

---

# ⚙️ Environment Variables

## Backend (.env)

```env
PORT=3000

FRONTEND_BASE_URL=http://localhost:5173
BACKEND_BASE_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=harta_db

JWT_SECRET=your_secret

GOOGLE_CLIENT_ID=your_google_client_id

MP_ACCESS_TOKEN=your_mercado_pago_token

ADMIN_EMAILS=admin@email.com
```

---

# 🔧 Installation

## 1. Clone the repository

```bash
git clone https://github.com/Eduman8/Harta-web.git
```

---

## 2. Install dependencies

### Frontend

```bash
cd Proyecto/Client/React/client
npm install
```

### Backend

```bash
cd Proyecto/Client/Server
npm install
```

---

## 3. Configure PostgreSQL

Create a PostgreSQL database:

```sql
CREATE DATABASE harta_db;
```

---

## 4. Configure environment variables

Create a `.env` file in the backend folder and add the required variables.

---

## 5. Start the backend

```bash
npm run dev
```

---

## 6. Start the frontend

```bash
npm start
```

---

# 🔐 Authentication Flow

- Google OAuth authentication
- Backend token verification
- JWT generation
- Secure route protection
- Admin role validation
- Persistent user sessions

---

# 💳 Mercado Pago Integration

- Preference creation
- Payment verification
- Webhook synchronization
- Pending / approved / rejected flows
- External reference tracking
- Secure backend confirmation

---

# 📁 Main Modules

## Products

- Public catalog
- Product details
- Stock validation
- Multi-image support

## Categories

- Dynamic categories
- Admin management
- Active/inactive states

## Cart

- Persistent cart
- Quantity validation
- Stock synchronization

## Orders

- Customer orders
- Admin order management
- Status transitions
- Delivery handling

## Payments

- Mercado Pago checkout
- Webhook processing
- Payment confirmation

---

# 📌 Current Status

Project under active development.

Future improvements planned:

- Production deployment
- Final branding redesign
- Analytics dashboard
- Email notification improvements
- Performance optimization
- Enhanced accessibility
- Automated testing

---

# 👨‍💻 Author

Eduardo Gomez

- GitHub: https://github.com/Eduman8
- LinkedIn: https://www.linkedin.com/in/eduardo-dami%C3%A1n-g%C3%B3mez-89a432217/
- Email: eduman.000@gmail.com

---

# 📄 License

This project is for educational and portfolio purposes.
