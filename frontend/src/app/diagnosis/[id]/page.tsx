'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/shared/AppLayout';
import { AuthProvider } from '@/hooks/useAuth';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, AlertTriangle, CheckCircle, Activity, Phone } from 'lucide-react';
import Link from 'next/link';

const URGENCY_CONFIG: any = {
  low: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'badge-low', icon: '✅', label: 'LOW RISK', desc: 'Monitor at home' },
  medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'badge-medium', icon: '⚠️', label: 'MEDIUM RISK', desc: 'Visit clinic today' },
  high: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'badge-high', icon: '🔶', label: 'HIGH RISK', desc: 'Urgent medical attention' },
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'badge-critical', icon: '🚨', label: 'CRITICAL', desc: 'Emergency — Call 108 NOW' }
};

function DiagnosisResult() {
  const params = useParams();
  const router = useRouter();
  const [consultation, setConsultation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/triage/consultation/${params.id}`)
      .then(res => setConsultation(res.data.consultation))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
          <Activity className="text-green-600" size={32} />
        </div>
        <p className="text-gray-600 font-semibold">Analyzing symptoms...</p>
        <p className="text-gray-400 text-sm">AI triage in progress</p>
      </div>
    );
  }

  if (!consultation) return <div className="p-8 text-center text-gray-500">Result not found</div>;

  const { triageResult, guidance, patient } = consultation;
  const urgency = triageResult?.urgencyLevel || 'low';
  const cfg = URGENCY_CONFIG[urgency];
  const isCritical = urgency === 'critical' || urgency === 'high';

  return (
    <div className="animate-fade-in-scale">
      <div className="page-header">
        <Link href="/symptoms" className="text-white/80 hover:text-white"><ChevronLeft size={24} /></Link>
        <h1 className="text-lg font-bold font-display">Diagnosis Result</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Patient info */}
        <div className="card flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-2xl">
            {patient?.gender === 'female' ? '👩' : '👨'}
          </div>
          <div>
            <p className="font-bold text-gray-800">{patient?.name}</p>
            <p className="text-sm text-gray-500">{patient?.age}y • {patient?.gender} • {patient?.village}</p>
          </div>
        </div>

        {/* Urgency Banner */}
        <div className={`rounded-3xl p-5 border-2 ${cfg.bg} ${cfg.border}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{cfg.icon}</span>
            <div>
              <p className={`text-2xl font-bold font-display ${cfg.text}`}>{cfg.label}</p>
              <p className={`text-sm ${cfg.text} font-medium`}>{cfg.desc}</p>
            </div>
          </div>
          <div className={`mt-3 pt-3 border-t ${cfg.border}`}>
            <p className={`font-semibold text-sm ${cfg.text}`}>📋 Recommendation:</p>
            <p className={`text-sm mt-1 ${cfg.text}`}>{triageResult?.recommendation}</p>
          </div>
          {urgency === 'critical' && (
            <a href="tel:108" className="mt-3 flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-2xl font-bold">
              <Phone size={18} /> Call 108 Emergency Now
            </a>
          )}
        </div>

        {/* Possible Conditions */}
        {triageResult?.possibleConditions?.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-gray-800 mb-3 font-display flex items-center gap-2">
              🩺 Possible Conditions
            </h3>
            <div className="space-y-3">
              {triageResult.possibleConditions.map((c: any, i: number) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl ${i === 0 ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-800">{c.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${c.confidence * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{Math.round(c.confidence * 100)}% match</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 bg-gray-50 rounded-xl p-2">
              ⚠️ AI-assisted triage only. Confirm with a qualified doctor for final diagnosis.
            </p>
          </div>
        )}

        {/* Guidance */}
        {guidance && (
          <div className="card border-l-4 border-green-500">
            <h3 className="font-bold text-gray-800 mb-2 font-display">💊 Health Guidance</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{guidance}</p>
          </div>
        )}

        {/* Risk Score */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-700 text-sm">Risk Score</h3>
            <span className="font-bold text-gray-800">{triageResult?.riskScore}/20+</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all ${urgency === 'critical' ? 'bg-red-500' : urgency === 'high' ? 'bg-orange-500' : urgency === 'medium' ? 'bg-amber-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(100, (triageResult?.riskScore / 20) * 100)}%` }} />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pb-6">
          {isCritical && (
            <Link href={`/referral/new?consultationId=${consultation._id}`}>
              <button className="btn-danger w-full">
                📋 Generate Referral Slip
              </button>
            </Link>
          )}
          <Link href="/symptoms">
            <button className="btn-secondary w-full">
              🔄 Start New Check
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="btn-secondary w-full">
              🏠 Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DiagnosisPage() {
  return (
    <AuthProvider>
      <AppLayout>
        <DiagnosisResult />
      </AppLayout>
    </AuthProvider>
  );
}
