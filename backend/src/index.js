import "dotenv/config";
import express from "express";
import "express-async-errors";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 24)
  throw new Error("JWT_SECRET missing or too short");

const db = new PrismaClient(),
  app = express();
const POINTS = { win: 3, draw: 1, loss: 0 }; // used only by /api/standings (match based table)
const STATUS = ["UPCOMING", "LIVE", "FINAL"],
  CATS = [
    "General",
    "Schedule Change",
    "Venue Change",
    "Match Result",
    "Emergency Notice",
  ];

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json({ limit: "10kb" }));
app.use(rateLimit({ windowMs: 60000, limit: 120 }));

const bad = (res, m) => res.status(400).json({ error: m });
const str = (v, max) =>
  typeof v === "string" && v.trim().length > 0 && v.length <= max;
const auth = (req, res, next) => {
  try {
    req.admin = jwt.verify(
      (req.headers.authorization || "").replace("Bearer ", ""),
      process.env.JWT_SECRET,
    );
    next();
  } catch {
    res.status(401).json({ error: "Login required" });
  }
};
const inc = { sport: true, teamA: true, teamB: true };
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const GCATS = ["Cricket", "Football", "Basketball", "Volleyball", "Tug of War", "Chess", "Table Tennis", "Carrom", "Opening Ceremony", "Prize Distribution", "General"];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_q, f, cb) => cb(null, ["image/jpeg", "image/png", "image/webp"].includes(f.mimetype)),
});

/* ---------- login ---------- */
app.post(
  "/api/auth/login",
  rateLimit({ windowMs: 15 * 60000, limit: 10 }),
  async (req, res) => {
    const { email, password } = req.body || {};
    if (!str(email, 100) || !str(password, 100))
      return bad(res, "Email and password required");
    const a = await db.admin.findUnique({ where: { email } });
    if (!a || !(await bcrypt.compare(password, a.password)))
      return res.status(401).json({ error: "Wrong email or password" });
    res.json({
      token: jwt.sign({ id: a.id, role: a.role }, process.env.JWT_SECRET, {
        expiresIn: "12h",
      }),
    });
  },
);

/* ---------- departments and sports ---------- */
app.get("/api/meta", async (_q, res) =>
  res.json({
    departments: await db.department.findMany({ orderBy: { id: "asc" } }),
    sports: await db.sport.findMany({ orderBy: { id: "asc" } }),
  }),
);

/* ---------- matches ---------- */
app.get("/api/matches", async (_q, res) =>
  res.json(
    await db.match.findMany({ include: inc, orderBy: { matchTime: "asc" } }),
  ),
);
app.get("/api/matches/:id", async (req, res) => {
  const m = await db.match.findUnique({
    where: { id: +req.params.id },
    include: { ...inc, events: { orderBy: { createdAt: "asc" } } },
  });
  m ? res.json(m) : res.status(404).json({ error: "Not found" });
});
app.post("/api/matches", auth, async (req, res) => {
  const { sportId, teamAId, teamBId, venue, matchTime } = req.body || {};
  if (
    ![sportId, teamAId, teamBId].every(Number.isInteger) ||
    teamAId === teamBId ||
    !str(venue, 80) ||
    isNaN(Date.parse(matchTime))
  )
    return bad(res, "Invalid match data");
  res.status(201).json(
    await db.match.create({
      data: {
        sportId,
        teamAId,
        teamBId,
        venue,
        matchTime: new Date(matchTime),
      },
    }),
  );
});
app.patch("/api/matches/:id", auth, async (req, res) => {
  const x = req.body || {},
    data = {};
  for (const k of ["scoreA", "scoreB"])
    if (x[k] !== undefined) {
      if (!Number.isInteger(x[k]) || x[k] < 0) return bad(res, "Bad score");
      data[k] = x[k];
    }
  for (const k of ["sportId", "teamAId", "teamBId"])
    if (x[k] !== undefined) {
      if (!Number.isInteger(x[k])) return bad(res, "Bad " + k);
      data[k] = x[k];
    }
  if (x.status !== undefined) {
    if (!STATUS.includes(x.status)) return bad(res, "Bad status");
    data.status = x.status;
  }
  if (x.detail !== undefined) {
    if (typeof x.detail !== "string" || x.detail.length > 80)
      return bad(res, "Bad note");
    data.detail = x.detail;
  }
  if (x.venue !== undefined) {
    if (!str(x.venue, 80)) return bad(res, "Bad venue");
    data.venue = x.venue;
  }
  if (x.matchTime !== undefined) {
    if (isNaN(Date.parse(x.matchTime))) return bad(res, "Bad date");
    data.matchTime = new Date(x.matchTime);
  }
  const cur = await db.match.findUnique({ where: { id: +req.params.id } });
  if (!cur) return res.status(404).json({ error: "Not found" });
  const A = data.teamAId ?? cur.teamAId,
    B = data.teamBId ?? cur.teamBId;
  if (A === B) return bad(res, "Team A and Team B must be different");
  const sa = data.scoreA ?? cur.scoreA,
    sb = data.scoreB ?? cur.scoreB;
  if ((data.status ?? cur.status) === "FINAL")
    data.winnerId = sa > sb ? A : sb > sa ? B : null;
  res.json(await db.match.update({ where: { id: cur.id }, data }));
});
app.delete("/api/matches/:id", auth, async (req, res) => {
  await db.match.delete({ where: { id: +req.params.id } }).catch(() => {});
  res.status(204).end();
});
app.post("/api/matches/:id/events", auth, async (req, res) => {
  const { minute, type, description } = req.body || {};
  if (!str(minute, 10) || !str(type, 30) || !str(description, 120))
    return bad(res, "Invalid event");
  res.status(201).json(
    await db.scoreEvent.create({
      data: { matchId: +req.params.id, minute, type, description },
    }),
  );
});

