"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useChat } from '@ai-sdk/react';
import { lastAssistantMessageIsCompleteWithToolCalls, DefaultChatTransport } from 'ai';
import { setCurrentPage, setServiceSelection, setCurrentSection, setStep } from '@/redux/features/navigationSlice';
import { addBooking, removeBooking } from '@/redux/serviceSlice';
import { setSelectedProfessional } from '@/redux/professionalSlice';
import { updateBookingStatus } from '@/redux/features/bookingStatusSlice';
import { resolveServiceAndPrice } from '@/lib/chat/serviceResolver';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Inter_Tight } from 'next/font/google';
import { SERVICES } from '@/lib/servicesData';
import Loader from './Loader';
import type { RootState } from '@/redux/store';

// Tool call input types
interface AddServiceInput {
  service: string;
  package?: string;
}

interface NavigateToInput {
  page: 'services' | 'professionals' | 'timeSelection';
  section?: string;
  // Accept group as an alternative field name from the model
  group?: string;
}

interface SelectProfessionalInput {
  professional: string;
}

interface SelectDateTimeInput {
  date: string;
  time: string;
}

interface CheckAvailabilityInput {
  service?: string;
  professional?: string;
  date?: string;
  time?: string;
}

const interTight = Inter_Tight({ subsets: ['latin'], weight: '400' });

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [hasUnread, setHasUnread] = useState(false);
  const [closing, setClosing] = useState(false);
  const [isFirstOpen, setIsFirstOpen] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const bookingStatus = useSelector((state: RootState) => state.bookingStatus.status);
  // Track processed tool calls to avoid duplicate executions across bubbles
  const handledToolCallsRef = useRef<Set<string>>(new Set());
  // Track assistant texts shown in current reply to avoid duplicate text bubbles on retries
  const seenAssistantTextsRef = useRef<Set<string>>(new Set());
  const normalizeText = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').replace(/[\p{P}\p{S}]+/gu, '').trim();
  // Track processed tool results (server-executed) to avoid duplicate state updates
  const handledToolResultsRef = useRef<Set<string>>(new Set());
  const bookings = useSelector((state: RootState) => state.service.bookings);
  // Helpers for package groups
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const findPackageGroupByLabel = (label?: string) => {
    const t = norm(String(label || ''));
    return SERVICES.find(
      g => Array.isArray((g as any).prices) && (g as any).prices.length > 0 && (norm(g.label) === t || norm(g.label).includes(t) || t.includes(norm(g.label)))
    );
  };
  const choosePackageLabel = (group: any, pkgText?: string) => {
    const choices: string[] = (group?.prices || []).map((p: any) => p.label);
    if (!choices.length) return undefined;
    if (!pkgText) return choices[0];
    const p = norm(pkgText);
    if (/(^|\s)1(\s|$)|for 1|for one|single/.test(p)) return choices.find(c => norm(c).includes('1')) || choices[0];
    if (/(^|\s)2(\s|$)|for 2|for two|couple|couples/.test(p)) return choices.find(c => norm(c).includes('2')) || choices[choices.length-1];
    return choices[0];
  };

