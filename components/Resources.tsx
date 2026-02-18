
import React, { useState, useEffect } from 'react';
import { Download, FileText, ExternalLink, BookOpen, Trash2, Plus, Loader2, Link, Upload, FolderPlus, AlertCircle } from 'lucide-react';
import { SalesRep, Resource, ResourceCategory } from '../types';
import { getResources, addResource, deleteResource, uploadFileToStorage, getResourceCategories, addResourceCategory, updateResourceCategory, deleteResourceCategory, checkDisplayOrderExists, getNextDisplayOrder } from '../services/firebase';

interface ResourcesProps {
  type: 'tools' | 'training';
  currentUser: SalesRep | null;
}

const Resources: React.FC<ResourcesProps> = ({ type, currentUser }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState<string | null>(null);
  const [newResource, setNewResource] = useState({ name: '', url: '', type: 'PDF', categoryId: '' });
  const [newCategory, setNewCategory] = useState({ name: '', displayOrder: 1 });
  const [nextDisplayOrder, setNextDisplayOrder] = useState(1);

  const title = type === 'tools' ? 'Sales Artillery' : 'Training Academy';
  const subtitle = type === 'tools' 
    ? 'Brochures, flyers, and forms to close the deal.' 
    : 'Guides and manuals to master the Educater sales process.';

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    loadData();
  }, [type]);

  const loadData = async () => {
    setIsLoading(true);
    const [resourcesData, categoriesData] = await Promise.all([
      getResources(type),
      getResourceCategories(type)
    ]);
    setResources(resourcesData);
    setCategories(categoriesData);
    
    const nextOrder = await getNextDisplayOrder(type);
    setNextDisplayOrder(nextOrder);
    setNewCategory({ name: '', displayOrder: nextOrder });
    setIsLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let resourceUrl = newResource.url;
    let coverImageUrl = '';

    if (selectedFile) {
      const uploadedUrl = await uploadFileToStorage(selectedFile, 'resources/');
      if (uploadedUrl) {
        resourceUrl = uploadedUrl;
      }
    }

    if (coverImage) {
      const uploadedCover = await uploadFileToStorage(coverImage, 'resources/covers/');
      if (uploadedCover) {
        coverImageUrl = uploadedCover;
      }
    }

    const resourceData: Omit<Resource, 'id'> = {
      name: newResource.name,
      url: resourceUrl,
      type: newResource.type,
      category: type,
      categoryId: newResource.categoryId || undefined,
      coverImage: coverImageUrl || undefined,
      createdAt: new Date().toISOString()
    };
    
    const id = await addResource(resourceData);
    if (id) {
      setResources([...resources, { ...resourceData, id }]);
      setShowAddModal(false);
      setNewResource({ name: '', url: '', type: 'PDF', categoryId: '' });
      setSelectedFile(null);
      setCoverImage(null);
    }
    setIsSubmitting(false);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError('');
    setIsSubmitting(true);

    try {
      const categoryData: Omit<ResourceCategory, 'id'> = {
        name: newCategory.name,
        displayOrder: newCategory.displayOrder,
        category: type,
        createdAt: new Date().toISOString()
      };
      
      const id = await addResourceCategory(categoryData);
      if (id) {
        setCategories([...categories, { ...categoryData, id }].sort((a, b) => a.displayOrder - b.displayOrder));
        setShowCategoryModal(false);
        
        const nextOrder = await getNextDisplayOrder(type);
        setNextDisplayOrder(nextOrder);
        setNewCategory({ name: '', displayOrder: nextOrder });
        setCategoryError('');
      }
    } catch (error: any) {
      setCategoryError(error.message || 'Error adding category');
    }
    setIsSubmitting(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Are you sure? This will not delete the resources in this category.')) {
      setIsDeletingCategory(id);
      const success = await deleteResourceCategory(id);
      if (success) {
        setCategories(categories.filter(c => c.id !== id));
      }
      setIsDeletingCategory(null);
    }
  };

  const handleDownload = (url: string, fileName: string) => {
    let downloadUrl = url;
    if (url.includes('firebasestorage')) {
      downloadUrl = url.includes('?') ? url + '&alt=media' : url + '?alt=media';
    }
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName || 'download';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const getResourcesByCategory = (categoryId?: string) => {
    return resources.filter(r => r.categoryId === categoryId);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{title}</h1>
          <p className="text-slate-500 font-medium mt-1">{subtitle}</p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-3">
            <button 
              onClick={() => {
                setCategoryError('');
                setShowCategoryModal(true);
              }}
              className="flex items-center gap-2 bg-slate-600 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all shadow-xl shadow-slate-600/10"
            >
              <FolderPlus size={18} />
              Add Category
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/10"
            >
              <Plus size={18} />
              Add Resource
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-brand" size={48} />
        </div>
      ) : (
        <div className="space-y-12">
          {/* Categorized Resources */}
          {categories.length > 0 && categories.map((cat) => {
            const catResources = getResourcesByCategory(cat.id);
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-slate-900">{cat.name}</h2>
                  {isAdmin && (
                    <button 
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                    >
                      {isDeletingCategory === cat.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  )}
                </div>
                
                {catResources.length === 0 ? (
                  <p className="text-slate-400 font-medium">No resources yet</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {catResources.map((item) => (
                      <ResourceCard 
                        key={item.id} 
                        item={item} 
                        type={type}
                        isAdmin={isAdmin}
                        onDelete={handleDelete}
                        onDownload={handleDownload}
                        isDeleting={isDeleting === item.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Uncategorized Resources */}
          {getResourcesByCategory(undefined).length > 0 && (
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-6">Other Resources</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getResourcesByCategory(undefined).map((item) => (
                  <ResourceCard 
                    key={item.id} 
                    item={item} 
                    type={type}
                    isAdmin={isAdmin}
                    onDelete={handleDelete}
                    onDownload={handleDownload}
                    isDeleting={isDeleting === item.id}
                  />
                ))}
              </div>
            </div>
          )}

          {resources.length === 0 && (
            <div className="bg-slate-50 rounded-[2rem] p-12 text-center">
              <p className="text-slate-400 font-bold">No resources available yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[2rem] max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
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

              {categories.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Category (Optional)</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-brand"
                    value={newResource.categoryId}
                    onChange={e => setNewResource({...newResource, categoryId: e.target.value})}
                  >
                    <option value="">-- No Category --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

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
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cover Image (Optional)</label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => setCoverImage(e.target.files ? e.target.files[0] : null)}
                    className="hidden"
                    id="cover-upload"
                  />
                  <label 
                    htmlFor="cover-upload"
                    className="flex items-center gap-3 w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all border-dashed border-2"
                  >
                    <div className="bg-brand/10 p-2 rounded-xl text-brand">
                      <Upload size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-600 truncate">
                      {coverImage ? coverImage.name : "Click to upload cover image"}
                    </span>
                  </label>
                </div>
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
                  className="flex-1 bg-brand text-slate-900 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-brand/90 transition-all disabled:opacity-50"
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

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[2rem] max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-900 mb-6">Add New Category</h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Category Name</label>
                <input 
                  required
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-brand"
                  value={newCategory.name}
                  onChange={e => setNewCategory({...newCategory, name: e.target.value})}
                  placeholder="e.g. Beginners, Advanced, etc."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Display Order (Position)</label>
                <p className="text-xs text-slate-400">Lower numbers appear first. Must be unique.</p>
                <input 
                  required
                  type="number"
                  min="1"
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-brand"
                  value={newCategory.displayOrder}
                  onChange={e => setNewCategory({...newCategory, displayOrder: parseInt(e.target.value) || 1})}
                  placeholder="1"
                />
              </div>

              {categoryError && (
                <div className="flex gap-3 p-4 bg-rose-50 rounded-xl border border-rose-200">
                  <AlertCircle size={20} className="text-rose-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-rose-700">{categoryError}</p>
                </div>
              )}

              <p className="text-xs text-slate-400">Next suggested number: {nextDisplayOrder}</p>
              
              <div className="flex gap-3 mt-8 pt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-brand text-slate-900 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-brand/90 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Category'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCategoryModal(false);
                    setCategoryError('');
                  }}
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

interface ResourceCardProps {
  item: Resource;
  type: 'tools' | 'training';
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onDownload: (url: string, name: string) => void;
  isDeleting: boolean;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ item, type, isAdmin, onDelete, onDownload, isDeleting }) => {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-brand/5 transition-all group relative overflow-hidden flex flex-col h-full">
      {item.coverImage && (
        <div className="w-full h-40 bg-gradient-to-br from-brand/20 to-brand/5 overflow-hidden">
          <img 
            src={item.coverImage} 
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <div className="p-6 flex flex-col flex-grow">
        {isAdmin && (
          <button 
            onClick={() => onDelete(item.id)}
            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
          >
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          </button>
        )}
        
        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand/10 group-hover:text-brand transition-colors flex-shrink-0">
          {type === 'tools' ? <FileText size={24} /> : <BookOpen size={24} />}
        </div>
        <h3 className="text-lg font-black text-slate-900 tracking-tight pr-8">{item.name}</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{item.type}</p>
        
        <div className="mt-auto pt-6">
          {item.type === 'Link' ? (
            <a 
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand hover:text-slate-900 transition-all shadow-lg shadow-slate-900/10"
            >
              <ExternalLink size={16} />
              Open Link
            </a>
          ) : (
            <button
              onClick={() => onDownload(item.url, item.name)}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand hover:text-slate-900 transition-all shadow-lg shadow-slate-900/10"
            >
              <Download size={16} />
              Download Asset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Resources;
