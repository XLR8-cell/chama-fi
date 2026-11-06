import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import Contributions from './features/Contributions'
import Dashboard from './features/Dashboard'
import ForgotPassword from './features/ForgotPassword'
import Loans from './features/Loans'
import Manage from './features/Manage'
import Members from './features/Members'
import Profile from './features/Profile'
import Reports from './features/Reports'
import SignIn from './features/SignIn'
import SignUp from './features/SignUp'

export default function App() {
  return (
    <Routes>
      <Route path="signin" element={<SignIn />} />
      <Route path="signup" element={<SignUp />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="contributions" element={<Contributions />} />
          <Route path="loans" element={<Loans />} />
          <Route path="manage" element={<Manage />} />
          <Route path="members" element={<Members />} />
          <Route path="profile" element={<Profile />} />
          <Route path="reports" element={<Reports />} />
          <Route path="*" element={<p className="p-5">Page not found.</p>} />
        </Route>
      </Route>
    </Routes>
  )
}
