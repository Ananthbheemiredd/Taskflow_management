# TaskFlow Frontend

A task management system frontend built with React, TypeScript, Vite, and Tailwind CSS.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Lucide React** - Icon library
- **date-fns** - Date formatting
- **clsx & tailwind-merge** - Conditional class utilities

## Architecture Decisions

### Component Library Choice
Built custom UI components (Button, Input, Card, Modal, Badge, etc.) using Tailwind CSS instead of using a component library like shadcn/ui. This provides:
- Full control over component behavior and styling
- Smaller bundle size
- No additional dependencies beyond Tailwind
- Easier customization for the specific needs of TaskFlow

### State Management
Used React Context for authentication state. This is sufficient for the app's needs:
- Simple, built-in solution without additional dependencies
- Auth state is needed globally across the app
- Local component state for page-specific data (projects, tasks)

### API Client
Created a centralized API client module that:
- Handles JWT token injection via Authorization header
- Provides typed API methods for all endpoints
- Throws structured errors for consistent error handling
- Uses the native fetch API (no additional HTTP library needed)

### Optimistic UI
Implemented optimistic updates for task status changes:
- UI updates immediately when status is changed
- Reverts on error
- Provides better perceived performance

### Tradeoffs
- **No global state library**: Context API is sufficient for this scale. Redux/Zustand would be overkill.
- **No form library**: Native form handling with React state is simple enough for this use case.
- **No data fetching library**: Native fetch with async/await is straightforward and doesn't require additional dependencies.
- **Custom components vs component library**: Chose custom components for full control and smaller bundle size.

## Running Locally

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
cd taskflow
npm install
```

### Environment Setup

```bash
cp .env.example .env
```

Edit `.env` to configure your API URL:
```
VITE_API_BASE_URL=http://localhost:4000
```

### Development with Mock API (Frontend-Only)

For frontend-only development, use the included json-server mock API:

**Terminal 1 - Start Mock API:**
```bash
npm run mock-api
```

The mock API will be available at `http://localhost:4000`

**Terminal 2 - Start Frontend:**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

**Mock Login Credentials:**
- Email: `test@example.com`
- Password: `password123`

Or register a new account through the app.

### Development with Real Backend

If you have a real backend API running:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Features

### Authentication
- User registration with validation
- Login with JWT token storage
- Protected routes that redirect unauthenticated users
- Persistent auth state across page refreshes (localStorage)

### Projects
- List all accessible projects
- Create new projects with name and optional description
- View project details with tasks
- Empty state handling

### Tasks
- Create tasks with title, description, priority, status, and due date
- Edit existing tasks via modal
- Delete tasks with confirmation
- Filter tasks by status
- Optimistic status updates with revert on error
- Visual status and priority badges

### UI/UX
- Responsive design (works at 375px mobile and 1280px desktop)
- Loading states on all async operations
- Error states with user-friendly messages
- Empty states with helpful CTAs
- Modal for task creation/editing
- Navbar with user info and logout

## API Reference

The frontend expects a REST API following this specification:

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and receive JWT token

### Projects
- `GET /projects` - List user's projects
- `POST /projects` - Create new project
- `GET /projects/:id` - Get project details with tasks
- `PATCH /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Tasks
- `GET /projects/:id/tasks?status=&assignee=` - List tasks with filters
- `POST /projects/:id/tasks` - Create task
- `PATCH /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

All protected endpoints require: `Authorization: Bearer <token>`

Error responses:
- 400: `{ "error": "validation failed", "fields": { "email": "is required" } }`
- 401: `{ "error": "unauthorized" }`
- 403: `{ "error": "forbidden" }`
- 404: `{ "error": "not found" }`

## What I'd Do With More Time

### Immediate Improvements
1. **Add unit tests** - Test critical components and API client functions
2. **Add E2E tests** - Use Playwright to test key user flows
3. **Add loading skeletons** - Replace "Loading..." text with skeleton UI
4. **Add toast notifications** - Better feedback for successful operations
5. **Add form validation library** - Use react-hook-form for better validation UX

### Feature Enhancements
1. **Dark mode toggle** - Persist user preference in localStorage
2. **Drag and drop** - Reorder tasks or change status via drag
3. **Real-time updates** - WebSocket or SSE for live task updates
4. **Task search** - Filter tasks by title/description
5. **Project editing** - Allow updating project name and description
6. **User avatars** - Display user avatars for assignees
7. **Due date warnings** - Visual indicators for overdue tasks

### Technical Improvements
1. **React Query** - For data fetching, caching, and optimistic updates
2. **Zustand** - For global state if the app grows
3. **shadcn/ui** - Consider for more complex components (dialogs, dropdowns)
4. **Bundle analysis** - Optimize bundle size
5. **Service Worker** - Add PWA capabilities for offline support
6. **Error boundary** - Better error handling for component errors

### Accessibility
1. **ARIA labels** - Improve screen reader support
2. **Keyboard navigation** - Ensure full keyboard accessibility
3. **Focus management** - Proper focus handling in modals
4. **Color contrast** - Verify WCAG compliance
5. **Reduced motion** - Respect prefers-reduced-motion

## Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   ├── Textarea.tsx
│   │   └── Select.tsx
│   ├── Navbar.tsx      # App navigation
│   ├── TaskModal.tsx    # Task create/edit modal
│   └── ProtectedRoute.tsx
├── context/
│   └── AuthContext.tsx  # Authentication state
├── lib/
│   ├── api.ts          # API client
│   └── utils.ts        # Utility functions
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Projects.tsx
│   ├── ProjectDetail.tsx
│   └── CreateProject.tsx
├── types/
│   └── index.ts        # TypeScript types
├── App.tsx             # Main app with routes
├── main.tsx            # Entry point
└── index.css           # Global styles with Tailwind
```
