import { Hono } from "hono";
import { db, vars } from "edgespark";
import { auth } from "edgespark/http";
import { signups } from "@defs";
import { eq, desc, like, sql, count } from "drizzle-orm";

const app = new Hono()

  // ── Public: submit waitlist signup ──
  .post("/api/public/signup", async (c) => {
    const body = await c.req.json<{ email: string; source?: string }>();
    const email = body.email?.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return c.json({ error: "Invalid email" }, 400);
    }
    try {
      const [row] = await db
        .insert(signups)
        .values({ email, source: body.source || "landing" })
        .returning({ id: signups.id });
      // Get the user's position in the waitlist
      const [{ total }] = await db
        .select({ total: count() })
        .from(signups);
      return c.json({ success: true, id: row.id, position: total }, 201);
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes("UNIQUE")) {
        // Already signed up — return their position
        const [existing] = await db
          .select({ id: signups.id })
          .from(signups)
          .where(eq(signups.email, email));
        const [{ total }] = await db
          .select({ total: count() })
          .from(signups);
        return c.json({
          success: true,
          id: existing.id,
          position: total,
          alreadySignedUp: true,
        });
      }
      throw e;
    }
  })

  // ── Public: waitlist count ──
  .get("/api/public/signups/count", async (c) => {
    const [{ total }] = await db
      .select({ total: count() })
      .from(signups);
    return c.json({ count: total });
  })

  // ── Authenticated: current user info ──
  .get("/api/me", async (c) => {
    if (!auth.isAuthenticated()) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const adminEmail = vars.get("ADMIN_EMAIL");
    const isAdminUser = adminEmail != null && auth.user.email === adminEmail;
    return c.json({
      email: auth.user.email,
      name: auth.user.name,
      isAdmin: isAdminUser,
    });
  })

  // ── Admin: stats ──
  .get("/api/admin/stats", async (c) => {
    if (!isAdmin()) return c.json({ error: "Forbidden" }, 403);

    const [{ total }] = await db
      .select({ total: count() })
      .from(signups);

    const [{ todayCount }] = await db
      .select({ todayCount: count() })
      .from(signups)
      .where(sql`date(${signups.created_at}) = date('now')`);

    // 7-day trend
    const trend = await db
      .select({
        day: sql<string>`date(${signups.created_at})`.as("day"),
        dayCount: count().as("day_count"),
      })
      .from(signups)
      .where(sql`${signups.created_at} >= datetime('now', '-7 days')`)
      .groupBy(sql`date(${signups.created_at})`)
      .orderBy(sql`date(${signups.created_at})`);

    // By source breakdown
    const sources = await db
      .select({
        source: signups.source,
        sourceCount: count().as("source_count"),
      })
      .from(signups)
      .groupBy(signups.source);

    return c.json({ total, todayCount, trend, sources });
  })

  // ── Admin: paginated signups list ──
  .get("/api/admin/signups", async (c) => {
    if (!isAdmin()) return c.json({ error: "Forbidden" }, 403);

    const page = parseInt(c.req.query("page") || "1");
    const search = c.req.query("search") || "";
    const sourceFilter = c.req.query("source") || "";
    const limit = 20;
    const offset = (page - 1) * limit;

    let query = db.select().from(signups).$dynamic();

    const conditions = [];
    if (search) {
      conditions.push(like(signups.email, `%${search}%`));
    }
    if (sourceFilter) {
      conditions.push(eq(signups.source, sourceFilter));
    }
    if (conditions.length === 1) {
      query = query.where(conditions[0]);
    } else if (conditions.length > 1) {
      const { and } = await import("drizzle-orm");
      query = query.where(and(...conditions));
    }

    const rows = await query
      .orderBy(desc(signups.created_at))
      .limit(limit)
      .offset(offset);

    // Total count for pagination
    let countQuery = db.select({ total: count() }).from(signups).$dynamic();
    if (conditions.length === 1) {
      countQuery = countQuery.where(conditions[0]);
    } else if (conditions.length > 1) {
      const { and } = await import("drizzle-orm");
      countQuery = countQuery.where(and(...conditions));
    }
    const [{ total }] = await countQuery;

    return c.json({
      rows,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  })

  // ── Admin: CSV export ──
  .get("/api/admin/signups/export", async (c) => {
    if (!isAdmin()) return c.json({ error: "Forbidden" }, 403);

    const rows = await db
      .select()
      .from(signups)
      .orderBy(desc(signups.created_at));

    const csv = [
      "id,email,source,created_at",
      ...rows.map(
        (r) => `${r.id},"${r.email}","${r.source}","${r.created_at}"`
      ),
    ].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=signups.csv",
      },
    });
  });

function isAdmin(): boolean {
  const adminEmail = vars.get("ADMIN_EMAIL");
  if (!adminEmail) return false;
  if (!auth.isAuthenticated()) return false;
  return auth.user.email === adminEmail;
}

export default app;
