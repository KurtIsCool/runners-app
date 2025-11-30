import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { type Message } from '../types';
import { sendNotification } from '../lib/utils';
import { type RealtimePostgresInsertPayload } from '@supabase/supabase-js';

const ChatBox = ({ requestId, currentUserId, embedded = false }: { requestId: string, currentUserId: string, embedded?: boolean }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!supabase) return;
      const fetchMessages = async () => {
        const { data } = await supabase.from('messages').select('*').eq('request_id', requestId).order('created_at', { ascending: true });
        if (data) setMessages(data);
      };
      fetchMessages();
      const channel = supabase.channel(`chat:${requestId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `request_id=eq.${requestId}` }, (payload: RealtimePostgresInsertPayload<Message>) => {
          setMessages(prev => {
              if (prev.find(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new as Message];
          });
          if (payload.new.sender_id !== currentUserId) sendNotification("New Message", payload.new.text);
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }, [requestId, currentUserId]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !supabase) return;
      const textToSend = newMessage;
      setNewMessage('');
      await supabase.from('messages').insert({ request_id: requestId, sender_id: currentUserId, text: textToSend });
    };

    return (
      <div className={`flex flex-col ${embedded ? 'h-full' : 'h-[500px]'} bg-gray-50`}>
        {!embedded && <div className="bg-blue-600 p-4 text-white font-bold flex items-center gap-2 shadow-md"><MessageCircle size={20} /> Chat</div>}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && <div className="text-center text-gray-400 mt-4 text-sm pop-in">Send a message to coordinate...</div>}
          {messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} stagger-enter`} style={{animationDelay: '0s'}}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}>{msg.text}</div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSend} className="p-3 bg-white border-t flex gap-2">
          <input type="text" className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white" placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} />
          <button type="submit" disabled={!newMessage.trim()} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 btn-press"><Send size={18} /></button>
        </form>
      </div>
    );
};

export default ChatBox;
