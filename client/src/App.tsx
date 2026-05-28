import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import Home from './pages/Home'
import Search from './pages/Search'
import Library from './pages/Library'
import Playlist from './pages/Playlist'
import Album from './pages/Album'
import Artist from './pages/Artist'
import Podcast from './pages/Podcast'
import Episode from './pages/Episode'
import Genre from './pages/Genre'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Welcome from './pages/Welcome'
import Login from './pages/Login'

export default function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/search/:query" element={<Search />} />
        <Route path="/library" element={<Library />} />
        <Route path="/playlist/:id" element={<Playlist />} />
        <Route path="/album/:id" element={<Album />} />
        <Route path="/artist/:id" element={<Artist />} />
        <Route path="/podcast/:id" element={<Podcast />} />
        <Route path="/episode/:id" element={<Episode />} />
        <Route path="/genre/:slug" element={<Genre />} />
        <Route path="/user/:id" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
