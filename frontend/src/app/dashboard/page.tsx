'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/shared/AppLayout';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, AlertTriangle, Activity, ArrowUpRight, TrendingUp, MapPin } from 'lucide-react';
import Link from 'next/link';

const URGENCY_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };

function DashboardContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const urgencyData = stats ? [
    { name: 'Low', value: stats.urgencyBreakdown.low, color: URGENCY_COLORS.low },
    { name: 'Medium', value: stats.urgencyBreakdown.medium, color: URGENCY_COLORS.medium },
    { name: 'High', value: stats.urgencyBreakdown.high, color: URGENCY_COLORS.high },
    { name: 'Critical', value: stats.urgencyBreakdown.critical, color: URGENCY_COLORS.critical },
  ] : [];

  return (
    <div className="p-4 space-y-4">
      {/* Greeting */}
      <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-3xl p-5 text-white">
        <p className="text-green-200 text-sm">Good day,</p>
        <h2 className="text-xl font-bold font-display">{user?.name || 'Health Worker'} 👋</h2>
        <p className="text-green-100 text-xs mt-1">{user?.village ? `${user.village} • ` : ''}Today: {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
      </div>

      {/* Quick Action */}
      <Link href="/symptoms" className="block">
        <div className="bg-green-50 border-2 border-green-200 rounded-3xl p-4 flex items-center justify-between group hover:bg-green-100 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center">
              <Activity className="text-white" size={24} />
            </div>
            <div>
              <p className="font-bold text-green-800">Start Symptom Check</p>
              <p className="text-green-600 text-xs">AI-powered triage</p>
            </div>
          </div>
          <ArrowUpRight className="text-green-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={20} />
        </div>
      </Link>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="card h-24 bg-gray-100 animate-pulse" />)}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard title="Total Patients" value={stats.overview.totalPatients} icon={<Users size={20} />} color="blue" />
          <StatCard title="High Risk" value={stats.overview.highRiskPatients} icon={<AlertTriangle size={20} />} color="red" highlight />
          <StatCard title="Consultations" value={stats.overview.recentConsultations} icon={<Activity size={20} />} color="green" sub="last 30 days" />
          <StatCard title="Referrals" value={stats.overview.referralsMade} icon={<TrendingUp size={20} />} color="orange" sub="last 30 days" />
        </div>
      )}

      {/* Urgency Breakdown */}
      {stats && (
        <div className="card">
          <h3 className="font-bold text-gray-800 mb-3 font-display">Urgency Breakdown</h3>
          <div className="flex gap-4 items-center">
            <PieChart width={120} height={120}>
              <Pie data={urgencyData.filter(d => d.value > 0)} cx={55} cy={55} innerRadius={30} outerRadius={55} dataKey="value" strokeWidth={0}>
                {urgencyData.filter(d => d.value > 0).map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
            <div className="flex-1 space-y-2">
              {urgencyData.map(({ name, value, color }) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                    <span className="text-xs text-gray-600">{name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Symptoms */}
      {stats?.topSymptoms?.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-800 mb-3 font-display">Top Symptoms (30 days)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stats.topSymptoms.slice(0, 6)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="symptom" tick={{ fontSize: 10 }} tickFormatter={v => v.replace(/_/g, ' ')} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [v, 'Cases']} labelFormatter={l => l.replace(/_/g, ' ')} />
              <Bar dataKey="count" fill="#16a34a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Villages */}
      {stats?.villageData?.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-800 mb-3 font-display flex items-center gap-2">
            <MapPin size={16} className="text-green-600" /> Village Coverage
          </h3>
          <div className="space-y-2">
            {stats.villageData.slice(0, 5).map((v: any) => (
              <div key={v.village} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 flex-1">{v.village}</span>
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(v.patients / stats.villageData[0].patients) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-600 w-6 text-right">{v.patients}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {stats?.recentActivity?.length > 0 && (
        <div className="card mb-4">
          <h3 className="font-bold text-gray-800 mb-3 font-display">Recent Consultations</h3>
          <div className="space-y-3">
            {stats.recentActivity.slice(0, 5).map((c: any) => (
              <div key={c._id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                  <span className="text-lg">👤</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{c.patient?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{c.patient?.village}</p>
                </div>
                <UrgencyBadge level={c.triageResult?.urgencyLevel} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color, sub, highlight }: any) {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  return (
    <div className={`card ${highlight && value > 0 ? 'border-red-200' : ''}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[color]} mb-2`}>
        {icon}
      </div>
      <p className={`text-2xl font-bold font-display ${highlight && value > 0 ? 'text-red-600' : 'text-gray-800'}`}>{value ?? '—'}</p>
      <p className="text-xs text-gray-500 mt-0.5">{title}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function UrgencyBadge({ level }: { level: string }) {
  const map: any = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high', critical: 'badge-critical' };
  return <span className={map[level] || 'badge-low'}>{level || 'low'}</span>;
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <AppLayout>
        <DashboardContent />
      </AppLayout>
    </AuthProvider>
  );
}
