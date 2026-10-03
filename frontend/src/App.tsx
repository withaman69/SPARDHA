import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type CSSProperties,
} from "react";
import {
  Routes,
  Route,
  NavLink,
  Link,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const ADMIN_PATH = "/cesco-admin"; // EDIT: change to a random word plus numbers that only the CESCO team knows
const FULL_FORM = "Civil Engineering Students’ Council, NIT Goa"; // EDIT: your real CESCO full form
const EMAIL = "cesco@nitgoa.ac.in";
const INSTAGRAM = "https://www.instagram.com/cesco.nitg/?hl=en"; // EDIT: your CESCO Instagram link
const CONTACT: [string, string][] = [
  ["Email", EMAIL],
 
  ["Conect us", "Ajaie Ahkash - 9342479393"],
   ["Instagram", "@cesco.nitg"],
]; // EDIT

type M = {
  id: number;
  sport: { name: string };
  teamA: { shortName: string };
  teamB: { shortName: string };
  venue: string;
  matchTime: string;
  status: string;
  scoreA: number;
  scoreB: number;
  detail: string;
};
type N = {
  id: number;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  createdAt: string;
};
type Meta = {
  departments: { id: number; shortName: string }[];
  sports: { id: number; name: string }[];
};
type AM = M & { sportId: number; teamAId: number; teamBId: number };
type LB = { dept: string; points: number; entries: number };
type PE = {
  id: number;
  sportId: number;
  departmentId: number;
  points: number;
  note: string;
  sport: { name: string };
  department: { shortName: string };
};
type Photo = { id: number; url: string; category: string; caption: string };

/* Demo data shows only while the API is offline */
const d = (s: string) => ({ shortName: s });
const DEMO_M: M[] = [
  {
    id: 1,
    sport: { name: "Football" },
    teamA: d("CSE"),
    teamB: d("CVE"),
    venue: "Main Ground",
    matchTime: "2026-10-06T16:00",
    status: "LIVE",
    scoreA: 2,
    scoreB: 1,
    detail: "68'",
  },
  {
    id: 2,
    sport: { name: "Basketball" },
    teamA: d("EEE"),
    teamB: d("MCE"),
    venue: "Basketball Court",
    matchTime: "2026-10-07T17:00",
    status: "UPCOMING",
    scoreA: 0,
    scoreB: 0,
    detail: "",
  },
  {
    id: 3,
    sport: { name: "Cricket" },
    teamA: d("ECE"),
    teamB: d("CSE"),
    venue: "Cricket Ground",
    matchTime: "2026-10-05T15:00",
    status: "FINAL",
    scoreA: 102,
    scoreB: 145,
    detail: "CSE won by 43 runs",
  },
];
const DEMO_N: N[] = [
  {
    id: 1,
    title: "Demo notice: API is offline",
    content: "Start the backend to see real announcements.",
    category: "General",
    isPinned: true,
    createdAt: "2026-09-29",
  },
];
const DEPTS = ["CVE", "CSE", "ECE", "EEE", "MCE"];
const DEMO_LB: LB[] = DEPTS.map((dept) => ({ dept, points: 0, entries: 0 }));
const CATS = [
  "General",
  "Schedule Change",
  "Venue Change",
  "Match Result",
  "Emergency Notice",
];
const GALLERY_CATS = [
  "Volleyball",
  "Football",
  "Opening Ceremony",
  "Prize Distribution",
  "General",
];
const thumb = (u: string) =>
  u.replace("/upload/", "/upload/c_fill,w_600,h_450,q_auto,f_auto/");
const big = (u: string) =>
  u.replace("/upload/", "/upload/c_limit,w_1600,q_auto,f_auto/");

const ALL_RULES: Record<string, string[]> = {
  Football: [
    "7 a side, two halves of 15 minutes",
    "Rolling substitutions, unlimited",
    "Goal = 1 point; knockout draws go to 3 penalties each",
    "Tie-break: points, goal difference, goals scored",
    "Two yellow cards or a red card: player is sent off and misses the next match",
  ],
  Cricket: [
    "6 a side, 6 overs per innings, max 2 overs per bowler",
    "Powerplay: first 2 overs, max 2 fielders outside the circle",
    "Wide and no ball: 1 run plus a re-bowl",
    "Retire hurt: batter may return later in the innings",
    "Tie: super over; if tied again, fewer wickets lost wins",
  ],
  Volleyball: [
    "6 a side, best of 3 sets",
    "Rally scoring: sets to 25, deciding set to 15, win by 2",
    "Rotate clockwise on winning service",
    "One 30 second timeout per team per set",
    "Net touch and double contact are faults",
  ],
  Basketball: [
    "5 a side, four quarters of 8 minutes",
    "2 points inside the arc, 3 outside, 1 per free throw",
    "Five fouls and a player is out; two technicals mean ejection",
    "One timeout per half; possession alternates on jump balls",
    "Overtime is 3 minutes",
  ],
  "Tug of War": [
    "Team of 8 per department",
    "Best of 3 pulls; a pull is won by dragging the marker 4 metres",
    "Flat shoes or barefoot only; no spikes",
    "No sitting, no rope wrapped on the body",
    "Disqualification after two warnings in a pull",
  ],
  Chess: [
    "15 minutes per player, no increment",
    "Touch move applies; an illegal move gives the opponent 2 extra minutes",
    "Draw by agreement, repetition, stalemate or insufficient material",
    "Win 1, draw 0.5",
    "Tie-break: head to head, then a blitz playoff",
  ],
  "Table Tennis": [
    "Best of 3 games, each to 11, win by 2",
    "Service changes every 2 points",
    "Serve must be visible and thrown up at least 16 cm",
    "One doubles tie plus singles per match",
    "Tie-break: ties won, then game ratio",
  ],
  Carrom: [
    "White coin 10 points, black coin 5, queen 50 if covered",
    "Striker must touch the baseline; flicking only",
    "Foul returns one pocketed coin to the board",
    "A board ends at 25 points or when all coins are pocketed",
    "Tie: one extra board",
  ],
};
/* Sports shown on the site, in this order. Add a name here once that sport is confirmed. */
type RuleSection = { title: string; items: string[] }

/* Official rulebooks. A sport listed here shows its rules in sections. */
const SECTIONED: Record<string, RuleSection[]> = {
  Volleyball: [
    { title: '1. Tournament format', items: [
      'Format: league-cum-tournament.',
      'Teams: 5 departments take part.',
      'Round-robin: every department plays one match against every other department.',
      'Matches per team: each department plays 4 league matches.',
      'Total matches: 10 league matches in total.',
      'Winner: the department finishing 1st in the final league table.',
      'Runner-up: the department finishing 2nd in the final league table.',
      'No separate final: the final league standings decide the Winner and Runner-up.'] },
    { title: '2. Team composition and gender participation', items: [
      'Roster: each department registers a maximum of 12 players, 10 boys and 2 girls.',
      'Mandatory participation: at least 1 girl must be on court for every match played.',
      'Regular sets: the gender requirement applies throughout all regular sets.',
      'Deciding set exception: in the 3rd deciding set (tie-breaker), teams may play an all-boys team.',
      'Scope: the all-boys exception applies strictly to the deciding set only.',
      'Eligibility: only registered players may take part in the tournament.'] },
    { title: '3. Match format', items: [
      'Matches are played as best of three (3) sets.',
      'The first two sets are played to 25 points, subject to the applicable winning-margin rule.',
      'If tied 1-1, a deciding third set is played to 15 points (the winning-margin rule applies).',
      'Important: the 3rd set is the only set in which an all-boys playing combination is permitted.'] },
    { title: '4. League table and ranking', items: [
      'A league table is maintained for all five departments.',
      'Each department will have played 4 matches after the league stage.',
      'Final ranking is decided by the approved tournament points system.',
      'The 1st ranked department is the Winner and the 2nd ranked department is the Runner-up.',
      'If teams are tied on points, the committee applies the announced tie-break criteria.'] },
    { title: '5. Tie-break in league standings', items: [
      'If departments finish level in the league table, tie-breaks apply in this order:',
      '1. Head-to-head: the match result between the tied departments.',
      '2. Set ratio: total sets won divided by total sets lost.',
      '3. Point ratio: total points won divided by total points conceded.'] },
    { title: '6. Conduct and match administration', items: [
      'All teams must report before their scheduled match time.',
      'Players must keep sportsmanlike conduct throughout the tournament.',
      "The referee's decisions during play must be respected.",
      'Any matter not specifically covered is decided by the tournament committee.'] },
    { title: '7. Tournament summary', items: [
      'Departments: 5',
      'Players per department: 12 (10 boys and 2 girls)',
      'Minimum girls on court: 1 girl is mandatory in regular sets',
      'Deciding set rule: an all-boys team is permitted',
      'Format: league-cum-tournament, round robin',
      'Matches per department: 4 (10 matches in total)',
      'Final placement: 1st is Winner, 2nd is Runner-up'] }
  ]
}

/* Sports shown on the site, in this order. Add a name here once that sport is confirmed. */
const ACTIVE = ['Volleyball', 'Football']
const RULES: Record<string, RuleSection[]> = Object.fromEntries(ACTIVE.map(k => [k, SECTIONED[k] ?? [{ title: 'Rules', items: ALL_RULES[k] }]]))
/* 3D style sport icons. Shared shading colours are defined once in <Defs /> */
const Defs = () => (
  <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
    <defs>
      <radialGradient id="gW" cx=".35" cy=".3" r=".85">
        <stop offset="0" stopColor="#fff" />
        <stop offset=".6" stopColor="#dfe3e6" />
        <stop offset="1" stopColor="#8f979d" />
      </radialGradient>
      <radialGradient id="gO" cx=".35" cy=".3" r=".85">
        <stop offset="0" stopColor="#FFB870" />
        <stop offset=".55" stopColor="#F07A24" />
        <stop offset="1" stopColor="#9E430C" />
      </radialGradient>
      <radialGradient id="gC" cx=".35" cy=".3" r=".85">
        <stop offset="0" stopColor="#FFF8DA" />
        <stop offset=".6" stopColor="#F1DC93" />
        <stop offset="1" stopColor="#B89A42" />
      </radialGradient>
      <radialGradient id="gR" cx=".35" cy=".3" r=".85">
        <stop offset="0" stopColor="#FF8E7D" />
        <stop offset=".55" stopColor="#D9392C" />
        <stop offset="1" stopColor="#85190F" />
      </radialGradient>
      <radialGradient id="gK" cx=".35" cy=".3" r=".85">
        <stop offset="0" stopColor="#6b6b6b" />
        <stop offset=".6" stopColor="#222" />
        <stop offset="1" stopColor="#050505" />
      </radialGradient>
      <linearGradient id="gWood" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#F6DDA6" />
        <stop offset=".5" stopColor="#D9A45B" />
        <stop offset="1" stopColor="#A9702F" />
      </linearGradient>
      <linearGradient id="gRope" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#EBD3A6" />
        <stop offset=".5" stopColor="#C79A5A" />
        <stop offset="1" stopColor="#8C6230" />
      </linearGradient>
      <linearGradient id="gPawn" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset=".55" stopColor="#D4D9DE" />
        <stop offset="1" stopColor="#8F979D" />
      </linearGradient>
    </defs>
  </svg>
);
const Sh = () => (
  <ellipse cx="32" cy="60" rx="18" ry="3" fill="#000" opacity=".25" />
);
const Gloss = () => (
  <ellipse
    cx="22"
    cy="17"
    rx="8"
    ry="5"
    fill="#fff"
    opacity=".4"
    transform="rotate(-30 22 17)"
  />
);
const P: Record<string, ReactNode> = {
  Football: (
    <>
      <Sh />
      <circle
        cx="32"
        cy="31"
        r="26"
        fill="url(#gW)"
        stroke="#9aa2a8"
        strokeWidth=".8"
      />
      <path d="M32 23l8 6-3 9H27l-3-9z" fill="#1b1b1b" />
      <path
        d="M32 23V12M40 29l10-4M37 38l6 11M27 38l-6 11M24 29l-10-4"
        stroke="#333"
        strokeWidth="1.6"
        fill="none"
      />
      {[
        [32, 12],
        [50, 25],
        [43, 49],
        [21, 49],
        [14, 25],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="3.4" fill="#1b1b1b" />
      ))}
    </>
  ),
  Volleyball: (
    <>
      <Sh />
      <circle
        cx="32"
        cy="31"
        r="26"
        fill="url(#gC)"
        stroke="#a88c3a"
        strokeWidth=".8"
      />
      <path
        d="M8 25C24 16 40 18 57 30M14 49C22 34 38 30 55 40"
        stroke="#3B6FB6"
        strokeWidth="3.2"
        fill="none"
      />
      <path
        d="M28 6C24 20 26 38 40 56"
        stroke="#E2A925"
        strokeWidth="3.2"
        fill="none"
      />
      <Gloss />
    </>
  ),
  Basketball: (
    <>
      <Sh />
      <circle
        cx="32"
        cy="31"
        r="26"
        fill="url(#gO)"
        stroke="#7a3208"
        strokeWidth=".8"
      />
      <path
        d="M32 5v52M6 31h52M14 11c12 12 12 28 0 40M50 11c-12 12-12 28 0 40"
        stroke="#4a1e06"
        strokeWidth="2"
        fill="none"
      />
      <Gloss />
    </>
  ),
  "Tug of War": (
    <>
      <Sh />
      <path
        d="M6 34H58"
        stroke="url(#gRope)"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M10 30l4 8M17 30l4 8M24 30l4 8M39 30l4 8M46 30l4 8M53 30l4 8"
        stroke="#6b4520"
        strokeWidth="1.6"
      />
      <path
        d="M29 22h7l-1 24h-5z"
        fill="url(#gR)"
        stroke="#85190F"
        strokeWidth=".8"
      />
      <circle
        cx="7"
        cy="34"
        r="5"
        fill="url(#gRope)"
        stroke="#6b4520"
        strokeWidth=".8"
      />
      <circle
        cx="57"
        cy="34"
        r="5"
        fill="url(#gRope)"
        stroke="#6b4520"
        strokeWidth=".8"
      />
    </>
  ),
  Cricket: (
    <>
      <Sh />
      <g transform="rotate(35 32 32)">
        <rect x="29" y="38" width="6" height="16" rx="2" fill="#2b2b2b" />
        <path d="M29 42h6M29 46h6M29 50h6" stroke="#D9392C" strokeWidth="1.6" />
        <rect
          x="24"
          y="4"
          width="16"
          height="36"
          rx="3"
          fill="url(#gWood)"
          stroke="#8a5a26"
          strokeWidth=".8"
        />
        <path d="M32 6v32" stroke="#8a5a26" strokeWidth="1" opacity=".6" />
      </g>
      <circle
        cx="47"
        cy="49"
        r="8"
        fill="url(#gR)"
        stroke="#6d140c"
        strokeWidth=".8"
      />
      <path
        d="M41 45c4 3 4 7 0 10"
        stroke="#fff"
        strokeWidth="1.2"
        fill="none"
      />
    </>
  ),
  Chess: (
    <>
      <Sh />
      <g stroke="#6f777d" strokeWidth=".8" fill="url(#gPawn)">
        <circle cx="32" cy="16" r="8" />
        <path d="M26 25h12l-1 4H27z" />
        <path d="M27 29h10c1 7 5 12 7 20H20c2-8 6-13 7-20z" />
        <rect x="16" y="49" width="32" height="7" rx="3" />
      </g>
    </>
  ),
  "Table Tennis": (
    <>
      <Sh />
      <g transform="rotate(-30 32 32)">
        <rect
          x="28"
          y="38"
          width="8"
          height="18"
          rx="3"
          fill="url(#gWood)"
          stroke="#8a5a26"
          strokeWidth=".8"
        />
        <circle
          cx="32"
          cy="24"
          r="17"
          fill="url(#gR)"
          stroke="#6d140c"
          strokeWidth=".8"
        />
        <circle
          cx="32"
          cy="24"
          r="13"
          fill="none"
          stroke="#fff"
          strokeWidth=".8"
          opacity=".35"
        />
      </g>
      <circle
        cx="50"
        cy="48"
        r="6"
        fill="url(#gW)"
        stroke="#9aa2a8"
        strokeWidth=".8"
      />
    </>
  ),
  Carrom: (
    <>
      <Sh />
      <rect
        x="6"
        y="8"
        width="52"
        height="48"
        rx="3"
        fill="url(#gWood)"
        stroke="#8a5a26"
        strokeWidth=".8"
      />
      <rect x="12" y="14" width="40" height="36" fill="#EAD08F" />
      <circle
        cx="32"
        cy="32"
        r="8"
        fill="none"
        stroke="#8b1f17"
        strokeWidth="1.6"
      />
      {[
        [12, 14],
        [52, 14],
        [12, 50],
        [52, 50],
      ].map(([x, y]) => (
        <circle key={x + "-" + y} cx={x} cy={y} r="4" fill="#1a1a1a" />
      ))}
      <circle cx="28" cy="28" r="3.2" fill="url(#gW)" />
      <circle cx="37" cy="28" r="3.2" fill="url(#gK)" />
      <circle cx="27" cy="37" r="3.2" fill="url(#gK)" />
      <circle cx="37" cy="36" r="3.2" fill="url(#gW)" />
      <circle cx="32" cy="32" r="3" fill="url(#gR)" />
      <circle
        cx="22"
        cy="44"
        r="4.2"
        fill="url(#gW)"
        stroke="#9aa2a8"
        strokeWidth=".8"
      />
    </>
  ),
};
const Icon = ({ name }: { name: string }) => (
  <svg className="icon3" viewBox="0 0 64 64" aria-hidden="true">
    {P[name]}
  </svg>
);

