# MyPromptManager Frontend

A modern, beautiful React application for managing prompt templates with version control.

## ✨ Features

### 🎨 Beautiful Design
- **Gradient Background**: Teal → Emerald → Cyan
- **Clean UI**: White cards with subtle shadows
- **Smooth Animations**: 200ms transitions throughout
- **Responsive**: Mobile, tablet, and desktop optimized

### 🔄 Dual Mode System
- **Simple Mode**: Streamlined for non-technical users
- **Advanced Mode**: Full Git operations for power users
- Seamless switching with UI adaptation

### 📝 Prompt Management
- **Create & Edit**: Markdown editor with Front Matter support
- **Version Control**: Track changes with Git-based versioning
- **Draft System**: Auto-save drafts before publishing
- **Labels & Tags**: Organize prompts with colorful labels

### 🚀 Publishing System
- **Multi-Channel**: Publish to prod or beta
- **Semantic Versioning**: Automatic version suggestions
- **Release Notes**: Document each release
- **Rollback**: Revert to previous versions safely

### 📊 Visualization
- **Timeline**: Chronological view of all releases
- **Swimlane Releases**: Visual representation by project/channel
- **Dashboard**: At-a-glance stats and recent activity

### ⚙️ Advanced Features (Advanced Mode Only)
- **Branch Management**: Create, switch, and delete branches
- **Tag Viewing**: Browse releases by namespace
- **Cherry-pick**: Apply specific commits to branches
- **Commit History**: Full Git history access

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- Django backend running on `http://127.0.0.1:8000`

### One-Command Start
```bash
./start-frontend.sh
```

### Manual Start
```bash
cd frontend
npm install
npm run dev
```

Visit: **http://localhost:3000**

## 📐 Architecture

### Tech Stack
- **Framework**: React 18 with Vite 5
- **Routing**: React Router v6
- **State**: Zustand (lightweight state management)
- **Styling**: Tailwind CSS 3.3
- **UI Components**: shadcn/ui + Radix UI
- **Icons**: Lucide React
- **HTTP**: Axios with interceptors
- **Date**: date-fns

### Project Structure
```
frontend/src/
├── components/
│   ├── layout/        # Sidebar, Topbar, Breadcrumb
│   ├── modals/        # Publish, Rollback dialogs
│   └── ui/            # 14 shadcn/ui components
├── pages/             # 7 main page components
├── lib/
│   ├── api.js         # API client (Simple/Detail/Common)
│   └── utils.js       # Utility functions
├── store/
│   └── useStore.js    # Zustand store
├── App.jsx            # Main app with routing
├── main.jsx           # Entry point
└── index.css          # Global styles + Tailwind
```

## 🎯 Key Pages

### 1. Dashboard
- Welcome screen with stats
- Total prompts, releases, active drafts
- Recent activity feed
- Quick action buttons

### 2. Prompts List
- **Table View**: Sortable columns with actions
- **Card View**: Beautiful grid layout
- **Filters**: Type, label, author, date
- **Inspector**: Slide-in panel for metadata

### 3. Prompt Detail
- **Simple Mode**: Split editor + metadata (7/12 + 5/12)
- **Advanced Mode**: Tabbed interface (Edit/Timeline/Diff/Releases)
- Markdown editor with auto-save
- Version suggestions

### 4. Timeline
- Global chronological view
- Release and draft events
- Filter by releases only
- Event cards with actions

### 5. Releases
- Swimlane visualization
- Grouped by project
- Production and beta lanes
- Horizontal scrolling

### 6. Repo (Advanced)
- **Branches Tab**: Manage Git branches
- **Tags Tab**: View releases by namespace
- **Cherry-pick Tab**: Apply commits selectively

### 7. Index Status (Admin)
- Index information and health
- Repair and rebuild operations
- Lock status monitoring

## 🎨 Design System

### Colors
```css
/* Background */
bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50

/* Primary */
teal-500, emerald-500

/* Text */
text-zinc-900  /* Headers */
text-zinc-700  /* Body */
text-zinc-500  /* Secondary */

/* Components */
bg-white shadow-sm

/* Borders */
border-zinc-300
```

### Typography
- **Headings**: font-bold text-zinc-900
- **Body**: text-zinc-700
- **Labels**: text-sm text-zinc-600
- **Code**: font-mono

