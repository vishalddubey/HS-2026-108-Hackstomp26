'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/shared/AppLayout';
import { AuthProvider } from '@/hooks/useAuth';
import api from '@/lib/api';
import Link from 'next/link';
import { Search, Plus, AlertTriangle, User, ChevronRight } from 'lucide-react';

function PatientsList() {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ limit: '30' });
      if (search) params.set('search', search);
      api.get(`/patients?${params}`)
        .then(res => { setPatients(res.data.patients); setTotal(res.data.total); })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div>
      <div className="page-header">
        <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
          <User size={18} className="text-white" />
        </div>
        <h1 className="text-lg font-bold font-display flex-1">Patients</h1>
        <span className="text-green-200 text-sm">{total} total</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Search + Add */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              className="input-field pl-10"
              placeholder="Search by name or village..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Link href="/patients/new">
            <button className="btn-primary px-4 py-3 rounded-2xl">
              <Plus size={20} />
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="card h-20 animate-pulse bg-gray-100" />
            ))}
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-gray-500 font-semibold">No patients found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search ? 'Try a different search' : 'Register your first patient'}
            </p>
            {!search && (
              <Link href="/patients/new">
                <button className="btn-primary mt-4">+ Register Patient</button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {patients.map((p) => (
              <Link key={p._id} href={`/patients/${p._id}`}>
                <div className="card-interactive flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg ${p.isHighRisk ? 'bg-red-100' : 'bg-green-100'}`}>
                    {p.gender === 'female' ? '👩' : '👨'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                      {p.isHighRisk && <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500">
                      {p.age}y • {p.gender} • {p.village}
                    </p>
                    {p.lastVisit && (
                      <p className="text-xs text-gray-400">
                        Last visit: {new Date(p.lastVisit).toLocaleDateString('en-IN')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {p.isHighRisk && <span className="badge-high">High Risk</span>}
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PatientsPage() {
  return (
    <AuthProvider>
      <AppLayout>
        <PatientsList />
      </AppLayout>
    </AuthProvider>
  );
}
