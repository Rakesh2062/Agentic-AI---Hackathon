// CivicPulse AI Platform Constants & Enums

export const UserRole = {
  CIVILIAN: "CIVILIAN",
  CIVIC_OFFICIAL: "CIVIC_OFFICIAL",
  TOURIST: "TOURIST",
};

export const RoleLabels = {
  [UserRole.CIVILIAN]: "Civilian / Resident",
  [UserRole.CIVIC_OFFICIAL]: "Civic Official",
  [UserRole.TOURIST]: "Tourist / Visitor",
};

export const Category = {
  ROADS: "roads",
  WATER: "water",
  DRAINAGE: "drainage",
  WASTE: "waste",
  STREETLIGHT: "streetlight",
  TRAFFIC: "traffic",
  PUBLIC_FACILITY: "public_facility",
  ENVIRONMENT: "environment",
  OTHER: "other",
};

export const Status = {
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  ASSIGNED: "assigned",
  IN_PROGRESS: "in_progress",
  INSPECTED: "inspected",
  RESOLVED: "resolved",
  CLOSED: "closed",
  ESCALATED: "escalated",
};

export const Priority = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

export const CategoryLabels = {
  [Category.ROADS]: "Roads & Infrastructure",
  [Category.WATER]: "Water & Sewage Board",
  [Category.DRAINAGE]: "Stormwater & Drainage",
  [Category.WASTE]: "Solid Waste Management",
  [Category.STREETLIGHT]: "Street Lighting & Electrical",
  [Category.TRAFFIC]: "Traffic Management & Signals",
  [Category.PUBLIC_FACILITY]: "Parks & Urban Forestry",
  [Category.ENVIRONMENT]: "Environment & Urban Forestry",
  [Category.OTHER]: "Other (Specify Custom Issue)",
};

export const StatusConfig = {
  [Status.SUBMITTED]: {
    label: "Submitted",
    color: "slate",
    bg: "bg-slate-800/80 text-slate-300 border-slate-700",
    dot: "bg-slate-400",
    description: "Received by AI intake system and awaiting official review",
  },
  [Status.UNDER_REVIEW]: {
    label: "Awaiting Official Validation",
    color: "sky",
    bg: "bg-sky-950/80 text-sky-300 border-sky-800",
    dot: "bg-sky-400",
    description: "AI classification complete. Pending official validation & point award.",
  },
  [Status.ASSIGNED]: {
    label: "Validated & Assigned",
    color: "purple",
    bg: "bg-purple-950/80 text-purple-300 border-purple-800",
    dot: "bg-purple-400",
    description: "Officially validated and assigned to department field dispatch",
  },
  [Status.IN_PROGRESS]: {
    label: "In Progress",
    color: "amber",
    bg: "bg-amber-950/80 text-amber-300 border-amber-800",
    dot: "bg-amber-400",
    description: "Department crew actively working on resolution",
  },
  [Status.INSPECTED]: {
    label: "Field Inspected",
    color: "cyan",
    bg: "bg-cyan-950/80 text-cyan-300 border-cyan-800",
    dot: "bg-cyan-400",
    description: "Field supervisor quality inspection completed",
  },
  [Status.RESOLVED]: {
    label: "Resolved",
    color: "emerald",
    bg: "bg-emerald-950/80 text-emerald-300 border-emerald-800",
    dot: "bg-emerald-400",
    description: "Issue repaired and verified according to municipal standards",
  },
  [Status.CLOSED]: {
    label: "Closed",
    color: "slate",
    bg: "bg-slate-900/90 text-slate-400 border-slate-800",
    dot: "bg-slate-500",
    description: "Archived after resolution verification",
  },
  [Status.ESCALATED]: {
    label: "SLA Escalated",
    color: "rose",
    bg: "bg-rose-950/90 text-rose-300 border-rose-800 animate-pulse",
    dot: "bg-rose-500",
    description: "SLA breached or high critical score triggering supervisor escalation",
  },
};

export const PriorityConfig = {
  [Priority.LOW]: {
    label: "Low Priority",
    shortLabel: "LOW",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
    text: "text-slate-400",
    barColor: "bg-slate-500",
    basePoints: 5,
    slaHours: 72,
  },
  [Priority.MEDIUM]: {
    label: "Medium Priority",
    shortLabel: "MED",
    badge: "bg-sky-950/80 text-sky-300 border-sky-700",
    text: "text-sky-400",
    barColor: "bg-sky-500",
    basePoints: 15,
    slaHours: 48,
  },
  [Priority.HIGH]: {
    label: "High Priority",
    shortLabel: "HIGH",
    badge: "bg-amber-950/80 text-amber-300 border-amber-700",
    text: "text-amber-400",
    barColor: "bg-amber-500",
    basePoints: 30,
    slaHours: 24,
  },
  [Priority.CRITICAL]: {
    label: "Critical Priority",
    shortLabel: "CRITICAL",
    badge: "bg-red-950/90 text-red-300 border-red-700 font-bold",
    text: "text-red-400",
    barColor: "bg-red-500",
    basePoints: 50,
    slaHours: 6,
  },
};

