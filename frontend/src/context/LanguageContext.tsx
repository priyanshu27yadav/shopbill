import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'en' | 'hi';

export interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

export const translations: Translations = {
  // Header
  'header.new_bill': { en: 'New Bill', hi: 'नया बिल' },
  'header.online': { en: 'Online Central', hi: 'ऑनलाइन कनेक्टेड' },
  'header.offline': { en: 'Offline SQLite', hi: 'ऑफलाइन मोड' },
  'header.sync': { en: 'Sync', hi: 'सिंक करें' },
  'header.non_gst': { en: 'Non-GST Retail Mode', hi: 'नॉन-जीएसटी रिटेल मोड' },
  'header.gstin': { en: 'GSTIN', hi: 'जीएसटी नंबर' },

  // Navigation
  'nav.fast_billing': { en: 'Fast Billing', hi: 'फास्ट बिलिंग' },
  'nav.dashboard': { en: 'Dashboard', hi: 'डैशबोर्ड' },
  'nav.products': { en: 'Products & Prices', hi: 'सामान एवं मूल्य' },
  'nav.pdf_upload': { en: 'Upload PDF Price List', hi: 'पीडीएफ प्राइस लिस्ट' },
  'nav.categories': { en: 'Categories', hi: 'सामान श्रेणियां' },
  'nav.invoices': { en: 'Invoice History', hi: 'बिल का इतिहास' },
  'nav.sales_return': { en: 'Sales Return', hi: 'सामान वापसी' },
  'nav.customers': { en: 'Customers & Udhaar', hi: 'ग्राहक एवं उधार' },
  'nav.reports': { en: 'Reports', hi: 'व्यापार रिपोर्ट्स' },
  'nav.settings': { en: 'Settings', hi: 'सेटिंग्स' },
  'nav.super_admin': { en: 'Super Admin', hi: 'सुपर एडमिन' },

  // User & Roles
  'user.sign_out': { en: 'Sign Out', hi: 'लॉग आउट (Sign Out)' },
  'user.retail_billing': { en: 'Retail Billing Software', hi: 'रिटेल बिलिंग सॉफ्टवेयर' },
  'user.your_shops': { en: 'Your Shops', hi: 'आपकी दुकानें' },
  'role.owner': { en: 'Shop Owner', hi: 'दुकान मालिक' },
  'role.cashier': { en: 'Cashier', hi: 'कैशियर' },
  'role.super_admin': { en: 'Super Admin', hi: 'सुपर एडमिन' },

  // Logout Confirmation Modal
  'logout.title': { en: 'Confirm Sign Out', hi: 'लॉग आउट की पुष्टि करें' },
  'logout.message': {
    en: 'Are you sure you want to sign out of your account? Any unsaved bill draft will be retained in local cache.',
    hi: 'क्या आप वाकई अपने खाते से लॉग आउट करना चाहते हैं? आपका स्थानीय बिल ड्राफ्ट सुरक्षित रूप से सहेजा गया है।',
  },
  'logout.cancel': { en: 'Cancel', hi: 'रद्द करें' },
  'logout.confirm': { en: 'Yes, Sign Out', hi: 'हाँ, लॉग आउट करें' },

  // Common
  'common.search': { en: 'Search', hi: 'खोजें' },
  'common.loading': { en: 'Loading...', hi: 'लोड हो रहा है...' },
  'common.save': { en: 'Save', hi: 'सुरक्षित करें' },
  'common.delete': { en: 'Delete', hi: 'हटाएं' },
  'common.edit': { en: 'Edit', hi: 'संपादित करें' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('shopbill_language');
    return saved === 'hi' || saved === 'en' ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('shopbill_language', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  const t = (key: string, fallback?: string): string => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
