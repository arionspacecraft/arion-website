import { Route, Routes } from 'react-router-dom'
import LanguageProvider from './components/LanguageProvider'
import ThemePreview from './components/ThemePreview'
import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Teams from './pages/Teams'
import TeamDetail from './pages/TeamDetail'
import News from './pages/News'
import NewsDetail from './pages/NewsDetail'
import Recruit from './pages/Recruit'
import Contact from './pages/Contact'
import Qna from './pages/Qna'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <LanguageProvider>
    <ThemePreview />
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:slug" element={<ProjectDetail />} />
        <Route path="teams" element={<Teams />} />
        <Route path="teams/:slug" element={<TeamDetail />} />
        <Route path="news" element={<News />} />
        <Route path="news/:slug" element={<NewsDetail />} />
        <Route path="recruit" element={<Recruit />} />
        <Route path="contact" element={<Contact />} />
        <Route path="qna" element={<Qna />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </LanguageProvider>
  )
}
