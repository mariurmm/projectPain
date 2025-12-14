import { useLanguage } from "../context/LanguageContext";
import "../style/LanguageSwitcher.css";

export default function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button className="lang-switcher" onClick={toggleLanguage}>
      {language === "ru" ? "RU" : "EN"}
    </button>
  );
}
