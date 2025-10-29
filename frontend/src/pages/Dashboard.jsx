import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard(){
  const { user } = useAuth();
  return (
    <div className="container mt-8">
    <p className="mt-2">Bienvenue sur votre espace, {user?.name}.</p>
    </div>
  );
}