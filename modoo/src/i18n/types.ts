export interface TranslationKeys {
  connection: {
    checking: string;
    checkingSubtext: string;
    offline: string;
    offlineSubtext: string;
    online: string;
  };
  common: {
    ok: string;
    cancel: string;
    submit: string;
    loading: string;
    error: string;
    success: string;
  };
  auth: {
    login: string;
    logout: string;
    phonePlaceholder: string;
    codePlaceholder: string;
    sendCode: string;
    loginSuccess: string;
    loginFailed: string;
  };
}

export type TranslationKey = keyof TranslationKeys;