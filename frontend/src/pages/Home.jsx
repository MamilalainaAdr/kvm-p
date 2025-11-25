import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import logo from '../assets/logo-transparent.png';
import AuthLayout from '../components/layout/AuthLayout';

export default function Home() {
  return (
    <AuthLayout>
      <div className="w-full min-h-screen flex items-start justify-center px-4 md:px-8 lg:px-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 max-w-7xl w-full mt-16">
          
          {/* Texte */}
          <div className="flex-1 space-y-6 text-left md:text-left overflow-hidden">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-text leading-tight">
              Facile , <br /> complète <br /> et <br />personnalisée
            </h1>

            <p className="text-lg md:text-xl text-muted max-w-lg">
              Gérez vos machines simplement avec <span className="font-bold text-primary">OBox</span>.
            </p>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primaryDark text-white rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all group"
            >
              Commencer 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Logo */}
          <div className="flex-1 justify-center hidden md:flex">
            <div className="relative w-full max-w-lg">
              <img
                src={logo}
                alt="OBox Logo"
                className="w-full object-contain hover:scale-105 transition-transform duration-300 logo-loop"
              />
              <div className="absolute -bottom-3 left-0 w-full h-1 bg-slate-400 blur-sm"></div>
            </div>
          </div>

        </div>
      </div>
    </AuthLayout>
  );
}