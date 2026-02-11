
import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Shield, CheckCircle, Trash2, Loader2, X } from 'lucide-react';
import { SalesRep } from '../types';
import { getAllReps, syncSalesRepToFirebase, deleteSalesRep, uploadFileToStorage } from '../services/firebase';

const RepManagement: React.FC = () => {
  const [reps, setReps] = useState<SalesRep[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [newRep, setNewRep] = useState({
    name: '',
    surname: '',
    email: '',
    password: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const loadReps = async () => {
      const data = await getAllReps();
      setReps(data);
      setIsLoading(false);
    };
    loadReps();
  }, []);

  const handleAddRep = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let avatarUrl = newRep.name.charAt(0).toUpperCase() + (newRep.surname.charAt(0).toUpperCase() || '');

    if (selectedFile) {
      const url = await uploadFileToStorage(selectedFile, 'profile_pics/');
      if (url) {
        avatarUrl = url;
      }
    }

    const repData: SalesRep = {
      id: `rep_${Date.now()}`,
      name: newRep.name,
      surname: newRep.surname,
      email: newRep.email,
      password: newRep.password, // Store password
      avatar: avatarUrl,
      totalSchools: 0,
      activeCommissions: 0,
      role: 'rep'
    };

    const success = await syncSalesRepToFirebase(repData);
    if (success) {
      setReps([...reps, repData]);
      setNewRep({ name: '', surname: '', email: '', password: '' });
      setSelectedFile(null);
      setShowAddForm(false);
    }
    setIsSubmitting(false);
  };

  const handleDeleteRep = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this sales representative? This action cannot be undone.')) {
      setIsDeleting(id);
      const success = await deleteSalesRep(id);
      if (success) {
        setReps(reps.filter(r => r.id !== id));
      }
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">Sales Members</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Keagan Smith Control Center</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/10"
        >
          <UserPlus size={18} />
          Create New Rep
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-8 rounded-[2rem] border-2 border-brand shadow-xl shadow-brand/5 animate-in slide-in-from-top-4">
          <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight">New Sales Account</h3>
          <form onSubmit={handleAddRep} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
              <input 
                required
                type="text" 
                value={newRep.name}
                onChange={e => setNewRep({...newRep, name: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-bold text-slate-900" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Surname</label>
              <input 
                required
                type="text" 
                value={newRep.surname}
                onChange={e => setNewRep({...newRep, surname: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-bold text-slate-900" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
              <input 
                required
                type="email" 
                value={newRep.email}
                onChange={e => setNewRep({...newRep, email: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-bold text-slate-900" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <input 
                required
                type="text" 
                value={newRep.password}
                onChange={e => setNewRep({...newRep, password: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-bold text-slate-900" 
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profile Picture (Optional)</label>
              <div className="relative">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="hidden"
                  id="profile-upload"
                />
                <label 
                  htmlFor="profile-upload"
                  className="flex items-center gap-3 w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all border-dashed border-2"
                >
                  <div className="bg-brand/10 p-2 rounded-xl text-brand">
                    <Upload size={20} />
                  </div>
                  <span className="text-sm font-bold text-slate-600">
                    {selectedFile ? selectedFile.name : "Click to upload profile picture"}
                  </span>
                </label>
              </div>
            </div>
            <div className="md:col-span-3 flex gap-3">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-brand text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                Activate Rep Account
              </button>
              <button 
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-8 bg-slate-100 text-slate-400 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-brand" size={48} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reps.map(rep => (
            <div key={rep.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 hover:border-brand transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-xl text-slate-900 border-2 border-slate-100 group-hover:bg-brand/10 transition-colors overflow-hidden">
                {rep.profilePicUrl ? (
                  <img src={rep.profilePicUrl} alt={rep.name} className="w-full h-full object-cover" />
                ) : (
                  rep.avatar
                )}
              
              {rep.role !== 'admin' && (
                <button 
                  onClick={() => handleDeleteRep(rep.id)}
                  disabled={isDeleting === rep.id}
                  className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  title="Delete User"
                >
                  {isDeleting === rep.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                </button>
              )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-lg">{rep.name} {rep.surname}</h3>
                  {rep.role === 'admin' && <Shield size={14} className="text-brand" />}
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 mt-1">
                  <span className="flex items-center gap-1"><Mail size={12} /> {rep.email}</span>
                  <span className="text-[10px] bg-slate-50 px-2 py-0.5 rounded-lg uppercase tracking-widest">{rep.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RepManagement;
