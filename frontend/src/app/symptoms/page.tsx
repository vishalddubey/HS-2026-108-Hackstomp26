'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/shared/AppLayout';
import { AuthProvider } from '@/hooks/useAuth';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Activity, Search } from 'lucide-react';
import Link from 'next/link';

interface Symptom { id: string; label: string; icon: string; category: string; description: string; }
interface SelectedSymptom { name: string; severity: 'mild' | 'moderate' | 'severe'; }

const STEPS = ['Patient', 'Symptoms', 'Details', 'Review'];

function SymptomChecker() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<SelectedSymptom[]>([]);
  const [duration, setDuration] = useState('');
  const [temperature, setTemperature] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    api.get('/symptoms/list').then(res => setSymptoms(res.data.symptoms)).catch(console.error);
  }, []);

  useEffect(() => {
    if (patientSearch.length < 2) { setPatients([]); return; }
    const t = setTimeout(() => {
      api.get(`/patients?search=${patientSearch}&limit=10`)
        .then(res => setPatients(res.data.patients))
        .catch(console.error);
    }, 400);
    return () => clearTimeout(t);
  }, [patientSearch]);

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms(prev => {
      const exists = prev.find(s => s.name === symptomId);
      if (exists) return prev.filter(s => s.name !== symptomId);
      return [...prev, { name: symptomId, severity: 'mild' }];
    });
  };

  const setSeverity = (symptomId: string, severity: 'mild' | 'moderate' | 'severe') => {
    setSelectedSymptoms(prev => prev.map(s => s.name === symptomId ? { ...s, severity } : s));
  };

  const isSelected = (id: string) => selectedSymptoms.some(s => s.name === id);

  const categories = ['all', ...Array.from(new Set(symptoms.map(s => s.category)))];
  const filteredSymptoms = categoryFilter === 'all' ? symptoms : symptoms.filter(s => s.category === categoryFilter);

  const handleSubmit = async () => {
    if (!selectedPatient || selectedSymptoms.length === 0) return;
    setSubmitting(true);
    try {
      const res = await api.post('/triage/analyze', {
        patientId: selectedPatient._id,
        symptoms: selectedSymptoms,
        durationOfIllness: duration,
        temperature: temperature ? parseFloat(temperature) : undefined,
        symptomNotes: notes
      });
      router.push(`/diagnosis/${res.data.consultation._id}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Analysis failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        {step > 0 ? (
          <button onClick={() => setStep(s => s - 1)} className="text-white/80 hover:text-white">
            <ChevronLeft size={24} />
          </button>
        ) : (
          <Link href="/dashboard" className="text-white/80 hover:text-white"><ChevronLeft size={24} /></Link>
        )}
        <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
          <Activity size={18} className="text-white" />
        </div>
        <h1 className="text-lg font-bold font-display flex-1">Symptom Checker</h1>
      </div>

      {/* Progress Steps */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex flex-col items-center gap-1`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i === step ? 'bg-green-600 text-white' : i < step ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-500'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs ${i === step ? 'text-green-700 font-semibold' : 'text-gray-400'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-12 mx-1 mt-[-12px] ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4">
        {/* Step 0: Select Patient */}
        {step === 0 && (
          <div className="space-y-4 animate-fade-in-scale">
            <div className="card">
              <h2 className="font-bold text-gray-800 mb-3 font-display">Select Patient</h2>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input className="input-field pl-9 text-sm" placeholder="Search patient by name..."
                  value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
              </div>
              {patients.map(p => (
                <div key={p._id} onClick={() => { setSelectedPatient(p); setPatients([]); setPatientSearch(p.name); }}
                  className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all mb-2 ${selectedPatient?._id === p._id ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center text-lg">
                    {p.gender === 'female' ? '👩' : '👨'}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.age}y • {p.village}</p>
                  </div>
                </div>
              ))}
              {selectedPatient && (
                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-3 mt-2">
                  <p className="text-xs text-green-600 font-semibold mb-1">✅ Selected Patient</p>
                  <p className="font-bold text-green-800">{selectedPatient.name}</p>
                  <p className="text-xs text-green-600">{selectedPatient.age}y • {selectedPatient.gender} • {selectedPatient.village}</p>
                  {selectedPatient.allergies && <p className="text-xs text-orange-600 mt-1">⚠️ Allergies: {selectedPatient.allergies}</p>}
                </div>
              )}
            </div>

            <Link href="/patients/new">
              <button className="btn-secondary w-full text-sm">+ Register New Patient First</button>
            </Link>

            <button className="btn-primary w-full" disabled={!selectedPatient} onClick={() => setStep(1)}>
              Continue <ChevronRight size={18} className="ml-1" />
            </button>
          </div>
        )}

        {/* Step 1: Select Symptoms */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in-scale">
            <div className="card">
              <h2 className="font-bold text-gray-800 mb-1 font-display">Select Symptoms</h2>
              <p className="text-xs text-gray-500 mb-3">Tap all symptoms the patient is experiencing</p>

              {/* Category filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all capitalize ${categoryFilter === cat ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* Emergency warning symptoms */}
              {selectedSymptoms.some(s => ['loss_of_consciousness', 'seizure', 'chest_pain', 'bleeding'].includes(s.name)) && (
                <div className="bg-red-50 border border-red-300 rounded-2xl p-3 mb-3">
                  <p className="text-red-700 font-bold text-sm">🚨 EMERGENCY SYMPTOMS DETECTED</p>
                  <p className="text-red-600 text-xs">Call 108 ambulance immediately</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                {filteredSymptoms.map(s => (
                  <button key={s.id} onClick={() => toggleSymptom(s.id)}
                    className={isSelected(s.id) ? 'symptom-chip-selected' : 'symptom-chip-default'}>
                    <span className="text-2xl">{s.icon}</span>
                    <span className="text-xs text-center leading-tight font-medium">{s.label}</span>
                    {isSelected(s.id) && <span className="text-green-600 text-xs">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {selectedSymptoms.length > 0 && (
              <div className="card">
                <p className="text-xs font-semibold text-gray-600 mb-2">{selectedSymptoms.length} symptoms selected — Set severity:</p>
                <div className="space-y-2">
                  {selectedSymptoms.map(s => {
                    const sym = symptoms.find(x => x.id === s.name);
                    return (
                      <div key={s.name} className="flex items-center gap-2">
                        <span className="text-lg">{sym?.icon}</span>
                        <span className="text-xs flex-1 font-medium text-gray-700">{sym?.label}</span>
                        <div className="flex gap-1">
                          {(['mild', 'moderate', 'severe'] as const).map(sev => (
                            <button key={sev} onClick={() => setSeverity(s.name, sev)}
                              className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${s.severity === sev
                                ? sev === 'mild' ? 'bg-green-500 text-white' : sev === 'moderate' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                                : 'bg-gray-100 text-gray-500'}`}>
                              {sev}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button className="btn-primary w-full" disabled={selectedSymptoms.length === 0} onClick={() => setStep(2)}>
              Next: Add Details <ChevronRight size={18} className="ml-1" />
            </button>
          </div>
        )}

        {/* Step 2: Additional Details */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in-scale">
            <div className="card space-y-4">
              <h2 className="font-bold text-gray-800 font-display">Additional Details</h2>

              <div>
                <label className="label">Duration of Illness</label>
                <div className="grid grid-cols-4 gap-2">
                  {['1 day', '2-3 days', '4-7 days', '> 1 week'].map(d => (
                    <button key={d} onClick={() => setDuration(d)}
                      className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${duration === d ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Temperature (°C) — optional</label>
                <input type="number" className="input-field" placeholder="e.g. 38.5" step="0.1" min="35" max="42"
                  value={temperature} onChange={e => setTemperature(e.target.value)} />
              </div>

              <div>
                <label className="label">Additional Notes</label>
                <textarea className="input-field" rows={3} placeholder="Any other observations or notes..."
                  value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>

            <button className="btn-primary w-full" onClick={() => setStep(3)}>
              Review & Analyze <ChevronRight size={18} className="ml-1" />
            </button>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in-scale">
            <div className="card">
              <h2 className="font-bold text-gray-800 mb-3 font-display">Review & Confirm</h2>

              <div className="space-y-3">
                <ReviewRow label="Patient" value={`${selectedPatient?.name} (${selectedPatient?.age}y)`} />
                <ReviewRow label="Symptoms" value={`${selectedSymptoms.length} selected`} />
                <ReviewRow label="Duration" value={duration || 'Not specified'} />
                {temperature && <ReviewRow label="Temperature" value={`${temperature}°C`} />}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-2">Selected Symptoms:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSymptoms.map(s => {
                    const sym = symptoms.find(x => x.id === s.name);
                    return (
                      <span key={s.name} className={`text-xs px-2 py-1 rounded-lg font-medium ${s.severity === 'severe' ? 'bg-red-100 text-red-700' : s.severity === 'moderate' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {sym?.icon} {sym?.label} ({s.severity})
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <button className="btn-primary w-full text-base" onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Analyzing with AI...
                </span>
              ) : '🤖 Run AI Triage Analysis'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-sm font-semibold text-gray-800">{value}</span>
    </div>
  );
}

export default function SymptomsPage() {
  return (
    <AuthProvider>
      <AppLayout>
        <SymptomChecker />
      </AppLayout>
    </AuthProvider>
  );
}
