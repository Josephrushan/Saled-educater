import React, { useState, useEffect } from 'react';
import { Gift, Upload, Trash2, X } from 'lucide-react';
import { SalesRep, Incentive } from '../types';
import { 
  addIncentive, 
  getIncentives, 
  deleteIncentive,
  uploadFile
} from '../services/firebase';

interface IncentivesModuleProps {
  currentUser: SalesRep | null;
}

const IncentivesModule: React.FC<IncentivesModuleProps> = ({ currentUser }) => {
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedIncentiveId, setExpandedIncentiveId] = useState<string | null>(null);

  const isAdmin = currentUser?.email === 'info@visualmotion.co.za';

  useEffect(() => {
    fetchIncentives();
  }, []);

  const fetchIncentives = async () => {
    setIsLoading(true);
    try {
      const data = await getIncentives();
      setIncentives(data);
    } catch (error) {
      console.error('Error fetching incentives:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateIncentive = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      alert('Please fill in all fields');
      return;
    }

    if (!imageFile) {
      alert('Please select an image');
      return;
    }

    setIsSaving(true);
    try {
      // Upload image to Firebase Storage
      const fileName = `incentives/${Date.now()}_${imageFile.name}`;
      const imageUrl = await uploadFile(imageFile, fileName);

      if (!imageUrl) {
        alert('Failed to upload image');
        setIsSaving(false);
        return;
      }

      // Create incentive
      const incentiveData: Omit<Incentive, 'id'> = {
        title: title.trim(),
        description: description.trim(),
        imageUrl,
        createdBy: currentUser?.email || 'admin',
        createdAt: new Date().toISOString()
      };

      const newId = await addIncentive(incentiveData);
      if (newId) {
        setIncentives([{ ...incentiveData, id: newId }, ...incentives]);
        setTitle('');
        setDescription('');
        setImageFile(null);
        setImagePreview('');
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Error creating incentive:', error);
      alert('Failed to create incentive');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteIncentive = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this incentive?')) return;

    try {
      const success = await deleteIncentive(id);
      if (success) {
        setIncentives(incentives.filter(i => i.id !== id));
      }
    } catch (error) {
      console.error('Error deleting incentive:', error);
      alert('Failed to delete incentive');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading incentives...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
            <Gift className="text-brand" size={32} />
            Incentives
          </h1>
          <p className="text-slate-500 mt-2">Motivate the team with exclusive rewards</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-6 py-3 bg-brand text-slate-900 rounded-xl font-bold hover:shadow-lg transition-all"
          >
            {isCreating ? 'Cancel' : '+ New Incentive'}
          </button>
        )}
      </div>

      {isCreating && isAdmin && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Create New Incentive</h2>
          <form onSubmit={handleCreateIncentive} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Top Performer Bonus"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the incentive details..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand resize-none"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Image
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-brand transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="h-32 object-cover rounded-lg" />
                  ) : (
                    <>
                      <Upload size={24} className="text-slate-400" />
                      <span className="text-sm font-bold text-slate-400">Click to upload image</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full px-6 py-3 bg-brand text-slate-900 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSaving ? 'Creating...' : 'Create Incentive'}
            </button>
          </form>
        </div>
      )}

      {/* Incentives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {incentives.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-400 font-bold">No incentives yet</p>
          </div>
        ) : (
          incentives.map((incentive) => (
            <div 
              key={incentive.id} 
              onClick={() => setExpandedIncentiveId(incentive.id)}
              className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-lg transition-all cursor-pointer hover:border-brand"
            >
              {/* Image */}
              <img
                src={incentive.imageUrl}
                alt={incentive.title}
                className="w-full h-48 object-cover"
              />

              {/* Content */}
              <div className="p-6 space-y-4">
                <h3 className="text-xl font-bold text-slate-900">{incentive.title}</h3>
                <p className="text-sm text-slate-600 line-clamp-3">{incentive.description}</p>
                <div className="text-xs text-brand font-bold">Click to read more →</div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    {new Date(incentive.createdAt).toLocaleDateString()}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteIncentive(incentive.id);
                      }}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Expanded View Modal */}
      {expandedIncentiveId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            {/* Header with close button */}
            <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-slate-900">
                {incentives.find(i => i.id === expandedIncentiveId)?.title}
              </h2>
              <button
                onClick={() => setExpandedIncentiveId(null)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={24} className="text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Full Image */}
              <img
                src={incentives.find(i => i.id === expandedIncentiveId)?.imageUrl}
                alt={incentives.find(i => i.id === expandedIncentiveId)?.title}
                className="w-full h-auto rounded-xl object-cover"
              />

              {/* Full Description */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">Description</h3>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {incentives.find(i => i.id === expandedIncentiveId)?.description}
                </p>
              </div>

              {/* Metadata */}
              <div className="pt-6 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  Created: {incentives.find(i => i.id === expandedIncentiveId)?.createdAt && new Date(incentives.find(i => i.id === expandedIncentiveId)?.createdAt!).toLocaleDateString()}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setExpandedIncentiveId(null)}
                className="w-full px-6 py-3 bg-slate-100 text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncentivesModule;
