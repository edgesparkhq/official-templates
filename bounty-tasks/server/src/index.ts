import { Hono } from "hono";
import { and, desc, eq, inArray, sql, gte, lte, isNull, asc } from "drizzle-orm";
import { db, storage, ctx, vars } from "edgespark";
import { auth } from "edgespark/http";
import {
  bounty_tasks,
  task_submissions,
  task_comments,
  comment_likes,
  user_profiles,
  user_notifications,
  countdown_settings,
  buckets,
} from "@defs";

// ---------- helpers ----------

// Admin is determined by the `ADMIN_EMAILS` runtime var (comma-separated, case-insensitive).
// Set it via `edgespark var set ADMIN_EMAILS "alice@acme.com,bob@acme.com"`.
const isCurrentUserAdmin = (): boolean => {
  if (!auth.user?.email) return false;
  const raw = vars.get("ADMIN_EMAILS");
  if (!raw) return false;
  const email = auth.user.email.toLowerCase();
  return raw
    .split(",")
    .some((e) => e.trim().toLowerCase() === email);
};

const requireAdmin = (c: any): Response | null => {
  if (!isCurrentUserAdmin()) {
    return c.json({ success: false, error: "Admin access required" }, 403);
  }
  return null;
};

/** Ensure a `user_profiles` row exists for the current user. No-op if already present. */
const ensureProfile = async (
  name: string | null,
  avatar: string | null
): Promise<void> => {
  if (!auth.user) return;
  const userId = auth.user.id;

  const [existing] = await db
    .select({ user_id: user_profiles.user_id })
    .from(user_profiles)
    .where(eq(user_profiles.user_id, userId))
    .limit(1);

  if (existing) return;

  await db.insert(user_profiles).values({
    user_id: userId,
    display_name: name,
    photo_url: avatar,
    participation_count: 0,
    award_count: 0,
  });
};

const isStoragePath = (value: string | null | undefined): value is string => {
  if (!value) return false;
  const t = value.trim();
  if (!t) return false;
  if (t.startsWith("http://") || t.startsWith("https://") || t.startsWith("data:")) return false;
  return true;
};

const extractExtension = (filename: string, contentType?: string): string => {
  const m = /\.([a-zA-Z0-9]{2,8})$/.exec(filename.trim());
  if (m) return m[1].toLowerCase();
  if (contentType?.includes("/")) {
    const [, sub] = contentType.split("/");
    if (sub) return sub.toLowerCase();
  }
  return "png";
};

const buildTaskCoverPath = (userId: string, extension: string): string => {
  const safeExt = extension.replace(/[^a-z0-9]/gi, "") || "png";
  const segment = userId || "anonymous";
  return `${segment}/${Date.now()}-${crypto.randomUUID().split("-")[0]}.${safeExt}`;
};

const resolveCoverUrl = async (
  cover: string | null | undefined
): Promise<{ cover_image: string | null; cover_image_path: string | null }> => {
  if (!cover) return { cover_image: null, cover_image_path: null };
  if (!isStoragePath(cover)) return { cover_image: cover, cover_image_path: null };
  try {
    const { downloadUrl } = await storage.from(buckets.taskcovers).createPresignedGetUrl(cover, 86400);
    return { cover_image: downloadUrl, cover_image_path: cover };
  } catch {
    return { cover_image: null, cover_image_path: cover };
  }
};

const sendNotification = async (
  userId: string,
  title: string,
  message: string,
  type: string,
  relatedTaskId: number | null = null,
  relatedSubmissionId: number | null = null
) => {
  await db.insert(user_notifications).values({
    user_id: userId,
    title,
    message,
    type,
    related_task_id: relatedTaskId,
    related_submission_id: relatedSubmissionId,
  });
};

const upsertProfileIncrementParticipation = async (
  userId: string,
  name: string | null,
  avatar: string | null
) => {
  const existing = await db.select().from(user_profiles).where(eq(user_profiles.user_id, userId)).limit(1);
  if (existing.length) {
    await db
      .update(user_profiles)
      .set({
        participation_count: sql`${user_profiles.participation_count} + 1`,
        updated_at: sql`(current_timestamp)`,
      })
      .where(eq(user_profiles.user_id, userId));
  } else {
    await db.insert(user_profiles).values({
      user_id: userId,
      display_name: name,
      photo_url: avatar,
      participation_count: 1,
      award_count: 0,
    });
  }
};

const incrementAwardCount = async (userId: string) => {
  const existing = await db.select({ id: user_profiles.user_id }).from(user_profiles).where(eq(user_profiles.user_id, userId)).limit(1);
  if (existing.length) {
    await db
      .update(user_profiles)
      .set({ award_count: sql`${user_profiles.award_count} + 1`, updated_at: sql`(current_timestamp)` })
      .where(eq(user_profiles.user_id, userId));
  } else {
    await db.insert(user_profiles).values({ user_id: userId, participation_count: 0, award_count: 1 });
  }
};

const isUserBlacklisted = async (userId: string): Promise<boolean> => {
  const r = await db.select({ b: user_profiles.is_blacklist }).from(user_profiles).where(eq(user_profiles.user_id, userId)).limit(1);
  return r.length ? r[0].b : false;
};

// ---------- app ----------

