import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, usersTable, freelancerProfilesTable } from "@workspace/db";
import { GetUserParams, UpdateUserParams, UpdateUserBody, BecomeFreelancerParams, BecomeFreelancerBody, GetFreelancerProfileParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    location: user.location ?? null,
    phone: user.phone ?? null,
    isVerified: user.isVerified,
    isBanned: user.isBanned,
    createdAt: user.createdAt.toISOString(),
  };
}

function formatFreelancer(fp: typeof freelancerProfilesTable.$inferSelect, user?: typeof usersTable.$inferSelect) {
  return {
    id: fp.id,
    userId: fp.userId,
    level: fp.level,
    skills: fp.skills,
    totalEarnings: parseFloat(fp.totalEarnings as string),
    completedOrders: fp.completedOrders,
    rating: parseFloat(fp.rating as string),
    reviewCount: fp.reviewCount,
    isAvailable: fp.isAvailable,
    createdAt: fp.createdAt.toISOString(),
    ...(user ? { user: formatUser(user) } : {}),
  };
}

router.get("/users/top-freelancers", async (_req, res): Promise<void> => {
  const profiles = await db
    .select()
    .from(freelancerProfilesTable)
    .innerJoin(usersTable, eq(freelancerProfilesTable.userId, usersTable.id))
    .orderBy(desc(freelancerProfilesTable.rating))
    .limit(10);

  res.json(profiles.map(({ freelancer_profiles: fp, users: u }) => formatFreelancer(fp, u)));
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(formatUser(user));
});

router.patch("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  if (req.user!.userId !== params.data.id && req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(formatUser(user));
});

router.post("/users/:id/become-freelancer", requireAuth, async (req, res): Promise<void> => {
  const params = BecomeFreelancerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = BecomeFreelancerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db.update(usersTable).set({ role: "freelancer" }).where(eq(usersTable.id, params.data.id));

  const existing = await db.select().from(freelancerProfilesTable).where(eq(freelancerProfilesTable.userId, params.data.id));
  let profile;
  if (existing.length === 0) {
    [profile] = await db.insert(freelancerProfilesTable).values({ userId: params.data.id, skills: parsed.data.skills ?? "" }).returning();
  } else {
    [profile] = await db.update(freelancerProfilesTable).set({ skills: parsed.data.skills ?? existing[0].skills }).where(eq(freelancerProfilesTable.userId, params.data.id)).returning();
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  res.json(formatFreelancer(profile, user));
});

router.get("/users/:id/freelancer-profile", async (req, res): Promise<void> => {
  const params = GetFreelancerProfileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const result = await db
    .select()
    .from(freelancerProfilesTable)
    .innerJoin(usersTable, eq(freelancerProfilesTable.userId, usersTable.id))
    .where(eq(freelancerProfilesTable.userId, params.data.id));

  if (!result.length) {
    res.status(404).json({ error: "Freelancer profile not found" });
    return;
  }

  const { freelancer_profiles: fp, users: u } = result[0];
  res.json(formatFreelancer(fp, u));
});

export default router;
