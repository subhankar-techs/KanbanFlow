# KanbanFlow

A modern, high-performance Kanban board designed for real-time team collaboration, project tracking, and task management. Built with Next.js, Tailwind CSS, and Supabase.

---

## 🚀 Project Setup

### Prerequisites
- **Node.js**: Version 18 or higher.
- **Package Manager**: `npm` (or `yarn`/`pnpm`).

### 1. Clone & Install Dependencies
```bash
# Install package dependencies
npm install
```

### 2. Configure Environment Variables
Copy the `.env.local.example` file to `.env.local` in the root directory:
```bash
cp .env.local.example .env.local
```
Open `.env.local` and supply your Supabase project credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Database Setup (Supabase)
Run the SQL queries in [supabase/schema.sql](file:///e:/Projects/CrossxMedia/New%20folder%20(2)/KanbanFlow/supabase/schema.sql) in your Supabase SQL Editor to initialize the database tables, relations, and row-level security (RLS) policies.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm run start
```

---

## 🛠️ Technologies Used

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Core Library**: [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Database & Auth & Realtime**: [Supabase](https://supabase.com/) (realtime sync via Supabase channels, auth state management, `@supabase/ssr`)
- **Drag-and-Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities`
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) (for client-side stores)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), `@base-ui/react`, [Lucide React](https://lucide.dev/) (icons), and [Next Themes](https://github.com/pacocoursey/next-themes) (dark mode support)
- **Form / Schema Validation**: [Zod](https://zod.dev/)
- **Feedback & Utilities**: [Sonner](https://sonner.emilkowal.ski/) (notifications), `date-fns` (date formatting), `clsx`, `tailwind-merge`

---

## 🤖 AI Tools Used During Development

- **Antigravity**: Google DeepMind's agentic AI coding assistant powered by **Claude Opus 4.6(Thinking)** **Gemini 3.5 Flash (High)**. Used for codebase research, directory exploration, component implementation alignment, structuring documentation, and setup refinement.
- **GitHub Copilot**: Assisted with day-to-day code completion, suggestions, and inline edits.

---

## ⚠️ Assumptions & Limitations

- **Node.js Version**: Assumes Node.js >= 18.x. Newer dependencies (e.g., React 19, Next.js 16, Tailwind CSS v4) may require modern engine compatibility.
- **Supabase Dependency**: Core functionality like authentication, board creation, drag-and-drop sync, and comments require a fully active Supabase database configured with the schema provided in `supabase/schema.sql`.
- **In-Memory Rate Limiting**: The rate-limiting layer (`src/lib/rate-limit.ts`) runs local in-memory tracking, which is suitable for single-instance or development environments but may require a distributed store (e.g., Redis) when deployed to serverless platforms.
- **Realtime Collaboration**: Realtime updates rely on Supabase database replication being active for tables like `boards`, `columns`, `tasks`, and `activities`.

---

## 📁 File Structure

```
KanbanFlow/
├── public/              # Static public assets (icons, images)
├── supabase/            # Supabase configuration and SQL migrations
│   └── schema.sql       # Database schema definition SQL
└── src/
    ├── app/             # Next.js App Router entrypoints & page routing
    │   ├── auth/        # Auth callbacks and route handlers
    │   ├── board/       # Board-specific workspace routes
    │   ├── dashboard/   # User dashboard pages
    │   ├── globals.css  # Global CSS stylesheet & Tailwind configuration
    │   ├── layout.tsx   # Root layout provider wrapper
    │   └── page.tsx     # Landing page component
    ├── components/      # Reusable React UI components
    │   ├── board/       # Kanban board components (DragOverlay, BoardCard, BoardFilters, etc.)
    │   ├── column/      # Columns UI & CreateColumn Dialogs
    │   ├── layout/      # Layout shells, Header, Sidebar, and Theme Providers
    │   ├── task/        # TaskCard, Creation dialogs, and TaskDetail modals
    │   └── ui/          # Core base layout UI elements (Buttons, Input, Dialog, etc.)
    ├── constants/       # Global constants, routes, and layout configs
    ├── hooks/           # Custom React hooks (useAuth, useDragAndDrop, useRealtimeBoard, useRealtimeDashboard)
    ├── lib/             # Third-party clients (Supabase setup, form validations, rate limiters)
    ├── services/        # Service layer interacting with Supabase (boards, columns, tasks, activities, members)
    ├── store/           # Zustand state management (authStore, boardStore, uiStore)
    ├── types/           # TypeScript types (index.ts) and Database schema mappings (database.ts)
    └── utils/           # Common utilities and helper functions
```
