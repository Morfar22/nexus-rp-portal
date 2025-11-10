import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { createClient } from '@supabase/supabase-js';

// Import translations
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import pt from './locales/pt.json';
import da from './locales/da.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  pt: { translation: pt },
  da: { translation: da }
};

// Initialize Supabase client for translation overrides
const supabaseUrl = "https://vqvluqwadoaerghwyohk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxdmx1cXdhZG9hZXJnaHd5b2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODc4NDksImV4cCI6MjA3MTQ2Mzg0OX0.ItCgdk_h-5fgz2LYN9tGHgmWJLHvXYuZREVeYJnoBMw";
const supabase = createClient(supabaseUrl, supabaseKey);

// Load translation overrides from database
const loadTranslationOverrides = async () => {
  try {
    const { data } = await supabase.functions.invoke('translation-sync');
    
    if (data?.translations) {
      // Merge database overrides with default translations
      Object.keys(data.translations).forEach(locale => {
        if (resources[locale as keyof typeof resources]) {
          i18n.addResourceBundle(
            locale,
            'translation',
            data.translations[locale],
            true, // deep merge
            true  // overwrite
          );
        }
      });
      console.log('Translation overrides loaded successfully');
    }
  } catch (error) {
    console.warn('Failed to load translation overrides, using defaults:', error);
  }
};

// Initialize i18n synchronously before export
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    lng: 'da', // Set default language
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },
    
    react: {
      useSuspense: false, // Disable suspense to prevent conflicts with lazy loading
    }
  });

// Load overrides after initialization
loadTranslationOverrides();

export default i18n;