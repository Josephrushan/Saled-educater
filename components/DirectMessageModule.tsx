import React, { useState, useEffect } from 'react';
import { Mail, Send, Search } from 'lucide-react';
import { SalesRep, Message } from '../types';
import { getSalesReps, getOrCreateDirectMessage, addDirectMessage, getDirectMessages, subscribeToDirectMessages } from '../services/firebase';

interface DirectMessageModuleProps {
  currentUser: SalesRep | null;
}

const DirectMessageModule: React.FC<DirectMessageModuleProps> = ({ currentUser }) => {
  const [allReps, setAllReps] = useState<SalesRep[]>([]);
  const [conversations, setConversations] = useState<Map<string, { rep: SalesRep; messages: Message[] }>>(new Map());
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedRepId && !conversations.has(selectedRepId)) {
      let unsubscribe: (() => void) | null = null;
      subscribeToConversation(selectedRepId).then(unsub => {
        unsubscribe = unsub;
      });
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [selectedRepId]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const reps = await getSalesReps();
      const filtered = reps.filter(r => r.id !== currentUser?.id);
      setAllReps(filtered);
      if (filtered.length > 0) {
        setSelectedRepId(filtered[0].id);
      }
    } catch (error) {
      console.error('Error fetching reps:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToConversation = async (repId: string) => {
    try {
      const dmId = await getOrCreateDirectMessage(currentUser?.id || '', repId);
      const unsubscribe = subscribeToDirectMessages(dmId, (messages) => {
        const rep = allReps.find(r => r.id === repId);
        if (rep) {
          setConversations(new Map(conversations).set(repId, { rep, messages }));
        }
      });
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to conversation:', error);
      return () => {}; // Return no-op unsubscribe if error
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !selectedRepId) return;

    setIsSendingMessage(true);
    try {
      const dmId = await getOrCreateDirectMessage(currentUser?.id || '', selectedRepId);

      const newMessage: Omit<Message, 'id'> = {
        senderId: currentUser?.id || '',
        senderName: currentUser?.name || '',
        senderProfilePic: currentUser?.profilePicUrl,
        content: messageInput.trim(),
        createdAt: new Date().toISOString()
      };

      const messageId = await addDirectMessage(dmId, newMessage);
      if (messageId) {
        const conversation = conversations.get(selectedRepId);
        if (conversation) {
          setConversations(
            new Map(conversations).set(selectedRepId, {
              ...conversation,
              messages: [...conversation.messages, { ...newMessage, id: messageId }]
            })
          );
        }
        setMessageInput('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const selectedConversation = selectedRepId ? conversations.get(selectedRepId) : null;
  const filteredReps = allReps.filter(rep =>
    rep.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading direct messages...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-100 p-6">
        <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
          <Mail className="text-brand" size={32} />
          Direct Messages
        </h1>
        <p className="text-slate-500 mt-2">One-on-one conversations with team members</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* People List */}
        <div className="w-80 border-r border-slate-100 overflow-y-auto bg-white flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand text-sm"
              />
            </div>
          </div>

          {/* Reps List */}
          <div className="flex-1 overflow-y-auto space-y-1 p-4">
            {filteredReps.length === 0 ? (
              <div className="text-center text-slate-400 text-sm py-8">
                No team members found
              </div>
            ) : (
              filteredReps.map(rep => (
                <button
                  key={rep.id}
                  onClick={() => setSelectedRepId(rep.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                    selectedRepId === rep.id
                      ? 'bg-brand text-slate-900 shadow-lg'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {/* Avatar */}
                  {rep.profilePicUrl ? (
                    <img
                      src={rep.profilePicUrl}
                      alt={rep.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {rep.avatar || rep.name[0]}
                    </div>
                  )}

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{rep.name}</p>
                    <p className="text-xs opacity-70">Sales Rep</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-50">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="border-b border-slate-200 p-4 bg-white flex items-center gap-3">
                {selectedConversation.rep.profilePicUrl ? (
                  <img
                    src={selectedConversation.rep.profilePicUrl}
                    alt={selectedConversation.rep.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center font-bold">
                    {selectedConversation.rep.avatar || selectedConversation.rep.name[0]}
                  </div>
                )}
                <div>
                  <p className="font-bold text-slate-900">{selectedConversation.rep.name}</p>
                  <p className="text-xs text-slate-500">Sales Rep</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedConversation.messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  selectedConversation.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.senderId === currentUser?.id ? 'flex-row-reverse' : ''}`}
                    >
                      {msg.senderProfilePic ? (
                        <img
                          src={msg.senderProfilePic}
                          alt={msg.senderName}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {msg.senderName[0]}
                        </div>
                      )}
                      <div className={msg.senderId === currentUser?.id ? 'text-right' : ''}>
                        <p className={`text-sm font-bold ${msg.senderId === currentUser?.id ? 'text-slate-900' : 'text-slate-700'}`}>
                          {msg.senderName}
                        </p>
                        <p
                          className={`text-sm rounded-xl px-3 py-2 mt-1 max-w-xs ${
                            msg.senderId === currentUser?.id
                              ? 'bg-brand text-slate-900 rounded-br-none'
                              : 'bg-white text-slate-700 rounded-bl-none'
                          }`}
                        >
                          {msg.content}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="border-t border-slate-200 p-4 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand text-sm"
                  />
                  <button
                    type="submit"
                    disabled={isSendingMessage || !messageInput.trim()}
                    className="px-4 py-3 bg-brand text-slate-900 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 font-bold"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              Select a team member to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectMessageModule;
