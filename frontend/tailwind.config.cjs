module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#DF2935',      // Rouge principal
        primaryDark: '#B71F2A',  // Rouge foncé (hover)
        background: '#E6E8E6',   // Gris clair fond
        surface: '#FFFFFF',      // Blanc surface
        text: '#080708',         // Noir texte
        accent: '#3772FF',       // Bleu accent (liens, boutons secondaires)
        warning: '#FDCA40',      // Jaune warnings
        success: '#10B981',      // Vert succès
        error: '#EF4444',        // Rouge erreur
        muted: '#6B7280',        // Gris texte secondaire
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial'],
      },
    },
  },
  plugins: []
};