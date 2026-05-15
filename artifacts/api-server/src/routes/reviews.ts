import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, reviewsTable, usersTable, ordersTable, servicesTable, freelancerProfilesTable } from "@workspace/db";
import { CreateReviewBody, ListServiceReviewsParams, ListFreelancerReviewsParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function formatReview(r: typeof reviewsTable.$inferSelect, client?: typeof usersTable.$inferSelect) {
  return {
    id: r.id,
    orderId: r.orderId,
    serviceId: r.serviceId,
    clientId: r.clientId,
    freelancerId: r.freelancerId,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    client: client ? {
      id: client.id, name: client.name, email: client.email, role: client.role,
      avatarUrl: client.avatarUrl ?? null, bio: client.bio ?? null,
      location: client.location ?? null, phone: client.phone ?? null,
      isVerified: client.isVerified, isBanned: client.isBanned,
      createdAt: client.createdAt.toISOString(),
    } : undefined,
  };
}

router.post("/reviews", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, parsed.data.orderId));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const [review] = await db.insert(reviewsTable).values({
    orderId: parsed.data.orderId,
    serviceId: order.serviceId,
    clientId: req.user!.userId,
    freelancerId: order.freelancerId,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
  }).returning();

  // Update service rating
  await db.execute(sql`
    UPDATE services SET
      rating = (SELECT AVG(rating) FROM reviews WHERE service_id = ${order.serviceId}),
      review_count = review_count + 1
    WHERE id = ${order.serviceId}
  `);

  // Update freelancer rating
  await db.execute(sql`
    UPDATE freelancer_profiles SET
      rating = (SELECT AVG(rating) FROM reviews WHERE freelancer_id = ${order.freelancerId}),
      review_count = review_count + 1
    WHERE id = ${order.freelancerId}
  `);

  const [client] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  res.status(201).json(formatReview(review, client));
});

router.get("/reviews/service/:serviceId", async (req, res): Promise<void> => {
  const params = ListServiceReviewsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const reviews = await db.select().from(reviewsTable)
    .innerJoin(usersTable, eq(reviewsTable.clientId, usersTable.id))
    .where(eq(reviewsTable.serviceId, params.data.serviceId));

  res.json(reviews.map(({ reviews: r, users: u }) => formatReview(r, u)));
});

router.get("/reviews/freelancer/:freelancerId", async (req, res): Promise<void> => {
  const params = ListFreelancerReviewsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const reviews = await db.select().from(reviewsTable)
    .innerJoin(usersTable, eq(reviewsTable.clientId, usersTable.id))
    .where(eq(reviewsTable.freelancerId, params.data.freelancerId));

  res.json(reviews.map(({ reviews: r, users: u }) => formatReview(r, u)));
});

export default router;
