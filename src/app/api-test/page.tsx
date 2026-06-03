'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ApiTestPage() {
  // 🔑 State สำหรับเก็บ Key แยกตามค่าย
  const [thaiLlmKey, setThaiLlmKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');

  // 🧪 State สำหรับการทดสอบถามตอบ
  const [testMessage, setTestMessage] = useState('สวัสดี');
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusInfo, setStatusInfo] = useState('กรุณากรอก Key และกดบันทึกเข้าระบบ Pool');

  // โหลด Key เก่าที่เคยบันทึกไว้ในเบราว์เซอร์มาแสดงผลอัตโนมัติ
  useEffect(() => {
    const localData = localStorage.getItem('prove_api_pool');
    if (localData) {
      try {
        const pool = JSON.parse(localData);
        const tKey = pool.find((item: any) => item.provider === 'thaillm')?.key || '';
        const gKey = pool.find((item: any) => item.provider === 'gemini')?.key || '';
        const oKey = pool.find((item: any) => item.provider === 'openai')?.key || '';
        setThaiLlmKey(tKey);
        setGeminiKey(gKey);
        setOpenaiKey(oKey);
        if (tKey || gKey || oKey) setStatusInfo('โหลด Key ล่าสุดจากระบบ Pool สำเร็จ');
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // 💾 ฟังก์ชันกดเซฟปุ่มเดียว บันทึกคีย์ทั้ง 3 ค่ายลงระบบจัดลำดับ Pool ของหลังบ้าน
  const saveAllKeys = () => {
    const updatedPool = [
      { 
        provider: 'thaillm', 
        url: 'https://playground.thaillm.or.th/api/v1', 
        key: thaiLlmKey.trim(), 
        model: 'opentaigpt-thaillm-8b-instruct-v7.2' 
      },
      { 
        provider: 'gemini', 
        url: 'https://generativelanguage.googleapis.com/v1beta/openai', 
        key: geminiKey.trim(), 
        model: 'gemini-1.5-flash' 
      },
      { 
        provider: 'openai', 
        url: 'https://api.openai.com/v1', 
        key: openaiKey.trim(), 
        model: 'gpt-4o-mini' 
      }
    ].filter(item => item.key !== ''); // กรองเก็บเฉพาะช่องที่มีการกรอกคีย์จริง

    localStorage.setItem('prove_api_pool', JSON.stringify(updatedPool));
    setStatusInfo(`💾 บันทึกสำเร็จ! ระบบจัดชุด API Pool รวม ${updatedPool.length} ค่ายพร้อมใช้งาน`);
    alert('บันทึกข้อมูลระบบคีย์หลักเรียบร้อยครับพี่!');
  };

  // 🚀 ฟังก์ชันยิงทดสอบระบบถามตอบ (ส่งข้อมูลข้ามไปให้หลังบ้านวนลูปเทสคีย์ให้)
  const handleTestApi = async () => {
    if (loading) return;
    setLoading(true);
    setTestResult('กำลังส่งคำขอและตรวจสอบระบบ API Pool (สูงสุด 12 วินาที)...');

    try {
      // ดึงคีย์ล่าสุดส่งแนบไปทดสอบ
      const currentPool = [
        { provider: 'thaillm', url: 'https://playground.thaillm.or.th/api/v1', key: thaiLlmKey.trim(), model: 'opentaigpt-thaillm-8b-instruct-v7.2' },
        { provider: 'gemini', url: 'https://generativelanguage.googleapis.com/v1beta/openai', key: geminiKey.trim(), model: 'gemini-1.5-flash' },
        { provider: 'openai', url: 'https://api.openai.com/v1', key: openaiKey.trim(), model: 'gpt-4o-mini' }
      ].filter(item => item.key !== '');

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testMessage,
          apiPool: currentPool,
          useTranslation: false // ปิดโหมดแปลภาษาชั่วคราวเพื่อเทสคำภาษาไทยตรงๆ
        })
      });

      const data = await res.json();
      if (data.error) {
        setTestResult(`❌ ล้มเหลว: ${data.error}`);
      } else {
        setTestResult(`🟢 สำเร็จ (200 OK)\nดึงคำตอบจากค่าย: ${data.provider.toUpperCase()} (กล่องลำดับที่ ${data.usedSlot})\n\n🤖 คำตอบจาก AI:\n${data.reply}`);
      }
    } catch (err: any) {
      setTestResult(`❌ เกิดข้อผิดพลาดด้านเครือข่าย: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* ส่วนหัวหน้าเว็บ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#0f172a', margin: 0 }}>ศูนย์ควบคุมระบบคีย์เดี่ยว (Multi-Provider API Pool Center)</h2>
        <Link href="/meeting-main" style={{ textDecoration: 'none', backgroundColor: '#64748b', color: 'white', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold' }}>
          ↩️ กลับหน้าห้องประชุม
        </Link>
      </div>

      <div style={{ backgroundColor: '#f1f5f9', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', color: '#334155', marginBottom: '20px', borderLeft: '4px solid #2563eb', fontWeight: 'bold' }}>
        สถานะระบบ: {statusInfo}
      </div>

      {/* 📦 กรอบรวมศูนย์กรอบเดียวจบตามที่พี่ออกแบบ */}
      <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '24px', backgroundColor: 'white', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>⚙️ แผงตั้งค่าและจัดการ Token Key</h3>
        
        {/* ช่องทางที่ 1: ThaiLLM Key */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px', color: '#475569' }}>1. ThaiLLM API Key (ระบบหลัก)</label>
          <input 
            type="password" 
            value={thaiLlmKey}
            onChange={(e) => setThaiLlmKey(e.target.value)}
            placeholder="วางรหัสคีย์ mbnr62PY..." 
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: '6px', fontFamily: 'monospace' }} 
          />
        </div>

        {/* ช่องทางที่ 2: Gemini API Key */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px', color: '#475569' }}>2. Google Gemini API Key (ระบบวิเคราะห์ความเร็วสูง)</label>
          <input 
            type="password" 
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="วางรหัสคีย์ AIzaSy..." 
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: '6px', fontFamily: 'monospace' }} 
          />
        </div>

        {/* ช่องทางที่ 3: OpenAI GPT Key */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px', color: '#475569' }}>3. OpenAI ChatGPT API Key (ระบบสำรองมาตรฐาน)</label>
          <input 
            type="password" 
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            placeholder="วางรหัสคีย์ sk-proj-..." 
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: '6px', fontFamily: 'monospace' }} 
          />
        </div>

        {/* ปุ่มบันทึกชุดโครงสร้าง */}
        <button 
          onClick={saveAllKeys}
          style={{ width: '100%', padding: '12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
        >
          💾 บันทึกโครงสร้างและส่งคีย์ลงระบบจัดลำดับ Pool
        </button>

        {/* 🧪 ช่องเทสถามตอบ (คงไว้ด้านล่างของกรอบตามคำขอพี่) */}
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px dashed #e2e8f0' }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>🚀 ช่องทดสอบสัญญาณกระตุ้นการส่งคำสั่ง (Test Sandbox)</h4>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input 
              type="text" 
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="พิมพ์ข้อความเพื่อทดสอบ เช่น สวัสดี" 
              style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
            <button 
              onClick={handleTestApi}
              disabled={loading}
              style={{ padding: '0 24px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {loading ? 'กำลังยิง...' : 'ยิงทดสอบ'}
            </button>
          </div>

          {/* กล่องแสดงผลลัพธ์การยิงทดสอบ */}
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>ผลลัพธ์การตอบกลับหลังบ้าน:</label>
          <textarea 
            value={testResult}
            readOnly
            placeholder="ผลการยิงทดสอบจะมาปรากฏตรงนี้ครับ..."
            style={{ width: '100%', height: '180px', padding: '12px', boxSizing: 'border-box', backgroundColor: '#0f172a', color: '#38bdf8', border: 'none', borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace', resize: 'none' }}
          />
        </div>

      </div>

    </div>
  );
}