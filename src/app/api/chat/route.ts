import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText, tool, convertToModelMessages, UIMessage, createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { z } from 'zod';
import { SERVICES } from '@/lib/servicesData';
import { getBookingStatus } from '@/lib/chat/bookingStatus';

// Helper function to resolve service and price
function resolveServiceAndPrice(serviceName: string, packageName?: string) {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const target = normalize(serviceName);

  // 1) Direct individual service match across all groups (e.g., Swedish Massage, Back Massage, Aroma - Therapy)
  for (const group of SERVICES) {
    for (const item of group.services || []) {
      const n = normalize(item.name);
      const isMatch = n === target || n.includes(target) || target.includes(n);
      if (isMatch && (item as any).price) {
        return { name: item.name, option: '', price: (item as any).price };
      }
    }
  }

  // 2) Group label match (packages or non-package groups)
  for (const group of SERVICES) {
    if (normalize(group.label) === target) {
      if ((group as any).prices && packageName) {
        const priceObj = (group as any).prices.find((p: any) => p.label === packageName);
        return { name: group.label, option: packageName, price: priceObj?.value || '' };
      }
      // Non-package group fallback: pick primary priced service
      const firstPriced = (group.services || []).find((s: any) => s && typeof (s as any).price === 'string');
      if (firstPriced) {
        return { name: firstPriced.name, option: '', price: (firstPriced as any).price || '' };
      }
    }
  }

  return null;
}

