export const INDUSTRIES = [
  "AI / ML",
  "Fintech",
  "Healthtech",
  "SaaS",
  "E-commerce",
  "Climate",
  "EdTech",
  "Web3",
  "Consumer",
  "Marketplace",
  "Hardware",
  "Biotech",
] as const;

export const SKILLS = [
  "Product",
  "Engineering",
  "Frontend",
  "Backend",
  "Mobile",
  "Design",
  "Marketing",
  "Sales",
  "Operations",
  "Finance",
  "Legal",
  "Data",
  "AI/ML",
  "DevOps",
] as const;

export const STAGES = [
  { value: "idea", label: "Idea" },
  { value: "mvp", label: "MVP" },
  { value: "early", label: "Early Stage" },
  { value: "growth", label: "Growth" },
] as const;

export const EXPERIENCE_LEVELS = [
  { value: "junior", label: "Junior (0–2 yrs)" },
  { value: "mid", label: "Mid (3–5 yrs)" },
  { value: "senior", label: "Senior (6–10 yrs)" },
  { value: "expert", label: "Expert (10+ yrs)" },
] as const;

export const AVAILABILITY = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "advisor", label: "Advisor" },
] as const;

export const ROLE_LABELS: Record<string, string> = {
  founder: "Founder",
  professional: "Professional",
  investor: "Investor",
  admin: "Admin",
};
