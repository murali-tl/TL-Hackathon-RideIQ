import { lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RideProvider } from './context/RideContext'
import { Layout } from './components/Layout'

const Bunks = lazy(() => import('./pages/Bunks'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Documents = lazy(() => import('./pages/Documents'))
const Fuel = lazy(() => import('./pages/Fuel'))
const Garage = lazy(() => import('./pages/Garage'))
const Reminders = lazy(() => import('./pages/Reminders'))
const Service = lazy(() => import('./pages/Service'))
const Split = lazy(() => import('./pages/Split'))

export default function App() {
  return (
    <RideProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/tips" element={<Navigate to="/dashboard" replace />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/fuel-log" element={<Fuel />} />
            <Route path="/service" element={<Service />} />
            <Route path="/split" element={<Split />} />
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
