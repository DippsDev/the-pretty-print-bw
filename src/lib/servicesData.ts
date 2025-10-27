// Universal services data for both Navbar and ServicesPage
export const SERVICES = [
  {
    label: "Massages",
    services: [
      {
        name: "Full Body Massage",
        price: "R699",
        timeOptions: ["90 Minutes"],
      },
      {
        name: "Full Body Hot Stone Massage",
        price: "R599",
        timeOptions: ["60 Minutes"],
      },
      {
        name: "Aroma - Therapy",
        price: "R499",
        timeOptions: ["60 Minutes"],
      },
      {
        name: "Deep Tissue Massage",
        price: "R599",
        timeOptions: ["60 Minutes"],
      },
      {
        name: "Swedish Massage",
        price: "R499",
        timeOptions: ["60 Minutes"],
      },
      {
        name: "Back Massage",
        price: "R350",
        timeOptions: ["30 Minutes"],
      },
      {
        name: "Head, Neck and Shoulder Massage",
        price: "R299",
        timeOptions: ["30 Minutes"],
      },
    ],
  },
  {
    label: "Facial",
    services: [
      {
        name: "Facial: Exfoliation, masking and massage",
        price: "R199",
        timeOptions: ["30 Minutes"],
      },
    ],
  },
  {
    label: "Half-Day Package",
    services: [
      {
        name: "Full Body Massage",
        timeOptions: ["60 Minutes"],
        type: "package"
      },
      {
        name: "Foot Soak, Exfoliation and Massage",
        timeOptions: ["30 Minutes"],
        type: "package"
      },
      {
        name: "Head, Neck and Shoulder Massage",
        timeOptions: ["30 Minutes"],
        type: "package"
      },
      {
        name: "Facial",
        timeOptions: ["30 Minutes"],
        type: "package"
      },
      {
        name: "Welcome drinks, snack platter with finger lunch between treatments",
        timeOptions: [],
        type: "package"
      }
    ],
    prices: [
      { label: "For 1", value: "R1 399" },
      { label: "For 2", value: "R2 499" }
    ]
  },
  {
    label: "Couple’s Treatment",
    services: [
      {
        name: "Full Body Hot Stone Massage",
        timeOptions: ["60 Minutes"],
        type: "package"
      },
      {
        name: "Foot Soak and Massage",
        timeOptions: ["30 Minutes"],
        type: "package"
      }
    ],
    prices: [
      { label: "For 2", value: "R1 050" }
    ]
  },
];