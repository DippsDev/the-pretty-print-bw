import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText, tool, convertToModelMessages, UIMessage, createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { z } from 'zod';
import { SERVICES } from '@/lib/servicesData';
import { getBookingStatus } from '@/lib/chat/bookingStatus';

// Run this route on the Edge runtime for fast startup and streaming support
export const runtime = 'edge';
// Cap the maximum duration so Vercel doesn’t kill the function with a 300s timeout
export const maxDuration = 30;

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

WELCOME MESSAGE:
When a user greets you with "Hello" or similar greetings, respond with this welcome message:
"Welcome to Bel Amour! I'm here to help you book your perfect spa experience. 

Here are some things you can ask me:
• What services do you offer?
• Book a Swedish massage for today at 2pm
• Check availability for Banele tomorrow
• Show me the Half-Day Package options

How can I help you today?"

AVAILABLE TOOLS:
- addService: Add services to the customer's booking
- navigateTo: Navigate to different pages/sections (services, professionals, timeSelection)
- selectProfessional: Select a specific professional (Banele, Dineo, Michelle, or Any professional)
- selectDateTime: Select a specific date and time for the booking
- checkAvailability: Check availability for services, professionals, or time slots

STRICT DATA RULES:
- Only use services that exist in the spa catalog provided above.
- Package groups (e.g., Half-Day Package, Couple's Treatment) are booked as a single item with an option (e.g., "For 1" or "For 2"). Their listed "services" are inclusions, not separate bookable items. Do not treat inclusions as individual services unless the user explicitly requests an individual service that exists as a standalone item in the catalog.
- When the user requests a package, always provide the package option in addService (infer "For 1" vs "For 2" from user phrasing when possible; otherwise default to the first option).
- For date/time selection, use YYYY-MM-DD format for dates and standard time format (e.g., "9:00 AM", "2:30 PM").
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
            selectDateTime: tool({
              description: 'Select a specific date and time for the booking',
              inputSchema: z.object({
                date: z.string().describe('Date for the booking (YYYY-MM-DD format)'),
                time: z.string().describe('Time slot for the booking (e.g., "9:00 AM", "2:30 PM")'),
              }),
              execute: async ({ date, time }) => {
                const { isSlotAvailable, bookDateTimeSlots } = await import('@/lib/chat/bookingStatus');
                // Normalize inputs to match TimeSelection expectations
                const normalizeDate = (d: string) => {
                  const lower = String(d || '').toLowerCase().trim();
                  const today = new Date();
                  const format = (dt: Date) => {
                    const y = dt.getFullYear();
                    const m = String(dt.getMonth() + 1).padStart(2, '0');
                    const da = String(dt.getDate()).padStart(2, '0');
                    return `${y}-${m}-${da}`;
                  };
                  if (!lower || lower === 'today') return format(today);
                  if (lower === 'tomorrow') {
                    const t = new Date(today);
                    t.setDate(t.getDate() + 1);
                    return format(t);
                  }
                  if (/^\d{4}-\d{2}-\d{2}$/.test(lower)) {
                    // If the date is in the past, snap to today
                    const [y, m, da] = lower.split('-').map(Number);
                    const dDate = new Date(y, (m as number) - 1, da as number);
                    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    if (dDate < todayOnly) return format(today);
                    return lower;
                  }
                  return format(today);
                };
                const normalizeTime = (t: string) => {
                  const raw = String(t || '').toLowerCase().trim();
                  // Convert common inputs to "H:MM AM/PM"
                  // 16:00 -> 4:00 PM, 4pm -> 4:00 PM, 4:30pm -> 4:30 PM
                  let hours = 0; let minutes = 0; let isPM = false; let isAM = false;
                  const m1 = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
                  const m2 = raw.match(/^(\d{1,2}):(\d{2})$/);
                  if (m1) {
                    hours = parseInt(m1[1], 10);
                    minutes = m1[2] ? parseInt(m1[2], 10) : 0;
                    isPM = (m1[3] || '') === 'pm';
                    isAM = (m1[3] || '') === 'am';
                  } else if (m2) {
                    hours = parseInt(m2[1], 10);
                    minutes = parseInt(m2[2], 10);
                  }
                  if (!isAM && !isPM && hours >= 13) { isPM = true; hours -= 12; }
                  if (hours === 0) hours = 12;
                  const hh = String(hours);
                  const mm = String(minutes).padStart(2, '0');
                  const suffix = isPM ? 'PM' : (isAM ? 'AM' : (hours >= 9 && hours <= 11 ? 'AM' : 'PM'));
                  return `${hh}:${mm} ${suffix}`;
                };

                const normDate = normalizeDate(date);
                const normTime = normalizeTime(time);

                // Check if slot is available
                if (!isSlotAvailable(normDate, normTime)) {
                  return { 
                    success: false, 
                    error: `Time slot ${normTime} on ${normDate} is not available` 
                  };
                }
                
                // Book the slot (assuming 30-minute duration for all services)
                bookDateTimeSlots(normDate, normTime, 30);
                
                return { 
                  success: true, 
                  date: normDate, 
                  time: normTime,
                  message: `Selected ${normTime} on ${normDate} for your booking`
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
                // Apply same normalization as selectDateTime so queries match UI time/date formats
                const normalizeDate = (d?: string) => {
                  const today = new Date();
                  const format = (dt: Date) => {
                    const y = dt.getFullYear();
                    const m = String(dt.getMonth() + 1).padStart(2, '0');
                    const da = String(dt.getDate()).padStart(2, '0');
                    return `${y}-${m}-${da}`;
                  };
                  const lower = String(d || '').toLowerCase().trim();
                  if (!lower || lower === 'today') return format(today);
                  if (lower === 'tomorrow') { const t = new Date(today); t.setDate(t.getDate() + 1); return format(t); }
                  if (/^\d{4}-\d{2}-\d{2}$/.test(lower)) {
                    const [y, m, da] = lower.split('-').map(Number);
                    const dDate = new Date(y, (m as number) - 1, da as number);
                    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    if (dDate < todayOnly) return format(today);
                    return lower;
                  }
                  return format(today);
                };
                const normalizeTime = (t?: string) => {
                  if (!t) return undefined as unknown as string;
                  const raw = String(t || '').toLowerCase().trim();
                  let hours = 0; let minutes = 0; let isPM = false; let isAM = false;
                  const m1 = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
                  const m2 = raw.match(/^(\d{1,2}):(\d{2})$/);
                  if (m1) { hours = parseInt(m1[1], 10); minutes = m1[2] ? parseInt(m1[2], 10) : 0; isPM = (m1[3] || '') === 'pm'; isAM = (m1[3] || '') === 'am'; }
                  else if (m2) { hours = parseInt(m2[1], 10); minutes = parseInt(m2[2], 10); }
                  if (!isAM && !isPM && hours >= 13) { isPM = true; hours -= 12; }
                  if (hours === 0) hours = 12;
                  const hh = String(hours);
                  const mm = String(minutes).padStart(2, '0');
                  const suffix = isPM ? 'PM' : (isAM ? 'AM' : (hours >= 9 && hours <= 11 ? 'AM' : 'PM'));
                  return `${hh}:${mm} ${suffix}`;
                };

                const normDate = date ? normalizeDate(date) : undefined;
                const normTime = time ? normalizeTime(time) : undefined;

                if (normDate && normTime) {
                  // Check specific date and time
                  const { isSlotAvailable } = await import('@/lib/chat/bookingStatus');
                  available = isSlotAvailable(normDate, normTime, professional);
                  message = available ? 
                    `Time slot ${normTime} on ${normDate} is available${professional ? ` for ${professional}` : ''}` : 
                    `Time slot ${normTime} on ${normDate} is not available${professional ? ` for ${professional}` : ''}`;
                } else if (normDate) {
                  // Check available times for a specific date
                  const { getAvailableTimeSlotsForDate } = await import('@/lib/chat/bookingStatus');
                  const availableTimes = getAvailableTimeSlotsForDate(normDate, professional);
                  message = `Available times for ${normDate}${professional ? ` (${professional})` : ''}: ${availableTimes.join(', ')}`;
                } else if (normTime) {
                  const isBooked = currentStatus.bookedTimes.includes(normTime);
                  available = !isBooked;
                  message = isBooked ? `Time slot ${normTime} is not available` : `Time slot ${normTime} is available`;
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
                  availableTimes: normDate ? 
                    (await import('@/lib/chat/bookingStatus')).getAvailableTimeSlotsForDate(normDate, professional) :
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
