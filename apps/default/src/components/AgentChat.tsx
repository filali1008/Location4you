import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { createConversation, createAgentChat } from '@/lib/agent-chat/v2';
import { isToolUIPart } from 'ai';
import { ulid } from 'ulidx';
import { MessageCircle, X, Send, Bot } from 'lucide-react';

const AGENT_ID = '01KR0VM3FWZ0NZ64H32ZBHPT1G';

function ActiveChat({ chat }: { chat: ReturnType<typeof createAgentChat> }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { messages, status, addToolApprovalResponse } = useChat({ chat, id: chat.id });
  const isSending = status === 'submitted' || status === 'streaming';

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || isSending) return;
    const text = input; setInput('');
    await chat.sendMessage({ id: ulid(), role: 'user', parts: [{ type: 'text', text }] });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
              {msg.parts.map((part, i) => {
                if (part.type === 'text') return <span key={i}>{part.text}</span>;
                if (isToolUIPart(part)) return <div key={i} className="text-xs opacity-70 italic">🔧 {part.toolName} [{part.state}]</div>;
                return null;
              })}
            </div>
          </div>
        ))}
        {isSending && <div className="flex justify-start"><div className="bg-muted rounded-2xl px-3 py-2 text-sm text-muted-foreground">...</div></div>}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-border p-3 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Posez votre question..." className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" disabled={isSending} />
        <button onClick={send} disabled={isSending || !input.trim()} className="p-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-50"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

function ChatInterface() {
  const [chat, setChat] = useState<ReturnType<typeof createAgentChat> | null>(null);
  const [starting, setStarting] = useState(false);

  const start = async () => {
    setStarting(true);
    try {
      const { conversationId } = await createConversation(AGENT_ID);
      setChat(createAgentChat(AGENT_ID, conversationId));
    } catch { } finally { setStarting(false); }
  };

  if (!chat) return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <Bot className="w-10 h-10 text-primary mb-3" />
      <h3 className="font-semibold mb-1">Assistant Location4You</h3>
      <p className="text-sm text-muted-foreground mb-4">Votre assistant IA pour gérer votre flotte, contrats et finances.</p>
      <button onClick={start} disabled={starting} className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">{starting ? 'Démarrage...' : 'Démarrer la conversation'}</button>
    </div>
  );
  return <ActiveChat chat={chat} />;
}

export function AgentChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-30 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity">
        <MessageCircle className="w-6 h-6" />
      </button>
      {open && (
        <div className="fixed bottom-20 right-4 lg:bottom-20 lg:right-6 z-40 w-80 sm:w-96 h-[500px] bg-card rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
            <div className="flex items-center gap-2"><Bot className="w-4 h-4 text-primary" /><span className="font-semibold text-sm">Assistant Location4You</span></div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-hidden"><ChatInterface /></div>
        </div>
      )}
    </>
  );
}
