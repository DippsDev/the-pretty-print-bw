// Universal services data for both Navbar and ServicesPage
// Each service references a Cal.com event type slug that is resolved in `calcom/events`

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
  services: Service[];
  prices?: ServicePriceOption[];
}

export const SERVICES: ServiceGroup[] = [
  {
    label: "Massages",
    services: [
      {
        name: "Full Body Massage",
        slug: "full-body-massage",
        price: "R699",
        timeOptions: ["90 Minutes"],
        durationMinutes: 90,
      },
      {
        name: "Full Body Hot Stone Massage",
        slug: "hot-stone-massage",
        price: "R599",
        timeOptions: ["60 Minutes"],
        durationMinutes: 60,
      },
      {
        name: "Aroma Therapy Massage",
        slug: "aroma-therapy",
        price: "R499",
        timeOptions: ["60 Minutes"],
        durationMinutes: 60,
      },
      {
        name: "Deep Tissue Massage",
        slug: "deep-tissue-massage",
        price: "R599",
        timeOptions: ["60 Minutes"],
        durationMinutes: 60,
      },
      {
        name: "Swedish Massage",
        slug: "swedish-massage",
        price: "R499",
        timeOptions: ["60 Minutes"],
        durationMinutes: 60,
      },
      {
        name: "Back Massage",
        slug: "back-massage",
        price: "R350",
        timeOptions: ["30 Minutes"],
        durationMinutes: 30,
      },
      {
        name: "Head, Neck and Shoulder Massage",
        slug: "head-neck-shoulder-massage",
        price: "R299",
        timeOptions: ["30 Minutes"],
        durationMinutes: 30,
      },
    ],
  },
  {
    label: "Facial",
    services: [
      {
        name: "Facial: Exfoliation, masking and massage",
        slug: "facial-treatment",
        price: "R199",
        timeOptions: ["30 Minutes"],
        durationMinutes: 30,
      },
    ],
  },
  {
    label: "Half-Day Package",
    services: [
      {
        name: "Full Body Massage",
        timeOptions: ["60 Minutes"],
        type: "package",
      },
      {
        name: "Foot Soak, Exfoliation and Massage",
        timeOptions: ["30 Minutes"],
        type: "package",
      },
      {
        name: "Head, Neck and Shoulder Massage",
        timeOptions: ["30 Minutes"],
        type: "package",
      },
      {
        name: "Facial",
        timeOptions: ["30 Minutes"],
        type: "package",
      },
      {
        name: "Welcome drinks, snack platter with finger lunch between treatments",
        timeOptions: [],
        type: "package",
      },
    ],
    prices: [
      { label: "For 1", value: "R1 399", slug: "half-day-package-single" },
      { label: "For 2", value: "R2 499", slug: "half-day-package-couple" },
    ],
  },
  {
    label: "Couple's Treatment",
    services: [
      {
        name: "Full Body Hot Stone Massage",
        timeOptions: ["60 Minutes"],
        type: "package",
      },
      {
        name: "Foot Soak and Massage",
        timeOptions: ["30 Minutes"],
        type: "package",
      },
    ],
    prices: [
      { label: "For 2", value: "R1 050", slug: "couples-treatment" },
    ],
  },
];
