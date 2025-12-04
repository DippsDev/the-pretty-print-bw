import { SERVICES } from "@/lib/servicesData";
import type { Booking } from "@/redux/serviceSlice";

export function resolveServiceSlugFromBooking(booking?: Booking): string | undefined {
  if (!booking) return undefined;
  if (booking.metadata?.serviceSlug) return booking.metadata.serviceSlug;

  for (const group of SERVICES) {
    const matchedService = group.services.find(
      (svc) => svc.name === booking.name && svc.slug
    );
    if (matchedService?.slug) {
      return matchedService.slug;
    }

    if (group.prices && group.prices.length > 0) {
      const matchedPrice = group.prices.find(
        (price) =>
          price.label === booking.option ||
          `${group.label} - ${price.label}` === booking.name
      );
      if (matchedPrice?.slug) {
        return matchedPrice.slug;
      }
    }
  }

  return undefined;
}









