import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Plus, Users } from 'lucide-react';
import { SalesRep, GroupChat, Message } from '../types';
import { getSalesReps, getGroupChats, addGroupChat, addGroupMessage, getGroupMessages } from '../services/firebase';

interface GroupChatModuleProps {
  currentUser: SalesRep | null;
}

const GroupChatModule: React.FC<GroupChatModuleProps> = ({ currentUser }) => {
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedReps, setSelectedReps] = useState<string[]>([]);
  const [allReps, setAllReps] = useState<SalesRep[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [groupMessages, setGroupMessages] = useState<Message[]>([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupMessages(selectedGroupId);
    }
  }, [selectedGroupId]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [reps, chats] = await Promise.all([
        getSalesReps(),
        getGroupChats()
      ]);
      setAllReps(reps.filter(r => r.id !== currentUser?.id));
      setGroupChats(chats);
      if (chats.length > 0) {
        setSelectedGroupId(chats[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroupMessages = async (groupId: string) => {
    try {
      const messages = await getGroupMessages(groupId);
      setGroupMessages(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupName.trim() || selectedReps.length === 0) {
      alert('Please fill in group name and select at least one member');
      return;
    }

    try {
      const newGroup: Omit<GroupChat, 'id'> = {
        name: groupName.trim(),
        members: [currentUser?.id || '', ...selectedReps],
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.id || ''
      };

      const groupId = await addGroupChat(newGroup);
      if (groupId) {
        setGroupChats([{ ...newGroup, id: groupId }, ...groupChats]);
        setGroupName('');
        setSelectedReps([]);
        setIsCreating(false);
        setSelectedGroupId(groupId);
      }
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !selectedGroupId) return;

    setIsSendingMessage(true);
    try {
      const newMessage: Omit<Message, 'id'> = {
        senderId: currentUser?.id || '',
        senderName: currentUser?.name || '',
        senderProfilePic: currentUser?.profilePicUrl,
        content: messageInput.trim(),
        createdAt: new Date().toISOString()
      };

      const messageId = await addGroupMessage(selectedGroupId, newMessage);
      if (messageId) {
        setGroupMessages([...groupMessages, { ...newMessage, id: messageId }]);
        setMessageInput('');

        // Update group chat lastMessage
        setGroupChats(groupChats.map(g =>
          g.id === selectedGroupId
            ? { ...g, lastMessage: { ...newMessage, id: messageId }, lastMessageTime: new Date().toISOString() }
            : g
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading group chats...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
              <MessageCircle className="text-brand" size={32} />
              Group Chats
            </h1>
            <p className="text-slate-500 mt-2">Team communication</p>
          </div>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-6 py-3 bg-brand text-slate-900 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            New Group
          </button>
        </div>

        {/* Create Group Form */}
        {isCreating && (
          <form onSubmit={handleCreateGroup} className="bg-slate-50 p-4 rounded-xl space-y-4">
            <input
              type="text"
              placeholder="Group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {allReps.map(rep => (
                <label key={rep.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedReps.includes(rep.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedReps([...selectedReps, rep.id]);
                      } else {
                        setSelectedReps(selectedReps.filter(id => id !== rep.id));
                      }
                    }}
                    className="rounded"
                  />
                  {rep.name}
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 px-3 py-2 bg-brand text-slate-900 rounded-lg font-bold text-sm">
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 px-3 py-2 bg-slate-200 text-slate-600 rounded-lg font-bold text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Group List */}
        <div className="w-64 border-r border-slate-100 overflow-y-auto bg-white">
          {groupChats.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              No group chats yet
            </div>
          ) : (
            <div className="space-y-1 p-4">
              {groupChats.map(group => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                    selectedGroupId === group.id
                      ? 'bg-brand text-slate-900 font-bold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold truncate">{group.name}</p>
                  {group.lastMessage && (
                    <p className="text-xs opacity-70 truncate">
                      {group.lastMessage.senderName}: {group.lastMessage.content}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-50">
          {selectedGroupId ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {groupMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  groupMessages.map(msg => (
                    <div key={msg.id} className="flex gap-3">
                      {msg.senderProfilePic ? (
                        <img
                          src={msg.senderProfilePic}
                          alt={msg.senderName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-xs font-bold">
                          {msg.senderName[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-slate-900">{msg.senderName}</p>
                        <p className="text-sm text-slate-600 bg-white rounded-xl px-3 py-2 mt-1">
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
              Select a group to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupChatModule;