### Interactive States
- **Hover**: bg-zinc-50, hover:scale-105 (buttons)
- **Focus**: ring-2 ring-teal-500
- **Transitions**: transition-colors duration-200

## 🔌 API Integration

### Endpoints
```javascript
// Simple API (/v1/simple/)
simpleApi.getTimeline(id, params)
simpleApi.getContent(id, params)
simpleApi.saveDraft(id, data)
simpleApi.publish(id, data)
simpleApi.compare(id, params)
simpleApi.rollback(id, data)

// Detail API (/v1/detail/)
detailApi.getHistory(id, params)
detailApi.getDiff(id, params)
detailApi.getRaw(id, params)
detailApi.updateRaw(id, data, etag)
detailApi.getReleases(id)
detailApi.createRelease(id, data)
detailApi.getBranches()
detailApi.checkout(data)

// Common API (/v1/)
commonApi.search(params)
commonApi.getIndexStatus()
commonApi.repairIndex()
commonApi.rebuildIndex()
```

### Features
- Automatic token injection
- Branch header management (`X-Git-Branch`)
- ETag support for optimistic locking
- Error handling with 401 redirects

## 📱 Responsive Breakpoints

- **Mobile** (< 768px):
  - Hamburger menu for sidebar
  - Single column layout
  - Stacked cards

- **Tablet** (768px - 1024px):
  - Visible sidebar
  - Two-column grid

- **Desktop** (> 1024px):
  - Full sidebar (280px)
  - Three/four-column grid
  - All features visible

## 🛠 Development

### Commands
```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Lint with ESLint
```

### Environment Variables
Create `.env` in frontend directory:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### Adding Components
1. Create in appropriate directory:
   - `src/pages/` for pages
   - `src/components/layout/` for layout
   - `src/components/ui/` for UI primitives

2. Follow naming conventions:
   - PascalCase for components
   - camelCase for utilities
   - kebab-case for files (optional)

3. Use Tailwind classes consistently
4. Include hover/focus states
5. Add proper TypeScript types (if migrating)

## 🐛 Troubleshooting

### Common Issues

**Backend not responding**:
```bash
# Check if backend is running
curl http://127.0.0.1:8000/v1/health

# Start backend
python manage.py runserver
```

**Port 3000 in use**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
vite --port 3001
```

**Dependencies issues**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**Styling broken**:
```bash
# Rebuild Tailwind
npm run build
```

## 📚 Documentation

- **[QUICK_START_FRONTEND.md](QUICK_START_FRONTEND.md)** - Get started quickly
- **[FRONTEND_SETUP.md](FRONTEND_SETUP.md)** - Detailed setup guide
- **[IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)** - Full feature list
- **[CLAUDE.md](CLAUDE.md)** - Backend API specification

## 🎯 Testing Checklist

Before deploying:

- [ ] All pages load without errors
- [ ] Mode switching works (Simple ↔ Advanced)
- [ ] Filters work on Prompts list
- [ ] Table/Card view toggle works
- [ ] Publish modal opens and submits
- [ ] Rollback modal opens and submits
- [ ] Timeline shows events
- [ ] Releases swimlane renders
- [ ] Repo page (Advanced) works
- [ ] Index status loads
- [ ] Responsive design works (mobile/tablet)
- [ ] All hover/focus states work
- [ ] Search bar functional
- [ ] Sidebar collapse works
- [ ] Breadcrumb shows correct path

## 🚢 Deployment

### Build
```bash
npm run build
```

Output: `dist/` folder

### Deploy to Vercel
```bash
vercel --prod
```

### Deploy to Netlify
```bash
netlify deploy --prod --dir=dist
```

### Environment Variables (Production)
Set in hosting platform:
```
VITE_API_BASE_URL=https://your-api-domain.com
```

## 📄 License

MIT License

## 👥 Contributing

1. Follow the existing code style
2. Use Tailwind classes consistently
3. Maintain the teal/emerald/zinc color scheme
4. Add comments for complex logic
5. Test in both Simple and Advanced modes
6. Ensure responsive design works

## 🎉 Credits

Built with:
- React & Vite
- Tailwind CSS
- shadcn/ui
- Radix UI
- Lucide React
- Zustand

---

**Version**: 1.0.0
**Status**: Production Ready ✨
**Last Updated**: November 5, 2025

For questions or issues, please refer to the documentation files or create an issue in the repository.
