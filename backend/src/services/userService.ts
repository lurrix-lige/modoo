import { prisma } from "../utils/database";
import { customError } from "../utils/errors";

export interface CreateUserInput {
  phone: string;
  nickname?: string;
  avatar?: string;
  appleUserId?: string;
  appleEmail?: string;
  wechatOpenid?: string;
  wechatUnionid?: string;
}

export async function findUserByPhone(phone: string) {
  return prisma.user.findUnique({
    where: { phone },
    include: {
      child: true,
      subscriptions: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

export async function findUserByAppleId(appleUserId: string) {
  return prisma.user.findFirst({
    where: { appleUserId },
    include: {
      child: true,
      subscriptions: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

export async function findUserByWechatOpenid(wechatOpenid: string) {
  return prisma.user.findFirst({
    where: { wechatOpenid },
    include: {
      child: true,
      subscriptions: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

export async function createUser(input: CreateUserInput) {
  const nickname = input.nickname || `用户${input.phone.slice(-4)}`;

  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phone: input.phone,
          nickname,
          avatar: input.avatar,
          appleUserId: input.appleUserId,
          appleEmail: input.appleEmail,
          wechatOpenid: input.wechatOpenid,
          wechatUnionid: input.wechatUnionid,
        },
        include: {
          child: true,
          subscriptions: true,
        },
      });

      await tx.notificationSettings.create({
        data: {
          userId: user.id,
        },
      });

      await tx.privacySettings.create({
        data: {
          userId: user.id,
        },
      });

      return user;
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      throw customError("USER_EXISTS", "该用户已存在", 409);
    }
    throw error;
  }
}

export async function findOrCreateUserByPhone(
  phone: string,
  nickname?: string,
) {
  let user = await findUserByPhone(phone);

  if (!user) {
    user = await createUser({ phone, nickname });
  }

  return user;
}

export async function findOrCreateUserByApple(
  appleUserId: string,
  appleEmail?: string,
  nickname?: string,
) {
  let user = await findUserByAppleId(appleUserId);

  if (!user) {
    const phone = appleEmail || `apple_${appleUserId}`;
    user = await createUser({
      phone,
      nickname: nickname || "Apple User",
      appleUserId,
      appleEmail,
    });
  }

  return user;
}

export async function findOrCreateUserByWechat(
  wechatOpenid: string,
  wechatUnionid?: string,
  nickname?: string,
  avatar?: string,
) {
  let user = await findUserByWechatOpenid(wechatOpenid);

  if (!user) {
    const phone = `wechat_${wechatOpenid}`;
    user = await createUser({
      phone,
      nickname: nickname || "微信用户",
      avatar,
      wechatOpenid,
      wechatUnionid,
    });
  }

  return user;
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      child: true,
      subscriptions: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

export async function updateUserLastLogin(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { updatedAt: new Date() },
  });
}
