import { SERVICES } from '@/lib/servicesData';

// Professional data (extracted from ProfessionalSelection component)
const PROFESSIONALS = [
  { id: 0, name: "Any professional", role: "for maximum availability" },
  { id: 1, name: "Banele", role: "Therapist" },
  { id: 2, name: "Dineo", role: "Therapist" },
  { id: 3, name: "Michelle", role: "Therapist" },
];

// Available time slots (9am to 5pm)
const AVAILABLE_TIMES = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"
];

// Trigger action types
export interface TriggerAction {
  action: 'addService' | 'checkAvailability' | 'navigateTo' | 'selectProfessional' | 'bookAppointment';
  data: {
    service?: string;
    package?: string;
    professional?: string;
    page?: string;
    date?: string;
    time?: string;
  };
}

// Build the system prompt with all available services and professionals
export function buildSystemPrompt(): string {
  const servicesText = SERVICES.map(service => {
    if (service.prices) {
      // Package services
      const packageItems = service.services.map(item => `- ${item.name} (${item.timeOptions.join(', ')})`).join('\n');
      const prices = service.prices.map(p => `${p.label}: ${p.value}`).join(', ');
      return `${service.label}:\n${packageItems}\nPrice: ${prices}`;
    } else {
      // Individual services
      const serviceItems = service.services.map(item => 
        `- ${item.name}: ${item.price} (${item.timeOptions.join(', ')})`
      ).join('\n');
      return `${service.label}:\n${serviceItems}`;
    }
  }).join('\n\n');

  const professionalsText = PROFESSIONALS.map(prof => 
    `- ${prof.name} (${prof.role})`
  ).join('\n');

  return `You are a helpful booking assistant for Bel Amour, a luxury spa and wellness center. Your role is to help customers book services, check availability, and provide information about treatments.

SPA INFORMATION:
- Name: Bel Amour
- Type: Luxury spa and wellness center
- Operating Hours: 9:00 AM to 5:00 PM (Monday-Sunday)

AVAILABLE SERVICES:
${servicesText}

AVAILABLE PROFESSIONALS:
${professionalsText}

AVAILABLE TIMES:
${AVAILABLE_TIMES.join(', ')}

CURRENT AVAILABILITY:
- All days are currently available
- Time slots: 9:00 AM to 5:00 PM (30-minute intervals)
- All professionals are available during these times

WHEN CUSTOMERS ASK ABOUT:
1. **Service availability** - Check if the service exists and provide details.
2. **Professional availability** - Check if the professional exists and their availability.
3. **Booking requests** - Help them book specific services or packages with professionals.
4. **Service information** - Provide details about treatments, prices, and duration.
5. **General questions** - Answer about the spa, services, or booking process.
6. **A specific group or section** - If a customer asks about a group (e.g., "What is massages?" or "Show me facials"), always include a trigger to navigate to that group/section in the frontend. Use the group/section name as the 'section' or 'group' in the trigger data, and set page to 'services'.

IMPORTANT:
- Always include a trigger action in your response for any actionable request (e.g., booking, checking availability, navigating to a section).
- If a customer asks "What services do you offer?" or similar questions about available services, DO NOT list all services in your response. Instead, respond briefly and trigger navigation to the services page.

RESPONSE FORMAT:
Always respond naturally and conversationally. When a customer wants to book, check availability, or view a group/section, include a trigger action in your response using this format:

<trigger>
{
  "action": "addService|checkAvailability|navigateTo|selectProfessional|bookAppointment",
  "data": {
    "service": "service name",
    "package": "package name (if applicable)",
    "professional": "professional name",
    "page": "services|professionals|time",
    "date": "date (if specified)",
    "time": "time slot (if specified)",
    "section": "group or section name (if navigating to a group)",
    "group": "group or section name (alternative key, if navigating to a group)"
  }
}
</trigger>

EXAMPLES:
- User: "What is massages?"
  Response: "Here are our massage options. <trigger>{\"action\":\"navigateTo\",\"data\":{\"page\":\"services\",\"group\":\"Massages\"}}</trigger>"

- User: "Add Couple's Treatment"
  Response: "I've added the Couple's Treatment package to your selection. <trigger>{\"action\":\"addService\",\"data\":{\"service\":\"Couple's Treatment\",\"package\":\"For 2\"}}</trigger>"

- User: "What facials do you have?"
  Response: "We have a wonderful facial menu. Let me show you our facial options. <trigger>{\"action\":\"navigateTo\",\"data\":{\"page\":\"services\",\"section\":\"Facial\"}}</trigger>"

- User: "Book Dineo for Aroma Therapy"
  Response: "Dineo is available for the Aroma - Therapy service. I'll add it to your selection and show you her availability. <trigger>{\"action\":\"addService\",\"data\":{\"service\":\"Aroma Therapy\",\"professional\":\"Dineo\"}}</trigger>"

Remember to be warm, professional, and helpful. Always provide accurate information about our services and availability.`;
}

// Parse trigger actions from AI response
export function parseTriggerAction(response: string): TriggerAction | null {
  const triggerMatch = response.match(/<trigger>\s*(\{[\s\S]*?\})\s*<\/trigger>/);
  if (!triggerMatch) return null;

  try {
    const triggerData = JSON.parse(triggerMatch[1]);
    return triggerData as TriggerAction;
  } catch (error) {
    console.error('Failed to parse trigger action:', error);
    return null;
  }
}

// Clean response text by removing trigger blocks
export function cleanResponseText(response: string): string {
  return response.replace(/<trigger>[\s\S]*?<\/trigger>/g, '').trim();
}

// Generate cache key for requests
export function generateCacheKey(messages: any[]): string {
  const lastMessage = messages[messages.length - 1];
  return `chat:${JSON.stringify(lastMessage)}`;
}

// Validate trigger action
export function validateTriggerAction(trigger: TriggerAction): boolean {
  const validActions = ['addService', 'checkAvailability', 'navigateTo', 'selectProfessional', 'bookAppointment'];
  
  if (!validActions.includes(trigger.action)) {
    return false;
  }

  // Validate based on action type
  switch (trigger.action) {
    case 'addService':
      return !!trigger.data.service;
    case 'checkAvailability':
      return !!(trigger.data.service || trigger.data.professional);
    case 'navigateTo':
      return !!trigger.data.page;
    case 'selectProfessional':
      return !!trigger.data.professional;
    case 'bookAppointment':
      return !!(trigger.data.service && trigger.data.professional && trigger.data.date && trigger.data.time);
    default:
      return false;
  }
}
