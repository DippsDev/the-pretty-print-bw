import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { buildSystemPrompt, parseTriggerAction, cleanResponseText, generateCacheKey } from '@/lib/chat/promptBuilder';
import { z } from 'zod';

// Request/Response types
interface ChatRequest {
  message: string;
  conversationId?: string;
  useCache?: boolean;
}

interface ChatResponse {
  message: string;
  trigger?: any;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  cached?: boolean;
}


// Main chat endpoint using AI SDK (OpenAI)
export async function POST(request: NextRequest) {
  try {
    // Accept UIMessage[] from the frontend (see ai-sdk.txt)
    const { messages }: { messages: UIMessage[] } = await request.json();

    if (!messages?.length) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Use your system prompt
    const systemPrompt = buildSystemPrompt();

    // Stream response from OpenAI
    const { textStream } = await streamText({
      model: openai('gpt-4'), // Updated model to gpt-4
      messages: convertToModelMessages(messages),
      system: systemPrompt,
      // You can add tools here if needed
    });

    // Create a readable stream for the frontend
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = '';
        let contentReceived = false;
        try {
          for await (const delta of textStream) {
            if (typeof delta === 'string') {
              fullResponse += delta;
              contentReceived = true;
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({ type: 'content', text: delta })}\n\n`)
              );
            }
          }

          // If nothing was streamed, send a fallback message
          if (!contentReceived) {
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ type: 'content', text: "Sorry, I didn't get a response from the assistant." })}\n\n`)
            );
            fullResponse = "Sorry, I didn't get a response from the assistant.";
          }

          // Parse trigger action from full response
          const trigger = parseTriggerAction(fullResponse);
          const cleanMessage = cleanResponseText(fullResponse);

          // Send final response
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({
              type: 'complete',
              message: cleanMessage,
              trigger,
            })}\n\n`)
          );
          controller.close();
        } catch (error: any) {
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ type: 'error', error: error?.message || 'Failed to process request' })}\n\n`)
          );
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
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
