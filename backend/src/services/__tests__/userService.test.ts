import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "../../utils/database";
import {
  createUser,
  findUserByPhone,
  findOrCreateUserByPhone,
} from "../userService";

vi.mock("../../utils/database", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    notificationSettings: {
      create: vi.fn(),
    },
    privacySettings: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("UserService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findUserByPhone", () => {
    it("should find user by phone", async () => {
      const mockUser = { id: "1", phone: "13812345678", nickname: "Test" };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const user = await findUserByPhone("13812345678");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { phone: "13812345678" },
        include: expect.any(Object),
      });
      expect(user).toEqual(mockUser);
    });

    it("should return null when user not found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const user = await findUserByPhone("13812345678");

      expect(user).toBeNull();
    });
  });

  describe("createUser", () => {
    it("should create user with transaction", async () => {
      const mockUser = {
        id: "1",
        phone: "13812345678",
        nickname: "用户5678",
        avatar: null,
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        return callback({
          user: {
            create: vi.fn().mockResolvedValue(mockUser),
          },
          notificationSettings: {
            create: vi.fn(),
          },
          privacySettings: {
            create: vi.fn(),
          },
        } as any);
      });

      const user = await createUser({ phone: "13812345678" });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(user).toEqual(mockUser);
    });
  });

  describe("findOrCreateUserByPhone", () => {
    it("should return existing user", async () => {
      const mockUser = { id: "1", phone: "13812345678", nickname: "Test" };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const user = await findOrCreateUserByPhone("13812345678");

      expect(prisma.user.findUnique).toHaveBeenCalled();
      expect(user).toEqual(mockUser);
    });

    it("should create new user when not found", async () => {
      const mockUser = {
        id: "1",
        phone: "13812345678",
        nickname: "用户5678",
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        return callback({
          user: {
            create: vi.fn().mockResolvedValue(mockUser),
          },
          notificationSettings: {
            create: vi.fn(),
          },
          privacySettings: {
            create: vi.fn(),
          },
        } as any);
      });

      const user = await findOrCreateUserByPhone("13812345678");

      expect(prisma.user.findUnique).toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(user).toEqual(mockUser);
    });
  });
});
