'use server';

import { z } from 'zod';
import { medicalChatFlow } from '@/ai/flows/medical-chat-flow';

const ChatFormSchema = z.object({
  message: z.string().min(1),
  history: z.string().optional(),
});

export type ChatState = {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  error?: string;
};

export async function medicalChatAction(
  prevState: ChatState,
  formData: FormData
): Promise<ChatState> {
  const validatedFields = ChatFormSchema.safeParse({
    message: formData.get('message'),
    history: formData.get('history'),
  });

  if (!validatedFields.success) {
    return {
      ...prevState,
      error: 'Invalid input. Message cannot be empty.',
    };
  }

  const { message, history } = validatedFields.data;

  const newMessages: ChatState['messages'] = [
    ...prevState.messages,
    { role: 'user', content: message },
  ];

  try {
    const response = await medicalChatFlow({
      input: message,
      history: JSON.parse(history || '[]'),
    });

    return {
      messages: [...newMessages, { role: 'assistant', content: response }],
    };
  } catch (error) {
    console.error(error);
    return {
      ...prevState,
      error: 'The AI assistant is currently unavailable. Please try again later.',
    };
  }
}
