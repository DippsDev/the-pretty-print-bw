import React from "react";
import { Inter_Tight } from "next/font/google";

const interTight = Inter_Tight({ subsets: ["latin"], weight: "400" });

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

function isPackageGroup(group: { label: string; services: Service[] }) {
  // Heuristic: if all services have type "package" or label includes "Package"
  if (group.label.toLowerCase().includes("package")) return true;
  if (group.services.length === 0) return false;
  return group.services.every(s => s.type === "package");
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
              className="border rounded-lg p-4 bg-white flex flex-col gap-2 cursor-pointer hover:bg-gray-50 transition"
              onClick={() => onSelectService(group)}
            >
              <div className="font-semibold text-lg text-[#141414]">{group.label}</div>
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
            className="border rounded-lg p-4 bg-white flex flex-col gap-2 cursor-pointer hover:bg-gray-50 transition"
            onClick={() => onSelectService(svc)}
          >
            <div className="font-semibold text-lg text-[#141414]">{svc.name}</div>
            {svc.description && (
              <div className="text-sm text-[#7B8487] mt-1">{svc.description}</div>
            )}
            {svc.price && (
              <div className="text-sm text-[#232323] font-normal mt-1">
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
