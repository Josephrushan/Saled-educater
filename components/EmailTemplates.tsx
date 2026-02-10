
import React, { useState } from 'react';
import { Copy, Check, Search } from 'lucide-react';
import { EMAIL_TEMPLATES } from '../constants';

const EmailTemplates: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = EMAIL_TEMPLATES.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.track.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Email Drafts</h1>
        <p className="text-slate-500 font-medium mt-1">Copy and paste these templates into your email client.</p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((template, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black text-slate-900 bg-brand px-2.5 py-1 rounded-full uppercase tracking-widest mb-2 inline-block">
                  {template.track}
                </span>
                <h3 className="text-xl font-black text-slate-900">{template.title}</h3>
              </div>
              <button 
                onClick={() => handleCopy(`${template.subject}\n\n${template.content}`, `t-${idx}`)}
                className={`p-3 rounded-xl transition-all ${
                  copiedId === `t-${idx}` ? 'bg-brand text-slate-900' : 'bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {copiedId === `t-${idx}` ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Line</p>
                <p className="text-sm font-bold text-slate-700 mt-1">{template.subject}</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl text-sm text-slate-600 whitespace-pre-wrap font-medium leading-relaxed border border-slate-100">
                {template.content}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmailTemplates;