const Logo = () => (
  <svg viewBox="0 0 48 48" width="36" height="36" aria-hidden="true">
    <circle
      className="logo-ring"
      cx="24"
      cy="24"
      r="21"
      fill="none"
      strokeWidth="2.5"
      opacity=".35"
    />
    <path
      d="M34 14A14 14 0 1 0 34 34"
      fill="none"
      stroke="var(--acc)"
      strokeWidth="5"
    />
    <circle className="logo-ball" cx="37" cy="24" r="4" />
  </svg>
);
const BellIcon = () => (
  <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z" />
    <path d="M10 21h4" />
  </svg>
);
const SunIcon = () => (
  <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
  </svg>
);
const MoonIcon = () => (
  <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
  </svg>
);
const CalIcon = () => (
  <svg className="icon3 line" viewBox="0 0 64 64" aria-hidden="true">
    <rect x="10" y="14" width="44" height="40" rx="4" />
    <path d="M10 26h44M22 8v10M42 8v10" />
    <path d="M20 36h6M30 36h6M40 36h4M20 45h6M30 45h6" />
  </svg>
);
const MysteryIcon = () => (
  <svg className="icon3 line mys" viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="32" r="24" strokeDasharray="4 5" />
    <path d="M24 25a8 8 0 1 1 11 7c-2 1-3 3-3 5" />
    <circle className="dot" cx="32" cy="46" r="1.8" />
  </svg>
);
const MailIcon = () => (
  <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 7 9-7" />
  </svg>
);
const InstaIcon = () => (
  <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" />
  </svg>
);

