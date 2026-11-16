import { prisma } from "@/lib/prisma";

export class BlockServiceError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "BlockServiceError";
  }
}

export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
  if (blockerId === blockedId) {
    throw new BlockServiceError("SELF_BLOCK", "Cannot block yourself");
  }

  const target = await prisma.user.findUnique({ where: { id: blockedId } });
  if (!target) throw new BlockServiceError("NOT_FOUND", "User not found");

  // Upsert — idempotent
  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    create: { blockerId, blockedId },
    update: {},
  });

  // Remove any follow relationships in both directions
  await prisma.follow.deleteMany({
    where: {
      OR: [
        { followerId: blockerId, followingId: blockedId },
        { followerId: blockedId, followingId: blockerId },
      ],
    },
  });
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  await prisma.block.deleteMany({
    where: { blockerId, blockedId },
  });
}

export async function getBlockedUsers(userId: string): Promise<
  Array<{ id: string; username: string; profile: { fullName: string; avatarUrl: string | null } | null }>
> {
  const blocks = await prisma.block.findMany({
    where: { blockerId: userId },
    include: {
      blocked: {
        select: {
          id: true,
          username: true,
          profile: { select: { fullName: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return blocks.map((b) => b.blocked);
}
