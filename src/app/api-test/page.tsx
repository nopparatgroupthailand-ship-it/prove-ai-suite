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

  // โหลด Key เก่าที่เคยบันทึกไว้ในเบราว์เซอร์มาแสดงผลอัตโนมัติเมื่อเปิดหน้าเว็บ
  useEffect(() => {
    const localData = localStorage.getItem('prove_api_pool');
    if (localData) {
      try {
        const pool = JSON.parse(localData);
        if (Array.isArray(pool)) {
          const tItem = pool.find((item: any) => item.provider === 'thaillm');
          const gItem = pool.find((item: any) => item.provider === 'gemini');
          const oItem = pool.find((item: any) => item.provider === 'openai');

          if (tItem?.key) setThaiLlmKey(tItem.key);
          if (gItem?.key) setGeminiKey(gItem.key);
          if (oItem?.key) setOpenaiKey(oItem.key);

          if (tItem?.key || gItem?.key || oItem?.key) {
            setStatusInfo('ดึงข้อมูล Key ล่าสุดจากระบบความจำภายในเครื่องสำเร็จ');
          }
        }
      } catch (e) {
        console.error('Error parsing local pool storage:', e);
      }
    }
  }, []);

  // 💾 ฟังก์ชันกดเซฟปุ่มเดียว บันทึกคีย์ลงระบบจัดลำดับ Pool ของเครื่องเบราว์เซอร์
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
    ].filter(item => item.key !== ''); // กรองเก็บเฉพาะช่องที่มีการกรอกคีย์จริง (มีอันใดอันหนึ่งก็ได้)

    localStorage.setItem('prove_api_pool', JSON.stringify(updatedPool));
    
    if (updatedPool.length > 0) {
      setStatusInfo(`💾 บันทึกสำเร็จ! ระบบจัดชุด API Pool รวม ${updatedPool.length} ค่ายพร้อมใช้งาน`);
      alert(`บันทึกข้อมูลเรียบร้อยแล้วครับพี่! ระบบตรวจพบทั้งหมด ${updatedPool.length} คีย์ที่พร้อมทำงาน`);
    } else {
      setStatusInfo('⚠️ แจ้งเตือน: ปัจจุบันไม่มีคีย์ใดๆ ถูกบันทึก ระบบจะหันไปใช้ค่า Default หลังบ้านแทน');
      alert('บันทึกข้อมูลเป็นค่าว่างเรียบร้อยครับ (ระบบจะใช้คีย์สำรองของหลังบ้านทำงานให้ชั่วคราว)');
    }
  };

  // 🚀 ฟังก์ชันยิงทดสอบระบบถามตอบ (ส่งข้อมูลข้ามไปให้หลังบ้านวนลูปประมวลผลเซฟตี้)
  const handleTestApi = async () => {
    if (loading) return;
    setLoading(true);
    setTestResult('กำลังส่งคำขอข้ามฝั่งและตรวจสอบระบบเครือข่าย API Pool (จำกัดเวลาสูงสุดค่ายละ 12 วินาที)...');

    try {
      // ดึงข้อมูลจัดลำดับล่าสุดเตรียมแนบส่งตรวจสอบ
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
          useTranslation: false // ปิดโหมดแปลภาษาชั่วคราวเพื่อส่งตรวจสอบภาษาไทยโดยตรง
        })
      });

      const data = await res.json();
      
      if (data.error) {
        setTestResult(`❌ ทดสอบล้มเหลว: ${data.error}`);
      } else {
        const providerName = data.provider ? data.provider.toUpperCase() : 'UNKNOWN';
        setTestResult(`🟢 สำเร็จเชื่อมต่อได้ปกติ (Status: 200 OK)\n📡 ดึงสัญญาณสำเร็จจากผู้ให้บริการ: ${providerName}\n📦 โควตาลำดับกล่องทำงาน: กล่องที่ ${data.usedSlot || 1}\n\n🤖 ข้อความตอบกลับตอบโต้จาก AI:\n----------------------------------------\n${data.reply}`);
      }
    } catch (err: any) {
      setTestResult(`❌ เกิดข้อผิดพลาดทางเทคนิคเครือข่าย: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* ส่วนหัวหน้าควบคุม */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#0f172a', margin: 0, fontSize: '22px' }}>ศูนย์ควบคุมระบบคีย์เดี่ยว (Multi-Provider API Pool Center)</h2>
        <Link href="/meeting-main" style={{ textDecoration: 'none', backgroundColor: '#64748b', color: 'white', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold' }}>
          ↩️ กลับหน้าห้องประชุม
        </Link>
      </div>

      {/* แถบแจ้งสถานะการโหลด/บันทึกข้อมูล */}
      <div style={{ backgroundColor: '#f1f5f9', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', color: '#334155', marginBottom: '20px', borderLeft: '4px solid #2563eb', fontWeight: 'bold' }}>
        สถานะการประมวลผล: {statusInfo}
      </div>

      {/* 📦 กรอบรวมศูนย์กรอบเดี่ยวแบบเบ็ดเสร็จ */}
      <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '24px', backgroundColor: 'white', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', fontSize: '16px' }}>⚙️ แผงตั้งค่าและจัดระเบียบ Token Key</h3>
        
        {/* ค่ายที่ 1: ThaiLLM */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px', color: '#475569' }}>1. ThaiLLM API Key (เซิร์ฟเวอร์หลักโครงการดิจิทัล)</label>
          <input 
            type="password" 
            value={thaiLlmKey}
            onChange={(e) => setThaiLlmKey(e.target.value)}
            placeholder="วางรหัส Token Key ขึ้นต้นด้วย mbnr62PY..." 
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: '6px', fontFamily: 'monospace' }} 
          />
        </div>

        {/* ค่ายที่ 2: Google Gemini */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px', color: '#475569' }}>2. Google Gemini API Key (โมเดลประมวลผลความเร็วสูง)</label>
          <input 
            type="password" 
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="วางรหัส Token Key ขึ้นต้นด้วย AIzaSy..." 
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: '6px', fontFamily: 'monospace' }} 
          />
        </div>

        {/* ค่ายที่ 3: OpenAI ChatGPT */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px', color: '#475569' }}>3. OpenAI ChatGPT API Key (โมเดลมาตรฐานวิเคราะห์เอกสาร)</label>
          <input 
            type="password" 
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            placeholder="วางรหัส Token Key ขึ้นต้นด้วย sk-proj-..." 
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: '6px', fontFamily: 'monospace' }} 
          />
        </div>

        {/* ปุ่มกดยืนยันบันทึกข้อมูล */}
        <button 
          onClick={saveAllKeys}
          style={{ width: '100%', padding: '12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
        >
          💾 บันทึกโครงสร้างและส่งคีย์ลงระบบจัดลำดับ Pool
        </button>

        {/* 🚀 กล่องทดสอบคำสั่งยิง Sandbox (อยู่ด้านล่างกรอบเดิมอย่างสวยงาม) */}
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px dashed #e2e8f0' }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '15px' }}>🚀 ช่องทดสอบสัญญาณตอบสนองแชทบอท (Test Sandbox)</h4>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input 
              type="text" 
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="พิมพ์คำสำคัญเพื่อใช้ทดสอบการตอบโต้อัตโนมัติ เช่น สวัสดี" 
              style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
            <button 
              onClick={handleTestApi}
              disabled={loading}
              style={{ padding: '0 24px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {loading ? 'กำลังประมวลผล...' : 'ยิงทดสอบ'}
            </button>
          </div>

          {/* กล่องดำ Terminal รับข้อมูลคำตอบกลับ */}
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>บันทึกรายงานตอบกลับจากระบบเซิร์ฟเวอร์:</label>
          <textarea 
            value={testResult}
            readOnly
            placeholder="ผลการวิเคราะห์และตรวจสอบสัญญาณช่องทางเชื่อมต่อจะปรากฏขึ้นที่นี่..."
            style={{ width: '100%', height: '200px', padding: '12px', boxSizing: 'border-box', backgroundColor: '#0f172a', color: '#38bdf8', border: 'none', borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace', resize: 'none', lineHeight: '1.5' }}
          />
        </div>

      </div>

    </div>
  );
}