/* scroll reveal, count up, section heading */
function Rv({ children }: { children: ReactNode }) {
  const r = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = r.current!;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={r} className="rv">
      {children}
    </div>
  );
}
function Count({ to }: { to: number }) {
  const [n, setN] = useState(0);
  const r = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = r.current!;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / 900);
        setN(Math.round(to * p));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return <span ref={r}>{n}</span>;
}
const Head = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
  <>
    <span className="eyebrow">{eyebrow}</span>
    <h2>{title}</h2>
    <div className="rule" />
  </>
);

/* nav link that scrolls to a home section from any page; Leaderboard also replays its animation */
function Jump({ id, children }: { id: string; children: ReactNode }) {
  const nav = useNavigate(),
    { pathname } = useLocation();
  const go = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (pathname !== "/") nav("/");
    else if (id === "board") window.dispatchEvent(new Event("lb-replay"));
    setTimeout(
      () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }),
      pathname === "/" ? 0 : 150,
    );
  };
  return (
    <a href="#/" onClick={go}>
      {children}
    </a>
  );
}

const Footer = () => (
  <footer className="foot2">
    <div className="fart l" aria-hidden="true" />
    <div className="fart r" aria-hidden="true" />
    <p className="ftitle">SPARDHA '26</p>
    <p className="ftag">Five departments. One trophy. One Legacy.</p>
    <div className="fsocial">
      <a href={`mailto:${EMAIL}`} aria-label="Email CESCO">
        <MailIcon />
      </a>
      <a
        href={INSTAGRAM}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="CESCO on Instagram"
      >
        <InstaIcon />
      </a>
    </div>
    <p className="copy">2026 Spardha, NIT Goa</p>
  </footer>
);

