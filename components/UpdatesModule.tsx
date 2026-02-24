import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Calendar, Upload } from 'lucide-react';
import { SalesRep } from '../types';
import { 
  getUpdates, 
  addUpdate, 
  deleteUpdate, 
  markUpdateAsRead,
  getUnreadUpdatesCount
} from '../services/firebase';

interface Update {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  createdAt: string;
  createdBy: string;
}

interface UpdatesModuleProps {
  currentUser: SalesRep;
}

const UpdatesModule: React.FC<UpdatesModuleProps> = ({ currentUser }) => {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    imageFile: null as File | null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [readUpdates, setReadUpdates] = useState<Set<string>>(new Set());

  // Load updates on mount
  useEffect(() => {
    loadUpdates();
    loadReadUpdates();
  }, [currentUser.id]);

  // Subscribe to updates in real-time
  useEffect(() => {
    if (!currentUser?.id) return;

    console.log('📰 Subscribing to updates');
    const unsubscribe = getUpdates((newUpdates) => {
      console.log('📰 Updates loaded:', newUpdates.length);
      setUpdates(newUpdates);
    });

    return () => {
      console.log('📰 Unsubscribing from updates');
      unsubscribe();
    };
  }, [currentUser?.id]);

  const loadUpdates = async () => {
    setIsLoading(true);
    try {
      const data = await getUpdates((updates) => setUpdates(updates));
      // data here is the unsubscribe function, not the updates
    } catch (error) {
      console.error('Error loading updates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReadUpdates = async () => {
    try {
      const stored = localStorage.getItem(`updates_read_${currentUser.id}`);
      if (stored) {
        setReadUpdates(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error('Error loading read updates:', error);
    }
  };

  const handleMarkAsRead = async (updateId: string) => {
    if (!readUpdates.has(updateId)) {
      const newSet = new Set(readUpdates);
      newSet.add(updateId);
      setReadUpdates(newSet);
      localStorage.setItem(`updates_read_${currentUser.id}`, JSON.stringify(Array.from(newSet)));
      
      try {
        await markUpdateAsRead(currentUser.id, updateId);
      } catch (error) {
        console.error('Error marking update as read:', error);
      }
    }
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const url = await uploadUpdateImage(file, currentUser.id);
      setFormData(prev => ({ ...prev, imageUrl: url, imageFile: null }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Title and description are required');
      return;
    }

    try {
      setIsLoading(true);
      console.log('📰 Adding new update');
      
      const success = await addUpdate({
        title: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl || undefined,
        createdBy: `${currentUser.name} ${currentUser.surname || ''}`.trim()
      });

      if (success) {
        setFormData({ title: '', description: '', imageUrl: '', imageFile: null });
        setShowAddModal(false);
        console.log('✅ Update posted successfully');
      } else {
        alert('Failed to post update');
      }
    } catch (error) {
      console.error('Error adding update:', error);
      alert('Error posting update');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (updateId: string) => {
    if (!confirm('Delete this update?')) return;

    try {
      setIsLoading(true);
      console.log('🗑️ Deleting update:', updateId);
      
      const success = await deleteUpdate(updateId);
      if (success) {
        setUpdates(updates.filter(u => u.id !== updateId));
        console.log('✅ Update deleted');
      } else {
        alert('Failed to delete update');
      }
    } catch (error) {
      console.error('Error deleting update:', error);
      alert('Error deleting update');
    } finally {
      setIsLoading(false);
    }
  };

  const unreadCount = updates.filter(u => !readUpdates.has(u.id)).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
              📰 Updates
            </h1>
            <p className="text-slate-600 mt-2">Latest announcements and updates</p>
          </div>
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-brand hover:bg-emerald-400 text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-200/50"
            >
              <Plus size={20} /> Post Update
            </button>
          )}
        </div>

        {/* Updates List */}
        <div className="space-y-4">
          {isLoading && updates.length === 0 ? (
            <div className="text-center text-slate-400 py-8">Loading updates...</div>
          ) : updates.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
              <p className="text-slate-500 font-medium">No updates yet</p>
            </div>
          ) : (
            updates.map(update => {
              const isRead = readUpdates.has(update.id);
              return (
                <div
                  key={update.id}
                  onClick={() => handleMarkAsRead(update.id)}
                  className={`bg-white rounded-lg border-2 p-6 transition-all cursor-pointer ${
                    isRead
                      ? 'border-slate-200 opacity-75'
                      : 'border-brand shadow-lg shadow-brand/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Image */}
                      {update.imageUrl && (
                        <img
                          src={update.imageUrl}
                          alt={update.title}
                          className="w-full max-h-64 object-cover rounded-lg mb-4"
                        />
                      )}

                      {/* Title */}
                      <h3 className="text-xl font-black text-slate-900">{update.title}</h3>

                      {/* Description */}
                      <p className="text-slate-600 mt-2 whitespace-pre-wrap">{update.description}</p>

                      {/* Meta */}
                      <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(update.createdAt).toLocaleDateString()}
                        </span>
                        <span>By {update.createdBy}</span>
                        {!isRead && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-brand/10 text-brand font-bold text-[10px] uppercase tracking-wider">
                            ● New
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete Button */}
                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(update.id);
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors flex-shrink-0"
                        title="Delete update"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Update Modal */}
      {showAddModal && currentUser?.role === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6">
              <h2 className="text-2xl font-black text-slate-900">Post New Update</h2>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">
                  Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Update title"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand text-sm"
                  disabled={isLoading}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">
                  Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Update description"
                  rows={6}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand text-sm resize-none"
                  disabled={isLoading}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">
                  Image (Optional)
                </label>
                {formData.imageUrl ? (
                  <div className="relative">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-full max-h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-brand cursor-pointer transition-colors">
                    <Upload size={18} className="text-slate-400" />
                    <span className="text-sm text-slate-600">
                      {isUploading ? 'Uploading...' : 'Click to upload image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(file);
                        }
                      }}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isLoading || isUploading}
                  className="flex-1 bg-brand text-slate-900 py-3 rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Posting...' : 'Post Update'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isLoading}
                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-lg font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Placeholder for image upload function - will add to firebase.ts
async function uploadUpdateImage(file: File, userId: string): Promise<string> {
  // This will be properly implemented in firebase.ts
  const { uploadUpdateImage } = await import('../services/firebase');
  return uploadUpdateImage(file, userId);
}

export default UpdatesModule;
