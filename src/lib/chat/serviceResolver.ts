import { SERVICES } from '@/lib/servicesData';

export function resolveServiceAndPrice(serviceName?: string, packageName?: string) {
  if (!serviceName) return null;
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const target = normalize(serviceName);

  // 1) Prefer matching real, individual services (with a direct price)
  for (const group of SERVICES) {
    if (!group.services) continue;
    for (const item of group.services) {
      const n = normalize(item.name);
      const isPackageType = (item as any).type === 'package';
      if (!isPackageType && (n === target || n.includes(target) || target.includes(n))) {
        return {
          name: item.name,
          option: item.timeOptions?.[0] || null,
          price: (item as any).price || null,
        };
      }
    }
  }

  // 2) Fall back to package groups only when explicitly asked (or when only package exists)
  for (const group of SERVICES) {
    if (group.prices && group.services) {
      const match = group.services.find(s => normalize(s.name) === target || target.includes(normalize(s.name)) || normalize(s.name).includes(target));
      if (match) {
        let price: string | null = null;
        let option: string | null = null;
        if (packageName && group.prices) {
          const pkg = group.prices.find(p => normalize(p.label) === normalize(packageName));
          if (pkg) {
            price = pkg.value;
            option = pkg.label;
          }
        }
        if (!price && group.prices?.length) {
          price = group.prices[0].value;
          option = group.prices[0].label;
        }
        return { name: match.name, option, price };
      }
    }
  }

  // 3) As a last resort, try fuzzy group match and pick the first real service in that group
  for (const group of SERVICES) {
    const g = normalize(group.label);
    if (g === target || g.startsWith(target) || target.startsWith(g)) {
      const firstReal = (group.services || []).find(s => (s as any).type !== 'package');
      if (firstReal) {
        return {
          name: firstReal.name,
          option: firstReal.timeOptions?.[0] || null,
          price: (firstReal as any).price || null,
        };
      }
    }
  }

  return null;
}
