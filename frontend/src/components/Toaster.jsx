import { Toaster as HotToaster } from 'react-hot-toast';

export default function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#1f2937',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontFamily: 'Inter, ui-sans-serif',
          borderLeft: '4px solid #3b82f6',
        },
        success: { 
          iconTheme: { primary: '#10b981', secondary: '#fff' },
          style: { borderLeft: '4px solid #10b981' }
        },
        error: { 
          iconTheme: { primary: '#ef4444', secondary: '#fff' },
          style: { borderLeft: '4px solid #ef4444' }
        },
        loading: { 
          iconTheme: { primary: '#3b82f6', secondary: '#fff' },
          style: { borderLeft: '4px solid #3b82f6' }
        },
      }}
    />
  );
}