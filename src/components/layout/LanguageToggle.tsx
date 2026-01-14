import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center bg-muted rounded-full p-0.5 gap-0.5">
      <button
        onClick={() => setLanguage('en')}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
          language === 'en'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Switch to English"
        aria-pressed={language === 'en'}
      >
        <span className="text-sm" role="img" aria-label="English">🇺🇸</span>
        <span className="hidden sm:inline">EN</span>
      </button>
      <button
        onClick={() => setLanguage('es')}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
          language === 'es'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Switch to Spanish"
        aria-pressed={language === 'es'}
      >
        <span className="text-sm" role="img" aria-label="Spanish">🇪🇸</span>
        <span className="hidden sm:inline">ES</span>
      </button>
    </div>
  );
}
