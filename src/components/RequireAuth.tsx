import { Navigate, Outlet } from 'react-router-dom'
import { useApp } from '../context'

export default function RequireAuth() {
  const { user } = useApp()
  return user ? <Outlet /> : <Navigate to="/signin" replace />
}
