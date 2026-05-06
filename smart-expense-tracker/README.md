# Smart Expense Tracker

A full-stack expense management web application built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

## Features

- **Authentication** — Secure JWT-based register/login
- **Dashboard** — Overview with income, expenses, balance, and savings stats
- **Transactions** — Add, edit, delete, filter, and paginate income/expense records
- **Budgets** — Set monthly category budgets with visual progress bars and alerts
- **Analytics** — Charts for yearly trends, category breakdowns, and daily spending
- **Settings** — Profile management, password change, and custom categories
- **Responsive** — Works on desktop, tablet, and mobile

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18, React Router 6, Chart.js  |
| Backend  | Node.js, Express.js                 |
| Database | MongoDB with Mongoose               |
| Auth     | JWT + bcryptjs                      |
| Styling  | Custom CSS with CSS variables       |

## Project Structure

```
smart-expense-tracker/
├── backend/
│   ├── models/          # Mongoose schemas (User, Transaction, Budget, Category)
│   ├── routes/          # Express routes (auth, transactions, budgets, categories, dashboard)
│   ├── middleware/       # JWT auth middleware
│   ├── server.js        # Entry point
│   └── package.json
└── frontend/
    ├── public/
    └── src/
        ├── components/  # Layout, UI components, TransactionModal
        ├── context/     # AuthContext
        ├── pages/       # Dashboard, Transactions, Budgets, Analytics, Settings, Login, Register
        └── utils/       # API client, formatters
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone and install

```bash
# Install backend dependencies
cd smart-expense-tracker/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/smart-expense-tracker
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=30d
NODE_ENV=development
```

### 3. Run the app

**Backend** (terminal 1):
```bash
cd backend
npm run dev
```

**Frontend** (terminal 2):
```bash
cd frontend
npm start
```

The app will be available at `http://localhost:3000`.

## API Endpoints

| Method | Endpoint                        | Description                  |
|--------|---------------------------------|------------------------------|
| POST   | /api/auth/register              | Register new user            |
| POST   | /api/auth/login                 | Login                        |
| GET    | /api/auth/me                    | Get current user             |
| PUT    | /api/auth/profile               | Update profile               |
| PUT    | /api/auth/password              | Change password              |
| GET    | /api/transactions               | List transactions (filtered) |
| POST   | /api/transactions               | Create transaction           |
| PUT    | /api/transactions/:id           | Update transaction           |
| DELETE | /api/transactions/:id           | Delete transaction           |
| GET    | /api/transactions/stats/summary | Transaction summary          |
| GET    | /api/budgets                    | Get budgets for month        |
| POST   | /api/budgets                    | Create/update budget         |
| DELETE | /api/budgets/:id                | Delete budget                |
| GET    | /api/categories                 | List categories              |
| POST   | /api/categories                 | Create category              |
| PUT    | /api/categories/:id             | Update category              |
| DELETE | /api/categories/:id             | Delete category              |
| GET    | /api/dashboard/overview         | Dashboard overview data      |
| GET    | /api/dashboard/analytics        | Detailed analytics           |
