
import React, { useState } from 'react';
import { X, School as SchoolIcon, Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { checkSchoolExists } from '../services/firebase';

interface AddSchoolModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const AddSchoolModal: React.FC<AddSchoolModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    principalName: '',
    principalEmail: '',
    studentCount: ''
  });
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<'idle' | 'available' | 'taken'>('idle');

  const handleCheck = async () => {
    if (!formData.name) return;
    setIsChecking(true);
    try {
      const exists = await checkSchoolExists(formData.name);
      setCheckResult(exists ? 'taken' : 'available');
    } catch (error) {
      console.error('Error checking school:', error);
      setCheckResult('available'); // Default to available if check fails
    }
    setIsChecking(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-black text-gray-800">Add School</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Acquisition Check</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <form className="p-8 space-y-6" onSubmit={(e) => {
          e.preventDefault();
          if (formData.name && checkResult === 'available') onSubmit(formData);
        }}>
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">School Name <span className="text-rose-500">*</span></label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <SchoolIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Westside Primary"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:outline-none focus:border-brand transition-all"
                    value={formData.name}
                    onChange={e => {
                      setFormData({...formData, name: e.target.value});
                      setCheckResult('idle');
                    }}
                  />
                </div>
                <button 
                  type="button"
                  onClick={handleCheck}
                  disabled={!formData.name || isChecking}
                  className="px-6 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black disabled:opacity-50 transition-all"
                >
                  {isChecking ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Check'}
                </button>
              </div>
              
              {checkResult === 'available' && (
                <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-brand uppercase animate-in fade-in slide-in-from-top-1">
                  <CheckCircle2 size={14} /> Available for acquisition
                </div>
              )}
              {checkResult === 'taken' && (
                <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-rose-500 uppercase animate-in fade-in slide-in-from-top-1">
                  <AlertCircle size={14} /> Already assigned to another rep
                </div>
              )}
            </div>

            {checkResult === 'available' && (
              <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Optional - Add details now or later</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Principal</label>
                    <input 
                      type="text"
                      placeholder="Name"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:outline-none focus:border-brand transition-all"
                      value={formData.principalName}
                      onChange={e => setFormData({...formData, principalName: e.target.value})}
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Students</label>
                    <input 
                      type="number"
                      placeholder="800"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:outline-none focus:border-brand transition-all"
                      value={formData.studentCount}
                      onChange={e => setFormData({...formData, studentCount: e.target.value})}
                    />
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Principal Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email"
                      placeholder="principal@school.co.za"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:outline-none focus:border-brand transition-all"
                      value={formData.principalEmail}
                      onChange={e => setFormData({...formData, principalEmail: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              disabled={checkResult !== 'available'}
              className="w-full bg-brand text-slate-900 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-brand/90 transition-all shadow-xl shadow-brand/10 flex items-center justify-center gap-2 disabled:opacity-20 disabled:grayscale"
            >
              Start Acquisition
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSchoolModal;
