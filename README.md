# VacationSplit ✈️

Split trip expenses with your group. No signups. No confusion.

## Features

- **Create Trips** — Start a new trip group with your friends
- **Join with Code** — Share a 6-character code to join
- **Track Expenses** — Add expenses with categories, payers, and custom splits
- **Smart Balances** — See who owes whom at a glance
- **Settlement Plan** — Minimum transactions to settle all debts
- **Trip Summary** — Category breakdown, expense list, shareable summary

## Tech Stack

- **Frontend:** Vanilla HTML5, CSS3, JavaScript (SPA with hash-based routing)
- **Backend:** Node.js + Express
- **Database:** MySQL

## Project Structure

```
backend/
├── database/
│   └── schema.sql          # Database schema
├── routes/
│   ├── trips.js            # Trip CRUD
│   ├── members.js          # Member management
│   ├── expenses.js         # Expense CRUD with splits
│   ├── balances.js         # Balance calculation & settlements
│   └── activity.js         # Activity log
├── public/
│   ├── index.html          # SPA shell
│   ├── style.css           # Complete design system
│   └── js/
│       ├── app.js          # Router & bootstrap
│       ├── api.js          # API service & session
│       ├── utils.js        # Shared utilities
│       └── pages/
│           ├── home.js     # Create/Join trip
│           ├── dashboard.js # Trip dashboard
│           ├── add-expense.js # Add/Edit expense
│           ├── balances.js # Settle up
│           └── summary.js  # Trip summary
├── server.js               # Express server
├── package.json
└── .env                    # Environment config
```

## Setup & Run

### 1. Database Setup

```bash
# Create the database and tables
mysql -u root -p < backend/database/schema.sql
```

### 2. Configure Environment

Edit `backend/.env`:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=vacation_split
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Start the Server

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

### 5. Open in Browser

Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Create a Trip** — Enter trip name, destination, dates, your name, and add members
2. **Share the Code** — Copy the 6-character trip code and share with friends
3. **Join a Trip** — Enter the trip code and select your name
4. **Add Expenses** — Track who paid, choose who splits, even or custom amounts
5. **View Balances** — See who owes whom and the smart settlement plan
6. **Share Summary** — Copy a WhatsApp-friendly expense summary
