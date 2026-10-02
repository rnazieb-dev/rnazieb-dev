import { useEffect } from 'react';
import { Alert, DevSettings, I18nManager } from 'react-native';
import { LANGUAGES } from './index';
import { useLang } from './useT';

/** Menyelaraskan arah tata letak (RTL untuk Arab/Urdu/Persia/Pashto). Perubahan arah butuh memuat ulang aplikasi. */
export function RtlSync() {
  const lang = useLang();
  useEffect(() => {
    const rtl = LANGUAGES[lang].rtl;
    if (I18nManager.isRTL === rtl) return;
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
    if (__DEV__) DevSettings.reload();
    else Alert.alert(LANGUAGES[lang].label, rtl ? 'أعد تشغيل التطبيق لتطبيق اتجاه الكتابة.' : 'Restart the app to apply the layout direction.');
  }, [lang]);
  return null;
}
