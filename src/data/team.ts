export type Member = {
  id: string;
  slug: string;
  name: string;
  role: string;
  teamId: string | null;
  team: string | null;
  isHead: boolean;
  isLeadership: boolean;
  photo?: string | null;
  bio?: string | null;
  skills: string[];
  links: Record<string, string>;
};

export type Team = {
  id: string;
  name: string;
  code: string;
  blurb: string | null;
  heads: Member[];
  members: Member[];
};

export type Directory = {
  teams: Team[];
  leadership: Member[];
  all: Member[];
};

export function initials(name: string): string {
  const parts = name.replace(/\./g, "").split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
