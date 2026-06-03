'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ApiTestPage() {
  const [pools, setPools] = useState([
    { provider: 'thaillm', url: 'https://thaillm.or.th/api/v1', key: '', model: 'opentaigpt-thaillm-8b-instruct-v7.2' },
    { provider: 'openai', url: 'https://api.openai.com/v1', key: '', model: 'gpt-4o-mini' },
    { provider: 'ollama', url: 'http://localhost:11434', key: 'ollama-local', model: 'llama3' }
  ]);

  useEffect(() => {
    const savedPools = localStorage.getItem('prove_api_pool');
    if (savedPools) {
      try { setPools(JSON.parse(savedPools)); } catch (e) { console.error(e); }
    }
  }, []);

  const handleInputChange = (index: number, field: string, value: string) => {
    const updated = [...pools];
    updated[index] = { ...updated[index], [field]: value };
    setPools(updated);
  };

  const saveToLocal = () => {
    localStorage.setItem('prove_api_pool', JSON.stringify(pools));
    alert('🎯 บันทึกชุด API Pool เรียบร้อยแล้วครับ! ค่านี้จะส่งไปใช้ในหน้าประชุมหลักทันที');
  };

  const [chatInputs, setChatInputs] = useState(['', '', '']);
  const [chatOutputs, setChatOutputs] = useState(['ยังไม่มีการทดสอบ', 'ยังไม่มีการทดสอบ', 'ยังไม่มีการทดสอบ']);
  const [loadingSlot, setLoadingSlot] = useState<number | null>(null);

  const testSingleSlot = async (index: number) => {
    const currentInput = chatInputs[index].trim();
    if (!currentInput) { alert('กรุณาพิมพ์ข้อความทดสอบก่อนครับ'); return; }

    setLoadingSlot(index);
    setChatOutputs(prev => { const next = [...prev]; next[index] = 'กำลังตรวจสอบสัญญาณคีย์...'; return next; });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, apiPool: [pools[index]], useTranslation: false })
      });
      const data = await res.json();
      setChatOutputs(prev => { const next = [...prev]; next[index] = data.reply || data.error || '⚠️ ไม่ส่งข้อมูลตอบกลับ'; return next; });
    } catch (err: any) {
      setChatOutputs(prev => { const next = [...prev]; next[index] = `❌ ล้มเหลว: ${err.message}`; return next; });
    } finally {
      setLoadingSlot(null);
    }
  };

  // กำหนดสีกรอบตามลำดับความสำคัญ 1, 2, 3
  const slotColors = ['#2563eb', '#7c3aed', '#0891b2'];

  return (
    <div style={{ backgroundColor: '#f0f4f8', minHeight: '100vh', color: '#1a2232', fontFamily: 'sans-serif' }}>
      <header style={{ backgroundColor: '#0f172a', padding: '20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem' }}>🧪 ระบบตั้งค่าและทดสอบสัญญาณ API Pool</h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>จัดลำดับความต้องการคีย์สำรองเพื่อเสถียรภาพสูงสุดของห้องประชุมอัจฉริยะ</p>
        </div>
        <Link href="/meeting-main" style={{ backgroundColor: '#475569', color: 'white', textDecoration: 'none', padding: '10px 16px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 'bold' }}>
          🖥️ กลับหน้าประชุมหลัก
        </Link>
      </header>

      <main style={{ maxWidth: '900px', margin: '20px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <button onClick={saveToLocal} style={{ backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>
          💾 บันทึกโครงสร้างและส่งคีย์ลงระบบจัดลำดับ Pool (ส่งต่อไปหน้าประชุมหลัก)
        </button>

        {pools.map((pool, idx) => (
          <div key={idx} style={{ backgroundColor: 'white', borderRadius: '10px', border: `1px solid #d4dce8`, borderLeft: `6px solid ${slotColors[idx]}`, overflow: 'hidden', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eef2f6', paddingBottom: '10px' }}>
              <span style={{ backgroundColor: slotColors[idx], color: 'white', fontWeight: 'bold', fontSize: '0.85rem', padding: '4px 10px', borderRadius: '20px' }}>
                ลำดับความสำคัญที่ {idx + 1}
              </span>
              <small style={{ color: '#64748b', fontWeight: 'bold' }}>
                {idx === 0 ? '🎯 Main Provider' : idx === 1 ? '🔄 Backup 1' : '🔄 Backup 2'}
              </small>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>ค่ายระบบบริการ</label>
                <select value={pool.provider} onChange={(e) => handleInputChange(idx, 'provider', e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="thaillm">ThaiLLM API</option>
                  <option value="openai">OpenAI Compatible / ค่ายอื่น</option>
                  <option value="ollama">Ollama (Local Run)</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>ชื่อตัวแบบจำลอง (Model)</label>
                <input type="text" value={pool.model} onChange={(e) => handleInputChange(idx, 'model', e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>ที่อยู่เซิร์ฟเวอร์ปลายทาง (URL)</label>
                <input type="text" value={pool.url} onChange={(e) => handleInputChange(idx, 'url', e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>รหัสพาสเวิร์ด (API Key)</label>
                <input type="password" value={pool.key} onChange={(e) => handleInputChange(idx, 'key', e.target.value)} placeholder="กรอกคีย์ความลับ Bearer Token ที่นี่" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '15px', marginTop: '5px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>⚙️ จำลองระบบถามตอบช่องลำดับที่ {idx + 1}:</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" value={chatInputs[idx]} onChange={(e) => setChatInputs(prev => { const next = [...prev]; next[idx] = e.target.value; return next; })} placeholder="พิมพ์ทดสอบคำถามตรงนี้..." style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <button onClick={() => testSingleSlot(idx)} disabled={loadingSlot !== null} style={{ padding: '0 20px', border: 'none', backgroundColor: '#1e293b', color: 'white', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer' }}>
                  {loadingSlot === idx ? '⏳ ยิงทดสอบ...' : '🚀 ยิงทดสอบ'}
                </button>
              </div>
              <div style={{ marginTop: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '6px', fontSize: '0.9rem', color: '#334155' }}>
                <strong>ผลลัพธ์:</strong> {chatOutputs[idx]}
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}