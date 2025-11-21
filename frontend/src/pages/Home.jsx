import { Link } from 'react-router-dom';
import logo from '../assets/logo-transparent.png';
export default function Home() {
  return (
    <div className="w-full min-h-screen flex items-start justify-center">
      {/* Section principale plein écran */}
      <div className="flex flex-1 mt-52 flex-col md:flex-row items-center justify-between w-full h-full px-6 md:px-16 lg:px-24">
        
      {/* --- Texte à gauche --- */}
      <div className="flex flex-col justify-center space-y-8 text-left w-full md:w-1/2">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-800 leading-tight">
          Facile, <br /> complète <br /> et personnalisée
        </h1>

        <p className="text-gray-600 text-lg md:text-xl">
          Gérez vos machines simplement avec{' '}
          <span className="font-semibold text-red-600">OBox</span>.
        </p>

        <a
          href="/login"
          className="inline-block bg-red-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-red-700 shadow-md hover:shadow-lg transition duration-300 w-fit"
        >
          Commencer →
        </a>
      </div>

      {/* --- Image/logo à droite --- */}
      <div className="hidden md:flex justify-center items-center w-full md:w-1/2 mt-10 md:mt-0">
        <div className="relative w-[70%] md:w-[90%] max-w-3xl">
          <img
            src={logo}
            alt="OBox Logo"
            className="w-full object-contain hover:scale-105 logo-loop"
          />

          {/* Bordure floutée en bas de l'image seulement */}
          <div className="absolute -bottom-3 left-0 w-full h-1 bg-slate-400 blur-sm"></div>
        </div>
      </div>
    </div>
    </div>
  );
}