
import React, { useState, useEffect } from 'react';
import { Copy, Check, Search, Edit2, Trash2, Plus, X } from 'lucide-react';
import { getEmailTemplates, addEmailTemplate, updateEmailTemplate, deleteEmailTemplate } from '../services/firebase';

interface EmailTemplate {
  id?: string;
  track: string;
  title: string;
  subject: string;
  content: string;
}

const EmailTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [formData, setFormData] = useState<EmailTemplate>({
    track: '',
    title: '',
    subject: '',
    content: ''
  });
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const loaded = await getEmailTemplates();
    setTemplates(loaded);
    setLoading(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingId(template.id || '');
    setFormData(template);
    setShowNewForm(false);
  };

  const handleNewTemplate = () => {
    setShowNewForm(true);
    setEditingId(null);
    setFormData({
      track: '',
      title: '',
      subject: '',
      content: ''
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowNewForm(false);
    setFormData({
      track: '',
      title: '',
      subject: '',
      content: ''
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.track || !formData.title || !formData.subject || !formData.content) {
        setSaveMessage({ type: 'error', text: 'All fields are required' });
        setTimeout(() => setSaveMessage(null), 3000);
        return;
      }

      if (editingId) {
        const success = await updateEmailTemplate(editingId, {
          track: formData.track,
          title: formData.title,
          subject: formData.subject,
          content: formData.content
        });
        if (success) {
          setSaveMessage({ type: 'success', text: 'Template updated successfully' });
          await loadTemplates();
          handleCancel();
        } else {
          setSaveMessage({ type: 'error', text: 'Failed to update template' });
        }
      } else {
        const id = await addEmailTemplate(formData as EmailTemplate);
        if (id) {
          setSaveMessage({ type: 'success', text: 'Template created successfully' });
          await loadTemplates();
          handleCancel();
        } else {
          setSaveMessage({ type: 'error', text: 'Failed to create template' });
        }
      }
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving template:', error);
      setSaveMessage({ type: 'error', text: 'Error saving template' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        const success = await deleteEmailTemplate(templateId);
        if (success) {
          setSaveMessage({ type: 'success', text: 'Template deleted successfully' });
          await loadTemplates();
        } else {
          setSaveMessage({ type: 'error', text: 'Failed to delete template' });
        }
        setTimeout(() => setSaveMessage(null), 3000);
      } catch (error) {
        console.error('Error deleting template:', error);
        setSaveMessage({ type: 'error', text: 'Error deleting template' });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    }
  };

  const filtered = templates.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.track.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Email Drafts</h1>
          <p className="text-slate-500 font-medium mt-1">Create, edit, and manage email templates.</p>
        </div>
        <button
          onClick={handleNewTemplate}
          className="flex items-center gap-2 bg-brand hover:bg-emerald-400 text-slate-900 px-4 py-2 rounded-xl font-bold text-sm uppercase tracking-widest transition-all"
        >
          <Plus size={18} />
          New Template
        </button>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-xl font-medium text-sm ${
          saveMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
            : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {saveMessage.text}
        </div>
      )}

      {showNewForm || editingId ? (
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-black text-slate-900">{editingId ? 'Edit Template' : 'New Template'}</h2>
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-slate-100 rounded-lg transition-all"
            >
              <X size={20} className="text-slate-600" />
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Track / Category</label>
            <input
              type="text"
              placeholder="e.g., Acquisition, Follow-up"
              value={formData.track}
              onChange={(e) => setFormData({ ...formData, track: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
            <input
              type="text"
              placeholder="e.g., Initial Outreach"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Subject Line</label>
            <input
              type="text"
              placeholder="Email subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Content</label>
            <textarea
              placeholder="Email body. Use [School Name], [Principal Name], etc. for placeholders"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand text-sm font-mono"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-brand hover:bg-emerald-400 text-slate-900 px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-widest transition-all"
            >
              Save Template
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-widest transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
        <input 
          type="text" 
          placeholder="Filter templates..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand transition-all text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-slate-500 font-medium">Loading templates...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-500 font-medium">
            {templates.length === 0 ? 'No templates yet. Create your first one!' : 'No templates match your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((template) => (
            <div key={template.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <span className="text-[10px] font-black text-slate-900 bg-brand px-2.5 py-1 rounded-full uppercase tracking-widest mb-2 inline-block">
                    {template.track}
                  </span>
                  <h3 className="text-xl font-black text-slate-900">{template.title}</h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleCopy(`${template.subject}\n\n${template.content}`, template.id || '')}
                    className={`p-3 rounded-xl transition-all ${
                      copiedId === template.id ? 'bg-brand text-slate-900' : 'bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {copiedId === template.id ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id || '')}
                    className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Line</p>
                  <p className="text-sm font-bold text-slate-700 mt-1">{template.subject}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl text-sm text-slate-600 whitespace-pre-wrap font-medium leading-relaxed border border-slate-100 max-h-48 overflow-y-auto">
                  {template.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmailTemplates;
