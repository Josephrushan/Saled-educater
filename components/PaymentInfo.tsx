
import React, { useState } from 'react';
import { SalesRep } from '../types';
import { CreditCard, Landmark, User, FileCheck, Save, Sparkles, Camera, Upload, File } from 'lucide-react';
import { syncSalesRepToFirebase, uploadProfilePicture, uploadBankProof } from '../services/firebase';

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
    branchCode: currentUser.branchCode || '',
    accountHolderName: currentUser.accountHolderName || '',
    bankProofUrl: currentUser.bankProofUrl || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const downloadURL = await uploadProfilePicture(file, currentUser.id);
    if (downloadURL) {
      setFormData({ ...formData, profilePicUrl: downloadURL });
    } else {
      alert('Failed to upload profile picture');
    }
    setUploadingImage(false);
  };

  const handleBankProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProof(true);
    const downloadURL = await uploadBankProof(file, currentUser.id);
    if (downloadURL) {
      setFormData({ ...formData, bankProofUrl: downloadURL });
    } else {
      alert('Failed to upload bank proof');
    }
    setUploadingProof(false);
  };

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
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="text-white" size={24} />
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload Profile Picture</p>
              <p className="text-xs text-slate-500 mt-1">{uploadingImage ? 'Uploading...' : 'Click the image to upload'}</p>
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Branch Code</label>
                <input 
                  type="text" 
                  value={formData.branchCode}
                  onChange={e => setFormData({...formData, branchCode: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-bold text-slate-900" 
                  placeholder="e.g. 632005"
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
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Holder Name</label>
                <input 
                  type="text" 
                  value={formData.accountHolderName}
                  onChange={e => setFormData({...formData, accountHolderName: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-bold text-slate-900" 
                  placeholder="Full Name"
                  required
                />
              </div>
            </div>

            {/* Bank Proof Upload */}
            <div className="mt-6 pt-6 border-t border-slate-50">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-3">Proof of Bank Account</label>
              <div className="relative">
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleBankProofUpload}
                  disabled={uploadingProof}
                  className="hidden"
                  id="bank-proof-input"
                />
                <label 
                  htmlFor="bank-proof-input"
                  className="block w-full px-5 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-center cursor-pointer hover:border-brand hover:bg-brand/5 transition-all"
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Upload size={18} className={uploadingProof ? 'text-slate-400 animate-spin' : 'text-slate-400'} />
                    <span className="text-sm font-bold text-slate-900">
                      {uploadingProof ? 'Uploading...' : formData.bankProofUrl ? 'Change Document' : 'Upload Document'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">PDF, DOC, or Image (JPG, PNG)</p>
                </label>
                {formData.bankProofUrl && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                    <FileCheck size={14} />
                    <span>Document uploaded</span>
                  </div>
                )}
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
