
import React, { useState } from 'react';
import { SalesRep } from '../types';
import { CreditCard, Landmark, User, FileCheck, Save, Sparkles, Camera } from 'lucide-react';
import { syncSalesRepToFirebase } from '../services/firebase';

interface PaymentInfoProps {
  currentUser: SalesRep;
  onUpdate: (updated: SalesRep) => void;
}

const PaymentInfo: React.FC<PaymentInfoProps> = ({ currentUser, onUpdate }) => {
  const [formData, setFormData] = useState<Partial<SalesRep>>({
    name: currentUser.name || '',
    surname: currentUser.surname || '',
    profilePicUrl: currentUser.profilePicUrl || '',
    idNumber: currentUser.idNumber || '',
    bankName: currentUser.bankName || '',
    accountNumber: currentUser.accountNumber || '',
    accountType: currentUser.accountType || 'Savings',
    branchCode: currentUser.branchCode || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const updatedUser = { ...currentUser, ...formData };
    await syncSalesRepToFirebase(updatedUser as SalesRep);
    
    onUpdate(updatedUser as SalesRep);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-6 duration-700 max-w-2xl pb-10">
      <div>
        <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">Profile & Payments</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Manage your identity and commission settings.</p>
      </div>

      <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative group">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-slate-50 overflow-hidden shadow-inner bg-slate-100 flex items-center justify-center">
                {formData.profilePicUrl ? (
                  <img src={formData.profilePicUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-slate-300" />
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={24} />
              </div>
            </div>
            <div className="w-full space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Profile Picture URL</label>
              <input 
                type="text" 
                value={formData.profilePicUrl}
                onChange={e => setFormData({...formData, profilePicUrl: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all text-xs font-bold text-slate-900" 
                placeholder="Paste image URL here..." 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-bold text-slate-900" 
                placeholder="First Name" 
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Surname</label>
              <input 
                type="text" 
                value={formData.surname}
                onChange={e => setFormData({...formData, surname: e.target.value})}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-bold text-slate-900" 
                placeholder="Surname" 
                required
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-50">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Landmark size={16} className="text-brand" />
              Banking Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bank Name</label>
                <input 
                  type="text" 
                  value={formData.bankName}
                  onChange={e => setFormData({...formData, bankName: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-bold text-slate-900" 
                  placeholder="e.g. FNB, Capitec..."
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Number</label>
                <input 
                  type="text" 
                  value={formData.accountNumber}
                  onChange={e => setFormData({...formData, accountNumber: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-bold text-slate-900" 
                  placeholder="123456789"
                  required
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSaving}
            className={`w-full py-5 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl ${
              saveSuccess 
              ? 'bg-brand text-slate-900 shadow-brand/20' 
              : 'bg-slate-900 text-white hover:bg-black shadow-slate-900/10'
            }`}
          >
            {isSaving ? <Sparkles className="animate-spin" /> : saveSuccess ? <FileCheck size={18} /> : <Save size={18} />}
            {isSaving ? 'Updating...' : saveSuccess ? 'Profile Synced' : 'Sync Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentInfo;