/* reset = true clears old data when the path changes, so stale numbers never show */
function useApi<T>(path: string, demo: T, every = 0, reset = false) {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    let on = true;
    if (reset) setData(null);
    const go = () =>
      fetch(API + path)
        .then((r) => {
          if (!r.ok) throw 0;
          return r.json();
        })
        .then((x) => on && setData(x))
        .catch(() => on && setData((p) => p ?? demo));
    go();
    const id = every ? window.setInterval(go, every) : 0;
    return () => {
      on = false;
      if (id) clearInterval(id);
    };
  }, [path]);
  return data;
}
const Skel = () => (
  <>
    <div className="sk" />
    <div className="sk" />
    <div className="sk" />
  </>
);
const when = (t: string) =>
  new Date(t).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
const loc = (t: string) => {
  const x = new Date(t);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 16);
};
const Card = ({ m }: { m: M }) => (
  <article className="card">
    <div className="sc">
      <span className="t">{m.teamA.shortName}</span>
      <span className="n">
        {m.status === "UPCOMING" ? "vs" : `${m.scoreA} - ${m.scoreB}`}
      </span>
      <span className="t">{m.teamB.shortName}</span>
    </div>
    <p className="meta">
      <span className={"tag" + (m.status === "LIVE" ? " live" : "")}>
        {m.status === "LIVE"
          ? "LIVE"
          : m.status === "FINAL"
            ? "Full time"
            : "Upcoming"}
      </span>{" "}
      {m.sport.name}, {when(m.matchTime)}, {m.venue}
      {m.detail && `, ${m.detail}`}
    </p>
  </article>
);
const Notice = ({ n }: { n: N }) => (
  <article className="card">
    <h3>{n.title}</h3>
    <p className="meta" style={{ textAlign: "left" }}>
      <span className={"tag" + (n.isPinned ? " pin" : "")}>
        {n.isPinned ? "Pinned" : n.category}
      </span>{" "}
      {n.createdAt.slice(0, 10)}
    </p>
    <p>{n.content}</p>
  </article>
);

/* leaderboards */
const DEPT_NAMES: Record<string, string> = {
  CVE: "Civil Engineering",
  CSE: "Computer Science Engineering",
  ECE: "Electronics and Communication",
  EEE: "Electrical and Electronics",
  MCE: "Mechanical Engineering",
};
const STEP_MS = 450; // time between rows appearing

/* number that spins through random values until it is locked */
function Roll({ to, spin }: { to: number; spin: boolean }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!spin) return;
    const top = 10 ** Math.max(2, String(Math.abs(to)).length);
    const iv = window.setInterval(
      () => setV(Math.floor(Math.random() * top)),
      60,
    );
    return () => clearInterval(iv);
  }, [spin, to]);
  return <>{spin ? v : to}</>;
}

const LBTable = ({ rows }: { rows: LB[] }) => {
  const n = rows.length;
  const box = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0),
    [done, setDone] = useState(false);
  const max = Math.max(1, ...rows.map((r) => r.points));
  useEffect(() => {
    const ids: number[] = [];
    const run = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setStep(n);
        setDone(true);
        return;
      }
      for (let s = 1; s <= n; s++)
        ids.push(window.setTimeout(() => setStep(s), 350 + s * STEP_MS));
      ids.push(
        window.setTimeout(() => setDone(true), 350 + n * STEP_MS + 1100),
      );
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          io.disconnect();
          run();
        }
      },
      { threshold: 0.2 },
    );
    if (box.current) io.observe(box.current);
    return () => {
      io.disconnect();
      ids.forEach(clearTimeout);
    };
  }, [n]);
  const msg = done
    ? "Final standings"
    : step === 0
      ? "First up..."
      : step < n
        ? "Coming in..."
        : "All teams in, tallying scores...";
  return (
    <div ref={box} className="lb">
      {rows.map((r, i) => {
        const rank = rows.findIndex((x) => x.points === r.points) + 1;
        const shown = i >= n - step;
        const medal = done && r.points > 0 && rank <= 3 ? ` m${rank}` : "";
        return (
          <div key={r.dept} className={`lbrow${shown ? " show" : ""}${medal}`}>
            <span className="lbrank">{rank}</span>
            <div className="lbname">
              <b>{r.dept}</b>
              <small>{DEPT_NAMES[r.dept] ?? ""}</small>
            </div>
            <div className="lbbar" aria-hidden="true">
              <i
                style={{
                  width: done ? `${(Math.max(0, r.points) / max) * 100}%` : 0,
                }}
              />
            </div>
            <div className="lbpts">
              <span>
                <Roll to={r.points} spin={shown && !done} />
              </span>
              <small>points</small>
            </div>
          </div>
        );
      })}
      <p className="lbstat" role="status">
        {msg}
      </p>
    </div>
  );
};

function LBSection() {
  const meta = useApi<Meta>("/meta", { departments: [], sports: [] });
  const [sid, setSid] = useState(0),
    [tick, setTick] = useState(0);
  const lb = useApi<LB[]>(
    "/leaderboard" + (sid ? `?sportId=${sid}` : ""),
    DEMO_LB,
    20000,
    true,
  );
  useEffect(() => {
    const on = () => setTick((t) => t + 1);
    window.addEventListener("lb-replay", on);
    return () => window.removeEventListener("lb-replay", on);
  }, []);
  const pick = (id: number) => {
    setSid(id);
    setTick((t) => t + 1);
  };
  return (
    <>
      <div className="tabs2">
        <button className={sid === 0 ? "on" : ""} onClick={() => pick(0)}>
          Overall
        </button>
        {meta?.sports
          .filter((s) => ACTIVE.includes(s.name))
          .map((s) => (
            <button
              key={s.id}
              className={sid === s.id ? "on" : ""}
              onClick={() => pick(s.id)}
            >
              {s.name}
            </button>
          ))}
      </div>
      {lb ? <LBTable key={`${sid}-${tick}`} rows={lb} /> : <Skel />}
    </>
  );
}

