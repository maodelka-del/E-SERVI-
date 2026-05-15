import { Router, type IRouter } from "express";
import { eq, desc, asc, and, gte, lte, ilike, sql } from "drizzle-orm";
import { db, servicesTable, categoriesTable, freelancerProfilesTable, usersTable, favoritesTable } from "@workspace/db";
import {
  ListServicesQueryParams, GetServiceParams, UpdateServiceParams, UpdateServiceBody,
  DeleteServiceParams, ToggleFavoriteParams, CreateServiceBody
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

async function formatService(s: typeof servicesTable.$inferSelect) {
  const [catResult] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, s.categoryId));
  const fpResult = await db.select().from(freelancerProfilesTable)
    .innerJoin(usersTable, eq(freelancerProfilesTable.userId, usersTable.id))
    .where(eq(freelancerProfilesTable.id, s.freelancerId));

  const cat = catResult ? {
    id: catResult.id, name: catResult.name, slug: catResult.slug,
    icon: catResult.icon, description: catResult.description ?? null, serviceCount: catResult.serviceCount
  } : undefined;

  const fp = fpResult[0] ? {
    id: fpResult[0].freelancer_profiles.id,
    userId: fpResult[0].freelancer_profiles.userId,
    level: fpResult[0].freelancer_profiles.level,
    skills: fpResult[0].freelancer_profiles.skills,
    totalEarnings: parseFloat(fpResult[0].freelancer_profiles.totalEarnings as string),
    completedOrders: fpResult[0].freelancer_profiles.completedOrders,
    rating: parseFloat(fpResult[0].freelancer_profiles.rating as string),
    reviewCount: fpResult[0].freelancer_profiles.reviewCount,
    isAvailable: fpResult[0].freelancer_profiles.isAvailable,
    createdAt: fpResult[0].freelancer_profiles.createdAt.toISOString(),
    user: {
      id: fpResult[0].users.id, name: fpResult[0].users.name, email: fpResult[0].users.email,
      role: fpResult[0].users.role, avatarUrl: fpResult[0].users.avatarUrl ?? null,
      bio: fpResult[0].users.bio ?? null, location: fpResult[0].users.location ?? null,
      phone: fpResult[0].users.phone ?? null, isVerified: fpResult[0].users.isVerified,
      isBanned: fpResult[0].users.isBanned, createdAt: fpResult[0].users.createdAt.toISOString(),
    }
  } : undefined;

  return {
    id: s.id, title: s.title, description: s.description,
    price: parseFloat(s.price as string), deliveryDays: s.deliveryDays,
    categoryId: s.categoryId, freelancerId: s.freelancerId,
    imageUrl: s.imageUrl ?? null, tags: s.tags ?? null,
    status: s.status, orderCount: s.orderCount,
    rating: parseFloat(s.rating as string), reviewCount: s.reviewCount,
    isFeatured: s.isFeatured, createdAt: s.createdAt.toISOString(),
    category: cat, freelancer: fp,
  };
}

router.get("/services/featured", async (_req, res): Promise<void> => {
  const services = await db.select().from(servicesTable)
    .where(and(eq(servicesTable.isFeatured, true), eq(servicesTable.status, "active")))
    .orderBy(desc(servicesTable.orderCount))
    .limit(8);
  const formatted = await Promise.all(services.map(formatService));
  res.json(formatted);
});

router.get("/services/my", requireAuth, async (req, res): Promise<void> => {
  const [fp] = await db.select().from(freelancerProfilesTable).where(eq(freelancerProfilesTable.userId, req.user!.userId));
  if (!fp) {
    res.json([]);
    return;
  }
  const services = await db.select().from(servicesTable).where(eq(servicesTable.freelancerId, fp.id)).orderBy(desc(servicesTable.createdAt));
  const formatted = await Promise.all(services.map(formatService));
  res.json(formatted);
});

router.get("/services/favorites", requireAuth, async (req, res): Promise<void> => {
  const favs = await db.select().from(favoritesTable).where(eq(favoritesTable.userId, req.user!.userId));
  const serviceIds = favs.map(f => f.serviceId);
  if (serviceIds.length === 0) {
    res.json([]);
    return;
  }
  const services = await db.select().from(servicesTable).where(sql`${servicesTable.id} = ANY(${serviceIds})`);
  const formatted = await Promise.all(services.map(formatService));
  res.json(formatted);
});

router.get("/services", async (req, res): Promise<void> => {
  const qp = ListServicesQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }

  const { q, categoryId, minPrice, maxPrice, sort, page = 1, limit = 12 } = qp.data;

  const conditions = [eq(servicesTable.status, "active")];
  if (q) conditions.push(ilike(servicesTable.title, `%${q}%`));
  if (categoryId) conditions.push(eq(servicesTable.categoryId, categoryId));
  if (minPrice != null) conditions.push(gte(servicesTable.price, String(minPrice)));
  if (maxPrice != null) conditions.push(lte(servicesTable.price, String(maxPrice)));

  const where = and(...conditions);
  const offset = (page - 1) * limit;

  let orderBy = desc(servicesTable.createdAt);
  if (sort === "price_asc") orderBy = asc(servicesTable.price);
  else if (sort === "price_desc") orderBy = desc(servicesTable.price);
  else if (sort === "popular") orderBy = desc(servicesTable.orderCount);
  else if (sort === "rating") orderBy = desc(servicesTable.rating);

  const [services, countResult] = await Promise.all([
    db.select().from(servicesTable).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(servicesTable).where(where),
  ]);

  const formatted = await Promise.all(services.map(formatService));
  res.json({ services: formatted, total: Number(countResult[0].count), page, limit });
});

router.post("/services", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateServiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [fp] = await db.select().from(freelancerProfilesTable).where(eq(freelancerProfilesTable.userId, req.user!.userId));
  if (!fp) {
    res.status(403).json({ error: "You must be a freelancer to create services" });
    return;
  }

  const [service] = await db.insert(servicesTable).values({
    ...parsed.data,
    price: String(parsed.data.price),
    freelancerId: fp.id,
  }).returning();

  // Update category service count
  await db.execute(sql`UPDATE categories SET service_count = service_count + 1 WHERE id = ${service.categoryId}`);

  res.status(201).json(await formatService(service));
});

router.get("/services/:id", async (req, res): Promise<void> => {
  const params = GetServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, params.data.id));
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  res.json(await formatService(service));
});

router.patch("/services/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateServiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.price != null) updateData.price = String(parsed.data.price);

  const [service] = await db.update(servicesTable).set(updateData).where(eq(servicesTable.id, params.data.id)).returning();
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  res.json(await formatService(service));
});

router.delete("/services/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(servicesTable).where(eq(servicesTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/services/:id/favorite", requireAuth, async (req, res): Promise<void> => {
  const params = ToggleFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const existing = await db.select().from(favoritesTable)
    .where(and(eq(favoritesTable.userId, req.user!.userId), eq(favoritesTable.serviceId, params.data.id)));

  if (existing.length > 0) {
    await db.delete(favoritesTable)
      .where(and(eq(favoritesTable.userId, req.user!.userId), eq(favoritesTable.serviceId, params.data.id)));
    res.json({ isFavorited: false });
  } else {
    await db.insert(favoritesTable).values({ userId: req.user!.userId, serviceId: params.data.id });
    res.json({ isFavorited: true });
  }
});

export default router;
