import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (lng) => {
    if (i18n.language !== lng) {
      i18n.changeLanguage(lng);
    }
  };

  const isEn = i18n.language === 'en';

  return (
    <div className="flex items-center w-full bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-md p-1 rounded-full border border-gray-300/50 dark:border-gray-700/50 shadow-inner">
      <button
        type="button"
        onClick={() => handleLanguageChange('en')}
        className={`relative flex-1 flex justify-center items-center py-2 text-sm font-bold rounded-full transition-colors duration-300 ${isEn ? 'text-blue-900 dark:text-blue-100' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        title={t('language.english')}
      >
        {isEn && (
          <motion.div
            layoutId="active-lang-tab"
            className="absolute inset-0 bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
        <span className="relative z-10 select-none">EN</span>
      </button>

      <button
        type="button"
        onClick={() => handleLanguageChange('gu')}
        className={`relative flex-1 flex justify-center items-center py-2 text-sm font-bold rounded-full transition-colors duration-300 ${!isEn ? 'text-blue-900 dark:text-blue-100' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        title={t('language.gujarati')}
      >
        {!isEn && (
          <motion.div
            layoutId="active-lang-tab"
            className="absolute inset-0 bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
        <span className="relative z-10 select-none">ગુજ</span>
      </button>
    </div>
  );
}
