import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "../../utils/database";
import { customError } from "../../utils/errors";
import { loginWithPhone, refreshAccessToken, logout } from "../authService";
import { verifyCode } from "../verificationService";
import { findOrCreateUserByPhone } from "../userService";
import { validateAccount } from "../accountValidationService";

vi.mock("../../utils/database", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("../verificationService", () => ({
  verifyCode: vi.fn(),
}));

vi.mock("../userService", () => ({
  findOrCreateUserByPhone: vi.fn(),
}));

vi.mock("../accountValidationService", () => ({
  validateAccount: vi.fn(),
}));

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockFastify = {
    jwt: {
      sign: vi.fn().mockReturnValue("mock-access-token"),
    },
  };

  describe("loginWithPhone", () => {
    it("should return login result with valid code", async () => {
      const mockUser = {
        id: "user-123",
        phone: "13812345678",
        nickname: "Test User",
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        appleUserId: null,
        wechatOpenid: null,
        wechatUnionid: null,
        role: "USER",
        appleEmail: null,
        child: null,
        subscriptions: [],
      };

      vi.mocked(validateAccount).mockResolvedValue({ valid: true } as any);
      vi.mocked(verifyCode).mockResolvedValue(true);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(findOrCreateUserByPhone).mockResolvedValue(mockUser);
      vi.mocked(prisma.refreshToken.create).mockResolvedValue({} as any);

      const result = await loginWithPhone(mockFastify as any, "13812345678", "123456");

      expect(validateAccount).toHaveBeenCalledWith("13812345678");
      expect(verifyCode).toHaveBeenCalledWith("13812345678", "123456");
      expect(findOrCreateUserByPhone).toHaveBeenCalledWith("13812345678");
      expect(mockFastify.jwt.sign).toHaveBeenCalled();
      expect(result).toEqual({
        accessToken: "mock-access-token",
        refreshToken: expect.any(String),
        expiresIn: expect.any(Number),
        user: {
          id: mockUser.id,
          phone: mockUser.phone,
          nickname: mockUser.nickname,
          avatar: mockUser.avatar,
          isNewUser: true,
        },
      });
    });

    it("should throw error when verification code is invalid", async () => {
      vi.mocked(validateAccount).mockResolvedValue({ valid: true } as any);
      vi.mocked(verifyCode).mockResolvedValue(false);

      await expect(loginWithPhone(mockFastify as any, "13812345678", "000000")).rejects.toThrow(
        customError("VALIDATION_ERROR", "验证码错误或已过期", 400)
      );
    });
  });

  describe("refreshAccessToken", () => {
    it("should return new tokens when refresh token is valid", async () => {
      const mockStoredToken = {
        id: "token-123",
        userId: "user-123",
        token: "valid-refresh-token",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      };

      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockStoredToken);
      vi.mocked(prisma.refreshToken.create).mockResolvedValue({} as any);

      const result = await refreshAccessToken(mockFastify as any, "valid-refresh-token");

      expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: "valid-refresh-token" },
      });
      expect(mockFastify.jwt.sign).toHaveBeenCalled();
      expect(result.accessToken).toBe("mock-access-token");
    });

    it("should throw error when refresh token is expired", async () => {
      const mockStoredToken = {
        id: "token-456",
        userId: "user-123",
        token: "expired-refresh-token",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      };

      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockStoredToken);

      await expect(refreshAccessToken(mockFastify as any, "expired-refresh-token")).rejects.toThrow(
        customError("UNAUTHORIZED", "refreshToken已过期，请重新登录", 401)
      );
    });

    it("should throw error when refresh token not found", async () => {
      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(null);

      await expect(refreshAccessToken(mockFastify as any, "invalid-token")).rejects.toThrow(
        customError("UNAUTHORIZED", "refreshToken已过期，请重新登录", 401)
      );
    });
  });

  describe("logout", () => {
    it("should delete all refresh tokens for user", async () => {
      await logout("user-123");

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-123" },
      });
    });
  });
});
