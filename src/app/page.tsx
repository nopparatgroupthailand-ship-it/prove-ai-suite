'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // บังคับให้หน้าแรกสุด วาร์ปไปที่หน้าตั้งค่า API Pool ทันทีที่เปิดเว็บ
    router.push('/api-test');
  }, [router]);

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: 'white', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <h2>🚀 กำลังนำท่านเข้าสู่ระบบ Prove AI Assistant...</h2>
        <p style={{ color: '#94a3b8', marginTop: '10px' }}>ระบบกำลังพาวาร์ปไปหน้าจัดการ API Pool</p>
      </div>
    </div>
  );
}