import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Templates } from './pages/Templates';
import { Tasks } from './pages/Tasks';
import { MyRequests } from './pages/MyRequests';
import { MyDocuments } from './pages/MyDocuments';
import { MyTasks } from './pages/MyTasks';
import { Requests } from './pages/Requests';
import { Documents } from './pages/Documents';
import { Approvals } from './pages/Approvals';
import { Clients } from './pages/Clients';
import { Notifications } from './pages/Notifications';
import { Reminders } from './pages/Reminders';
import { VoiceCalls } from './pages/VoiceCalls';
import { Integrations } from './pages/Integrations';
import { Webhooks } from './pages/Webhooks';
import { AIVerification } from './pages/AIVerification';
import { UploadSessions } from './pages/UploadSessions';
import { ShareableLinks } from './pages/ShareableLinks';
import { UsersPage } from './pages/Users';
import { AuditTrail } from './pages/AuditTrail';
import { DocumentMatches } from './pages/DocumentMatches';
import { Organizations } from './pages/Organizations';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/templates"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'team_member']}>
                <DashboardLayout>
                  <Templates />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/tasks"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'team_member']}>
                <DashboardLayout>
                  <Tasks />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-requests"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <MyRequests />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-documents"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <MyDocuments />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-tasks"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <MyTasks />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/requests"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'team_member']}>
                <DashboardLayout>
                  <Requests />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/documents"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'team_member']}>
                <DashboardLayout>
                  <Documents />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/approvals"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'team_member']}>
                <DashboardLayout>
                  <Approvals />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/clients"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'team_member']}>
                <DashboardLayout>
                  <Clients />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reminders"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'team_member']}>
                <DashboardLayout>
                  <Reminders />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/voice-calls"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'team_member']}>
                <DashboardLayout>
                  <VoiceCalls />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Notifications />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/integrations"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <DashboardLayout>
                  <Integrations />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/webhooks"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <DashboardLayout>
                  <Webhooks />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/ai-verification"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <DashboardLayout>
                  <AIVerification />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/upload-sessions"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <DashboardLayout>
                  <UploadSessions />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/shareable-links"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <DashboardLayout>
                  <ShareableLinks />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <DashboardLayout>
                  <UsersPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/audit-trail"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <DashboardLayout>
                  <AuditTrail />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/document-matches"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <DashboardLayout>
                  <DocumentMatches />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/organizations"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <DashboardLayout>
                  <Organizations />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
