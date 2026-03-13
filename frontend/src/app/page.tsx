'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('gramhealth_token');
    router.replace(token ? '/dashboard' : '/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-700">
      <div className="text-center text-white">
        <div className="text-5xl mb-3">💚</div>
        <p className="font-bold text-xl">GramHealth AI</p>
        <p className="text-green-200 text-sm mt-1">Loading...</p>
      </div>
    </div>
  );
}
