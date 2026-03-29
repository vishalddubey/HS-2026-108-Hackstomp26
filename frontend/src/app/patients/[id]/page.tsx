'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/shared/AppLayout';
import { AuthProvider } from '@/hooks/useAuth';
import api from '@/lib/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Activity, AlertTriangle } from 'lucide-react';

function PatientDetail() {
  const params = useParams();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/patients/${params.id}`)
      .then(res => setPatient(res.data.patient))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="p-8 text-center"><div className="animate-spin text-4xl">⏳</div></div>;
  if (!patient) return <div className="p-8 text-center text-gray-500">Patient not found</div>;

  return (
    <div>
      <div className="page-header">
        <Link href="/patients" className="text-white/80"><ChevronLeft size={24} /></Link>
        <h1 className="text-lg font-bold font-display">Patient Profile</h1>
        {patient.isHighRisk && <AlertTriangle size={20} className="text-yellow-300" />}
      </div>

      <div className="p-4 space-y-4">
        {/* Profile header */}
        <div className="card flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-3xl flex items-center justify-center text-3xl">
            {patient.gender === 'female' ? '👩' : '👨'}
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-gray-800">{patient.name}</h2>
            <p className="text-gray-500">{patient.age} years • {patient.gender} • {patient.village}</p>
            <p className="text-gray-400 text-sm">ID: {patient.patientId}</p>
          </div>
        </div>

        {patient.isHighRisk && (
          <div className="bg-red-50 border border-red-300 rounded-2xl p-3 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            <p className="text-red-700 font-semibold text-sm">This patient is marked as HIGH RISK</p>
          </div>
        )}

        <div className="card space-y-3">
          <h3 className="font-bold text-gray-700 font-display">Medical Information</h3>
          <InfoRow label="Blood Group" value={patient.bloodGroup?.toUpperCase() || 'Unknown'} />
          <InfoRow label="Phone" value={patient.phone || 'Not provided'} />
          <InfoRow label="Medical History" value={patient.medicalHistory || 'None recorded'} />
          <InfoRow label="Allergies" value={patient.allergies || 'None known'} />
          {patient.lastVisit && (
            <InfoRow label="Last Visit" value={new Date(patient.lastVisit).toLocaleDateString('en-IN')} />
          )}
          <InfoRow label="Registered" value={new Date(patient.createdAt).toLocaleDateString('en-IN')} />
        </div>

        <Link href={`/symptoms?patientId=${patient._id}`}>
          <button className="btn-primary w-full flex items-center justify-center gap-2">
            <Activity size={18} /> Start Symptom Check
          </button>
        </Link>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-800 text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export default function PatientDetailPage() {
  return (
    <AuthProvider>
      <AppLayout>
        <PatientDetail />
      </AppLayout>
    </AuthProvider>
  );
}
