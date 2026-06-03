'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ApiTestPage() {
  // สร้าง State สำหรับเก็บข้อมูล API ทั้ง 3 ช่อง
  const [pools, setPools] = useState([
    { provider: 'thaillm', url: 'https://thaillm.or.th/api/v1', key: '', model: 'opentaigpt-thaillm-8b-instruct-v7.2' },
    { provider: 'openai', url: 'https://api.openai.com/v1', key: '', model: 'gpt-4o-mini' },
    { provider: 'ollama', url: 'http://localhost:11434', key: 'ollama-local', model: 'llama3' }
  ]);

  // สเต็ปโหลดค่าเก่าที่เคยบันทึกไว้ในเบราว์เซอร์ขึ้นมาแสดงผลอัตโนมัติ
  useEffect(() => {
    const savedPools = localStorage.getItem('prove_api_pool');
    if (savedPools) {
      try {
        setPools(JSON.parse(savedPools));
      } catch (e) {
        console.error('โหลดค่าล้มเหลว', e);
      }
    }
  }, []);

  // ฟังก์ชันอัปเดตข้อมูลรายช่องเมื่อพิมพ์กรอก
  const handleInputChange = (index: number, field: string, value: string) => {
    const updated = [...pools];
    updated[index] = { ...updated[index], [field]: value };
    setPools(updated);
  };

  // ปุ่มกดเพื่อเซฟค่าจำลงเครื่องเบราว์เซอร์
  const saveToLocal = () => {
    localStorage.setItem('prove_api_pool', JSON.stringify(pools));
    alert('🎯 บันทึกชุด API Pool ลำดับ 1-2-3 ลงระบบเรียบร้อยแล้วครับ! ค่านี้จะส่งไปใช้ในหน้าประชุมหลักทันที');
  };

  // --- ระบบกล่องจำลองถามตอบ (Mini Chat Tester) ของแต่ละกรอบ ---
  const [chatInputs, setChatInputs] = useState(['', '', '']);
  const [chatOutputs, setChatOutputs] = useState(['ยังไม่มีการทดสอบ', 'ยังไม่มีการทดสอบ', 'ยังไม่มีการทดสอบ']);
  const [loadingSlot, setLoadingSlot] = useState<number | null>(null);

  const testSingleSlot = async (index: number) => {
    const currentInput = chatInputs[index].trim();
    if (!currentInput) {
      alert('กรุณาพิมพ์ข้อความทดสอบในช่องก่อนครับ');
      return;
    }

    setLoadingSlot(index);
    setChatOutputs(prev => {
      const next = [...prev];
      next[index] = 'กำลังส่งข้อมูลตรวจสอบสัญญาณคีย์...';
      return next;
    });

    try {
      // ยิงตรงไปหาหลังบ้านตัวกลางของเรา โดยส่งเฉพาะค่าของกล่องตัวมันเองไปเทส
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          apiPool: [pools[index]], // บังคับให้วิ่งช่องนี้โดยเฉพาะ
          useTranslation: false // หน้าเทสปล่อยให้พิมพ์แบบตรงตัว
        })
      });

      const data = await res.json();
      setChatOutputs(prev => {
        const next = [...prev];
        next[index] = data.reply || data.error || '⚠️ ระบบไม่ส่งข้อมูลการตอบกลับ';
        return next;
      });
    } catch (err: any) {
      setChatOutputs(prev => {
        const next = [...prev];
        next[index] = `❌ การเชื่อมต่อล้มเหลว: ${err.message}`;
        return next;
      });
    } finally {
      setLoadingSlot(null);
    }
  };

  return (
    <div className="tester-container">
      <style dangerouslySetInnerHTML={{ __html: `
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Sarabun', sans-serif; }
        body { background: #f0f4f8; color: #1a2232; }
        .tester-header { background: #0f172a; padding: 20px; color: white; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header-title h1 { font-size: 1.5rem; display: flex; align-items: center; gap: 10px; }
        .header-title p { font-size: 0.85rem; color: #94a3b8; margin-top: 4px; }
        .btn-nav-main { background: #475569; color: white; text-decoration: none; padding: 10px 16px; border-radius: 6px; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 5px; transition: 0.2s; }
        .btn-nav-main:hover { background: #334155; }
        
        .main-content { max-width: 1000px; margin: 30px auto; padding: 0 20px; display: flex; flex-direction: column; gap: 25px; }
        .pool-card { background: white; border-radius: 12px; border: 1px solid #d4dce8; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.02); position: relative; }
        
        /* แถบสีบ่งบอกระดับความสำคัญของ Pool */
        .pool-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 6px; }
        .card-slot-0::before { background: #2563eb; } /* ลำดับ 1 - น้ำเงิน */
        .card-slot-1::before { background: #7c3aed; } /* ลำดับ 2 - ม่วง */
        .card-slot-2::before { background: #0891b2; } /* ลำดับ 3 - ฟ้า */

        .card-header { padding: 15px 20px; border-bottom: 1px solid #eef2f6; display: flex; justify-content: space-between; align-items: center; background: #fafbfc; }
        .slot-badge { font-weight: bold; font-size: 0.9rem; padding: 4px 10px; border-radius: 20px; color: white; }
        .badge-0 { background: #2563eb; }
        .badge-1 { background: #7c3aed; }
        .badge-2 { background: #0891b2; }

        .card-body { padding: 20px; display: flex; flex-direction: column; gap: 15px; }
        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full-width { grid-column: span 2; }
        label { font-size: 0.85rem; font-weight: 600; color: #475569; }
        input, select { padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.95rem; background: #fff; width: 100%; }
        input:focus, select:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        
        .mini-chat-section { border-top: 1px dashed #e2e8f0; padding-top: 15px; margin-top: 5px; }
        .chat-input-row { display: flex; gap: 10px; }
        .btn-test { padding: 0 20px; border: none; background: #1e293b; color: white; font-weight: bold; border-radius: 6px; cursor: pointer; white-space: nowrap; transition: 0.2s; }
        .btn-test:hover { background: #0f172a; }
        .btn-test:disabled { background: #94a3b8; cursor: not-allowed; }
        
        .chat-output-box { margin-top: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 0.95rem; line-height: 1.5; min-height: 40px; color: #334155; word-break: break-word; }
        
        .save-bar { background: white; border-radius: 12px; border: 1px solid #d4dce8; padding: 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.02); margin-bottom: 5px; }
        .btn-save-all { background: #16a34a; color: white; border: none; padding: 14px 28px; border-radius: 8px; font-size: 1rem; font-weight: bold; cursor: pointer; width: 100%; text-align: center; box-shadow: 0 4px 6px rgba(22,163,74,0.2); transition: 0.2s; }
        .btn-save-all:hover { background: #15803d; transform: translateY(-1px); }
      `}} />

      <header className="tester-header">
        <div className="header-title">
          <h1>🧪 ระบบตั้งค่าและทดสอบสัญญาณ API Pool</h1>
          <p>จัดลำดับความต้องการในการดึงคีย์สำรองอัตโนมัติ เพื่อเสถียรภาพสูงสุดของห้องประชุมอัจฉริยะ</p>
        </div>
        <Link href="/meeting-main" className="btn-nav-main">
          🖥️ กลับหน้าประชุมหลัก
        </Link>
      </header>

      <main className="main-content">
        {/* แถบบาร์บันทึกข้อมูล */}
        <div className="save-bar">
          <button className="btn-save-all" onClick={saveToLocal}>
            💾 บันทึกโครงสร้างและส่งคีย์ลงระบบจัดลำดับ Pool (ส่งต่อไปหน้าประชุมหลัก)
          </button>
        </div>

        {pools.map((pool, idx) => (
          <div key={idx} className={`pool-card card-slot-${idx}`}>
            <div