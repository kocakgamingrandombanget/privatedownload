import { Routes, Route } from 'react-router-dom'
import HomeLayout from './layouts/HomeLayout'
import ClientLayout from './layouts/ClientLayout'
import Home from './pages/Home'
import ClientPortal from './pages/ClientPortal'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeLayout />}>
        <Route index element={<Home />} />
      </Route>
      <Route path="/client" element={<ClientLayout />}>
        <Route index element={<ClientPortal />} />
      </Route>
    </Routes>
  )
}

export default App
