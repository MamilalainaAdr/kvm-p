import { useEffect } from 'react';

export default function AuthLayout({ children }) {
  useEffect(() => {
    // Empêcher le scroll sur le body lors du montage
    document.body.style.overflow = 'hidden';
    return () => {
      // Réactiver le scroll au démontage
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="overflow-hidden mt-20">
      <div>
        {children}
      </div>
    </div>
  );
}