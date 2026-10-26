// Menu for thePRETTYPRINT, taken from the current price list.
// Amounts are in Botswana pula (P). Durations are estimates for the prototype.

export interface ServicePriceOption {
  label: string;
  value: string;
  slug?: string;
}

export interface Service {
  name: string;
  slug?: string;
  description?: string;
  price?: string | { [time: string]: string | undefined } | ServicePriceOption[];
  timeOptions?: string[];
  durationMinutes?: number;
  type?: string;
}

export interface ServiceGroup {
  label: string;
  blurb: string;
  services: Service[];
  prices?: ServicePriceOption[];
}

function item(
  name: string,
  price: string,
  minutes: number,
  description?: string,
): Service {
  const slug = name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return {
    name,
    slug,
    description,
    price,
    timeOptions: [`About ${minutes} min`],
    durationMinutes: minutes,
  };
}

export const HOUSE_RULES = [
  "Come with your hair washed and blow-dried.",
  "Read the studio policies before booking.",
  "No extra guests.",
];

export const SERVICES: ServiceGroup[] = [
  {
    label: "Ponytails",
    blurb: "Installed ponytails, from a straight back to a mohawk.",
    services: [
      item("Straight back ponytail", "P300", 90),
      item("Spikes / knot bun", "P300", 90),
      item("3D part ponytail", "P300", 90),
      item("2 or 3 bun ponytail (mohawk)", "P300", 120),
      item("Swoop ponytail", "P350", 90),
      item("Double ponytail", "P350", 90),
    ],
  },
  {
    label: "Half up, half down",
    blurb: "Priced by length.",
    services: [
      item("Short length", "P360", 90, "Half up, half down"),
      item("Medium length", "P380", 105, "Half up, half down"),
      item("Long", "P400", 120, "Half up, half down"),
    ],
  },
  {
    label: "Sew-in & quickweaves",
    blurb: "Sew-ins, curly installs, and crochet.",
    services: [
      item("Traditional sew-in (bob)", "P400", 180),
      item("Traditional sew-in (long)", "P450", 210),
      item("Natural curly", "P450", 180),
      item("Vixen crochet", "P480", 180),
      item("Island curl sew-in", "P500", 210),
    ],
  },
  {
    label: "Extras",
    blurb: "Add-ons for an install. The one-week touch up is free.",
    services: [
      item("Peekaboos", "P50", 20),
      item("Volume", "P50", 20),
      item("1-week touch up", "Free", 45),
    ],
  },
  {
    label: "Wig services",
    blurb: "Rentals, revamps, and a silk press.",
    services: [
      item("Wig rental", "P200", 30),
      item("Wig wash & revamp", "P150", 60),
      item("Wig lines", "P50", 30),
      item("Silk press", "P100", 90),
    ],
  },
  {
    label: "Packages",
    blurb: "Welcome sets that pair a style with cluster lashes.",
    services: [
      item(
        "Welcome package 1",
        "P360",
        120,
        "Any ponytail + cluster lashes",
      ),
      item(
        "Welcome package 2",
        "P420",
        150,
        "Any half up + cluster lashes",
      ),
      item(
        "Welcome package 3",
        "P550",
        180,
        "Any ponytail or half up + cluster lashes + any-count bouquet rental",
      ),
    ],
  },
];