/* ---------- announcements ---------- */
app.get("/api/announcements", async (_q, res) =>
  res.json(
    await db.announcement.findMany({
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    }),
  ),
);
app.post("/api/announcements", auth, async (req, res) => {
  const { title, content, category, isPinned } = req.body || {};
  if (!str(title, 100) || !str(content, 600) || !CATS.includes(category))
    return bad(res, "Invalid announcement");
  res.status(201).json(
    await db.announcement.create({
      data: { title, content, category, isPinned: !!isPinned },
    }),
  );
});
app.patch("/api/announcements/:id", auth, async (req, res) => {
  const { title, content, category, isPinned } = req.body || {},
    data = {};
  if (title !== undefined) {
    if (!str(title, 100)) return bad(res, "Bad title");
    data.title = title;
  }
  if (content !== undefined) {
    if (!str(content, 600)) return bad(res, "Bad message");
    data.content = content;
  }
  if (category !== undefined) {
    if (!CATS.includes(category)) return bad(res, "Bad category");
    data.category = category;
  }
  if (isPinned !== undefined) data.isPinned = !!isPinned;
  try {
    res.json(
      await db.announcement.update({ where: { id: +req.params.id }, data }),
    );
  } catch {
    res.status(404).json({ error: "Not found" });
  }
});
app.delete("/api/announcements/:id", auth, async (req, res) => {
  await db.announcement
    .delete({ where: { id: +req.params.id } })
    .catch(() => {});
  res.status(204).end();
});

/* ---------- match based standings (optional, older) ---------- */
app.get("/api/standings", async (req, res) => {
  const sportId = req.query.sportId ? +req.query.sportId : undefined;
  const [ds, ms] = await Promise.all([
    db.department.findMany(),
    db.match.findMany({
      where: { status: "FINAL", ...(sportId && { sportId }) },
    }),
  ]);
  const T = Object.fromEntries(
    ds.map((d) => [
      d.id,
      { dept: d.shortName, played: 0, won: 0, drawn: 0, lost: 0, points: 0 },
    ]),
  );
  for (const m of ms) {
    const A = T[m.teamAId],
      B = T[m.teamBId];
    A.played++;
    B.played++;
    if (m.scoreA === m.scoreB) {
      A.drawn++;
      B.drawn++;
      A.points += POINTS.draw;
      B.points += POINTS.draw;
    } else {
      const [w, l] = m.scoreA > m.scoreB ? [A, B] : [B, A];
      w.won++;
      l.lost++;
      w.points += POINTS.win;
      l.points += POINTS.loss;
    }
  }
  res.json(
    Object.values(T).sort((x, y) => y.points - x.points || y.won - x.won),
  );
});