// Main chat endpoint using AI SDK tools
export async function POST(request: NextRequest) {
  try {
    const { messages }: { messages: UIMessage[] } = await request.json();

    if (!messages?.length) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Sanitize incoming UI messages to avoid sending provider-specific IDs or
    // transient parts back to the model, which can cause duplicate item errors.
    const sanitizedMessages: UIMessage[] = messages.map((m: any) => ({
      ...m,
      parts: (m.parts || [])
        // Drop transient/non-essential UI parts from history
        .filter((p: any) => p?.type !== 'data-booking-status' && p?.type !== 'step-start')
        // Strip provider metadata that can hold provider-assigned IDs
        .map((p: any) => {
          if (!p || typeof p !== 'object') return p;
          const { callProviderMetadata, providerMetadata, ...rest } = p;
          return rest;
        }),
    }));

    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        // Send current booking status as data part
        const currentBookingStatus = getBookingStatus();
        writer.write({
          type: 'data-booking-status',
          data: currentBookingStatus,
        });

        const result = streamText({
          model: openai('gpt-4o'),
          messages: convertToModelMessages(sanitizedMessages),
          system: `You are a helpful, warm, and accommodating booking assistant for Bel Amour, a luxury spa and wellness center.

SPA INFORMATION:
- Name: Bel Amour
- Type: Luxury spa and wellness center
- Operating Hours: 9:00 AM to 5:00 PM (Monday-Sunday)
- Time slots: 30-minute intervals from 9:00 AM to 5:00 PM

AVAILABLE SERVICES:
- MASSAGES: Full Body Massage (R699), Full Body Hot Stone Massage (R599), Aroma - Therapy (R499), Deep Tissue Massage (R599), Swedish Massage (R499), Back Massage (R350), Head, Neck and Shoulder Massage (R299)
- FACIAL: Facial: Exfoliation, masking and massage (R199)
- HALF-DAY PACKAGE: For 1 (R1,399) or For 2 (R2,499) - includes Full Body Massage, Foot Soak/Exfoliation/Massage, Head/Neck/Shoulder Massage, Facial, and welcome drinks/snacks
- COUPLE'S TREATMENT: For 2 (R1,050) - includes Full Body Hot Stone Massage and Foot Soak and Massage

Use the available tools to help customers with bookings, navigation, and service information.
Always be warm, professional, and helpful.

STRICT DATA RULES:
- Only use services that exist in the spa catalog provided above.
- Package groups (e.g., Half-Day Package, Couple's Treatment) are booked as a single item with an option (e.g., "For 1" or "For 2"). Their listed "services" are inclusions, not separate bookable items. Do not treat inclusions as individual services unless the user explicitly requests an individual service that exists as a standalone item in the catalog.
- When the user requests a package, always provide the package option in addService (infer "For 1" vs "For 2" from user phrasing when possible; otherwise default to the first option).
- After invoking tools, interpret their results correctly: if addService returns success, do not apologize or claim failure; instead briefly confirm what was added. If it returns an error, report that error briefly.`,
          tools: {
            addService: tool({
              description: 'Add a service to the customer\'s booking selection',
              inputSchema: z.object({
                service: z.string().describe('Name of the service to add'),
                package: z.string().optional().describe('Package option if applicable (e.g., "For 2" for Couple\'s Treatment)'),
              }),
              execute: async ({ service, package: pkg }) => {
                // Helper for choosing package label such as For 1 / For 2
                const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
                const choosePackageLabel = (group: any, pkgText?: string) => {
                  const labels: string[] = (group?.prices || []).map((p: any) => p.label);
                  if (!labels.length) return undefined;
                  if (!pkgText) return labels[0];
                  const p = norm(pkgText);
                  if (/(^|\s)1(\s|$)|for 1|for one|single/.test(p)) return labels.find(l => norm(l).includes('1')) || labels[0];
                  if (/(^|\s)2(\s|$)|for 2|for two|couple|couples/.test(p)) return labels.find(l => norm(l).includes('2')) || labels[labels.length-1];
                  return labels[0];
                };

                // First try resolving a real individual service
                const resolved = resolveServiceAndPrice(service, pkg);
                if (resolved) {
                  return {
                    success: true,
                    service: resolved.name,
                    option: resolved.option,
                    price: resolved.price,
                    message: `Added ${resolved.name}${resolved.option ? ` (${resolved.option})` : ''} to your selection`
                  };
                }

                // If not resolved, try group by label (package or non-package)
                const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
                const tgt = normalize(service);
                const group = SERVICES.find(g => normalize(g.label) === tgt || normalize(g.label).includes(tgt) || tgt.includes(normalize(g.label)));
                if (group && (group as any).prices) {
                  let selected: string | undefined;
                  // Couples Treatment has no user-selectable options; always use its single price and empty option
                  if (norm(group.label).includes('couple')) {
                    selected = undefined;
                  } else {
                    // Half-Day Package has options; pick best label when multiple
                    selected = (group as any).prices.length > 1 ? choosePackageLabel(group as any, pkg) : undefined;
                  }
                  const price = selected
                    ? ((group as any).prices.find((p: any) => p.label === selected)?.value || '')
                    : (((group as any).prices?.[0]?.value) || '');
                  return {
                    success: true,
                    service: group.label,
                    option: selected || '',
                    price,
                    message: `Added ${group.label}${selected ? ` (${selected})` : ''} to your selection`
                  };
                } else if (group && !(group as any).prices) {
                  // Non-package group (e.g., Facial). Book the primary listed service.
                  const firstPriced = (group.services || []).find((s: any) => s && typeof (s as any).price === 'string');
                  if (firstPriced) {
                    return {
                      success: true,
                      service: firstPriced.name,
                      option: '',
                      price: (firstPriced as any).price || '',
                      message: `Added ${firstPriced.name} to your selection`
                    };
                  }
                }

                return { success: false, error: 'Service not found' };
              },
            }),
            navigateTo: tool({
              description: 'Navigate to a specific page or section in the booking flow',
              inputSchema: z.object({
                page: z.enum(['services', 'professionals', 'timeSelection']).describe('Page to navigate to'),
                section: z.string().optional().describe('Specific section or group to navigate to'),
              }),
              execute: async ({ page, section }) => {
                // Normalize to a valid SERVICES label when possible
                const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
                const target = normalize(String(section || ''));
                let resolved = SERVICES.find(g => normalize(g.label) === target)?.label
                  ?? SERVICES.find(g => normalize(g.label).startsWith(target) || target.startsWith(normalize(g.label)))?.label
                  ?? (() => {
                    for (const g of SERVICES) {
                      if ((g.services || []).some(s => normalize(s.name) === target)) return g.label;
                    }
                    return undefined;
                  })();
                if (!resolved && target.includes('package')) {
                  const half = SERVICES.find(g => normalize(g.label).includes('half day package'))?.label;
                  if (half) resolved = half;
                }
                return {
                  success: true,
                  page,
                  section: resolved || section,
                  message: `Navigating to ${page}${(resolved || section) ? ` - ${resolved || section}` : ''}`
                };
              },
            }),
            selectProfessional: tool({
              description: 'Select a professional for the booking',
              inputSchema: z.object({
                professional: z.string().describe('Name of the professional to select'),
              }),
              execute: async ({ professional }) => {
                const currentStatus = getBookingStatus();
                const prof = currentStatus.professionals.find(p => 
                  p.name.toLowerCase() === professional.toLowerCase()
                );
                if (!prof) {
                  return { success: false, error: 'Professional not found' };
                }
                if (!prof.available) {
                  return { success: false, error: 'Professional is not available' };
                }
                return { 
                  success: true, 
                  professional: prof.name,
                  message: `Selected ${prof.name} as your professional`
                };
              },
            }),
            checkAvailability: tool({
              description: 'Check availability for services, professionals, or time slots',
              inputSchema: z.object({
                service: z.string().optional().describe('Service to check availability for'),
                professional: z.string().optional().describe('Professional to check availability for'),
                date: z.string().optional().describe('Date to check availability for (YYYY-MM-DD format)'),
                time: z.string().optional().describe('Time slot to check availability for'),
              }),
              execute: async ({ service, professional, date, time }) => {
                const currentStatus = getBookingStatus();
                let available = true;
                let message = 'Available';
                
                if (date && time) {
                  // Check specific date and time
                  const { isSlotAvailable } = await import('@/lib/chat/bookingStatus');
                  available = isSlotAvailable(date, time);
                  message = available ? 
                    `Time slot ${time} on ${date} is available` : 
                    `Time slot ${time} on ${date} is not available`;
                } else if (date) {
                  // Check available times for a specific date
                  const { getAvailableTimeSlotsForDate } = await import('@/lib/chat/bookingStatus');
                  const availableTimes = getAvailableTimeSlotsForDate(date);
                  message = `Available times for ${date}: ${availableTimes.join(', ')}`;
                } else if (time) {
                  const isBooked = currentStatus.bookedTimes.includes(time);
                  available = !isBooked;
                  message = isBooked ? `Time slot ${time} is not available` : `Time slot ${time} is available`;
                }
                
                if (professional) {
                  const prof = currentStatus.professionals.find(p => 
                    p.name.toLowerCase() === professional.toLowerCase()
                  );
                  if (!prof || !prof.available) {
                    available = false;
                    message = `Professional ${professional} is not available`;
                  }
                }
                
                return { 
                  success: true, 
                  available,
                  message,
                  availableTimes: date ? 
                    (await import('@/lib/chat/bookingStatus')).getAvailableTimeSlotsForDate(date) :
                    currentStatus.availableTimes.filter(t => !currentStatus.bookedTimes.includes(t))
                };
              },
            }),
          },
        });

        writer.merge(result.toUIMessageStream());
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
