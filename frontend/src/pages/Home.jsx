import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">OBox</h1>
        <p className="text-lg mb-8">Gestion simple de VMs</p>
        <div className="flex gap-4 justify-center">
          <Link to="/register" className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700">S'inscrire</Link>
          <Link to="/login" className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700">Se connecter</Link>
        </div>
      </div>
    </div>
  );
}