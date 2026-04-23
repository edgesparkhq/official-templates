import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 只同步加载默认语言（英语）
import enTranslation from './en/translation.json';

// 动态加载其他语言的函数
const loadLanguageAsync = async (language: string) => {
  switch (language) {
    case 'zh':
      return (await import('./zh/translation.json')).default;
    case 'ja':
      return (await import('./ja/translation.json')).default;
    case 'ko':
      return (await import('./ko/translation.json')).default;
    case 'es':
      return (await import('./es/translation.json')).default;
    case 'pt':
      return (await import('./pt/translation.json')).default;
    default:
      return enTranslation;
  }
};

// 初始只包含英语资源
const resources = {
  en: {
    translation: enTranslation,
  },
};

const htmlLangFor = (lng: string): string => {
  const base = (lng || 'en').split('-')[0];
  switch (base) {
    case 'zh': return 'zh-CN';
    case 'pt': return 'pt-BR';
    default: return base;
  }
};

const syncHtmlLang = (lng: string) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = htmlLangFor(lng);
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: 'en', // Set default language to English
    debug: false,

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

syncHtmlLang(i18n.language);
i18n.on('languageChanged', syncHtmlLang);

// 扩展 i18n 实例，添加动态加载语言的方法
const originalChangeLanguage = i18n.changeLanguage.bind(i18n);

i18n.changeLanguage = async (language: string) => {
  // 如果语言资源还没有加载，动态加载它
  if (!i18n.hasResourceBundle(language, 'translation')) {
    try {
      const translation = await loadLanguageAsync(language);
      i18n.addResourceBundle(language, 'translation', translation);
    } catch (error) {
      console.error(`Failed to load language ${language}:`, error);
      // 回退到英语
      return originalChangeLanguage('en');
    }
  }
  
  return originalChangeLanguage(language);
};

export default i18n;