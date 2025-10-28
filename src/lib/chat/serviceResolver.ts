import { SERVICES } from '@/lib/servicesData';

export function resolveServiceAndPrice(serviceName?: string, packageName?: string) {
  if (!serviceName) return null;

  // Try to find the service in SERVICES
  for (const service of SERVICES) {
    // Package services
    if (service.prices && service.services) {
      for (const item of service.services) {
        if (item.name.toLowerCase() === serviceName.toLowerCase()) {
          // Find the package price if applicable
          let price = null;
          let option = null;
          if (packageName && service.prices) {
            const pkg = service.prices.find(
              p => p.label.toLowerCase() === packageName.toLowerCase()
            );
            if (pkg) {
              price = pkg.value;
              option = pkg.label;
            }
          }
          // Fallback to first package if not specified
          if (!price && service.prices && service.prices.length > 0) {
            price = service.prices[0].value;
            option = service.prices[0].label;
          }
          return {
            name: item.name,
            option,
            price,
          };
        }
      }
    } else if (service.services) {
      // Individual services
      for (const item of service.services) {
        if (item.name.toLowerCase() === serviceName.toLowerCase()) {
          return {
            name: item.name,
            option: item.timeOptions?.[0] || null,
            price: 'price' in item ? item.price : null,
          };
        }
      }
    }
  }

  return null;
}
