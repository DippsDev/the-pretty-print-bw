"use client";

import React from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentPage, setServiceSelection, setCurrentSection } from '@/redux/features/navigationSlice';
import { addBooking } from '@/redux/serviceSlice';
import { setSelectedProfessional } from '@/redux/professionalSlice';
import { resolveServiceAndPrice } from '@/lib/chat/serviceResolver';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Inter_Tight } from 'next/font/google';
import Loader from './Loader';

type StreamEvent =
  | { type: 'content'; text: string }
  | { type: 'complete'; message: string; trigger?: any }
  | { type: 'error'; error: string };

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

const interTight = Inter_Tight({ subsets: ['latin'], weight: '400' });

export default function Chatbot() {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [botStreaming, setBotStreaming] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const listRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const streamingBotMsgIdRef = React.useRef<string | null>(null);
  const [hasUnread, setHasUnread] = React.useState(false);
  const dispatch = useDispatch();

  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Scroll to bottom when opening the chatbot
  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
      }, 10);
    }
  }, [open]);

  // Focus input when opening
  React.useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close on outside click
  React.useEffect(() => {
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

  function appendMessage(text: string, sender: 'user' | 'bot') {
    setMessages(prev => [...prev, { id: String(Date.now() + Math.random()), text, sender }]);
  }

  // Create or update a streaming bot bubble for smoothness
  function upsertStreamingBotMessage(partial: string) {
    // Remove any <trigger>...</trigger> from the streaming text before showing to user
    const cleanText = partial.replace(/<trigger>[\s\S]*?<\/trigger>/g, '').trim();
    setMessages(prev => {
      if (!streamingBotMsgIdRef.current) {
        const id = String(Date.now() + Math.random());
        streamingBotMsgIdRef.current = id;
        return [...prev, { id, text: cleanText, sender: 'bot' }];
      }
      const id = streamingBotMsgIdRef.current;
      if (!prev.some(m => m.id === id)) {
        return [...prev, { id, text: cleanText, sender: 'bot' }];
      }
      return prev.map(m => (m.id === id ? { ...m, text: cleanText } : m));
    });
  }

  function finalizeStreamingBotMessage() {
    // Remove the streaming bot message id, but do NOT add a new message.
    streamingBotMsgIdRef.current = null;
  }

  // Simulate streaming effect for a bot message (character by character)
  async function simulateStreamingBotMessage(fullText: string) {
    const id = String(Date.now() + Math.random());
    streamingBotMsgIdRef.current = id;
    setMessages(prev => [...prev, { id, text: '', sender: 'bot' }]);
    for (let i = 1; i <= fullText.length; i++) {
      await new Promise(res => setTimeout(res, 7 + Math.random() * 12));
      setMessages(prev => prev.map(m => m.id === id ? { ...m, text: fullText.slice(0, i) } : m));
    }
  }

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;
    setInput('');
    appendMessage(content, 'user');
    setSending(true);
    setBotStreaming(true);

    try {
      // Build UIMessage[] for API
      const uiMessages = [
        ...messages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          parts: [{ type: 'text', text: m.text }],
        })),
        {
          role: 'user',
          parts: [{ type: 'text', text: content }],
        },
      ];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: uiMessages }),
      });

      if (!res.ok || !res.body) {
        appendMessage('Sorry, something went wrong connecting to Bel Amour assistant.', 'bot');
        setBotStreaming(false);
        setSending(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let botBuffer = '';
      let finalMessage = '';
      let finalTrigger = null;
      // Remove any previous streaming bot message before starting a new one
      setMessages(prev => prev.filter(m => !streamingBotMsgIdRef.current || m.id !== streamingBotMsgIdRef.current));
      streamingBotMsgIdRef.current = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n').filter(Boolean);
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = JSON.parse(line.replace('data: ', '')) as StreamEvent;
          if (payload.type === 'content') {
            botBuffer += payload.text;
          } else if (payload.type === 'complete') {
            finalMessage = payload.message || '';
            finalTrigger = payload.trigger;
          }
        }
      }

      // After stream, show the cleaned message as if streaming
      if (finalMessage) {
        const cleanText = finalMessage.replace(/<trigger>[\s\S]*?<\/trigger>/g, '').trim();
        await simulateStreamingBotMessage(cleanText);
        finalizeStreamingBotMessage();
        if (finalTrigger) handleTrigger(finalTrigger);
      } else if (botBuffer) {
        // fallback if no final message
        const cleanText = botBuffer.replace(/<trigger>[\s\S]*?<\/trigger>/g, '').trim();
        await simulateStreamingBotMessage(cleanText);
        finalizeStreamingBotMessage();
      }
    } catch (e) {
      appendMessage('Sorry, an error occurred while contacting Bel Amour assistant.', 'bot');
    } finally {
      setSending(false);
      setBotStreaming(false);
      // If panel is closed when a bot message arrives, show unread dot
      if (!open) setHasUnread(true);
    }
  }

  function handleTrigger(trigger: any) {
    const action = trigger?.action as string | undefined;
    const data = trigger?.data || {};
    if (!action) return;

    if (action === 'navigateTo' && data.page) {
      // If a section/group is specified, set it in Redux (for group navigation)
      if (data.section || data.group) {
        dispatch(setCurrentSection(data.section || data.group));
      }
      dispatch(setCurrentPage(String(data.page)));
      return;
    }

    if (action === 'selectProfessional' && data.professional) {
      // Map names to known IDs from ProfessionalSelection.tsx
      const name = String(data.professional).toLowerCase();
      const id = name.includes('banele') ? 1 : name.includes('dineo') ? 2 : name.includes('michelle') ? 3 : 0;
      dispatch(setSelectedProfessional(id));
      return;
    }

    if (action === 'addService') {
      // Always add the service, even if already present (for multi-service booking)
      const resolved = resolveServiceAndPrice(data.service, data.package);
      if (resolved) {
        dispatch(addBooking({ 
          name: resolved.name, 
          option: resolved.option ?? '', 
          time: '', 
          price: resolved.price ?? '' 
        }));
        dispatch(setServiceSelection({ service: resolved.name, pkg: resolved.option, time: '' } as any));
      }
      dispatch(setCurrentPage('services'));
      return;
    }

    if (action === 'checkAvailability') {
      // 1. Set professional if provided
      if (data.professional) {
        const name = String(data.professional).toLowerCase();
        const id = name.includes('banele') ? 1 : name.includes('dineo') ? 2 : name.includes('michelle') ? 3 : 0;
        dispatch(setSelectedProfessional(id));
      }
      // 2. Resolve service
      let resolved = null;
      if (data.service) {
        resolved = resolveServiceAndPrice(data.service, data.package);
      }
      // 3. Available times (should match promptBuilder)
      const AVAILABLE_TIMES = [
        "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
        "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
        "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"
      ];
      let selectedTime = '';
      let requestedTime = data.time;
      if (requestedTime && typeof requestedTime === 'string') {
        // Normalize time string
        const norm = (s: string) => s.replace(/\s+/g, '').replace(/:00/, ':0').toLowerCase();
        const found = AVAILABLE_TIMES.find(t => norm(t) === norm(requestedTime));
        if (found) {
          selectedTime = found;
        } else {
          // Not available, find next available
          const idx = AVAILABLE_TIMES.findIndex(t => t > requestedTime);
          const nextAvailable = idx !== -1 ? AVAILABLE_TIMES[idx] : null;
          // Inform user
          appendMessage(
            `Sorry, ${requestedTime} is not available. The next available time is ${nextAvailable || 'tomorrow'}. Please select a time.`,
            'bot'
          );
        }
      }
      // 4. Set service selection with time if available
      if (resolved) {
        dispatch(setServiceSelection({ service: resolved.name, pkg: resolved.option, time: selectedTime } as any));
      }
      // 5. Always go to time selection step (services page)
      dispatch(setCurrentPage('services'));
      return;
    }
  }

  // Track the current streaming bot message (if any)
  const streamingBotMsgId = streamingBotMsgIdRef.current;
  const streamingBotMsg = streamingBotMsgId
    ? messages.find(m => m.id === streamingBotMsgId)
    : null;

  // Track panel ref for outside click
  const panelRef = React.useRef<HTMLDivElement>(null);

  // Track if we are closing (for X spin animation)
  const [closing, setClosing] = React.useState(false);

  // Animate X spin on close
  React.useEffect(() => {
    if (!open && closing) {
      // After animation, reset closing state
      const timeout = setTimeout(() => setClosing(false), 350);
      return () => clearTimeout(timeout);
    }
  }, [open, closing]);

  return (
    <div className={interTight.className}>
      {/* Floating Chat Icon */}
      <motion.button
        onClick={() => {
          if (open) setClosing(true);
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
              {/* removed status */}
            </div>

            {/* Messages */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 bg-white">
              <div className="space-y-2">
                {/* Render all messages in order, including streaming bot message */}
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${m.sender === 'user' ? 'bg-[#141414] text-white' : 'bg-[#f6f6f6] text-[#141414] border border-black/5'}`}
                    >
                      {m.text}
                    </motion.div>
                  </div>
                ))}

                {/* Loader bubble if bot is streaming but no content yet */}
                {botStreaming && !streamingBotMsg && (
                  <div className="flex justify-start">
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="max-w-[80%] rounded-2xl px-5 py-2 bg-[#f6f6f6] border border-black/5 flex items-center"
                      style={{ minWidth: 64 }}
                    >
                      <Loader />
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
                />
                <motion.button
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
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