const app = new Hono()

  // ========== TASKS ==========

  .get("/api/public/tasks", async (c) => {
    const status = c.req.query("status");
    const dateFilter = c.req.query("date");
    const startDate = c.req.query("startDate") || "";
    const endDate = c.req.query("endDate") || "";
    const sortBy = c.req.query("sortBy") || "created_at";
    const order = (c.req.query("order") || "DESC").toUpperCase();
    const page = parseInt(c.req.query("page") || "1", 10);
    const limit = parseInt(c.req.query("limit") || "10", 10);
    const offset = (page - 1) * limit;

    const conds = [];
    if (status) conds.push(eq(bounty_tasks.status, status as any));
    if (dateFilter) conds.push(sql`date(${bounty_tasks.created_at}) = date(${dateFilter})`);
    else {
      if (startDate) conds.push(sql`date(${bounty_tasks.created_at}) >= ${startDate}`);
      if (endDate) conds.push(sql`date(${bounty_tasks.created_at}) <= ${endDate}`);
    }
    const whereExpr = conds.length ? and(...conds) : undefined;

    const [{ total } = { total: 0 }] = await db
      .select({ total: sql<number>`COUNT(*)` })
      .from(bounty_tasks)
      .where(whereExpr as any);

    const sortCol =
      sortBy === "reward_amount" ? bounty_tasks.reward_amount :
      sortBy === "updated_at" ? bounty_tasks.updated_at :
      bounty_tasks.created_at;
    const orderExpr = order === "ASC" ? asc(sortCol) : desc(sortCol);

    const rows = await db.select().from(bounty_tasks).where(whereExpr as any).orderBy(orderExpr).limit(limit).offset(offset);

    // Resolve cover URLs
    const withCovers = await Promise.all(
      rows.map(async (t) => {
        const { cover_image, cover_image_path } = await resolveCoverUrl(t.cover_image);
        return { ...t, cover_image, cover_image_path };
      })
    );

    // Winning submissions + force-close inconsistent tasks
    const taskIds = rows.map((r) => r.id);
    let winningSubmissions: any[] = [];
    const toClose: number[] = [];
    if (taskIds.length) {
      winningSubmissions = await db
        .select({ task_id: task_submissions.task_id, project_url: task_submissions.project_url, submitter_name: task_submissions.submitter_name })
        .from(task_submissions)
        .where(and(inArray(task_submissions.task_id, taskIds), eq(task_submissions.submission_status, "awarded")));

      for (const ws of winningSubmissions) {
        const t = withCovers.find((x) => x.id === ws.task_id);
        if (t && t.status !== "Closed") toClose.push(t.id);
      }
      if (toClose.length) {
        await db.update(bounty_tasks).set({ status: "Closed", updated_at: sql`(current_timestamp)` }).where(inArray(bounty_tasks.id, toClose));
        for (const t of withCovers) if (toClose.includes(t.id)) t.status = "Closed";
      }
    }

    // Participant counts
    const enriched = await Promise.all(
      withCovers.map(async (t) => {
        const [{ cnt } = { cnt: 0 }] = await db
          .select({ cnt: sql<number>`COUNT(*)` })
          .from(task_submissions)
          .where(eq(task_submissions.task_id, t.id));
        if (t.participants_count !== cnt) {
          await db.update(bounty_tasks).set({ participants_count: cnt }).where(eq(bounty_tasks.id, t.id));
        }
        return {
          ...t,
          participants_count: cnt,
          display_participants_count: (t.initial_participants_count || 0) + cnt,
        };
      })
    );

    const dateRows = await db
      .select({ date: sql<string>`date(${bounty_tasks.created_at})` })
      .from(bounty_tasks)
      .groupBy(sql`date(${bounty_tasks.created_at})`)
      .orderBy(sql`date(${bounty_tasks.created_at}) DESC`);
    const availableDates = dateRows.map((r) => r.date);

    const statsConds = [];
    if (startDate) statsConds.push(sql`date(${bounty_tasks.created_at}) >= ${startDate}`);
    if (endDate) statsConds.push(sql`date(${bounty_tasks.created_at}) <= ${endDate}`);
    const statsRows = await db
      .select({ status: bounty_tasks.status, count: sql<number>`COUNT(*)` })
      .from(bounty_tasks)
      .where(statsConds.length ? and(...statsConds) : undefined)
      .groupBy(bounty_tasks.status);
    const statusStats: Record<string, number> = { Open: 0, Pending: 0, Closed: 0 };
    for (const s of statsRows) statusStats[s.status] = s.count;

    return c.json({
      success: true,
      tasks: enriched,
      pagination: { totalTasks: total, currentPage: page, totalPages: Math.ceil(total / limit), limit },
      availableDates,
      winningSubmissions,
      statusStats,
    });
  })

  .post("/api/tasks", async (c) => {
    const forbidden = requireAdmin(c);
    if (forbidden) return forbidden;
    const body = await c.req.json<any>();
    const { title, description, cover_image, cover_image_path, reward_amount, created_at, winner_url, participants_count, initial_participants_count } = body;
    if (!title || !description || reward_amount == null) {
      return c.json({ success: false, error: "title, description, reward_amount are required" }, 400);
    }
    const pathCand = typeof cover_image_path === "string" && cover_image_path.trim() ? cover_image_path.trim() : null;
    const urlCand = typeof cover_image === "string" && cover_image.trim() ? cover_image.trim() : null;
    const normalizedCover = pathCand || urlCand || null;
    const taskStatus: "Open" | "Closed" = winner_url ? "Closed" : "Open";

    const values: any = {
      title,
      description,
      cover_image: normalizedCover,
      reward_amount: Number(reward_amount),
      status: taskStatus,
      creator_id: auth.user!.id,
      winner_url: winner_url || null,
      participants_count: participants_count || 0,
      initial_participants_count: initial_participants_count || 0,
    };
    if (created_at) {
      values.created_at = created_at;
      values.updated_at = created_at;
    }
    const [row] = await db.insert(bounty_tasks).values(values).returning({ id: bounty_tasks.id });
    return c.json({ success: true, taskId: row.id });
  })

  .put("/api/tasks/:taskId", async (c) => {
    const forbidden = requireAdmin(c);
    if (forbidden) return forbidden;
    const taskId = parseInt(c.req.param("taskId"), 10);
    if (!Number.isFinite(taskId)) return c.json({ success: false, error: "invalid task id" }, 400);
    const updatesRaw = await c.req.json<any>();

    const hasCoverField = Object.prototype.hasOwnProperty.call(updatesRaw, "cover_image") || Object.prototype.hasOwnProperty.call(updatesRaw, "cover_image_path");
    const pathCand = typeof updatesRaw.cover_image_path === "string" && updatesRaw.cover_image_path.trim() ? updatesRaw.cover_image_path.trim() : null;
    const urlCand = typeof updatesRaw.cover_image === "string" && updatesRaw.cover_image.trim() ? updatesRaw.cover_image.trim() : null;

    const allowed = new Set([
      "title", "description", "cover_image", "reward_amount", "status", "winner_url",
      "winner_submission_id", "participants_count", "initial_participants_count", "created_at",
    ]);
    const updates: Record<string, any> = {};
    for (const k of Object.keys(updatesRaw)) if (allowed.has(k)) updates[k] = updatesRaw[k] === undefined ? null : updatesRaw[k];
    if (hasCoverField) updates.cover_image = pathCand || urlCand || null;
    delete updates.cover_image_path;

    // Auto-close when winner_url newly set
    if (updates.winner_url && String(updates.winner_url).trim() && !updates.status) {
      const [cur] = await db.select({ w: bounty_tasks.winner_url }).from(bounty_tasks).where(eq(bounty_tasks.id, taskId));
      if (!cur?.w || String(cur.w).trim() === "") updates.status = "Closed";
    }

    if (!updates.created_at) updates.updated_at = sql`(current_timestamp)`;
    if (Object.keys(updates).length === 0) return c.json({ success: true });

    await db.update(bounty_tasks).set(updates).where(eq(bounty_tasks.id, taskId));
    return c.json({ success: true });
  })

  .delete("/api/tasks/:taskId", async (c) => {
    const forbidden = requireAdmin(c);
    if (forbidden) return forbidden;
    const taskId = parseInt(c.req.param("taskId"), 10);
    if (!Number.isFinite(taskId)) return c.json({ success: false, error: "invalid task id" }, 400);
    await db.batch([
      db.delete(user_notifications).where(eq(user_notifications.related_task_id, taskId)),
      db.delete(task_comments).where(eq(task_comments.task_id, taskId)),
      db.delete(task_submissions).where(eq(task_submissions.task_id, taskId)),
      db.delete(bounty_tasks).where(eq(bounty_tasks.id, taskId)),
    ]);
    return c.json({ success: true });
  })

  // ========== SUBMISSIONS ==========

  .get("/api/public/submissions", async (c) => {
    const taskIdParam = c.req.query("taskId");
    const checkSubmitted = c.req.query("checkSubmitted") === "true";
    const submitterId = c.req.query("submitterId") || auth.user?.id || "";

    if (checkSubmitted && taskIdParam) {
      if (!auth.user) return c.json({ success: true, hasSubmitted: false });
      const existing = await db
        .select({ id: task_submissions.id })
        .from(task_submissions)
        .where(and(eq(task_submissions.task_id, parseInt(taskIdParam, 10)), eq(task_submissions.submitter_id, auth.user.id)))
        .limit(1);
      return c.json({ success: true, hasSubmitted: existing.length > 0 });
    }

    const rows = await db
      .select({
        id: task_submissions.id,
        task_id: task_submissions.task_id,
        submitter_id: task_submissions.submitter_id,
        submitter_name: task_submissions.submitter_name,
        submitter_avatar: task_submissions.submitter_avatar,
        project_url: task_submissions.project_url,
        social_media_url: task_submissions.social_media_url,
        submission_status: task_submissions.submission_status,
        notes: task_submissions.notes,
        created_at: task_submissions.created_at,
        submitted_at: task_submissions.created_at,
        task_title: bounty_tasks.title,
        reward_amount: bounty_tasks.reward_amount,
        task_status: bounty_tasks.status,
      })
      .from(task_submissions)
      .innerJoin(bounty_tasks, eq(task_submissions.task_id, bounty_tasks.id))
      .where(
        taskIdParam
          ? eq(task_submissions.task_id, parseInt(taskIdParam, 10))
          : submitterId
          ? eq(task_submissions.submitter_id, submitterId)
          : undefined as any
      )
      .orderBy(desc(task_submissions.created_at));

    return c.json({ success: true, submissions: rows });
  })

  .post("/api/submissions", async (c) => {
    const userId = auth.user!.id;
    if (await isUserBlacklisted(userId)) {
      return c.json({ success: false, error: "You have triggered the Policy on Malicious Submissions. For inquiries, please contact the official team." }, 403);
    }
    const body = await c.req.json<any>();
    const { task_id, project_url, social_media_url, submitter_name, submitter_avatar } = body;
    if (!task_id || !project_url) return c.json({ success: false, error: "task_id and project_url are required" }, 400);
    const taskIdInt = parseInt(task_id, 10);
    if (!Number.isFinite(taskIdInt)) return c.json({ success: false, error: "invalid task id" }, 400);

    const existing = await db
      .select({ id: task_submissions.id, s: task_submissions.submission_status })
      .from(task_submissions)
      .where(and(eq(task_submissions.task_id, taskIdInt), eq(task_submissions.submitter_id, userId)))
      .limit(1);

    if (existing.length) {
      const s = existing[0].s;
      if (s === "submitted" || s === "awarded") {
        return c.json({ success: false, error: s === "awarded" ? "Your submission already won." : "You already submitted; awaiting review." }, 400);
      }
    }

    const [task] = await db.select({ id: bounty_tasks.id, status: bounty_tasks.status }).from(bounty_tasks).where(eq(bounty_tasks.id, taskIdInt)).limit(1);
    if (!task) return c.json({ success: false, error: "Task not found" }, 404);
    if (task.status !== "Open") return c.json({ success: false, error: "Task is closed" }, 400);

    const name = submitter_name || auth.user!.name || auth.user!.email || "Anonymous";
    const avatar = submitter_avatar || auth.user!.image || null;

    if (existing.length && existing[0].s === "not_awarded") {
      await db
        .update(task_submissions)
        .set({
          project_url,
          social_media_url: social_media_url ?? null,
          submitter_name: name,
          submitter_avatar: avatar,
          submission_status: "submitted",
          notes: null,
          updated_at: sql`(current_timestamp)`,
        })
        .where(eq(task_submissions.id, existing[0].id));
      return c.json({ success: true, submissionId: existing[0].id, isResubmission: true });
    }

    const [ins] = await db
      .insert(task_submissions)
      .values({
        task_id: taskIdInt,
        submitter_id: userId,
        submitter_name: name,
        submitter_avatar: avatar,
        project_url,
        social_media_url: social_media_url ?? null,
        submission_status: "submitted",
      })
      .returning({ id: task_submissions.id });

    await db
      .update(bounty_tasks)
      .set({ participants_count: sql`${bounty_tasks.participants_count} + 1` })
      .where(eq(bounty_tasks.id, taskIdInt));

    ctx.runInBackground(upsertProfileIncrementParticipation(userId, name, avatar));

    return c.json({ success: true, submissionId: ins.id, isResubmission: false });
  })

  .put("/api/submissions/:id/edit", async (c) => {
    const id = parseInt(c.req.param("id"), 10);
    if (!Number.isFinite(id)) return c.json({ success: false, error: "invalid id" }, 400);
    const { project_url, social_media_url } = await c.req.json<any>();

    const [row] = await db
      .select({
        submitter_id: task_submissions.submitter_id,
        task_status: bounty_tasks.status,
      })
      .from(task_submissions)
      .innerJoin(bounty_tasks, eq(task_submissions.task_id, bounty_tasks.id))
      .where(eq(task_submissions.id, id))
      .limit(1);
    if (!row) return c.json({ success: false, error: "Submission not found" }, 404);

    const isAdmin = isCurrentUserAdmin();
    if (!isAdmin) {
      if (row.submitter_id !== auth.user!.id) return c.json({ success: false, error: "Can only edit your own submission" }, 403);
      if (row.task_status !== "Open") return c.json({ success: false, error: "Task is closed" }, 400);
    }

    await db
      .update(task_submissions)
      .set({ project_url: project_url ?? null, social_media_url: social_media_url ?? null, updated_at: sql`(current_timestamp)` })
      .where(eq(task_submissions.id, id));
    return c.json({ success: true });
  })

  .put("/api/submissions/:id", async (c) => {
    const forbidden = requireAdmin(c);
    if (forbidden) return forbidden;
    const id = parseInt(c.req.param("id"), 10);
    if (!Number.isFinite(id)) return c.json({ success: false, error: "invalid id" }, 400);
    const { submission_status, notes } = await c.req.json<any>();

    const [sub] = await db
      .select({ task_id: task_submissions.task_id, submitter_id: task_submissions.submitter_id, project_url: task_submissions.project_url, notes: task_submissions.notes, status: task_submissions.submission_status })
      .from(task_submissions)
      .where(eq(task_submissions.id, id))
      .limit(1);
    if (!sub) return c.json({ success: false, error: "Submission not found" }, 404);

    if (submission_status === "awarded") {
      await db
        .update(task_submissions)
        .set({ submission_status: "not_awarded" })
        .where(and(eq(task_submissions.task_id, sub.task_id), sql`${task_submissions.id} != ${id}`, inArray(task_submissions.submission_status, ["awarded", "submitted"])));
      const finalNotes = notes !== undefined && notes !== "" ? notes : sub.notes;
      await db.update(task_submissions).set({ submission_status: "awarded", notes: finalNotes, updated_at: sql`(current_timestamp)` }).where(eq(task_submissions.id, id));
      await db
        .update(bounty_tasks)
        .set({ status: "Closed", winner_url: sub.project_url || null, winner_submission_id: id, updated_at: sql`(current_timestamp)` })
        .where(eq(bounty_tasks.id, sub.task_id));
      await incrementAwardCount(sub.submitter_id);
      const [task] = await db.select({ title: bounty_tasks.title }).from(bounty_tasks).where(eq(bounty_tasks.id, sub.task_id)).limit(1);
      if (task) await sendNotification(sub.submitter_id, "🎉 Congratulations on Your Award!", `Your submission for "${task.title}" has been awarded!`, "award", sub.task_id, id);
    } else {
      const finalNotes = notes !== undefined && notes !== "" ? notes : sub.notes;
      await db.update(task_submissions).set({ submission_status, notes: finalNotes, updated_at: sql`(current_timestamp)` }).where(eq(task_submissions.id, id));
      if (sub.status === "awarded" && submission_status !== "awarded") {
        const other = await db
          .select({ id: task_submissions.id })
          .from(task_submissions)
          .where(and(eq(task_submissions.task_id, sub.task_id), eq(task_submissions.submission_status, "awarded")))
          .limit(1);
        if (!other.length) {
          await db.update(bounty_tasks).set({ winner_url: null, winner_submission_id: null, updated_at: sql`(current_timestamp)` }).where(eq(bounty_tasks.id, sub.task_id));
        }
      }
    }
    return c.json({ success: true });
  })

  .delete("/api/submissions/:id", async (c) => {
    const forbidden = requireAdmin(c);
    if (forbidden) return forbidden;
    const id = parseInt(c.req.param("id"), 10);
    if (!Number.isFinite(id)) return c.json({ success: false, error: "invalid id" }, 400);

    const [sub] = await db.select().from(task_submissions).where(eq(task_submissions.id, id)).limit(1);
    if (!sub) return c.json({ success: false, error: "Submission not found" }, 404);

    const wasAwarded = sub.submission_status === "awarded";
    await db.batch([
      db.delete(user_notifications).where(eq(user_notifications.related_submission_id, id)),
      db.delete(task_submissions).where(eq(task_submissions.id, id)),
    ]);
    await db
      .update(bounty_tasks)
      .set({ participants_count: sql`CASE WHEN ${bounty_tasks.participants_count} > 0 THEN ${bounty_tasks.participants_count} - 1 ELSE 0 END` })
      .where(eq(bounty_tasks.id, sub.task_id));
    if (wasAwarded) {
      const other = await db.select({ id: task_submissions.id }).from(task_submissions).where(and(eq(task_submissions.task_id, sub.task_id), eq(task_submissions.submission_status, "awarded"))).limit(1);
      if (!other.length) {
        await db.update(bounty_tasks).set({ winner_url: null, winner_submission_id: null, updated_at: sql`(current_timestamp)` }).where(eq(bounty_tasks.id, sub.task_id));
      }
    }
    const [task] = await db.select({ title: bounty_tasks.title }).from(bounty_tasks).where(eq(bounty_tasks.id, sub.task_id)).limit(1);
    if (task) await sendNotification(sub.submitter_id, "📋 Submission Removed", `Your submission for "${task.title}" has been removed by the administrator.`, "system", sub.task_id, null);
    return c.json({ success: true });
  })

  .put("/api/submissions/batch", async (c) => {
    const forbidden = requireAdmin(c);
    if (forbidden) return forbidden;
    const { submission_ids, submission_status, task_id } = await c.req.json<any>();
    if (!Array.isArray(submission_ids) || submission_ids.length === 0) return c.json({ success: false, error: "submission_ids is required" }, 400);
    if (!["awarded", "not_awarded"].includes(submission_status)) return c.json({ success: false, error: "Invalid status" }, 400);

    const ids: number[] = submission_ids.map((x: any) => parseInt(x, 10));
    if (ids.some((n) => !Number.isFinite(n))) return c.json({ success: false, error: "Invalid submission id(s)" }, 400);

    if (submission_status === "awarded" && ids.length > 1) {
      return c.json({ success: false, error: "Each task can have only one awarded submission." }, 400);
    }

    const exist = await db.select({ id: task_submissions.id, task_id: task_submissions.task_id }).from(task_submissions).where(inArray(task_submissions.id, ids));
    if (exist.length !== ids.length) {
      const found = new Set(exist.map((r) => r.id));
      const missing = ids.filter((n) => !found.has(n));
      return c.json({ success: false, error: `Submission(s) not found: ${missing.join(", ")}` }, 404);
    }
    if (task_id) {
      const wrong = exist.find((r) => r.task_id !== task_id);
      if (wrong) return c.json({ success: false, error: "All submissions must belong to the same task" }, 400);
    }

    const defaultNotes =
      submission_status === "awarded"
        ? "Congratulations! Your project performed excellently in this task and has been recognized by the review committee."
        : "Thank you for your participation and efforts!";

    if (submission_status === "awarded" && task_id) {
      await db
        .update(task_submissions)
        .set({ submission_status: "not_awarded" })
        .where(and(eq(task_submissions.task_id, task_id), sql`${task_submissions.id} NOT IN (${sql.join(ids.map((n) => sql`${n}`), sql`, `)})`, inArray(task_submissions.submission_status, ["awarded", "submitted"])));
    }

    await db
      .update(task_submissions)
      .set({ submission_status, notes: defaultNotes, updated_at: sql`(current_timestamp)` })
      .where(inArray(task_submissions.id, ids));

    if (submission_status === "awarded" && task_id && ids.length === 1) {
      const [sub] = await db.select({ submitter_id: task_submissions.submitter_id, project_url: task_submissions.project_url }).from(task_submissions).where(eq(task_submissions.id, ids[0])).limit(1);
      if (sub) {
        await db
          .update(bounty_tasks)
          .set({ status: "Closed", winner_url: sub.project_url || null, winner_submission_id: sub.submitter_id as any, updated_at: sql`(current_timestamp)` })
          .where(eq(bounty_tasks.id, task_id));
        await incrementAwardCount(sub.submitter_id);
        const [task] = await db.select({ title: bounty_tasks.title }).from(bounty_tasks).where(eq(bounty_tasks.id, task_id)).limit(1);
        if (task) await sendNotification(sub.submitter_id, "🎉 Congratulations on Your Award!", `Your submission for "${task.title}" has been awarded!`, "award", task_id, ids[0]);
      }
    }

    return c.json({ success: true, message: `Updated ${ids.length} submission(s)` });
  })

  // ========== COMMENTS ==========

  .get("/api/public/comments", async (c) => {
    const taskIdParam = c.req.query("taskId");
    const latestOnly = c.req.query("latestOnly") === "true";
    const countOnly = c.req.query("countOnly") === "true";
    if (!taskIdParam) return c.json({ success: false, error: "Task ID required" }, 400);
    const taskId = parseInt(taskIdParam, 10);

    const [{ total } = { total: 0 }] = await db
      .select({ total: sql<number>`COUNT(*)` })
      .from(task_comments)
      .where(eq(task_comments.task_id, taskId));

    if (countOnly) return c.json({ success: true, totalComments: total });

    const base = db
      .select({
        id: task_comments.id,
        task_id: task_comments.task_id,
        commenter_id: task_comments.commenter_id,
        commenter_name: task_comments.commenter_name,
        commenter_avatar: task_comments.commenter_avatar,
        content: task_comments.content,
        parent_id: task_comments.parent_id,
        created_at: task_comments.created_at,
        likes_count: sql<number>`(SELECT COUNT(*) FROM ${comment_likes} WHERE ${comment_likes.comment_id} = ${task_comments.id})`,
      })
      .from(task_comments);

    const comments = latestOnly
      ? await base.where(and(eq(task_comments.task_id, taskId), isNull(task_comments.parent_id))).orderBy(desc(task_comments.created_at)).limit(1)
      : await base.where(eq(task_comments.task_id, taskId)).orderBy(desc(task_comments.created_at));

    return c.json({ success: true, comments, totalComments: total });
  })

  .post("/api/comments", async (c) => {
    const body = await c.req.json<any>();
    const { task_id, content, commenter_name, commenter_avatar, parent_id } = body;
    if (!task_id || !content) return c.json({ success: false, error: "task_id and content are required" }, 400);
    const [row] = await db
      .insert(task_comments)
      .values({
        task_id: parseInt(task_id, 10),
        commenter_id: auth.user!.id,
        commenter_name: commenter_name || auth.user!.name || auth.user!.email || "Anonymous",
        commenter_avatar: commenter_avatar || auth.user!.image || null,
        content,
        parent_id: parent_id ? parseInt(parent_id, 10) : null,
      })
      .returning({ id: task_comments.id });
    return c.json({ success: true, commentId: row.id });
  })

  .post("/api/comments/like", async (c) => {
    const { comment_id } = await c.req.json<any>();
    if (!comment_id) return c.json({ success: false, error: "comment_id is required" }, 400);
    const userId = auth.user!.id;
    const existing = await db
      .select({ id: comment_likes.id })
      .from(comment_likes)
      .where(and(eq(comment_likes.comment_id, comment_id), eq(comment_likes.user_id, userId)))
      .limit(1);
    if (existing.length) {
      await db.delete(comment_likes).where(and(eq(comment_likes.comment_id, comment_id), eq(comment_likes.user_id, userId)));
      await db.update(task_comments).set({ likes_count: sql`CASE WHEN ${task_comments.likes_count} > 0 THEN ${task_comments.likes_count} - 1 ELSE 0 END` }).where(eq(task_comments.id, comment_id));
      return c.json({ success: true, action: "unliked" });
    }
    await db.insert(comment_likes).values({ comment_id, user_id: userId });
    await db.update(task_comments).set({ likes_count: sql`${task_comments.likes_count} + 1` }).where(eq(task_comments.id, comment_id));
    return c.json({ success: true, action: "liked" });
  })

  // ========== ADMIN ==========

  .get("/api/admin/check", async (c) => {
    return c.json({ success: true, isAdmin: isCurrentUserAdmin() });
  })

  .put("/api/admin/users/:id/blacklist", async (c) => {
    const forbidden = requireAdmin(c);
    if (forbidden) return forbidden;
    const targetId = c.req.param("id");
    const { action } = await c.req.json<any>();
    const status = action === "blacklist";

    const existing = await db.select({ id: user_profiles.user_id }).from(user_profiles).where(eq(user_profiles.user_id, targetId)).limit(1);
    if (existing.length) {
      await db.update(user_profiles).set({ is_blacklist: status, updated_at: sql`(current_timestamp)` }).where(eq(user_profiles.user_id, targetId));
    } else {
      await db.insert(user_profiles).values({ user_id: targetId, is_blacklist: status, participation_count: 0, award_count: 0 });
    }
    return c.json({ success: true, message: status ? "User blacklisted" : "User removed from blacklist", blacklistStatus: status });
  })

  .get("/api/admin/users", async (c) => {
    const forbidden = requireAdmin(c);
    if (forbidden) return forbidden;
    const page = parseInt(c.req.query("page") || "1", 10);
    const limit = parseInt(c.req.query("limit") || "10", 10);
    const offset = (page - 1) * limit;

    const [{ total } = { total: 0 }] = await db.select({ total: sql<number>`COUNT(*)` }).from(user_profiles);

    const rows = await db
      .select({
        user_id: user_profiles.user_id,
        display_name: user_profiles.display_name,
        photo_url: user_profiles.photo_url,
        participation_count: user_profiles.participation_count,
        award_count: user_profiles.award_count,
        is_blacklist: user_profiles.is_blacklist,
        profile_created_at: user_profiles.created_at,
        last_submission_date: sql<string | null>`(SELECT MAX(${task_submissions.created_at}) FROM ${task_submissions} WHERE ${task_submissions.submitter_id} = ${user_profiles.user_id})`,
        submitter_name: sql<string | null>`(SELECT ${task_submissions.submitter_name} FROM ${task_submissions} WHERE ${task_submissions.submitter_id} = ${user_profiles.user_id} ORDER BY ${task_submissions.created_at} DESC LIMIT 1)`,
        submitter_avatar: sql<string | null>`(SELECT ${task_submissions.submitter_avatar} FROM ${task_submissions} WHERE ${task_submissions.submitter_id} = ${user_profiles.user_id} ORDER BY ${task_submissions.created_at} DESC LIMIT 1)`,
      })
      .from(user_profiles)
      .orderBy(desc(user_profiles.created_at))
      .limit(limit)
      .offset(offset);

    const users = rows.map((u) => ({
      userYwId: u.user_id,
      userName: u.display_name || u.submitter_name || "Unknown",
      userAvatar: u.photo_url || u.submitter_avatar,
      participationCount: u.participation_count || 0,
      awardCount: u.award_count || 0,
      isBlacklisted: u.is_blacklist,
      lastSubmissionDate: u.last_submission_date,
      profileCreatedAt: u.profile_created_at,
    }));

    const totalPages = Math.ceil(total / limit);
    return c.json({
      success: true,
      users,
      pagination: { currentPage: page, totalPages, totalUsers: total, limit, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    });
  })

  // ========== PROFILE ==========

  .get("/api/profile", async (c) => {
    const userId = auth.user!.id;
    const [row] = await db.select().from(user_profiles).where(eq(user_profiles.user_id, userId)).limit(1);
    if (!row) {
      return c.json({
        success: true,
        profile: { discord_id: "", paypal_email: "", age_range: "", profession: "", bio: "", participation_count: 0, award_count: 0 },
      });
    }
    return c.json({
      success: true,
      profile: {
        discord_id: row.discord_id || "",
        paypal_email: row.paypal_email || "",
        age_range: row.age_range || "",
        profession: row.profession || "",
        bio: row.bio || "",
        participation_count: row.participation_count || 0,
        award_count: row.award_count || 0,
      },
    });
  })

  .put("/api/profile", async (c) => {
    const userId = auth.user!.id;
    const body = await c.req.json<any>();
    const data = {
      discord_id: body.discord_id || null,
      paypal_email: body.paypal_email || null,
      age_range: body.age_range || null,
      profession: body.profession || null,
      bio: body.bio || null,
    };
    const existing = await db.select({ id: user_profiles.user_id }).from(user_profiles).where(eq(user_profiles.user_id, userId)).limit(1);
    if (existing.length) {
      await db.update(user_profiles).set({ ...data, updated_at: sql`(current_timestamp)` }).where(eq(user_profiles.user_id, userId));
    } else {
      await db.insert(user_profiles).values({
        user_id: userId,
        display_name: auth.user!.name || null,
        photo_url: auth.user!.image || null,
        ...data,
        participation_count: 0,
        award_count: 0,
      });
    }
    return c.json({ success: true });
  })

  // ========== COUNTDOWN ==========

  .get("/api/public/countdown/settings", async (c) => {
    const [row] = await db
      .select()
      .from(countdown_settings)
      .where(eq(countdown_settings.is_active, true))
      .orderBy(desc(countdown_settings.created_at))
      .limit(1);
    if (!row) {
      return c.json({
        success: true,
        settings: {
          event_name: "Open Task Participation",
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          timezone: "UTC",
          is_active: true,
        },
      });
    }
    return c.json({ success: true, settings: row });
  })

  .post("/api/countdown/settings", async (c) => {
    const forbidden = requireAdmin(c);
    if (forbidden) return forbidden;
    const { event_name, start_time, end_time } = await c.req.json<any>();
    if (!start_time || !end_time) return c.json({ success: false, error: "start_time and end_time required" }, 400);
    const sd = new Date(start_time);
    const ed = new Date(end_time);
    if (isNaN(sd.getTime()) || isNaN(ed.getTime())) return c.json({ success: false, error: "Invalid date format" }, 400);
    if (ed <= sd) return c.json({ success: false, error: "end_time must be after start_time" }, 400);

    await db.update(countdown_settings).set({ is_active: false, updated_at: sql`(current_timestamp)` });
    await db.insert(countdown_settings).values({
      event_name: event_name || "Open Task Participation",
      start_time: sd.toISOString(),
      end_time: ed.toISOString(),
      timezone: "UTC",
      is_active: true,
      created_by: auth.user!.id,
    });
    return c.json({ success: true, message: "Countdown settings updated" });
  })

  // ========== NOTIFICATIONS ==========

  .get("/api/notifications", async (c) => {
    const userId = auth.user!.id;
    const page = parseInt(c.req.query("page") || "1", 10);
    const limit = parseInt(c.req.query("limit") || "20", 10);
    const offset = (page - 1) * limit;

    const rows = await db
      .select({
        id: user_notifications.id,
        user_id: user_notifications.user_id,
        title: user_notifications.title,
        message: user_notifications.message,
        type: user_notifications.type,
        related_task_id: user_notifications.related_task_id,
        related_submission_id: user_notifications.related_submission_id,
        is_read: user_notifications.is_read,
        created_at: user_notifications.created_at,
        task_title: bounty_tasks.title,
      })
      .from(user_notifications)
      .leftJoin(bounty_tasks, eq(user_notifications.related_task_id, bounty_tasks.id))
      .where(eq(user_notifications.user_id, userId))
      .orderBy(desc(user_notifications.created_at))
      .limit(limit)
      .offset(offset);

    const [{ total } = { total: 0 }] = await db
      .select({ total: sql<number>`COUNT(*)` })
      .from(user_notifications)
      .where(eq(user_notifications.user_id, userId));

    return c.json({
      success: true,
      notifications: rows,
      pagination: { currentPage: page, totalPages: Math.ceil(total / limit), total, limit },
    });
  })

  .post("/api/notifications/read", async (c) => {
    const userId = auth.user!.id;
    const { notificationId } = await c.req.json<any>();
    if (!notificationId) return c.json({ success: false, error: "notificationId required" }, 400);
    await db
      .update(user_notifications)
      .set({ is_read: true })
      .where(and(eq(user_notifications.id, notificationId), eq(user_notifications.user_id, userId)));
    return c.json({ success: true });
  })

  .get("/api/notifications/unread-count", async (c) => {
    const userId = auth.user!.id;
    const [{ cnt } = { cnt: 0 }] = await db
      .select({ cnt: sql<number>`COUNT(*)` })
      .from(user_notifications)
      .where(and(eq(user_notifications.user_id, userId), eq(user_notifications.is_read, false)));
    return c.json({ success: true, unreadCount: cnt });
  })

  // ========== STORAGE ==========

  .post("/api/upload/image", async (c) => {
    const { filename, contentType } = await c.req.json<any>();
    if (!filename || typeof filename !== "string") return c.json({ success: false, error: "filename required" }, 400);
    const ct = typeof contentType === "string" ? contentType : undefined;
    if (ct && !ct.startsWith("image/")) return c.json({ success: false, error: "image/* only" }, 400);

    const ext = extractExtension(filename, ct);
    const path = buildTaskCoverPath(auth.user!.id, ext);
    const bucket = storage.from(buckets.taskcovers);
    const { uploadUrl, requiredHeaders } = await bucket.createPresignedPutUrl(path, 3600, {
      contentType: ct || `image/${ext}`,
      cacheControl: "public, max-age=86400",
    });
    const { downloadUrl } = await bucket.createPresignedGetUrl(path, 3600);
    return c.json({ success: true, uploadUrl, requiredHeaders, filePath: path, previewUrl: downloadUrl });
  })

  .post("/api/storage/download-url", async (c) => {
    const { key } = await c.req.json<any>();
    if (!key || typeof key !== "string") return c.json({ success: false, error: "key required" }, 400);
    if (!isStoragePath(key)) return c.json({ success: true, url: key });
    const { downloadUrl } = await storage.from(buckets.taskcovers).createPresignedGetUrl(key, 3600);
    return c.json({ success: true, url: downloadUrl });
  })

  // ========== USER INFO ==========

  .get("/api/public/me", async (c) => {
    if (!auth.user) return c.json({ success: true, user: null });
    await ensureProfile(auth.user.name ?? null, auth.user.image ?? null);
    return c.json({
      success: true,
      user: {
        id: auth.user.id,
        email: auth.user.email,
        display_name: auth.user.name,
        photo_url: auth.user.image,
        isAdmin: isCurrentUserAdmin(),
      },
    });
  });

export default app;