const normalizeProfessionalKey = (name?: string) => {
  if (!name) return 'any';
  const trimmed = name.trim().toLowerCase();
  if (!trimmed || trimmed === 'any professional' || trimmed === 'any') {
    return 'any';
  }
  return trimmed;
};

  // Use AI SDK's useChat hook
  const { messages, sendMessage, addToolResult, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    
    // Handle tool calls automatically
    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) return;
      // Deduplicate repeated toolCallIds coming from stitched assistant messages
      if (handledToolCallsRef.current.has(toolCall.toolCallId)) {
        return;
      }
      handledToolCallsRef.current.add(toolCall.toolCallId);

      switch (toolCall.toolName) {
        case 'addService': {
          // Server executes this tool; avoid client-side state mutations to prevent duplicates.
          return;
        }

        case 'navigateTo': {
          const input = toolCall.input as NavigateToInput;
          const { page } = input;
          // Support both section and group keys, normalize against SERVICES labels
          const rawSection = (input.section || (input as any).group || '').toString();

          const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
          const resolveSectionLabel = (name: string): string | undefined => {
            if (!name) return undefined;
            const target = normalize(name);
            // Try exact label match (case-insensitive)
            const exact = SERVICES.find(g => normalize(g.label) === target)?.label;
            if (exact) return exact;
            // Try startsWith/contains (handles pluralization like "facials" -> "Facial")
            const fuzzy = SERVICES.find(g =>
              normalize(g.label) === target ||
              normalize(g.label).startsWith(target) ||
              target.startsWith(normalize(g.label))
            )?.label;
            if (fuzzy) return fuzzy;
            // Synonym: generic "packages" should map to Half-Day Package
            if (target.includes('package')) {
              const half = SERVICES.find(g => normalize(g.label).includes('half day package'))?.label;
              if (half) return half;
            }
            return undefined;
          };

          // If provided section didn't match a group, try to resolve by service name -> its parent group
          let resolvedSection = resolveSectionLabel(rawSection);
          if (!resolvedSection && rawSection) {
            const serviceGroup = SERVICES.find(g => (g.services || []).some(s => normalize(s.name) === normalize(rawSection)));
            if (serviceGroup) {
              resolvedSection = serviceGroup.label;
            }
          }
          if (resolvedSection) {
            dispatch(setCurrentSection(resolvedSection));
          }

          if (page === 'professionals') {
            dispatch(setCurrentPage('services'));
            dispatch(setStep('professionals'));
          } else if (page === 'timeSelection') {
            dispatch(setCurrentPage('services'));
            dispatch(setStep('time'));
          } else {
            // Default to services step
            dispatch(setCurrentPage('services'));
            dispatch(setStep('services'));
          }
          
          addToolResult({
            tool: 'navigateTo',
            toolCallId: toolCall.toolCallId,
            output: `Navigating to ${page}${resolvedSection ? ` - ${resolvedSection}` : ''}`
          });
          break;
        }

        case 'selectProfessional': {
          const input = toolCall.input as SelectProfessionalInput;
          const { professional } = input;
          const name = professional.toLowerCase();
          const id = name.includes('banele') ? 1 : name.includes('dineo') ? 2 : name.includes('michelle') ? 3 : 0;
          
          dispatch(setSelectedProfessional(id));
          
          addToolResult({
            tool: 'selectProfessional',
            toolCallId: toolCall.toolCallId,
            output: `Selected ${professional} as your professional`
          });
          break;
        }

        case 'selectDateTime': {
          const input = toolCall.input as SelectDateTimeInput;
          const { date, time } = input;
          
          // Update service selection with the selected date and time
          dispatch(setServiceSelection({ 
            service: '', 
            pkg: '', 
            time: `${date} at ${time}` 
          }));
          
          // Navigate to time selection step to show the selection
          dispatch(setCurrentPage('services'));
          dispatch(setStep('time'));
          
          addToolResult({
            tool: 'selectDateTime',
            toolCallId: toolCall.toolCallId,
            output: `Selected ${time} on ${date} for your booking`
          });
          break;
        }

        case 'checkAvailability': {
          const input = toolCall.input as CheckAvailabilityInput;
          const { service: checkService, professional: checkProf, time: checkTime, date: checkDate } = input;
          let available = true;
          let message = 'Available';
          
          if (checkDate && checkTime && bookingStatus) {
            const slotEntry = bookingStatus.bookedSlots?.[checkDate];
            const professionalKey = normalizeProfessionalKey(checkProf);
            const blockedAll = Array.isArray(slotEntry)
              ? slotEntry.includes(checkTime)
              : slotEntry?.all?.includes(checkTime) ?? false;
            const blockedProfessional = professionalKey !== 'any'
              ? Array.isArray(slotEntry)
                ? false
                : slotEntry?.byProfessional?.[professionalKey]?.includes(checkTime) ?? false
              : false;
            const isBooked = blockedAll || blockedProfessional;
            available = !isBooked;
            message = isBooked ? 
              `Time slot ${checkTime} on ${checkDate} is not available` : 
              `Time slot ${checkTime} on ${checkDate} is available`;
          } else if (checkDate && bookingStatus) {
            const slotEntry = bookingStatus.bookedSlots?.[checkDate];
            const professionalKey = normalizeProfessionalKey(checkProf);
            let availableTimes = bookingStatus.availableTimes;
            if (slotEntry) {
              const blocked = new Set(
                Array.isArray(slotEntry) ? slotEntry : (slotEntry.all || [])
              );
              if (professionalKey !== 'any' && !Array.isArray(slotEntry)) {
                slotEntry.byProfessional?.[professionalKey]?.forEach((slot: string) => blocked.add(slot));
              }
              availableTimes = bookingStatus.availableTimes.filter(time => !blocked.has(time));
            }
            message = `Available times for ${checkDate}${checkProf ? ` (${checkProf})` : ''}: ${availableTimes.join(', ')}`;
          } else if (checkTime && bookingStatus) {
            const isBooked = bookingStatus.bookedTimes.includes(checkTime);
            available = !isBooked;
            message = isBooked ? `Time slot ${checkTime} is not available` : `Time slot ${checkTime} is available`;
          }
          
          if (checkProf && bookingStatus) {
            const prof = bookingStatus.professionals.find(p => 
              p.name.toLowerCase() === checkProf.toLowerCase()
            );
            if (!prof || !prof.available) {
              available = false;
              message = `Professional ${checkProf} is not available`;
            } else if (checkDate && !available) {
              message = `Professional ${checkProf} is not available at ${checkTime ?? 'the selected time'} on ${checkDate}`;
            }
          }
          
          addToolResult({
            tool: 'checkAvailability',
            toolCallId: toolCall.toolCallId,
            output: message
          });
          break;
        }
      }
    },

    // Handle real-time data updates
    onData: ({ data, type }) => {
      if (type === 'data-booking-status') {
        dispatch(updateBookingStatus(data as any));
      }
    },
  });

  // Send welcome message when chatbot is first opened
  useEffect(() => {
    if (open && isFirstOpen && messages.length === 0) {
      // Send a hidden trigger message that won't be visible to the user
      sendMessage({ 
        text: "Hello", 
        // Add a flag to indicate this is a system trigger
        role: "user" as const,
        // We'll filter this out in the UI rendering
        isSystemTrigger: true 
      } as any);
      setIsFirstOpen(false);
    }
  }, [open, isFirstOpen, messages.length, sendMessage]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Scroll to bottom when opening the chatbot
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
      }, 10);
    }
  }, [open]);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Handle send message
  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput('');
  };

  // Handle booking confirmation
  const handleBookingConfirmation = async (date: string, time: string, duration: number, professional?: string) => {
    try {
      const response = await fetch('/api/chat/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time, duration, professional }),
      });
      
      if (response.ok) {
        // Booking successful, the real-time updates will handle the status change
        console.log('Booking confirmed for', date, time);
      }
    } catch (error) {
      console.error('Failed to confirm booking:', error);
    }
  };

  // Animate X spin on close
  useEffect(() => {
    if (!open && closing) {
      const timeout = setTimeout(() => setClosing(false), 350);
      return () => clearTimeout(timeout);
    }
  }, [open, closing]);

  // React to server-executed tool results (output-available) and update Redux once
  useEffect(() => {
    for (const message of messages) {
      if (message.role === 'user') continue;
      for (const part of message.parts as any[]) {
        if (!part || typeof part.type !== 'string') continue;
        if (!part.type.startsWith('tool-')) continue;
        if (part.state !== 'output-available') continue;
        const callId: string | undefined = part.toolCallId;
        if (!callId || handledToolResultsRef.current.has(callId)) continue;

        const toolName = part.type.replace('tool-', '');
        try {
          switch (toolName) {
            case 'addService': {
              const svcName: string = part.output?.service || part.input?.service || '';
              const pkg: string | undefined = part.output?.option || part.input?.package;

              // Package group path from server
              const pkgGroup = findPackageGroupByLabel(svcName);
              if (pkgGroup) {
                const selectedPkg = choosePackageLabel(pkgGroup as any, pkg);
                if (selectedPkg) {
                  // Dedupe
                  const existsPkg = bookings.some(b => b.name === pkgGroup.label && (b.option || '') === selectedPkg);
                  if (!existsPkg) {
                    dispatch({ type: 'ADD_PACKAGE_SERVICE', payload: { group: pkgGroup, pkg: selectedPkg } });
                  }
                  // Navigate and show correct section
                  dispatch(setCurrentPage('services'));
                  dispatch(setCurrentSection(pkgGroup.label));
                  dispatch(setStep('services'));
                  break;
                }
              }

              const resolved = resolveServiceAndPrice(svcName, pkg);
              if (!resolved) break;
              const exists = bookings.some(b => b.name === resolved.name && (b.option || '') === (resolved.option || ''));
              if (!exists) {
                dispatch(addBooking({ name: resolved.name, option: resolved.option || '', time: '', price: resolved.price || '' }));
                dispatch(setServiceSelection({ service: resolved.name, pkg: resolved.option || '', time: '' }));
              }
              break;
            }
            case 'navigateTo': {
              const page: string = part.output?.page || part.input?.page || 'services';
              const rawSection: string = part.output?.section || part.input?.section || part.input?.group || '';
              const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
              const resolveSectionLabel = (name: string): string | undefined => {
                if (!name) return undefined;
                const target = normalize(name);
                const exact = SERVICES.find(g => normalize(g.label) === target)?.label;
                if (exact) return exact;
                const fuzzy = SERVICES.find(g =>
                  normalize(g.label) === target ||
                  normalize(g.label).startsWith(target) ||
                  target.startsWith(normalize(g.label))
                )?.label;
                if (fuzzy) return fuzzy;
                if (target.includes('package')) {
                  const half = SERVICES.find(g => normalize(g.label).includes('half day package'))?.label;
                  if (half) return half;
                }
                return undefined;
              };
              let resolvedSection = resolveSectionLabel(rawSection);
              if (!resolvedSection && rawSection) {
                const group = SERVICES.find(g => (g.services || []).some(s => normalize(s.name) === normalize(rawSection)));
                if (group) resolvedSection = group.label;
              }
              if (resolvedSection) dispatch(setCurrentSection(resolvedSection));
              if (page === 'professionals') {
                dispatch(setCurrentPage('services'));
                dispatch(setStep('professionals'));
              } else if (page === 'timeSelection') {
                dispatch(setCurrentPage('services'));
                dispatch(setStep('time'));
              } else {
                dispatch(setCurrentPage('services'));
                dispatch(setStep('services'));
              }
              break;
            }
            case 'selectProfessional': {
              const professional: string = part.output?.professional || part.input?.professional || '';
              const name = professional.toLowerCase();
              const id = name.includes('banele') ? 1 : name.includes('dineo') ? 2 : name.includes('michelle') ? 3 : 0;
              dispatch(setSelectedProfessional(id));
              break;
            }
            case 'selectDateTime': {
              const date: string = part.output?.date || part.input?.date || '';
              const time: string = part.output?.time || part.input?.time || '';
              if (date && time) {
                dispatch(setServiceSelection({ 
                  service: '', 
                  pkg: '', 
                  time: `${date} at ${time}` 
                }));
                dispatch(setCurrentPage('services'));
                dispatch(setStep('time'));
              }
              break;
            }
            // checkAvailability result is UI-only here
          }
        } finally {
          handledToolResultsRef.current.add(callId);
        }
      }
    }
  }, [messages, dispatch]);

  return (
    <div className={interTight.className}>
      {/* Floating Chat Icon */}
      <motion.button
        onClick={() => {
          if (open) {
            setClosing(true);
          }
          setOpen(v => !v);
          setHasUnread(false);
        }}
        className="fixed z-[999] bottom-6 right-6 p-0 m-0 bg-transparent border-none shadow-none flex items-center justify-center"
        aria-label="Open Bel Amour Chat"
        style={{ background: 'none', border: 'none', boxShadow: 'none', borderRadius: 0, width: 'auto', height: 'auto' }}
        whileTap={{ scale: 0.92, rotate: -10 }}
        whileHover={{ scale: 1.08, rotate: 8, filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.18))' }}
        animate={open ? { scale: 0.92, rotate: -10, filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.22))' } : { scale: 1, rotate: 0, filter: 'none' }}
        transition={{ type: 'spring', stiffness: 350, damping: 22 }}
      >
        {!open && !closing ? (
          <div className="relative">
            <Image src="/chat.png" alt="Chat" width={48} height={48} className="opacity-90 transition-all duration-300" priority />
            {hasUnread && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#141414]" />
            )}
          </div>
        ) : (
          <motion.div
            // Animate X spin on open and close
            initial={{ rotate: 0, scale: 1 }}
            animate={{
              rotate: open ? 90 : closing ? 180 : 0,
              scale: open || closing ? 1.1 : 1,
            }}
            exit={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-[#141414]">
              <motion.path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.25 }}
              />
            </svg>
          </motion.div>
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 32, scale: 0.96, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 32, scale: 0.96, filter: 'blur(6px)' }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="fixed z-[1000] bottom-24 right-6 w-[min(92vw,380px)] h-[min(70vh,560px)] bg-white rounded-2xl shadow-2xl border border-black/5 flex flex-col overflow-hidden"
            style={{ boxShadow: '0 12px 48px rgba(0,0,0,0.18)' }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-black/10 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image src="/assistant.png" alt="Assistant" width={28} height={28} className="h-7 w-7 rounded-full object-cover" />
                <div className="text-sm font-semibold text-[#141414]">Bel Assistant</div>
              </div>
            </div>

            {/* Messages */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 bg-white">
              <div className="space-y-2">
                {(() => {
                  // Track tool parts we've already displayed in this assistant reply (between user messages)
                  const seenToolCallIds = new Set<string>();
                  // Track last assistant pure-text content to avoid duplicate text bubbles
                  let lastAssistantText = '';
                  return messages.map(message => {
                    // Skip system trigger messages (welcome message triggers)
                    if ((message as any).isSystemTrigger) {
                      return null;
                    }
                    
                    const isAssistant = message.role !== 'user';
                    // Suppress tool banners only when this assistant message contains text parts
                    const hasAssistantText = isAssistant && message.parts.some(p => p.type === 'text' && !!(p as any).text);
                    const suppressToolProcessing = hasAssistantText;
                    // Reset dedupe when a new user message starts
                    if (!isAssistant) {
                      seenToolCallIds.clear();
                      lastAssistantText = '';
                      seenAssistantTextsRef.current.clear();
                    }

                    // If this assistant message is only text and equals previous assistant text, skip
                    if (isAssistant) {
                      const textContent = message.parts
                        .filter(p => p.type === 'text')
                        .map(p => (p as any).text || '')
                        .join('\n')
                        .trim();
                      const norm = textContent ? normalizeText(textContent) : '';
                      if (norm && (norm === normalizeText(lastAssistantText) || seenAssistantTextsRef.current.has(norm))) {
                        return null;
                      }
                      if (norm) {
                        lastAssistantText = textContent;
                        seenAssistantTextsRef.current.add(norm);
                      }
                    }

                    return (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                        message.role === 'user' 
                          ? 'bg-[#141414] text-white' 
                          : 'bg-[#f6f6f6] text-[#141414] border border-black/5'
                      }`}
                    >
                      {message.parts.map((part, index) => {
                        const toolCallId = (part as any).toolCallId as string | undefined;
                        // If we've already shown this tool call in a previous bubble of the same reply, skip it
                        if (isAssistant && toolCallId && seenToolCallIds.has(toolCallId)) {
                          return null;
                        }
                        switch (part.type) {
                          case 'text':
                            return <div key={index}>{part.text}</div>;
                          case 'tool-call':
                            if (suppressToolProcessing) return null;
                            if (toolCallId) seenToolCallIds.add(toolCallId);
                            return (
                              <div key={index} className="text-xs text-gray-500 italic">
                                Processing tool...
                              </div>
                            );
                          case 'tool-result':
                            if (suppressToolProcessing) return null;
                            if (toolCallId) seenToolCallIds.add(toolCallId);
                            return (
                              <div key={index} className="text-xs text-green-600">
                                ✓ Tool completed
                              </div>
                            );
                          default:
                            // Handle tool parts with different states
                            if (typeof part.type === 'string' && part.type.startsWith('tool-')) {
                              if (suppressToolProcessing) return null;
                              const toolName = part.type.replace('tool-', '');
                              if (toolCallId) seenToolCallIds.add(toolCallId);
                              return (
                                <div key={index} className="text-xs text-gray-500 italic">
                                  Processing {toolName}...
                                </div>
                              );
                            }
                            return null;
                        }
                      })}
                    </motion.div>
                  </div>
                    );
                  });
                })()}

                {/* Loading indicator - removed since isLoading is not available */}

                {/* Error message */}
                {error && (
                  <div className="flex justify-start">
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="max-w-[80%] rounded-2xl px-3 py-2 text-sm bg-red-50 text-red-600 border border-red-200"
                    >
                      Sorry, something went wrong. Please try again.
                    </motion.div>
                  </div>
                )}
              </div>
            </div>

            {/* Input */}
            <div className="p-3 border-t border-black/10 bg-white">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                  placeholder="Ask about services, availability, bookings…"
                  className="flex-1 rounded-full border border-black/10 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 text-[#141414] placeholder-[#7B8487]"
                  ref={inputRef}
                  disabled={false}
                />
                <motion.button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  whileTap={{ scale: 0.97 }}
                  className="h-9 px-4 rounded-full bg-[#141414] text-white text-sm font-medium disabled:opacity-50"
                >
                  Send
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


