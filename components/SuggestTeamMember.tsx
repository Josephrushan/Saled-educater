import React, { useState } from 'react';
import { Mail, Phone, User } from 'lucide-react';

interface SuggestTeamMemberProps {
  onSubmit: (formData: {
    firstName: string;
    surname: string;
    email: string;
    telephoneNumber: string;
  }) => Promise<void>;
}

const SuggestTeamMember: React.FC<SuggestTeamMemberProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    surname: '',
    email: '',
    telephoneNumber: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.surname.trim()) newErrors.surname = 'Surname is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.telephoneNumber.trim()) newErrors.telephoneNumber = 'Telephone number is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        firstName: '',
        surname: '',
        email: '',
        telephoneNumber: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* First Name */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            <User size={16} className="inline mr-1" />
            First Name
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="John"
            className={`w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
              errors.firstName ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-brand'
            }`}
          />
          {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>}
        </div>

        {/* Surname */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            <User size={16} className="inline mr-1" />
            Surname
          </label>
          <input
            type="text"
            value={formData.surname}
            onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
            placeholder="Doe"
            className={`w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
              errors.surname ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-brand'
            }`}
          />
          {errors.surname && <p className="text-red-600 text-xs mt-1">{errors.surname}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            <Mail size={16} className="inline mr-1" />
            Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@example.com"
            className={`w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
              errors.email ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-brand'
            }`}
          />
          {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
        </div>

        {/* Telephone */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            <Phone size={16} className="inline mr-1" />
            Telephone Number
          </label>
          <input
            type="tel"
            value={formData.telephoneNumber}
            onChange={(e) => setFormData({ ...formData, telephoneNumber: e.target.value })}
            placeholder="27 123 456 7890"
            className={`w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
              errors.telephoneNumber ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-brand'
            }`}
          />
          {errors.telephoneNumber && (
            <p className="text-red-600 text-xs mt-1">{errors.telephoneNumber}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-brand text-slate-900 py-3 rounded-lg font-bold text-base hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
        </button>
      </form>
    </div>
  );
};

export default SuggestTeamMember;
