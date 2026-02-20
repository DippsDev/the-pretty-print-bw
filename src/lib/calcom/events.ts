export type ProfessionalKey = 'team' | 'banele' | 'dineo' | 'michelle';

export interface CalcomEventTypeMap {
  team?: number;
  banele?: number;
  dineo?: number;
  michelle?: number;
}

export interface CalcomEventInfo {
  slug: string;
  durationMinutes: number;
  eventTypeIds: CalcomEventTypeMap;
}

const DEFAULT_WEBAPP_URL =
  process.env.NEXT_PUBLIC_CALCOM_WEBAPP_URL || 'https://cal-amour.vercel.app';

const TEAM_SLUG = 'bel-amour';

export const PROFESSIONAL_ID_TO_KEY: Record<number, ProfessionalKey> = {
  0: 'team',
  34: 'banele',
  35: 'dineo',
  36: 'michelle',
};

export const PROFESSIONAL_KEY_TO_USERNAME: Record<ProfessionalKey, string> = {
  team: `team/${TEAM_SLUG}`,
  banele: 'banele',
  dineo: 'dineo',
  michelle: 'michelle',
};

export const CALCOM_EVENT_INFO_BY_SLUG: Record<string, CalcomEventInfo> = {
  'full-body-massage': {
    slug: 'full-body-massage',
    durationMinutes: 90,
    eventTypeIds: {
      team: 245,
      banele: 256,
      dineo: 267,
      michelle: 278,
    },
  },
  'hot-stone-massage': {
    slug: 'hot-stone-massage',
    durationMinutes: 60,
    eventTypeIds: {
      team: 246,
      banele: 257,
      dineo: 268,
      michelle: 279,
    },
  },
  'aroma-therapy': {
    slug: 'aroma-therapy',
    durationMinutes: 60,
    eventTypeIds: {
      team: 247,
      banele: 258,
      dineo: 269,
      michelle: 280,
    },
  },
  'deep-tissue-massage': {
    slug: 'deep-tissue-massage',
    durationMinutes: 60,
    eventTypeIds: {
      team: 248,
      banele: 259,
      dineo: 270,
      michelle: 281,
    },
  },
  'swedish-massage': {
    slug: 'swedish-massage',
    durationMinutes: 60,
    eventTypeIds: {
      team: 249,
      banele: 260,
      dineo: 271,
      michelle: 282,
    },
  },
  'back-massage': {
    slug: 'back-massage',
    durationMinutes: 30,
    eventTypeIds: {
      team: 250,
      banele: 261,
      dineo: 272,
      michelle: 283,
    },
  },
  'head-neck-shoulder-massage': {
    slug: 'head-neck-shoulder-massage',
    durationMinutes: 30,
    eventTypeIds: {
      team: 251,
      banele: 262,
      dineo: 273,
      michelle: 284,
    },
  },
  'facial-treatment': {
    slug: 'facial-treatment',
    durationMinutes: 30,
    eventTypeIds: {
      team: 252,
      banele: 263,
      dineo: 274,
      michelle: 285,
    },
  },
  'half-day-package-single': {
    slug: 'half-day-package-single',
    durationMinutes: 180,
    eventTypeIds: {
      team: 253,
      banele: 264,
      dineo: 275,
      michelle: 286,
    },
  },
  'half-day-package-couple': {
    slug: 'half-day-package-couple',
    durationMinutes: 180,
    eventTypeIds: {
      team: 254,
      banele: 265,
      dineo: 276,
      michelle: 287,
    },
  },
  'couples-treatment': {
    slug: 'couples-treatment',
    durationMinutes: 90,
    eventTypeIds: {
      team: 255,
      banele: 266,
      dineo: 277,
      michelle: 288,
    },
  },
};

export function getCalcomEventInfo(slug?: string | null): CalcomEventInfo | undefined {
  if (!slug) return undefined;
  return CALCOM_EVENT_INFO_BY_SLUG[slug];
}

export function resolveProfessionalKey(id?: number | null): ProfessionalKey {
  if (id == null) {
    return 'team';
  }
  return PROFESSIONAL_ID_TO_KEY[id] ?? 'team';
}

export function buildBookingUrl(
  professionalKey: ProfessionalKey,
  slug: string
): string {
  const username = PROFESSIONAL_KEY_TO_USERNAME[professionalKey];
  return `${DEFAULT_WEBAPP_URL}/${username}/${slug}`;
}









