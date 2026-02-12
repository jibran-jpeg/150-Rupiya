# 150 Rupiya 💰

A modern expense tracking web application inspired by the iconic "Hera Pheri" movie, built with React and Supabase. Track shared expenses with friends, split bills, and settle up - all with a touch of Bollywood humor!

![150 Rupiya Logo](public/logo.png)

## ✨ Features

### 🎯 Core Functionality
- **Group Expense Management** - Create or join expense groups with unique codes
- **Real-time Updates** - See expenses and settlements update in real-time
- **Smart Expense Splitting** - Add expenses and automatically split them among members
- **Settlement Tracking** - Track who owes whom and settle up debts
- **Personal Stats** - View your personal expense statistics and breakdown
- **Profile Management** - Set up and manage your profile with custom passwords

### 🎨 Design Highlights
- **Neomorphic UI** - Modern brutalist design with bold shadows and borders
- **Dark Mode** - Toggle between light and dark themes
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Hera Pheri Theme** - Dialogues and references from the classic movie
- **Smooth Animations** - Engaging micro-interactions and transitions

### 🔐 Authentication
- Supabase email authentication
- Magic link login
- Secure password management
- Protected routes and role-based access

### 📊 Analytics & Admin
- Admin panel for user management
- Expense history with detailed timestamps
- Group statistics and breakdowns
- Personal debt/credit tracking

## 🚀 Tech Stack

- **Frontend**: React 19 + Vite
- **Routing**: React Router DOM v7
- **Backend**: Supabase (PostgreSQL)
- **Styling**: TailwindCSS + Custom CSS
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Deployment**: Ready for Vercel/Netlify

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/jibran-jpeg/150-Rupiya.git
cd 150-Rupiya
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup Supabase**

Create a new Supabase project and run the SQL schema files:
- `supabase_schema.sql` - Main database schema
- `auth_schema.sql` - Authentication setup

4. **Configure environment variables**

Create a `.env` file based on `.env.example`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. **Run development server**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🏗️ Project Structure

```
150-Rupiya/
├── public/              # Static assets (logo, images)
├── src/
│   ├── components/      # Reusable components
│   │   ├── AddExpenseModal.jsx
│   │   ├── Navigation.jsx
│   │   └── SettleUpModal.jsx
│   ├── pages/          # Page components
│   │   ├── AdminPanel.jsx
│   │   ├── Dashboard.jsx
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── ProfilePage.jsx
│   │   └── StatsPage.jsx
│   ├── utils/          # Utility functions (quotes, helpers)
│   ├── App.jsx         # Main app component with routing
│   ├── supabaseClient.js  # Supabase configuration
│   └── index.css       # Global styles & design system
├── .env.example        # Environment variables template
└── package.json
```

## 🎮 Usage

### Creating a Group
1. Sign up or log in
2. Click "Naya Khata" (New Group)
3. Enter group name and create
4. Share the unique code with friends

### Joining a Group
1. Get the group code from a friend
2. Enter code in "Join Khata" section
3. Start tracking expenses together

### Adding Expenses
1. Open a group
2. Click the "+" button
3. Fill in expense details
4. Select who paid and who should split

### Settling Up
1. Navigate to a group
2. Click "Settle Up" button
3. Record payment settlements
4. Balances update automatically

## 🗄️ Database Schema

The app uses the following main tables:

- **profiles** - User profiles with names and metadata
- **groups** - Expense groups with unique codes
- **members** - Group membership tracking
- **expenses** - Individual expense records
- **settle_ups** - Settlement/payment records

See `supabase_schema.sql` for complete schema.

## 🎨 Design System

The app uses a custom neomorphic/brutalist design system with:
- Bold black borders (2-4px)
- Hard shadows (8px offset)
- Primary color: `#FFD700` (Gold)
- Custom fonts: Bangers (headings), System fonts (body)
- Smooth transitions and hover effects

## 🔧 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🌐 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables
4. Deploy!

### Netlify
1. Build the project: `npm run build`
2. Deploy the `dist` folder
3. Configure environment variables

## 📝 Environment Variables

Create a `.env` file with:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📄 License

This project is open source and available under the MIT License.

## 🎬 Credits

Inspired by the legendary Bollywood film "Hera Pheri" (2000)
- Dialogues and references used for entertainment purposes
- No copyright infringement intended

## 👨‍💻 Author

**Jibran**
- GitHub: [@jibran-jpeg](https://github.com/jibran-jpeg)

## 🙏 Acknowledgments

- Hera Pheri movie for the inspiration
- Supabase for the amazing backend platform
- React and Vite teams for excellent tools

---

**Made with ❤️ and Hera Pheri vibes** 🎭
