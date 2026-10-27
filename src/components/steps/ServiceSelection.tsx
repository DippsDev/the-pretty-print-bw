import React from "react";

interface Service {
  name: string;
  description?: string;
  price?: string | { [time: string]: string | undefined } | Array<{ label: string; value: string }>;
  timeOptions?: string[];
  type?: string;
}

interface ServiceSelectionStepProps {
  // Now expects the full SERVICES array, not just .services
  services: {
    label: string;
    services: Service[];
  }[];
  onSelectService: (service: any) => void;
}

function isPackageGroup(group: { label: string; services: Service[]; prices?: unknown }) {
  return Array.isArray(group.prices) && group.prices.length > 0;
}

export default function ServiceSelectionStep({ services, onSelectService }: ServiceSelectionStepProps) {
  return (
    <div className="flex flex-col gap-4">
      {services.map((group, i) => {
        if (isPackageGroup(group)) {
          // Show one card for the package group
          return (
            <div
              key={group.label}
              className="booking-card"
              onClick={() => onSelectService(group)}
            >
              <div className="booking-card-title">{group.label}</div>
              {/* List included services */}
              <div className="mt-2">
                <div className="text-xs font-semibold text-[#232323] mb-1">Includes:</div>
                <ul className="flex flex-col gap-1">
                  {group.services.map((svc, idx) => (
                    <li key={svc.name + idx} className="flex flex-row items-center gap-2">
                      <span className="font-medium text-sm text-[#141414]">{svc.name}</span>
                      {svc.description && <span className="text-xs text-[#7B8487]">{svc.description}</span>}
                      {svc.price && (
                        <span className="text-xs text-[#232323]">
                          {typeof svc.price === "string"
                            ? svc.price
                            : Array.isArray(svc.price)
                              ? svc.price.map(p => `${p.label}: ${p.value}`).join(" | ")
                              : Object.entries(svc.price)
                                  .map(([time, price]) => `${time}: ${price}`)
                                  .join(" | ")
                          }
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        }
        // Otherwise, show each service as a card
        return group.services.map((svc, j) => (
          <div
            key={svc.name}
            className="booking-card"
            onClick={() => onSelectService(svc)}
          >
            <div className="booking-card-title">{svc.name}</div>
            {svc.description && (
              <div className="text-sm text-[#626262]">{svc.description}</div>
            )}
            {svc.timeOptions && svc.timeOptions.length > 0 && (
              <div className="booking-meta">{svc.timeOptions[0]}</div>
            )}
            {svc.price && (
              <div className="booking-price">
                {typeof svc.price === "object" && !Array.isArray(svc.price)
                  ? `from ${Object.values(svc.price)[0]}`
                  : Array.isArray(svc.price)
                    ? svc.price.map(p => `${p.label}: ${p.value}`).join(" | ")
                    : svc.price}
              </div>
            )}
            {svc.price && typeof svc.price === "object" && !Array.isArray(svc.price) && (
              <div className="text-xs text-[#7B8487] mt-1">
                {Object.entries(svc.price)
                  .map(([time, price]) => `${time}: ${price}`)
                  .join(" | ")}
              </div>
            )}
          </div>
        ));
      })}
      {services.length === 0 && (
        <div className="text-[#b0b0b0] italic">No services in this category yet.</div>
      )}
    </div>
  );
}
