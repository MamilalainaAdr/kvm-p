import { useAuth } from '../context/AuthContext';
import AdminMonitoring from '../components/AdminMonitoring';
import UserMonitoring from '../components/UserMonitoring';

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p>Bienvenue, {user?.name} ({user?.role})</p>

      {user?.role === 'admin' ? <AdminMonitoring /> : <UserMonitoring />}
    </div>
  );
}