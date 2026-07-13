'use client';
import { useState, useRef, useEffect } from 'react';
import { useFormState } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, X, Loader2, Send } from 'lucide-react';
import { medicalChatAction, type ChatState } from '@/app/actions/medical-chat';
import { useUserLocation } from '@/context/location-context';
import { cn } from '@/lib/utils';
import { Avatar } from './ui/avatar';
import Logo from './logo';

const quickReplies = [
  'How do I donate blood?',
  'Find nearby blood banks',
  'First aid for a small cut',
  'What are the symptoms of anemia?',
];

function QuickReplyButton({
  text,
  formAction,
  history,
}: {
  text: string;
  formAction: (formData: FormData) => void;
  history: any[];
}) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    formData.append('history', JSON.stringify(history));
    
    formAction(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="message" value={text} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        className="h-auto whitespace-normal w-full"
      >
        {text}
      </Button>
    </form>
  );
}

export default function MedicalChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showQuickReplies, setShowQuickReplies] = useState(true);

  const initialState: ChatState = {
    messages: [
      {
        role: 'assistant',
        content:
          "Hello! I'm your AI health assistant. I can answer general health questions or find nearby hospitals. How can I help you today? \n\n**Disclaimer:** I am not a medical professional. Please consult a doctor for medical advice. In case of an emergency, call your local emergency number.",
      },
    ],
  };

  const [state, formAction] = useFormState(
    medicalChatAction,
    initialState
  );

  const isPending = (formAction as any).pending;


  const wrappedFormAction = (formData: FormData) => {
    const message = formData.get('message') as string;
    if (!message?.trim()) return;

    setShowQuickReplies(false);
    (formAction as any)(formData);
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [state.messages]);

  useEffect(() => {
    if (isOpen) {
      // Reset the quick replies visibility when chat is opened and has only initial message
      if(state.messages.length <= 1) {
        setShowQuickReplies(true);
      }
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, state.messages.length]);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className="rounded-full w-16 h-16 shadow-lg"
          aria-label="Toggle AI Chatbot"
        >
          {isOpen ? <X /> : <Bot />}
        </Button>
      </div>

      {isOpen && (
        <Card className="fixed bottom-24 right-6 z-50 w-full max-w-sm h-[70vh] flex flex-col shadow-2xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo className="w-10 h-10" />
              <div>
                <CardTitle className="font-headline text-xl">
                  AI Health Assistant
                </CardTitle>
                <CardDescription>Your 24/7 Health Guide</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close chat</span>
            </Button>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden">
            <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {state.messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex gap-3 text-sm',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="h-8 w-8">
                        <div className="bg-primary/10 flex items-center justify-center h-full w-full rounded-full">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'rounded-lg px-4 py-2 max-w-[85%] prose prose-sm prose-p:my-2',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                      dangerouslySetInnerHTML={{
                        __html: message.content.replace(/\n/g, '<br />'),
                      }}
                    />
                    {message.role === 'user' && (
                      <Avatar className="h-8 w-8">
                        <div className="bg-muted flex items-center justify-center h-full w-full rounded-full">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isPending && (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <div className="bg-primary/10 flex items-center justify-center h-full w-full rounded-full">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-4 py-3">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                 {showQuickReplies && !isPending && (
                  <div className="p-4 grid grid-cols-2 gap-2">
                    {quickReplies.map((text) => (
                      <QuickReplyButton 
                        key={text} 
                        text={text} 
                        formAction={wrappedFormAction as any}
                        history={state.messages}
                      />
                    ))}
                  </div>
                )}
                {state.error && (
                  <div className="flex justify-center">
                    <p className="text-xs text-destructive text-center p-2 bg-destructive/10 rounded-md">
                      {state.error}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <form
              action={(formData) => {
                formData.append('history', JSON.stringify(state.messages));
                wrappedFormAction(formData);
                inputRef.current!.value = '';
              }}
              className="flex w-full gap-2"
            >
              <Input
                name="message"
                placeholder="Type your message..."
                disabled={isPending}
                ref={inputRef}
              />
              <Button type="submit" disabled={isPending} size="icon" aria-label="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
