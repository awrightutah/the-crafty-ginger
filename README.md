# The Crafty Ginger PWA

A Progressive Web Application for The Crafty Ginger - Handmade Resin Creations by Julie.

## Features

- 🛍️ **Product Catalog**: Browse and filter products by category
- 🛒 **Shopping Cart**: Add items, adjust quantities, and checkout
- 👤 **User Authentication**: Register, login, and manage account
- 💳 **Venmo Payment**: Simple payment via Venmo
- 📱 **PWA Support**: Install as an app on mobile devices
- 🔧 **Admin Dashboard**: Manage products and orders

## Tech Stack

- **Frontend**: React + Vite + PWA
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Hosting**: Railway

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Railway account (for deployment)

### Supabase Setup

1. Create a new Supabase project
2. Run the SQL schema from `supabase-schema.sql` in the SQL Editor
3. Copy your project URL and anon key

### Installation

```bash
# Clone the repository
git clone https://github.com/awrightutah/the-crafty-ginger.git
cd the-crafty-ginger

# Install all dependencies
npm run install:all

# Set up environment variables
cp client/.env.example client/.env
cp server/.env.example server/.env
```

### Environment Variables

**Client (.env)**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Server (.env)**
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=3001
```

### Running Locally

```bash
# Run both client and server
npm run dev

# Or run separately
npm run dev:client  # Frontend on port 5173
npm run dev:server  # Backend on port 3001
```

### Deployment to Railway

1. Connect your GitHub repository to Railway
2. Deploy the server from the `server` directory
3. Deploy the client from the `client` directory
4. Set environment variables in Railway dashboard

## Admin Access

To create an admin user:

1. Register a new account through the app
2. In Supabase SQL Editor, run:
```sql
INSERT INTO admin_users (user_id) 
VALUES ('your-user-id-from-auth-users');
```

## Product Categories

- Keychains & Tassels
- Resin Coasters
- Resin Globes
- Custom Orders
- Christmas Ornaments

## License

MIT License - The Crafty Ginger © 2024