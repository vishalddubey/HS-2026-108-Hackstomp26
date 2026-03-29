'use client';
import { useState } from 'react';
import AppLayout from '@/components/shared/AppLayout';
import { AuthProvider } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import api from '@/lib/api';
import offlineDB from '@/lib/offlineDB';
import { useRouter } from 'next/navigation';
import { ChevronLeft, User, CheckCircle } from 'lucide-react';
import Link from 'next/link';

function PatientForm() {
  const isOnline = useOnlineStatus();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: '', age: '', gender: '', village: '', phone: '',
    medicalHistory: '', allergies: '', bloodGroup: 'unknown'
  });

  const set = (field: string, val: string) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, age: Number(form.age) };
      if (isOnline) {
        await api.post('/patients', data);
      } else {
        await offlineDB.savePatient(data as any);
      }
      setSuccess(true);
      setTimeout(() => router.push('/patients'), 1800);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save patient');
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-10 space-y-4 animate-fade-in-scale">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="text-green-600" size={40} />
        </div>
        <h2 className="text-xl font-bold text-green-800 font-display">Patient Registered!</h2>
        <p className="text-gray-500 text-sm text-center">
          {isOnline ? 'Record saved to database.' : 'Saved offline. Will sync when connected.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <Link href="/patients" className="text-white/80 hover:text-white">
          <ChevronLeft size={24} />
        </Link>
        <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
          <User size={18} className="text-white" />
        </div>
        <h1 className="text-lg font-bold font-display">Register Patient</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-8">
        {!isOnline && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-700 flex items-center gap-2">
            📴 Offline mode — record will sync automatically when internet returns
          </div>
        )}

        <div className="card space-y-4">
          <h3 className="font-bold text-gray-800 font-display">Basic Information</h3>

          <div>
            <label className="label">Full Name *</label>
            <input className="input-field" placeholder="Patient's full name" value={form.name}
              onChange={e => set('name', e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Age *</label>
              <input type="number" className="input-field" placeholder="Years" min="0" max="150"
                value={form.age} onChange={e => set('age', e.target.value)} required />
            </div>
            <div>
              <label className="label">Gender *</label>
              <div className="flex gap-2 pt-1">
                {['male', 'female', 'other'].map(g => (
                  <button key={g} type="button"
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${form.gender === g ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                    onClick={() => set('gender', g)}>
                    {g === 'male' ? '♂ M' : g === 'female' ? '♀ F' : '⊕ O'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="label">Village / Area *</label>
            <input className="input-field" placeholder="Village name" value={form.village}
              onChange={e => set('village', e.target.value)} required />
          </div>

          <div>
            <label className="label">Phone Number</label>
            <input type="tel" className="input-field" placeholder="10-digit mobile number" value={form.phone}
              onChange={e => set('phone', e.target.value)} />
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="font-bold text-gray-800 font-display">Medical Details</h3>

          <div>
            <label className="label">Blood Group</label>
            <select className="input-field" value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)}>
              {['unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                <option key={bg} value={bg}>{bg === 'unknown' ? 'Unknown' : bg}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Medical History</label>
            <textarea className="input-field" rows={3} placeholder="Known conditions, past illnesses..."
              value={form.medicalHistory} onChange={e => set('medicalHistory', e.target.value)} />
          </div>

          <div>
            <label className="label">Allergies</label>
            <textarea className="input-field" rows={2} placeholder="Known allergies to medicines, food..."
              value={form.allergies} onChange={e => set('allergies', e.target.value)} />
          </div>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={saving || !form.gender}>
          {saving ? '⏳ Saving...' : '✅ Register Patient'}
        </button>
      </form>
    </div>
  );
}

export default function RegisterPatientPage() {
  return (
    <AuthProvider>
      <AppLayout>
        <PatientForm />
      </AppLayout>
    </AuthProvider>
  );
}
