export function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export function classifyStaff(badge: string) {
  const b = (badge || "").toLowerCase();
  if (b.includes("server owner")) return "owner";
  if (b.includes("head")) return "lead";
  return "admin";
}