/* ---------- leaderboard points entered by the admin ---------- */
app.get("/api/leaderboard", async (req, res) => {
  const sportId = req.query.sportId ? +req.query.sportId : undefined;
  const [ds, es] = await Promise.all([
    db.department.findMany({ orderBy: { id: "asc" } }),
    db.pointEntry.findMany({ where: sportId ? { sportId } : {} }),
  ]);
  const T = Object.fromEntries(
    ds.map((d) => [d.id, { dept: d.shortName, points: 0, entries: 0 }]),
  );
  for (const e of es) {
    T[e.departmentId].points += e.points;
    T[e.departmentId].entries++;
  }
  res.json(
    Object.values(T).sort(
      (a, b) => b.points - a.points || a.dept.localeCompare(b.dept),
    ),
  );
});
app.get("/api/points", async (_q, res) =>
  res.json(
    await db.pointEntry.findMany({
      include: { sport: true, department: true },
      orderBy: { createdAt: "desc" },
    }),
  ),
);
app.post("/api/points", auth, async (req, res) => {
  const { sportId, departmentId, points, note } = req.body || {};
  if (
    ![sportId, departmentId, points].every(Number.isInteger) ||
    Math.abs(points) > 1000 ||
    (note !== undefined && (typeof note !== "string" || note.length > 80))
  )
    return bad(res, "Invalid points entry");
  try {
    res.status(201).json(
      await db.pointEntry.create({
        data: { sportId, departmentId, points, note: note || "" },
      }),
    );
  } catch {
    bad(res, "Invalid sport or department");
  }
});
app.patch("/api/points/:id", auth, async (req, res) => {
  const { sportId, departmentId, points, note } = req.body || {},
    data = {};
  for (const [k, v] of Object.entries({ sportId, departmentId }))
    if (v !== undefined) {
      if (!Number.isInteger(v)) return bad(res, "Bad " + k);
      data[k] = v;
    }
  if (points !== undefined) {
    if (!Number.isInteger(points) || Math.abs(points) > 1000)
      return bad(res, "Bad points");
    data.points = points;
  }
  if (note !== undefined) {
    if (typeof note !== "string" || note.length > 80)
      return bad(res, "Bad note");
    data.note = note;
  }
  try {
    res.json(await db.pointEntry.update({ where: { id: +req.params.id }, data }));
  } catch {
    res.status(404).json({ error: "Not found" });
  }
});
app.delete("/api/points/:id", auth, async (req, res) => {
  await db.pointEntry.delete({ where: { id: +req.params.id } }).catch(() => {});
  res.status(204).end();
});
/* ---------- gallery (images are stored on Cloudinary) ---------- */
app.get("/api/gallery", async (_q, res) =>
  res.json(await db.photo.findMany({ orderBy: { createdAt: "desc" } })),
);
app.post("/api/gallery", auth, upload.single("image"), async (req, res) => {
  if (!req.file) return bad(res, "Choose a JPG, PNG or WEBP image under 5 MB");
  const { category, caption = "" } = req.body || {};
  if (!GCATS.includes(category) || typeof caption !== "string" || caption.length > 100)
    return bad(res, "Invalid category or caption");
  try {
    const r = await new Promise((ok, fail) =>
      cloudinary.uploader
        .upload_stream(
          { folder: "cesco-sports", resource_type: "image", transformation: [{ width: 1600, height: 1600, crop: "limit", quality: "auto" }] },
          (e, x) => (e ? fail(e) : ok(x)),
        )
        .end(req.file.buffer),
    );
    res.status(201).json(await db.photo.create({ data: { url: r.secure_url, publicId: r.public_id, category, caption } }));
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: "Upload to Cloudinary failed. Check the Cloudinary keys in .env" });
  }
});
app.delete("/api/gallery/:id", auth, async (req, res) => {
  const p = await db.photo.findUnique({ where: { id: +req.params.id } });
  if (p) {
    await cloudinary.uploader.destroy(p.publicId).catch(() => {});
    await db.photo.delete({ where: { id: p.id } }).catch(() => {});
  }
  res.status(204).end();
});
/* ---------- errors and start ---------- */
app.use((err, _q, res, _n) => {
  if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "Photo must be under 5 MB" });
  if (err.name === "MulterError") return bad(res, "Upload error: " + err.message);
  console.error(err);
  res.status(500).json({ error: "Server error" });
});
app.listen(process.env.PORT || 4000, () =>
  console.log("API on", process.env.PORT || 4000),
);