export const DepartmentsList = [
  { id: "roads", name: "Roads & Infrastructure" },
  { id: "water", name: "Water & Sewage Board" },
  { id: "waste", name: "Solid Waste Management" },
  { id: "streetlight", name: "Street Lighting & Electrical" },
  { id: "drainage", name: "Stormwater & Drainage" },
  { id: "traffic", name: "Traffic Management & Signals" },
  { id: "parks", name: "Parks & Urban Forestry" },
];

export const CivicLevels = [
  { minPoints: 0, maxPoints: 49, title: "Civic Starter", badge: "🌱", color: "emerald", nextTitle: "Civic Contributor", nextAt: 50 },
  { minPoints: 50, maxPoints: 149, title: "Civic Contributor", badge: "🌿", color: "teal", nextTitle: "Community Supporter", nextAt: 150 },
  { minPoints: 150, maxPoints: 299, title: "Community Supporter", badge: "⭐", color: "sky", nextTitle: "Community Champion", nextAt: 300 },
  { minPoints: 300, maxPoints: 499, title: "Community Champion", badge: "🏆", color: "amber", nextTitle: "Civic Leader", nextAt: 500 },
  { minPoints: 500, maxPoints: 999, title: "Civic Leader", badge: "🌟", color: "purple", nextTitle: "Civic Ambassador", nextAt: 1000 },
  { minPoints: 1000, maxPoints: 99999, title: "Civic Ambassador", badge: "💎", color: "rose", nextTitle: "Max Level", nextAt: 1000 },
];

export function getCivicLevel(points = 0) {
  return CivicLevels.find((lvl) => points >= lvl.minPoints && points <= lvl.maxPoints) || CivicLevels[0];
}

export const ResidentBenefitsCatalog = [
  {
    id: "rew-res-01",
    title: "Digital Civic Contributor Badge",
    description: "Official verified contributor digital badge on municipal portal and profile.",
    pointsRequired: 50,
    type: "badge",
    category: "Recognition",
    partner: "City Administration",
    status: "available",
  },
  {
    id: "rew-res-02",
    title: "Priority Community Program Pass",
    description: "Early access reservations for municipal town halls and community recreation centers.",
    pointsRequired: 150,
    type: "access",
    category: "Civic Access",
    partner: "Parks & Recreation",
    status: "available",
  },
  {
    id: "rew-res-03",
    title: "Green Merchant Discount (15% Off)",
    description: "Partner discount on local sustainable grocery stores and eco-friendly merchants.",
    pointsRequired: 200,
    type: "voucher",
    category: "Partner Reward",
    partner: "GreenMarket Alliance",
    status: "available",
  },
  {
    id: "rew-res-04",
    title: "Community Champion Commendation",
    description: "Formal Certificate of Civic Commendation signed by the Mayor's Office.",
    pointsRequired: 300,
    type: "certificate",
    category: "Honors",
    partner: "Mayor's Office of Civic Engagement",
    status: "available",
  },
];

export const VisitorBenefitsCatalog = [
  {
    id: "rew-vis-01",
    title: "Civic Tourist Welcome Badge",
    description: "Recognition for visitors contributing to local city preservation and safety.",
    pointsRequired: 20,
    type: "badge",
    category: "Visitor Recognition",
    partner: "City Tourism Board",
    status: "available",
  },
  {
    id: "rew-vis-02",
    title: "City Museum & Heritage Pass (20% Off)",
    description: "Discounted admission ticket to City Art Gallery and Botanical Conservatory.",
    pointsRequired: 100,
    type: "voucher",
    category: "Local Reward",
    partner: "City Arts Council",
    status: "available",
  },
  {
    id: "rew-vis-03",
    title: "Metro Transit 24-Hour Mobility Voucher",
    description: "Partner-sponsored 1-day eco-transit pass on all downtown light rail and electric bus lines.",
    pointsRequired: 200,
    type: "transit",
    category: "Partner Benefit",
    partner: "Metropolitan Transit District",
    status: "available",
  },
];
