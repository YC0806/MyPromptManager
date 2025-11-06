# MyPromptManager Frontend - Quick Start

## 🚀 One-Command Start

```bash
./start-frontend.sh
```

This script will:
1. ✅ Check if Node.js is installed
2. ✅ Install dependencies if needed
3. ✅ Check if backend is running
4. ✅ Start the development server

---

## 📋 Manual Setup

If you prefer to run commands manually:

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Start Backend (in another terminal)

```bash
# From project root
python manage.py runserver
```

### Step 3: Start Frontend

```bash
# From frontend directory
npm run dev
```

---

## 🌐 Access the Application

Once both servers are running:

- **Frontend**: http://localhost:3000
- **Backend API**: http://127.0.0.1:8000
- **Admin Panel**: http://127.0.0.1:8000/admin

---

## 🎨 What You'll See

### First Load
You'll land on the **Dashboard** with:
- Welcome message
- Stats cards (Total Prompts, Total Releases, Active Drafts)
- Recent activity timeline
- Quick action buttons

### Navigation
Use the left sidebar to explore:
- **Dashboard** - Overview and stats
- **Search** - Find prompts quickly
- **Prompts** - List and manage all prompts
- **Timeline** - View release history
- **Releases** - Swimlane visualization

### Mode Switching
Toggle between **Simple** and **Advanced** modes in the top navigation bar:
- **Simple Mode**: Streamlined interface for basic operations
- **Advanced Mode**: Full Git operations (branches, tags, cherry-pick)

---

## ✨ Key Features to Try

### 1. View Prompts
- Navigate to **Prompts** from the sidebar
- Toggle between **Table View** and **Card View**
- Filter by type, label, or author

### 2. Create/Edit Prompt
- Click **New Prompt** button
- Fill in title, description, and labels
- Edit content in the Markdown editor
- Click **Save** to save as draft

### 3. Publish a Version
- Open a prompt
- Click **Publish** button
- Select channel (prod/beta)
- Choose version type (auto/major/minor/patch)
- Add release notes
- Confirm to publish

### 4. View Timeline
- Navigate to **Timeline** from sidebar
- See all releases and drafts in chronological order
- Toggle "Releases Only" to filter

### 5. Advanced Features (Advanced Mode)
- Switch to **Advanced Mode** in top bar
- Navigate to **Repo** from sidebar
- View branches, tags, and perform cherry-picks

---

## 🎯 Sample Workflow

### Publishing a Prompt

1. **Create Draft**:
   ```
   Dashboard → Prompts → New Prompt
   Enter content → Save
   ```

2. **Edit and Refine**:
   ```
   Edit content → Save (auto-saved)
   Add labels → Update metadata
   ```

3. **Publish to Beta**:
   ```
   Click Publish → Select "beta"
   Choose version (auto suggests patch)
   Add release notes → Confirm
   ```

4. **Promote to Production**:
   ```
   After testing → Publish again
   Select "prod" channel
   Use same or new version
   ```

5. **View Release History**:
   ```
   Timeline or Releases page
   See all versions with notes
   ```

---

## 🐛 Troubleshooting

### "Cannot connect to backend"

**Solution**: Make sure Django backend is running
```bash
python manage.py runserver
```

### "Port 3000 already in use"

**Solution**: Kill the existing process or use a different port
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Or use different port
vite --port 3001
```

### "Module not found" errors

**Solution**: Reinstall dependencies
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Styling issues

**Solution**: Rebuild Tailwind
```bash
npm run build
```

---

## 📱 Mobile Testing

To test on mobile devices:

1. Find your local IP:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Update `vite.config.js`:
   ```js
   server: {
     host: '0.0.0.0',
     port: 3000,
   }
   ```

3. Access from mobile:
   ```
   http://YOUR_IP:3000
   ```

---

## 🎨 UI Demo Features

### Color Scheme
- Background: Teal → Emerald → Cyan gradient
- Primary actions: Teal-500
- Text: Zinc hierarchy (900/700/500)
- Cards: White with subtle shadow

### Interactive Effects
- **Hover**: Light gray background (zinc-50)
- **Focus**: Teal ring (ring-2 ring-teal-500)
- **Transitions**: Smooth 200ms duration
- **Buttons**: Slight scale on hover

### Responsive Breakpoints
- **Mobile** (< 768px): Sidebar collapses, single column
- **Tablet** (768-1024px): Sidebar visible, two columns
- **Desktop** (> 1024px): Full layout, three/four columns

---

## 📚 Next Steps

### Explore the UI
1. Try switching between Simple and Advanced modes
2. Explore all pages from the sidebar
3. Test table vs. card views
4. Try filtering and searching
5. Open modals (Publish, Rollback)

### Development
1. Read [FRONTEND_SETUP.md](FRONTEND_SETUP.md) for detailed docs
2. Check [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md) for full feature list
3. Modify components in `src/components/`
4. Add new pages in `src/pages/`
5. Update API calls in `src/lib/api.js`

### Integration with Backend
Once you have real data:
1. Update API endpoints in `src/lib/api.js`
2. Replace mock data in pages
3. Test with actual prompts and releases
4. Verify authentication flow

---

## 🎉 You're Ready!

The frontend is fully functional and ready to use. Explore all the features and enjoy the smooth, modern UI!

**Happy coding!** ✨

---

**Need Help?**
- Check documentation in `FRONTEND_SETUP.md`
- Review implementation details in `IMPLEMENTATION_COMPLETE.md`
- Explore component files in `src/components/`
- Read inline comments in source code

**Report Issues**:
- Create an issue in the repository
- Include error messages and screenshots
- Describe steps to reproduce
