
import React, { useState, useEffect } from 'react';
import { Download, FileText, ExternalLink, BookOpen, Trash2, Plus, Loader2, Link, Upload } from 'lucide-react';
import { SalesRep, Resource } from '../types';
import { getResources, addResource, deleteResource, uploadFileToStorage } from '../services/firebase';

interface ResourcesProps {
  type: 'tools' | 'training';
  currentUser: SalesRep | null;
}

const Resources: React.FC<ResourcesProps> = ({ type, currentUser }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newResource, setNewResource] = useState({ name: '', url: '', type: 'PDF' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const title = type === 'tools' ? 'Sales Artillery' : 'Training Academy';
  const subtitle = type === 'tools' 
    ? 'Brochures, flyers, and forms to close the deal.' 
    : 'Guides and manuals to master the Educater sales process.';

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    loadResources();
  }, [type]);

  const loadResources = async () => {
    setIsLoading(true);
    const data = await getResources(type);
    setResources(data);
    setIsLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let resourceUrl = newResource.url;

    if (selectedFile) {
      const uploadedUrl = await uploadFileToStorage(selectedFile, 'resources/');
      if (uploadedUrl) {
        resourceUrl = uploadedUrl;
      }
    }

    const resourceData: Omit<Resource, 'id'> = {
      name: newResource.name,
      url: resourceUrl,
      type: newResource.type,
      category: type,
      createdAt: new Date().toISOString()
    };
    
    const id = await addResource(resourceData);
    if (id) {
      setResources([...resources, { ...resourceData, id }]);
      setShowAddModal(false);
      setNewResource({ name: '', url: '', type: 'PDF' });
      setSelectedFile(null);
    }
    setIsSubmitting(false);
  };

  const handleDownload = async (url: string, fileName: string) => {
    try {
      // Fetch the file with CORS and credentials handling
      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback - try direct link with alt=media parameter
      let downloadUrl = url;
      if (url.includes('firebasestorage')) {
        downloadUrl = url.includes('?') ? url + '&alt=media' : url + '?alt=media';
      }
      window.location.href = downloadUrl;
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      setIsDeleting(id);
      const success = await deleteResource(id, type);
      if (success) {
        setResources(resources.filter(r => r.id !== id));
      }
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{title}</h1>
          <p className="text-slate-500 font-medium mt-1">{subtitle}</p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/10"
          >
            <Plus size={18} />
            Add Resource
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-brand" size={48} />
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-slate-50 rounded-[2rem] p-12 text-center">
          <p className="text-slate-400 font-bold">No resources available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-brand/5 transition-all group relative">
              {isAdmin && (
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                >
                  {isDeleting === item.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
              )}
              
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                {type === 'tools' ? <FileText size={24} /> : <BookOpen size={24} />}
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight pr-8">{item.name}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{item.type}</p>
              
              {item.type === 'Link' ? (
                <a 
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-8 w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand hover:text-slate-900 transition-all shadow-lg shadow-slate-900/10"
                >
                  <ExternalLink size={16} />
                  Open Link
                </a>
              ) : (
                <button
                  onClick={() => handleDownload(item.url, item.name)}
                  className="mt-8 w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand hover:text-slate-900 transition-all shadow-lg shadow-slate-900/10"
                >
                  <Download size={16} />
                  Download Asset
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[2rem] max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-900 mb-6">Add New Resource</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Title</label>
                <input 
                  required
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-brand"
                  value={newResource.name}
                  onChange={e => setNewResource({...newResource, name: e.target.value})}
                  placeholder="e.g. Sales Brochure 2026"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Type</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-brand"
                  value={newResource.type}
                  onChange={e => setNewResource({...newResource, type: e.target.value})}
                >
                  <option value="PDF">PDF Document</option>
                  <option value="Link">External Link</option>
                  <option value="Doc">Word Doc</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {newResource.type === 'Link' ? 'External URL' : 'Upload File'}
                </label>
                
                {newResource.type === 'Link' ? (
                  <input 
                    required
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-brand"
                    value={newResource.url}
                    onChange={e => setNewResource({...newResource, url: e.target.value})}
                    placeholder="https://..."
                  />
                ) : (
                  <div className="relative">
                    <input 
                      type="file" 
                      onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                      className="hidden"
                      id="resource-upload"
                    />
                    <label 
                      htmlFor="resource-upload"
                      className="flex items-center gap-3 w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all border-dashed border-2"
                    >
                      <div className="bg-brand/10 p-2 rounded-xl text-brand">
                        <Upload size={20} />
                      </div>
                      <span className="text-sm font-bold text-slate-600 truncate">
                        {selectedFile ? selectedFile.name : "Click to upload file"}
                      </span>
                    </label>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-8 pt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-brand text-slate-900 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-brand/90 transition-all"
                >
                  {isSubmitting ? 'Saving...' : 'Add Resource'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-6 bg-slate-100 text-slate-400 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
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

export default Resources;
