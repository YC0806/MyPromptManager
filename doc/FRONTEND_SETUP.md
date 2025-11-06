# Frontend Setup Guide

This document provides detailed instructions for setting up and running the MyPromptManager frontend.

## 📋 Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

## 🚀 Quick Start

### 1. Install Dependencies

Navigate to the frontend directory and install all required packages:

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000)

The development server includes:
- Hot Module Replacement (HMR)
- Proxy to backend API at `http://127.0.0.1:8000`
- Fast refresh for React components

### 3. Build for Production

```bash
npm run build
```

The optimized production build will be generated in the `dist` folder.

### 4. Preview Production Build

```bash
npm run preview
```

## 🎨 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/           # Layout components (Sidebar, Topbar, Breadcrumb)
│   │   ├── modals/           # Modal dialogs (Publish, Rollback)
│   │   └── ui/               # shadcn/ui components
│   ├── pages/                # Page components
│   │   ├── Dashboard.jsx
│   │   ├── PromptsList.jsx
│   │   ├── PromptDetail.jsx
│   │   ├── Timeline.jsx
│   │   ├── Releases.jsx
│   │   ├── RepoAdvanced.jsx
│   │   └── IndexStatus.jsx
│   ├── lib/
│   │   ├── api.js            # API client with axios
│   │   └── utils.js          # Utility functions
│   ├── store/
│   │   └── useStore.js       # Zustand state management
│   ├── App.jsx               # Main application component
│   ├── main.jsx              # Application entry point
│   └── index.css             # Global styles
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## 🎯 Key Features

### Visual Design

- **Color Scheme**: Teal/Emerald gradient background with clean white components
- **UI Components**: Built with shadcn/ui and Radix UI primitives
- **Icons**: Lucide React icon library
- **Typography**: Zinc color palette for text hierarchy
- **Transitions**: Smooth 200ms transitions for all interactions

### Dual Mode System

The application supports two modes:

1. **Simple Mode**:
   - Streamlined interface for non-technical users
   - Hidden advanced Git features
   - Simplified publishing workflow

2. **Advanced Mode**:
   - Full Git operations visibility
   - Branch/tag management
   - Cherry-pick and revert capabilities
   - Detailed version history

### State Management

Uses Zustand for lightweight state management:

- Current mode (Simple/Advanced)
- Current project and branch
- View preferences (table/cards)
- Filters and search queries
- UI state (sidebar, inspector)

### API Integration

All API calls are centralized in `src/lib/api.js`:

- **Simple API**: `/v1/simple/*` - User-friendly operations
- **Detail API**: `/v1/detail/*` - Advanced Git operations
- **Common API**: `/v1/*` - Shared endpoints

Features:
- Automatic token injection
- Branch header management
- Error handling with redirects
- Response interceptors

## 🛠 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Environment Variables

Create a `.env` file in the frontend directory if you need to customize:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### Adding New Pages

1. Create component in `src/pages/`
2. Add route in `src/App.jsx`
3. Add navigation item in `src/components/layout/Sidebar.jsx`

### Adding New UI Components

The project uses shadcn/ui components. All base components are in `src/components/ui/`.

To customize a component:
1. Locate the component file (e.g., `button.jsx`)
2. Modify the `buttonVariants` or styles
3. Use the `cn()` utility for conditional classes

## 📱 Responsive Design

The application is fully responsive:

- **Mobile (< 768px)**:
  - Collapsible sidebar with hamburger menu
  - Single-column card layout
  - Simplified search bar

- **Tablet (768px - 1024px)**:
  - Sidebar visible
  - Two-column card grid

- **Desktop (> 1024px)**:
  - Full layout with sidebar
  - Three/four-column card grid
  - All features visible

## 🎨 Styling Guide

### Color Palette

```css
/* Background Gradient */
bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50

/* Primary Actions */
bg-teal-500 hover:bg-teal-600

/* Text Hierarchy */
text-zinc-900  /* Headers */
text-zinc-700  /* Body */
text-zinc-500  /* Secondary */

/* Component Backgrounds */
bg-white shadow-sm

/* Borders */
border-zinc-300
```

### Interactive States

All interactive elements should include:

```jsx
className="transition-colors duration-200 hover:bg-zinc-50 focus:ring-2 focus:ring-teal-500"
```

## 🐛 Troubleshooting

### Port Already in Use

If port 3000 is occupied:

```bash
# Specify a different port
vite --port 3001
```

### API Connection Issues

1. Ensure backend is running on `http://127.0.0.1:8000`
2. Check proxy configuration in `vite.config.js`
3. Verify CORS settings on backend

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Styling Issues

```bash
# Rebuild Tailwind
npm run build
```

## 📚 Technology Stack

- **Framework**: React 18
- **Build Tool**: Vite 5
- **Routing**: React Router v6
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Date Handling**: date-fns

## 🔧 Configuration Files

### vite.config.js

Configures:
- React plugin
- Path aliases (`@/` → `./src/`)
- Development server (port 3000)
- API proxy

### tailwind.config.js

Defines:
- Custom color palette
- Component variants
- Animations
- Container settings

### postcss.config.js

Processes:
- Tailwind CSS
- Autoprefixer for browser compatibility

## 🚢 Deployment

### Build Production Bundle

```bash
npm run build
```

### Serve with Static Server

```bash
npm install -g serve
serve -s dist
```

### Deploy to Vercel/Netlify

The `dist` folder can be deployed directly to:
- Vercel: `vercel --prod`
- Netlify: `netlify deploy --prod --dir=dist`

### Environment Variables for Production

Set these in your hosting platform:

```
VITE_API_BASE_URL=https://your-api-domain.com
```

## 📖 Additional Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Zustand](https://github.com/pmndrs/zustand)

## 🤝 Contributing

When adding new features:

1. Follow the existing component structure
2. Use Tailwind classes consistently
3. Maintain color scheme (teal/emerald/zinc)
4. Add proper TypeScript annotations (if migrating)
5. Test in both Simple and Advanced modes
6. Ensure responsive design works

## 📝 License

MIT License - see LICENSE file for details
