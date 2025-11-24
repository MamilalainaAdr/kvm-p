import { Toaster as HotToaster } from 'react-hot-toast';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info,
  Loader2 
} from 'lucide-react';

export default function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        className: 'font-sans',
        style: {
          background: '#FFF8F0', // ✅ Fond chaleureux
          color: '#080708',      // ✅ Texte principal
          boxShadow: '0 4px 12px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.08)',
          borderRadius: '12px',
          borderLeft: '4px solid #3772FF', // ✅ Accent par défaut
          fontFamily: 'Inter, ui-sans-serif, system-ui',
          padding: '16px',
          maxWidth: '400px',
        },
        success: { 
          icon: <CheckCircle2 className="w-5 h-5 text-success" />,
          style: { 
            borderLeft: '4px solid #10B981', // ✅ Success
            background: '#F0FDF4'
          },
        },
        error: { 
          icon: <XCircle className="w-5 h-5 text-error" />,
          style: { 
            borderLeft: '4px solid #EF4444', // ✅ Error
            background: '#FEF2F2'
          },
        },
        loading: { 
          icon: <Loader2 className="w-5 h-5 text-accent animate-spin" />,
          style: { 
            borderLeft: '4px solid #3772FF', // ✅ Accent
            background: '#EFF6FF'
          },
        },
        warning: {
          icon: <AlertTriangle className="w-5 h-5 text-warning" />,
          style: {
            borderLeft: '4px solid #FDCA40', // ✅ Warning
            background: '#FFFBEB'
          },
        },
        info: {
          icon: <Info className="w-5 h-5 text-accent" />,
          style: {
            borderLeft: '4px solid #3772FF',
            background: '#EFF6FF'
          },
        },
      }}
    />
  );
}