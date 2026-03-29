'use client';
import AppLayout from '@/components/shared/AppLayout';
import { AuthProvider } from '@/hooks/useAuth';
import Link from 'next/link';
import { Bell, Plus } from 'lucide-react';

export default function ReferralsPage() {
  return (
    <AuthProvider>
      <AppLayout>
        <div>
          <div className="page-header">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <Bell size={18} className="text-white" />
            </div>
            <h1 className="text-lg font-bold font-display flex-1">Referrals</h1>
            <Link href="/referral/new">
              <button className="bg-white/20 text-white px-3 py-1.5 rounded-xl text-sm font-semibold flex items-center gap-1">
                <Plus size={16} /> New
              </button>
            </Link>
          </div>
          <div className="p-6 text-center">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-700 font-semibold">Referral Management</p>
            <p className="text-gray-400 text-sm mt-2 mb-6">
              Generate referrals after completing a symptom check for high-risk patients.
            </p>
            <Link href="/symptoms">
              <button className="btn-primary w-full">Start Symptom Check → Generate Referral</button>
            </Link>
          </div>
        </div>
      </AppLayout>
    </AuthProvider>
  );
}