function Gallery() {
  const ph = useApi<Photo[]>("/gallery", [], 60000);
  const [cat, setCat] = useState(""),
    [open, setOpen] = useState<Photo | null>(null);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);
  const cats = GALLERY_CATS.filter((c) => ph?.some((p) => p.category === c));
  const list = ph?.filter((p) => !cat || p.category === cat) ?? [];
  return (
    <div className="wrap">
      <Head eyebrow="Moments" title="Gallery" />
      {cats.length > 0 && (
        <div className="tabs2">
          <button className={cat === "" ? "on" : ""} onClick={() => setCat("")}>
            All
          </button>
          {cats.map((c) => (
            <button
              key={c}
              className={cat === c ? "on" : ""}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      {!ph ? (
        <Skel />
      ) : list.length === 0 ? (
        <div className="card">
          <p className="meta">No photos yet. Check back during the event.</p>
        </div>
      ) : (
        <div className="gal">
          {list.map((p) => (
            <button key={p.id} className="shot" onClick={() => setOpen(p)}>
              <img
                src={thumb(p.url)}
                alt={p.caption || p.category}
                loading="lazy"
              />
              <span>{p.caption || p.category}</span>
            </button>
          ))}
        </div>
      )}
      {open && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(null)}
        >
          <img src={big(open.url)} alt={open.caption || open.category} />
          <p>
            {open.category}
            {open.caption && `, ${open.caption}`}
          </p>
          <button onClick={() => setOpen(null)}>Close</button>
        </div>
      )}
    </div>
  );
}

const Split = ({ text, start }: { text: string; start: number }) => (
  <>
    {text.split("").map((c, i) => (
      <span
        key={i}
        className="ch"
        style={{ "--i": i + start } as CSSProperties}
      >
        {c === " " ? "\u00A0" : c}
      </span>
    ))}
  </>
);

function Home() {
  const ms = useApi<M[]>("/matches", DEMO_M, 10000);
  const live = ms?.filter((m) => m.status === "LIVE") ?? [];
  const go = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  return (
    <>
      <section className="hero2">
        <i className="d c1" />
        <i className="d c2" />
        <i className="d s1" />
        <i className="d s2" />
        <i className="d c3" />
        <svg className="d t1" viewBox="0 0 100 100" aria-hidden="true">
          <polygon points="50,8 94,90 6,90" />
        </svg>
        <span className="eyebrow box">A NEW ERA OF COMPETITION</span>
        <h1 aria-label="CESCO presents Spardha '26">
          <span aria-hidden="true">
            <Split text="CESCO" start={0} />
          </span>
          <small className="pres" aria-hidden="true">
            Presents
          </small>
          <em aria-hidden="true">
            <Split text="SPARDHA '26" start={5} />
          </em>
        </h1>
        <p className="tagline">{FULL_FORM}</p>
        <div className="cta">
          <button className="pri" onClick={() => go("about")}>
            Explore more
          </button>
          <Link className="btn" to="/fixtures">
            Fixtures
          </Link>
        </div>
        <div className="scroll">
          SCROLL
          <i />
        </div>
      </section>
      <div className="wrap">
        {live.length > 0 && (
          <section className="sec">
            <Rv>
              <Head eyebrow="Right now" title="Live matches" />
              {live.map((m) => (
                <Card key={m.id} m={m} />
              ))}
            </Rv>
          </section>
        )}
        <section className="sec two about" id="about">
          <Rv>
            <Head eyebrow="Who we are" title="About CESCO" />
            <p>
              <b>CESCO – Civil Engineering Students’ Council is a community</b>{" "}
              of students passionate about learning, creating, and growing
              together.
            </p>
            <p>
              Since 2019, we have been catering to enthusiasts across the
              institute through projects, workshops, competitions, and engaging
              activities. Whether you’re a beginner or an enthusiast, CESCO
              offers opportunities to learn, collaborate, explore your
              potential, and push your own boundaries.
            </p>
          </Rv>
          <Rv>
            <div className="stats">
              <div className="stat">
                <span className="big">
                  <Count to={5} />
                </span>
                <small>Departments</small>
              </div>
              <div className="stat">
                <span className="big">
                  <Count to={Object.keys(RULES).length} />
                </span>
                <small>Sports</small>
              </div>
              <div className="stat">
                <span className="big">
                  <Count to={ms?.length ?? 0} />
                </span>
                <small>Matches</small>
              </div>
            </div>
          </Rv>
        </section>
        <section className="sec" id="sports">
          <Rv>
            <Head eyebrow="Our disciplines" title="Two sports. One spirit." />
            <div className="tiles">
              {Object.keys(RULES).map((k) => (
                <Link
                  className="tile"
                  key={k}
                  to={`/sport/${encodeURIComponent(k)}`}
                >
                  <Icon name={k} />
                  <span className="tlabel">{k}</span>
                  <small className="sub">Rules, fixtures, scores</small>
                </Link>
              ))}
              <Link className="tile" to="/fixtures">
                <CalIcon />
                <span className="tlabel">Fixtures</span>
                <small className="sub">
                  {ms?.length ?? 0} matches scheduled
                </small>
              </Link>
              <div
                className="tile soon"
                aria-label="More sports revealing soon"
              >
                <MysteryIcon />
                <span className="tlabel">Revealing soon</span>
                <small className="sub">More sports on the way</small>
              </div>
            </div>
          </Rv>
        </section>
        <section className="sec" id="board">
          <Rv>
            <Head eyebrow="Department race" title="Leaderboard" />
            <LBSection />
          </Rv>
        </section>
        <section className="sec" id="contact">
          <Rv>
            <Head eyebrow="Get in touch" title="Contact" />
            <div className="contact">
              {CONTACT.map(([k, v]) => (
                <div className="card" key={k}>
                  <small>{k}</small>
                  <p>{v}</p>
                </div>
              ))}
            </div>
          </Rv>
        </section>
      </div>
    </>
  );
}
const ruleItem = (r: string) => { const k = r.indexOf(': '); return k > 0 && k < 30 ? <><b>{r.slice(0, k)}:</b> {r.slice(k + 2)}</> : r }
const RuleBlocks = ({ sections, plain }: { sections: RuleSection[]; plain?: boolean }) => <>{sections.map(s => <div className="rsec" key={s.title}>{s.title !== 'Rules' && <h3>{s.title}</h3>}<ul className={plain ? undefined : 'rules'}>{s.items.map(r => <li key={r}>{ruleItem(r)}</li>)}</ul></div>)}</>
function SportPage() {
  const { name = "" } = useParams();
  const ms = useApi<M[]>("/matches", DEMO_M, 15000);
  const rules = RULES[name];
  const meta = useApi<Meta>("/meta", { departments: [], sports: [] });
  const sid = meta?.sports.find((s) => s.name === name)?.id;
  const lb = useApi<LB[]>(
    sid ? `/leaderboard?sportId=${sid}` : "/leaderboard",
    DEMO_LB,
    20000,
    true,
  );
  const pts = useApi<PE[]>("/points", [], 20000);
  if (!rules)
    return (
      <div className="wrap">
        <h2>Sport not found</h2>
        <Link className="btn" to="/">
          Back home
        </Link>
      </div>
    );
  const list = ms?.filter((m) => m.sport.name === name) ?? [],
    mine = pts?.filter((p) => p.sport.name === name) ?? [];
  return (
    <div className="wrap">
      <Link className="btn" to="/">
        Back
      </Link>
      <div className="sporthead">
        <Icon name={name} />
        <h1>{name}</h1>
      </div>
      <section className="sec">
        <Head eyebrow="Rulebook" title="Rules" />
       <RuleBlocks sections={rules} />
      </section>
      <section className="sec">
        <Head eyebrow="Standings" title={`${name} leaderboard`} />
        {sid && lb ? <LBTable rows={lb} /> : <Skel />}
        {mine.length > 0 && (
          <ul className="rules">
            {mine.map((p) => (
              <li key={p.id}>
                <b>{p.department.shortName}</b> {p.points > 0 ? "+" : ""}
                {p.points}
                {p.note && `, ${p.note}`}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="sec">
        <Head eyebrow="Schedule" title="Fixtures and results" />
        {!ms ? (
          <Skel />
        ) : list.length ? (
          list.map((m) => <Card key={m.id} m={m} />)
        ) : (
          <p className="meta">No matches scheduled for {name} yet.</p>
        )}
      </section>
    </div>
  );
}
function Live() {
  const ms = useApi<M[]>("/matches", DEMO_M, 8000);
  return (
    <div className="wrap">
      <h1>Live scores</h1>
      {!ms ? (
        <Skel />
      ) : (
        ms
          .filter((m) => m.status === "LIVE")
          .map((m) => <Card key={m.id} m={m} />)
      )}
      <p className="meta">Updates every 8 seconds.</p>
    </div>
  );
}
function Fixtures() {
  const ms = useApi<M[]>("/matches", DEMO_M, 15000);
  const [sp, setSp] = useState(""),
    [dp, setDp] = useState("");
  const sports = Object.keys(RULES);
  return (
    <div className="wrap">
      <h1>Fixtures and results</h1>
      <div className="filters">
        <select
          aria-label="Sport"
          value={sp}
          onChange={(e) => setSp(e.target.value)}
        >
          <option value="">All sports</option>
          {sports.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          aria-label="Department"
          value={dp}
          onChange={(e) => setDp(e.target.value)}
        >
          <option value="">All departments</option>
          {DEPTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      {!ms ? (
        <Skel />
      ) : (
        ms
          .filter(
            (m) =>
              (!sp || m.sport.name === sp) &&
              (!dp || m.teamA.shortName === dp || m.teamB.shortName === dp),
          )
          .map((m) => <Card key={m.id} m={m} />)
      )}
    </div>
  );
}
function Standings() {
  return (
    <div className="wrap">
      <h1>Leaderboard</h1>
      <LBSection />
    </div>
  );
}
function Rules() {
  return (
    <div className="wrap">
      <h1>Rules of every sport</h1>
     {Object.entries(RULES).map(([k, v]) => <details className="card" key={k}><summary>{k}</summary><RuleBlocks sections={v} plain /></details>)}
      
    </div>
  );
}
function Notices() {
  const ns = useApi<N[]>("/announcements", DEMO_N, 30000);
  const [q, setQ] = useState("");
  return (
    <div className="wrap">
      <h1>Announcements</h1>
      <div className="filters">
        <input
          type="search"
          aria-label="Search announcements"
          placeholder="Search announcements"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {!ns ? (
        <Skel />
      ) : (
        ns
          .filter((n) =>
            (n.title + n.content + n.category)
              .toLowerCase()
              .includes(q.toLowerCase()),
          )
          .map((n) => <Notice key={n.id} n={n} />)
      )}
    </div>
  );
}
function More() {
  return (
    <div className="wrap">
      <h1>More</h1>
      <p style={{ display: "grid", gap: ".6rem", marginTop: "1rem" }}>
        <Link className="btn" to="/rules">
          Sports rules
        </Link>
        <Link className="btn" to="/notices">
          Announcements
        </Link>
        <Link className="btn" to="/gallery">
          Gallery
        </Link>
      </p>
    </div>
  );
}

function Admin() {
  const [tok, setTok] = useState(sessionStorage.getItem("tok") || ""),
    [msg, setMsg] = useState(""),
    [n, setN] = useState(0),
    [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"matches" | "notices" | "points" | "gallery">(
      "matches",
    ),
    [em, setEm] = useState(0),
    [en, setEn] = useState(0),
    [ep, setEp] = useState(0);
  const meta0 = useApi<Meta>("/meta", { departments: [], sports: [] });
  const meta = meta0 && {
    ...meta0,
    sports: meta0.sports.filter((s) => ACTIVE.includes(s.name)),
  };
  const ms = useApi<AM[]>("/matches?t=" + n, []);
  const ns = useApi<N[]>("/announcements?t=" + n, []);
  const pe = useApi<PE[]>("/points?t=" + n, []);
  const ph = useApi<Photo[]>("/gallery?t=" + n, []);
  const out = () => {
    sessionStorage.removeItem("tok");
    setTok("");
  };
  const call = async (path: string, method: string, body?: unknown) => {
    const r = await fetch(API + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tok}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.status === 401) out();
    setMsg(
      r.ok
        ? "Saved."
        : (await r.json().catch(() => ({}))).error || "Something went wrong.",
    );
    if (r.ok) setN((x) => x + 1);
    return r.ok;
  };
  const login = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await fetch(API + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: f.get("email"),
        password: f.get("password"),
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      sessionStorage.setItem("tok", j.token);
      setTok(j.token);
      setMsg("");
    } else setMsg(j.error || "Login failed.");
  };
  const patch = (id: number, b: object) => call("/matches/" + id, "PATCH", b);

  const saveMatch = (m?: AM) => async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const body: Record<string, unknown> = {
      sportId: +(f.get("sp") as string),
      teamAId: +(f.get("ta") as string),
      teamBId: +(f.get("tb") as string),
      venue: f.get("v"),
      matchTime: new Date(f.get("t") as string).toISOString(),
    };
    if (m)
      Object.assign(body, {
        scoreA: +(f.get("a") as string),
        scoreB: +(f.get("b") as string),
        status: f.get("s"),
        detail: f.get("d"),
      });
    const ok = await call(
      m ? "/matches/" + m.id : "/matches",
      m ? "PATCH" : "POST",
      body,
    );
    if (ok) {
      if (m) setEm(0);
      else form.reset();
    }
  };
  const saveNotice = (x?: N) => async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const ok = await call(
      x ? "/announcements/" + x.id : "/announcements",
      x ? "PATCH" : "POST",
      {
        title: f.get("t"),
        content: f.get("c"),
        category: f.get("k"),
        isPinned: f.get("p") === "on",
      },
    );
    if (ok) {
      if (x) setEn(0);
      else form.reset();
    }
  };
  const savePoint = (x?: PE) => async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const ok = await call(
      x ? "/points/" + x.id : "/points",
      x ? "PATCH" : "POST",
      {
        sportId: +(f.get("sp") as string),
        departmentId: +(f.get("dp") as string),
        points: +(f.get("pt") as string),
        note: f.get("nt"),
      },
    );
    if (ok) {
      if (x) setEp(0);
      else form.reset();
    }
  };
  const upload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const file = f.get("image") as File;
    if (!file || !file.size) return setMsg("Choose a photo first.");
    if (file.size > 5 * 1024 * 1024) return setMsg("Photo must be under 5 MB.");
    setBusy(true);
    setMsg("Uploading...");
    try {
      const r = await fetch(API + "/gallery", {
        method: "POST",
        headers: { Authorization: `Bearer ${tok}` },
        body: f,
      });
      if (r.status === 401) out();
      setMsg(
        r.ok
          ? "Photo uploaded."
          : (await r.json().catch(() => ({}))).error || "Upload failed.",
      );
      if (r.ok) {
        form.reset();
        setN((x) => x + 1);
      }
    } catch {
      setMsg("Could not reach the server.");
    }
    setBusy(false);
  };

  if (!tok)
    return (
      <div className="wrap">
        <h1>Organiser login</h1>
        <form className="card" onSubmit={login}>
          <label>
            Email
            <input name="email" type="email" required autoComplete="username" />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </label>
          <button className="pri">Log in</button>
          <p role="alert">{msg}</p>
        </form>
      </div>
    );
  if (!meta?.sports.length)
    return (
      <div className="wrap">
        <Skel />
      </div>
    );

  const matchFields = (m?: AM) => (
    <>
      <label>
        Sport
        <select name="sp" defaultValue={m?.sportId}>
          {meta.sports.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Team A
        <select name="ta" defaultValue={m?.teamAId}>
          {meta.departments.map((s) => (
            <option key={s.id} value={s.id}>
              {s.shortName}
            </option>
          ))}
        </select>
      </label>
      <label>
        Team B
        <select name="tb" defaultValue={m?.teamBId ?? meta.departments[1]?.id}>
          {meta.departments.map((s) => (
            <option key={s.id} value={s.id}>
              {s.shortName}
            </option>
          ))}
        </select>
      </label>
      <label>
        Date and time
        <input
          name="t"
          type="datetime-local"
          required
          defaultValue={m ? loc(m.matchTime) : ""}
        />
      </label>
      <label>
        Venue
        <input name="v" maxLength={80} required defaultValue={m?.venue} />
      </label>
      {m && (
        <>
          <label>
            {m.teamA.shortName} score
            <input name="a" type="number" min="0" defaultValue={m.scoreA} />
          </label>
          <label>
            {m.teamB.shortName} score
            <input name="b" type="number" min="0" defaultValue={m.scoreB} />
          </label>
          <label>
            Status
            <select name="s" defaultValue={m.status}>
              <option>UPCOMING</option>
              <option>LIVE</option>
              <option>FINAL</option>
            </select>
          </label>
          <label>
            Live note (minute, quarter, set, overs)
            <input name="d" maxLength={80} defaultValue={m.detail} />
          </label>
        </>
      )}
    </>
  );
  const noticeFields = (x?: N) => (
    <>
      <label>
        Title
        <input name="t" maxLength={100} required defaultValue={x?.title} />
      </label>
      <label>
        Message
        <textarea
          name="c"
          maxLength={600}
          rows={3}
          required
          defaultValue={x?.content}
        />
      </label>
      <label>
        Category
        <select name="k" defaultValue={x?.category}>
          {CATS.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </label>
      <label>
        <span>
          <input
            name="p"
            type="checkbox"
            defaultChecked={x?.isPinned}
            style={{ width: "auto", minHeight: 0 }}
          />{" "}
          Pin to top
        </span>
      </label>
    </>
  );
  const pointFields = (x?: PE) => (
    <>
      <label>
        Sport
        <select name="sp" defaultValue={x?.sportId}>
          {meta.sports.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Department
        <select name="dp" defaultValue={x?.departmentId}>
          {meta.departments.map((s) => (
            <option key={s.id} value={s.id}>
              {s.shortName}
            </option>
          ))}
        </select>
      </label>
      <label>
        Points (negative for a penalty)
        <input
          name="pt"
          type="number"
          step="1"
          required
          defaultValue={x?.points}
        />
      </label>
      <label>
        Note (optional)
        <input name="nt" maxLength={80} defaultValue={x?.note} />
      </label>
    </>
  );

  return (
    <div className="wrap">
      <h1>Admin</h1>
      <button onClick={out}>Log out</button>
      <div className="tabs2">
        <button
          className={tab === "matches" ? "on" : ""}
          onClick={() => setTab("matches")}
        >
          Matches and scores
        </button>
        <button
          className={tab === "notices" ? "on" : ""}
          onClick={() => setTab("notices")}
        >
          Announcements
        </button>
        <button
          className={tab === "points" ? "on" : ""}
          onClick={() => setTab("points")}
        >
          Leaderboard points
        </button>
        <button
          className={tab === "gallery" ? "on" : ""}
          onClick={() => setTab("gallery")}
        >
          Gallery
        </button>
      </div>
      <p role="status" className="ok">
        {msg}
      </p>
      {tab === "matches" ? (
        <>
          <h2>Add fixture</h2>
          <form className="card grid2" onSubmit={saveMatch()}>
            {matchFields()}
            <button className="pri">Add match</button>
          </form>
          <h2>All matches</h2>
          {ms?.length === 0 && (
            <p className="meta">No matches yet. Add one above.</p>
          )}
          {ms?.map((m) =>
            em === m.id ? (
              <form key={m.id} className="card grid2" onSubmit={saveMatch(m)}>
                {matchFields(m)}
                <div className="row">
                  <button className="pri">Save changes</button>
                  <button type="button" onClick={() => setEm(0)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div key={m.id}>
                <Card m={m} />
                <div
                  className="row"
                  style={{ marginTop: "-.3rem", marginBottom: "1.2rem" }}
                >
                  <button onClick={() => patch(m.id, { scoreA: m.scoreA + 1 })}>
                    +1 {m.teamA.shortName}
                  </button>
                  <button onClick={() => patch(m.id, { scoreB: m.scoreB + 1 })}>
                    +1 {m.teamB.shortName}
                  </button>
                  <button onClick={() => patch(m.id, { status: "LIVE" })}>
                    Go live
                  </button>
                  <button onClick={() => patch(m.id, { status: "FINAL" })}>
                    Finish
                  </button>
                  <button onClick={() => setEm(m.id)}>Edit</button>
                  <button
                    className="danger"
                    onClick={() => {
                      if (confirm("Delete this match?"))
                        call("/matches/" + m.id, "DELETE");
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ),
          )}
        </>
      ) : tab === "notices" ? (
        <>
          <h2>Post announcement</h2>
          <form className="card" onSubmit={saveNotice()}>
            {noticeFields()}
            <button className="pri">Publish</button>
          </form>
          <h2>All announcements</h2>
          {ns?.map((x) =>
            en === x.id ? (
              <form key={x.id} className="card" onSubmit={saveNotice(x)}>
                {noticeFields(x)}
                <div className="row">
                  <button className="pri">Save changes</button>
                  <button type="button" onClick={() => setEn(0)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div key={x.id}>
                <Notice n={x} />
                <div
                  className="row"
                  style={{ marginTop: "-.3rem", marginBottom: "1.2rem" }}
                >
                  <button
                    onClick={() =>
                      call("/announcements/" + x.id, "PATCH", {
                        isPinned: !x.isPinned,
                      })
                    }
                  >
                    {x.isPinned ? "Unpin" : "Pin"}
                  </button>
                  <button onClick={() => setEn(x.id)}>Edit</button>
                  <button
                    className="danger"
                    onClick={() => {
                      if (confirm("Delete this announcement?"))
                        call("/announcements/" + x.id, "DELETE");
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ),
          )}
        </>
      ) : tab === "points" ? (
        <>
          <h2>Add points</h2>
          <p
            className="meta"
            style={{ textAlign: "left", marginBottom: "1rem" }}
          >
            Each entry gives one department points in one sport. A sport
            leaderboard adds up that sport's entries. The overall leaderboard
            adds up every sport.
          </p>
          <form className="card grid2" onSubmit={savePoint()}>
            {pointFields()}
            <button className="pri">Add points</button>
          </form>
          <h2>All entries</h2>
          {pe?.length === 0 && (
            <p className="meta">No entries yet. Add one above.</p>
          )}
          {pe?.map((p) =>
            ep === p.id ? (
              <form key={p.id} className="card grid2" onSubmit={savePoint(p)}>
                {pointFields(p)}
                <div className="row">
                  <button className="pri">Save changes</button>
                  <button type="button" onClick={() => setEp(0)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div key={p.id} className="card pe">
                <div>
                  <b>{p.department.shortName}</b> {p.points > 0 ? "+" : ""}
                  {p.points} in {p.sport.name}
                  {p.note && (
                    <>
                      <br />
                      <small className="meta">{p.note}</small>
                    </>
                  )}
                </div>
                <div className="row">
                  <button onClick={() => setEp(p.id)}>Edit</button>
                  <button
                    className="danger"
                    onClick={() => {
                      if (confirm("Delete this entry?"))
                        call("/points/" + p.id, "DELETE");
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ),
          )}
          <h2>Live preview</h2>
          <LBSection key={n} />
        </>
      ) : (
        <>
          <h2>Upload photo</h2>
          <form className="card grid2" onSubmit={upload}>
            <label>
              Photo (JPG, PNG or WEBP, max 5 MB)
              <input
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
              />
            </label>
            <label>
              Category
              <select name="category">
                {GALLERY_CATS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Caption (optional)
              <input name="caption" maxLength={100} />
            </label>
            <button className="pri" disabled={busy}>
              {busy ? "Uploading..." : "Upload to gallery"}
            </button>
          </form>
          <h2>All photos</h2>
          {ph?.length === 0 && <p className="meta">No photos yet.</p>}
          <div className="gal">
            {ph?.map((p) => (
              <figure key={p.id} className="shot">
                <img
                  src={thumb(p.url)}
                  alt={p.caption || p.category}
                  loading="lazy"
                />
                <figcaption>
                  {p.category}
                  {p.caption && `, ${p.caption}`}
                </figcaption>
                <div className="row" style={{ padding: "0 .7rem .7rem" }}>
                  <button
                    className="danger"
                    onClick={() => {
                      if (confirm("Delete this photo?"))
                        call("/gallery/" + p.id, "DELETE");
                    }}
                  >
                    Delete
                  </button>
                </div>
              </figure>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const LOAD_WORDS = ['CESCO', 'SPARDHA', '2026', ...Object.keys(RULES).map(s => s.toUpperCase())]
const LOAD_STEP = 750 // milliseconds each word takes
function Loader() {
  const [show, setShow] = useState(() => {
    try { return !sessionStorage.getItem('cesco-seen') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
  })
  const [out, setOut] = useState(false)
  const end = (LOAD_WORDS.length - 1) * LOAD_STEP
  useEffect(() => {
    if (!show) return
    try { sessionStorage.setItem('cesco-seen', '1') } catch { /* ignore */ }
    const root = document.documentElement
    root.classList.add('loading')
    const t1 = window.setTimeout(() => setOut(true), end + 1000)
    const t2 = window.setTimeout(() => setShow(false), end + 1600)
    return () => { clearTimeout(t1); clearTimeout(t2); root.classList.remove('loading') }
  }, [show])
  useEffect(() => { if (out) document.documentElement.classList.remove('loading') }, [out])
  if (!show) return null
  const skip = () => { setOut(true); window.setTimeout(() => setShow(false), 600) }
  return <div className={'loader' + (out ? ' out' : '')} role="status" aria-label="Loading Spardha 26" onClick={skip}>
    <div className="lstage" style={{ '--step': LOAD_STEP + 'ms' } as CSSProperties}>
      {LOAD_WORDS.map((w, k) => <span key={w} className={'lw ' + (k % 2 ? 'rtl' : 'ltr') + (k === LOAD_WORDS.length - 1 ? ' last' : '')} style={{ '--k': k } as CSSProperties}><i>{String(k + 1).padStart(2, '0')}</i>{w}</span>)}
    </div>
    <div className="lbar2"><i style={{ animationDuration: `${end + 1000}ms` }} /></div>
  </div>
}

export default function App() {
  const [dark, setDark] = useState(
    document.documentElement.dataset.theme === "dark",
  );
  const { pathname } = useLocation();
  const ns = useApi<N[]>("/announcements", [], 60000);
  const fresh =
    ns?.filter((n) => Date.now() - new Date(n.createdAt).getTime() < 3 * 864e5)
      .length ?? 0;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    const root = document.documentElement;
    let raf = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        root.style.setProperty("--mx", e.clientX + "px");
        root.style.setProperty("--my", e.clientY + "px");
        root.classList.add("glow-on");
        const el = (e.target as Element).closest?.(
          ".tile,.stat,.contact .card,.rules li,.lbrow",
        ) as HTMLElement | null;
        if (el) {
          const r = el.getBoundingClientRect();
          el.style.setProperty("--cx", e.clientX - r.left + "px");
          el.style.setProperty("--cy", e.clientY - r.top + "px");
        }
      });
    };
    const leave = () => root.classList.remove("glow-on");
    window.addEventListener("pointermove", move);
    document.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("mouseleave", leave);
      cancelAnimationFrame(raf);
    };
  }, []);
  const toggle = () => {
    const t = dark ? "light" : "dark";
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem("theme", t);
    } catch {
      /* ignore */
    }
    setDark(!dark);
  };
  const links: [string, string][] = [
    ["/", "Home"],
    ["/live", "Live"],
    ["/fixtures", "Fixtures"],
    ["/table", "Table"],
    ["/more", "More"],
  ];
  const L = () => (
    <>
      {links.map(([to, t]) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) => (isActive ? "on" : "")}
        >
          {t}
        </NavLink>
      ))}
    </>
  );
  return (
    <>
      <Defs />
      <Loader />
      <header className="top">
        <Link to="/" className="brand">
          <img
            className="brandlogo"
            src="/spardha-logo.png"
            alt="Spardha"
            width="40"
            height="40"
          />
          <span>SPARDHA</span>
        </Link>
        <nav className="side" aria-label="Main">
          <Jump id="about">About</Jump>
          <Jump id="sports">Sports</Jump>
          <Link to="/fixtures">Fixtures</Link>
          <Jump id="board">Leaderboard</Jump>
          <Link to="/gallery">Gallery</Link>
        </nav>
        <div className="actions">
          <Link
            to="/notices"
            className="btn iconbtn"
            aria-label={`Announcements${fresh ? `, ${fresh} new` : ""}`}
          >
            <BellIcon />
            {fresh > 0 && <span className="badge">{fresh}</span>}
          </Link>
          <button
            className="iconbtn"
            onClick={toggle}
            aria-label="Switch light or dark mode"
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/live" element={<Live />} />
          <Route path="/fixtures" element={<Fixtures />} />
          <Route path="/table" element={<Standings />} />
          <Route path="/sport/:name" element={<SportPage />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/notices" element={<Notices />} />
          <Route path="/more" element={<More />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path={ADMIN_PATH} element={<Admin />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
      <nav className="bot" aria-label="Main mobile">
        <L />
      </nav>
    </>
  );
}
