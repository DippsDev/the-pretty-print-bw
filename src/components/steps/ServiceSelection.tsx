import React from "react";
import { Inter_Tight } from "next/font/google";

const interTight = Inter_Tight({ subsets: ["latin"], weight: "400" });

export type ServiceOption = {
  name: string;
  description?: string;
  price: string | { [time: string]: string | undefined }; // allow undefined for optional keys
  duration?: string;
};

interface ServiceSelectionStepProps {
  services: {
    name: string;
    description?: string;
    price: string | { [time: string]: string | undefined }; // allow undefined for optional keys
    timeOptions?: string[];
  }[];
  onSelectService: (service: any) => void;
}

export default function ServiceSelectionStep({ services, onSelectService }: ServiceSelectionStepProps) {
  return (
    <div className="flex flex-col gap-4">
      {services.map((svc, i) => (
        <div
          key={svc.name}
          className="border rounded-lg p-4 bg-white flex flex-col gap-1 cursor-pointer hover:bg-gray-50 transition"
          onClick={() => onSelectService(svc)}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-lg text-[#141414]">{svc.name}</div>
            </div>
          </div>
          {svc.description && (
            <div className="text-sm text-[#7B8487] mt-1">{svc.description}</div>
          )}
          <div className="text-sm text-[#232323] font-semibold mt-1">
            {svc.price && typeof svc.price === "object"
              ? `from ${Object.values(svc.price)[0]}`
              : svc.price}
          </div>
          {svc.price && typeof svc.price === "object" && (
            <div className="text-xs text-[#7B8487] mt-1">
              {Object.entries(svc.price)
                .map(([time, price]) => `${time}: ${price}`)
                .join(" | ")}
            </div>
          )}
        </div>
      ))}
      {services.length === 0 && (
        <div className="text-[#b0b0b0] italic">No services in this category yet.</div>
      )}
    </div>
  );
}
