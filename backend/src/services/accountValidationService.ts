import { customError } from "../utils/errors";
import { config as appConfig } from "../config";

export interface AccountValidationConfig {
  enabled: boolean;
  phonePattern: string;
  minPhoneLength: number;
  maxPhoneLength: number;
  blockedPrefixes: string[];
  blockedPhones: string[];
}

const DEFAULT_CONFIG: AccountValidationConfig = {
  enabled: appConfig.accountValidation.enabled,
  phonePattern: appConfig.accountValidation.phonePattern,
  minPhoneLength: appConfig.accountValidation.minPhoneLength,
  maxPhoneLength: appConfig.accountValidation.maxPhoneLength,
  blockedPrefixes: appConfig.accountValidation.blockedPrefixes,
  blockedPhones: appConfig.accountValidation.blockedPhones,
};

let config: AccountValidationConfig = { ...DEFAULT_CONFIG };

export function updateAccountValidationConfig(newConfig: Partial<AccountValidationConfig>): void {
  config = { ...config, ...newConfig };
}

export function getAccountValidationConfig(): AccountValidationConfig {
  return { ...config };
}

export async function validateAccount(phone: string): Promise<boolean> {
  if (!config.enabled) {
    return true;
  }

  if (!phone) {
    throw customError("VALIDATION_ERROR", "手机号不能为空", 400);
  }

  const trimmedPhone = phone.trim();

  if (trimmedPhone.length < config.minPhoneLength) {
    throw customError("VALIDATION_ERROR", `手机号长度不能少于${config.minPhoneLength}位`, 400);
  }

  if (trimmedPhone.length > config.maxPhoneLength) {
    throw customError("VALIDATION_ERROR", `手机号长度不能超过${config.maxPhoneLength}位`, 400);
  }

  const phoneRegex = new RegExp(config.phonePattern);
  if (!phoneRegex.test(trimmedPhone)) {
    throw customError("VALIDATION_ERROR", "请输入正确格式的手机号", 400);
  }

  for (const prefix of config.blockedPrefixes) {
    if (trimmedPhone.startsWith(prefix)) {
      throw customError("ACCOUNT_BLOCKED", "该手机号段暂不支持注册", 403);
    }
  }

  if (config.blockedPhones.includes(trimmedPhone)) {
    throw customError("ACCOUNT_BLOCKED", "该手机号已被限制使用", 403);
  }

  return true;
}

export function isPhoneFormatValid(phone: string): boolean {
  try {
    const phoneRegex = new RegExp(config.phonePattern);
    return phoneRegex.test(phone.trim());
  } catch {
    return false;
  }
}
