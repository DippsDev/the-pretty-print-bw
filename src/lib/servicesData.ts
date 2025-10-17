// Universal services data for both Navbar and ServicesPage
export const SERVICES = [
  {
    label: "Massages",
    right: [
      "Aroma - Therapy",
      "Swedish Massage",
      "Back Massage",
      "Head, Neck and Shoulder Massage",
    ],
    services: [
      {
        name: "Aroma - Therapy",
        description: "Relaxing massage with essential oils.",
        price: {
          "30 mins": "ZAR 300",
          "60 mins": "ZAR 500",
          "90 mins": "ZAR 700"
        },
        timeOptions: ["30 mins", "60 mins", "90 mins"]
      },
      {
        name: "Swedish Massage",
        description: "Classic full-body massage.",
        price: {
          "30 mins": "ZAR 250",
          "60 mins": "ZAR 450"
        },
        timeOptions: ["30 mins", "60 mins"]
      },
      {
        name: "Back Massage",
        description: "Focused back massage for tension relief.",
        price: {
          "20 mins": "ZAR 180",
          "40 mins": "ZAR 300"
        },
        timeOptions: ["20 mins", "40 mins"]
      },
      {
        name: "Head, Neck and Shoulder Massage",
        description: "Targeted massage for head, neck, and shoulders.",
        price: {
          "15 mins": "ZAR 120",
          "30 mins": "ZAR 250"
        },
        timeOptions: ["15 mins", "30 mins"]
      },
    ],
  },
  {
    label: "Facial",
    right: [
      "Classic Facial",
      "Deep Cleansing Facial",
      "Anti-Aging Facial",
    ],
    services: [
      {
        name: "Classic Facial",
        description: "Basic facial for all skin types.",
        price: {
          "30 mins": "ZAR 250",
          "60 mins": "ZAR 400"
        },
        timeOptions: ["30 mins", "60 mins"]
      },
      {
        name: "Deep Cleansing Facial",
        description: "Deep pore cleansing and exfoliation.",
        price: {
          "45 mins": "ZAR 300",
          "75 mins": "ZAR 450"
        },
        timeOptions: ["45 mins", "75 mins"]
      },
      {
        name: "Anti-Aging Facial",
        description: "Facial to reduce signs of aging.",
        price: {
          "60 mins": "ZAR 350",
          "90 mins": "ZAR 500"
        },
        timeOptions: ["60 mins", "90 mins"]
      },
    ],
  },
  {
    label: "Half-Day Package",
    right: ["Package A", "Package B"],
    services: [
      {
        name: "Package A",
        description: "Includes massage and facial.",
        price: {
          "2 hours": "ZAR 900",
          "3 hours": "ZAR 1200"
        },
        timeOptions: ["2 hours", "3 hours"]
      },
      {
        name: "Package B",
        description: "Includes massage, facial, and lunch.",
        price: {
          "3 hours": "ZAR 1200",
          "4 hours": "ZAR 1500"
        },
        timeOptions: ["3 hours", "4 hours"]
      },
    ],
  },
  {
    label: "Couples Treatment",
    right: ["Couples Massage", "Couples Facial"],
    services: [
      {
        name: "Couples Massage",
        description: "Massage for two in the same room.",
        price: {
          "30 mins": "ZAR 500",
          "60 mins": "ZAR 900"
        },
        timeOptions: ["30 mins", "60 mins"]
      },
      {
        name: "Couples Facial",
        description: "Facial for two in the same room.",
        price: {
          "30 mins": "ZAR 400",
          "60 mins": "ZAR 800"
        },
        timeOptions: ["30 mins", "60 mins"]
      },
    ],
  },
];