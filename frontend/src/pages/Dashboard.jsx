import { useAuth } from '../context/AuthContext';
import AdminMonitoring from '../components/AdminMonitoring';
import UserMonitoring from '../components/UserMonitoring';

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="p-6">
      <p>Bienvenue, <em><b className='text-slate-700'>{user?.name}</b></em></p>

      {user?.role === 'admin' ? (
        <>
          <AdminMonitoring />
          <UserMonitoring/>
        </>
        ) : (<UserMonitoring />)}
    </div>
  );
}