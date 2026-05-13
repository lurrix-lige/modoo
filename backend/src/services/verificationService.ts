import { prisma } from "../utils/database";
import { customError } from "../utils/errors";
import { logger } from "../utils/logger";

const VERIFICATION_EXPIRY =
  parseInt(process.env.VERIFICATION_EXPIRY_MINUTES || "5") * 60 * 1000;
const MAX_ATTEMPTS = parseInt(process.env.MAX_VERIFICATION_ATTEMPTS || "5");
const MAX_VERIFY_ATTEMPTS = parseInt(process.env.MAX_VERIFY_ATTEMPTS || "3");
const ENABLE_REAL_SMS = process.env.ENABLE_REAL_SMS === "true";
const RATE_LIMIT_WINDOW = parseInt(process.env.VERIFICATION_RATE_LIMIT_WINDOW_MS || "60000");

interface VerificationAttempt {
  phone: string;
  attempts: number;
  lockedUntil?: Date;
}

const verificationAttempts = new Map<string, VerificationAttempt>();

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getOrCreateAttempt(phone: string): VerificationAttempt {
  let attempt = verificationAttempts.get(phone);
  if (!attempt) {
    attempt = { phone, attempts: 0 };
    verificationAttempts.set(phone, attempt);
  }
  return attempt;
}

function checkRateLimit(phone: string): void {
  const attempt = getOrCreateAttempt(phone);
  
  if (attempt.lockedUntil && attempt.lockedUntil > new Date()) {
    const remainingSeconds = Math.ceil((attempt.lockedUntil.getTime() - Date.now()) / 1000);
    throw customError("RATE_LIMITED", `账号已被锁定，请在${remainingSeconds}秒后重试`, 429);
  }
}

export async function sendVerificationCode(
  phone: string,
): Promise<{ code: string; expiresAt: Date }> {
  checkRateLimit(phone);

  const now = new Date();

  const recentAttempts = await prisma.verificationCode.count({
    where: {
      phone,
      createdAt: {
        gt: new Date(now.getTime() - RATE_LIMIT_WINDOW),
      },
    },
  });

  if (recentAttempts >= MAX_ATTEMPTS) {
    const attempt = getOrCreateAttempt(phone);
    attempt.lockedUntil = new Date(now.getTime() + RATE_LIMIT_WINDOW);
    throw customError("RATE_LIMITED", "请求过于频繁，请稍后再试", 429);
  }

  const code = generateCode();
  const expiresAt = new Date(now.getTime() + VERIFICATION_EXPIRY);

  await prisma.verificationCode.create({
    data: {
      phone,
      code,
      expiresAt,
    },
  });

  if (ENABLE_REAL_SMS) {
    throw customError("NOT_IMPLEMENTED", "真实短信发送功能尚未实现", 501);
  } else {
    logger.info(`[SIMULATED SMS] Verification code for ${phone}: ${code} (expires in ${VERIFICATION_EXPIRY / 60000} minutes)`);
  }

  return { code, expiresAt };
}

export async function verifyCode(
  phone: string,
  code: string,
): Promise<boolean> {
  checkRateLimit(phone);

  const attempt = getOrCreateAttempt(phone);

  const verification = await prisma.verificationCode.findFirst({
    where: {
      phone,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!verification) {
    attempt.attempts++;
    
    if (attempt.attempts >= MAX_VERIFY_ATTEMPTS) {
      attempt.lockedUntil = new Date(Date.now() + RATE_LIMIT_WINDOW);
      attempt.attempts = 0;
      throw customError("VERIFY_FAILED", "验证码错误次数过多，账号已被临时锁定", 429);
    }
    
    return false;
  }

  attempt.attempts = 0;

  await prisma.verificationCode.update({
    where: { id: verification.id },
    data: { used: true },
  });

  return true;
}

export async function cleanupExpiredCodes(): Promise<void> {
  await prisma.verificationCode.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
  
  const now = new Date();
  for (const [phone, attempt] of verificationAttempts) {
    if (attempt.lockedUntil && attempt.lockedUntil < now) {
      verificationAttempts.delete(phone);
    }
  }
}

export function resetVerificationAttempts(phone: string): void {
  verificationAttempts.delete(phone);
}
