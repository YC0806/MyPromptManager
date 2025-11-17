import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import Dashboard from './pages/Dashboard'
import PromptsList from './pages/PromptsList'
import PromptDetail from './pages/PromptDetail'
import PromptCreate from './pages/PromptCreate'
import TemplatesList from './pages/TemplatesList'
import TemplateDetail from './pages/TemplateDetail'
import TemplateCreate from './pages/TemplateCreate'
import ChatsList from './pages/ChatsList'
import ChatDetail from './pages/ChatDetail'
import ChatCreate from './pages/ChatCreate'
import Releases from './pages/Releases'
import Timeline from './pages/Timeline'
import RepoAdvanced from './pages/RepoAdvanced'
import IndexStatus from './pages/IndexStatus'
import useStore from './store/useStore'

function App() {
  const { sidebarCollapsed } = useStore()

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
        <Sidebar />
        <div
          className={`transition-all duration-200 ${
            sidebarCollapsed ? 'ml-0' : 'ml-[280px]'
          }`}
        >
          <Topbar />
          <main className="pt-16">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/prompts" element={<PromptsList />} />
              <Route path="/prompts/create" element={<PromptCreate />} />
              <Route path="/prompts/:id" element={<PromptDetail />} />
              <Route path="/templates" element={<TemplatesList />} />
              <Route path="/templates/create" element={<TemplateCreate />} />
              <Route path="/templates/:id" element={<TemplateDetail />} />
              <Route path="/chats" element={<ChatsList />} />
              <Route path="/chats/create" element={<ChatCreate />} />
              <Route path="/chats/:id" element={<ChatDetail />} />
              <Route path="/releases" element={<Releases />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/repo" element={<RepoAdvanced />} />
              <Route path="/admin/index" element={<IndexStatus />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App
