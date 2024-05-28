import type { Resource } from 'i18next';

export default {
  'de-DE': (): Promise<Resource> => import('./de-DE.i18n.json'),
  'en': (): Promise<Resource> => import('./en.i18n.json'),
  'es': (): Promise<Resource> => import('./es.i18n.json'),
  'fi': (): Promise<Resource> => import('./fi.i18n.json'),
  'fr': (): Promise<Resource> => import('./fr.i18n.json'),
  'hu': (): Promise<Resource> => import('./hu.i18n.json'),
  'hi-IN': (): Promise<Resource> => import('./hi-IN.i18n.json'),
  'it-IT': (): Promise<Resource> => import('./it-IT.i18n.json'),
  'ja': (): Promise<Resource> => import('./ja.i18n.json'),
  'pl': (): Promise<Resource> => import('./pl.i18n.json'),
  'pt-BR': (): Promise<Resource> => import('./pt-BR.i18n.json'),
  'ru': (): Promise<Resource> => import('./ru.i18n.json'),
  'tr-TR': (): Promise<Resource> => import('./tr-TR.i18n.json'),
  'uk-UA': (): Promise<Resource> => import('./uk-UA.i18n.json'),
  'zh-CN': (): Promise<Resource> => import('./zh-CN.i18n.json'),
  'zh-TW': (): Promise<Resource> => import('./zh-TW.i18n.json'),
} as const;
