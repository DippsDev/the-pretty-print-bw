export interface Stylist {
  id: number;
  name: string;
  role: string;
  avatar: string | null;
  isGroup?: boolean;
}

/** Placeholder staff for the wireframe. Real names go in once the studio confirms them. */
export const STYLISTS: Stylist[] = [
  {
    id: 0,
    name: "Any stylist",
    role: "First available",
    avatar: null,
    isGroup: true,
  },
  {
    id: 1,
    name: "Stylist A",
    role: "Stylist",
    avatar: null,
  },
  {
    id: 2,
    name: "Stylist B",
    role: "Stylist",
    avatar: null,
  },
  {
    id: 3,
    name: "Stylist C",
    role: "Stylist",
    avatar: null,
  },
];

export function stylistName(id: number | undefined) {
  if (id === undefined) return "Any stylist";
  return STYLISTS.find((stylist) => stylist.id === id)?.name ?? "Any stylist";
}
