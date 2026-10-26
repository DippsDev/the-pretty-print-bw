export type StudioServiceLine = {
  name: string;
  price: string;
  stylist: string;
};

export type StudioBooking = {
  id: string;
  createdAt: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  services: StudioServiceLine[];
  date: string;
  time: string;
  notes: string;
  total: number;
  status: "confirmed" | "cancelled";
  payment: "unpaid" | "paid" | "refunded";
  yocoCheckoutId?: string;
  calUid?: string;
  refundAmount?: number;
  refundNote?: string;
};
