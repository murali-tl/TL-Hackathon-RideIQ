import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RideProvider } from './context/RideContext'
import { Layout } from './components/Layout'
import Bunks from './pages/Bunks'
import Dashboard from './pages/Dashboard'
import Documents from './pages/Documents'
import Fuel from './pages/Fuel'
import Garage from './pages/Garage'
import Reminders from './pages/Reminders'
import Service from './pages/Service'
import Split from './pages/Split'
import Tips from './pages/Tips'

export default function App() {
  return (
    <RideProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/fuel-log" element={<Fuel />} />
            <Route path="/service" element={<Service />} />
            <Route path="/split" element={<Split />} />
            <Route path="/tips" element={<Tips />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/bunks" element={<Bunks />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/bikes" element={<Garage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </RideProvider>
  )
}
