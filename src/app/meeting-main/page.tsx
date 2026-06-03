'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function MeetingMainPage() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', role: 'ai', text: 'สวัสดีครับ ผมคือผู้ช่วย AI ประจำคณะกรรมการจัดซื้อจัดจ้าง ท่านสามารถสอบถามระเบียบพัสดุ หรือตรวจสอบคีย์ Pool ในหน้านี้ได้เลยครับ' }
  ]);
  const [meetingMode, setMeetingMode] = useState('none');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [useTranslation, setUseTranslation] = useState(true);
  const [statusInfo, setStatusInfo] = useState('เชื่อมต่อระบบ API Pool อัตโนมัติ');

  const [leftWidth, setLeftWidth] = useState(68); 
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || !containerRef.current) return;
      let newWidth = (e.clientX / containerRef.current.clientWidth) * 100;
      if (newWidth > 20 && newWidth < 80) setLeftWidth(newWidth);
    };
    const handleMouseUp = () => { isResizing.current = false; };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const askAI = async () => {
    if (!inputText.trim() || loading) return;
    const userText = inputText.trim();
    const userMsgId = Date.now().toString();
    const aiMsgId = (Date.now() + 1).toString();

    setMessages(prev => [...prev, { id: userMsgId, role: 'user', text: userText }]);
    setInputText('');
    setLoading(true);
    setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: 'กำลังประมวลผลข้อมูลผ่านตัวสำรองระบบ...' }]);

    try {
      let savedPool = [];
      const localData = localStorage.getItem('prove_api_pool');
      if (localData) {
        try { savedPool = JSON.parse(localData); } catch(e) { console.error(e); }
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, apiPool: savedPool, useTranslation: useTranslation }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.usedSlot) {
        setStatusInfo(`✅ ดึงข้อมูลสำเร็จจาก API กล่องลำดับที่ ${data.usedSlot} ${data.translated ? '(โหมดประหยัด Token)' : ''}`);
      }

      setMessages(prev => prev.map(msg => msg.id === aiMsgId ? { ...msg, text: data.reply || '⚠️ ส่งข้อมูลมาว่างเปล่า' } : msg));
    } catch (err: any) {
      setMessages(prev => prev.map(msg => msg.id === aiMsgId ? { ...msg, text: `❌ เกิดข้อผิดพลาด: ${err.message}` } : msg));
    } {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', width: '100vw', height: '100vh', position: 'relative', background: '#f8fafc', overflow: 'hidden' }}>
      
      {/* ฝั่งซ้าย: ระบบประชุมวิดีโอ */}
      <div style={{ width: `${leftWidth}%`, minWidth: '250px', backgroundColor: '#0b0f19', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifycontent: 'center', backgroundColor: '#020617', color: '#475569', padding: '20px' }}>
          {meetingMode === 'jitsi' ? (
            <iframe src="https://meet.jit.si/PhraeMeetingRoom" allow="microphone; camera" style={{ width: '100%', height: '100%', border: 'none' }} />
          ) : meetingMode === 'webex' ? (
            <div style={{ color: 'white', textAlign: 'center', width: '100%' }}>
              <p style={{ fontSize: '1.2rem' }}>กำลังเรียกเปิดระบบ Cisco Webex...</p>
              <a href="webexteams://..." style={{ color: '#67e8f9', display: 'block', marginTop: '10px' }}>คลิกที่นี่เพื่อเปิดแอป</a>
            </div>
          ) : (
            <div style={{ textAlign: 'center', width: '100%' }}>
              <p style={{ color: '#94a3b8' }}>กรุณาเลือกสัญญาณโหมดการประชุมด้านล่าง</p>
            </div>
          )}
        </div>
        <div style={{ padding: '16px', backgroundColor: '#0f172a', display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={() => setMeetingMode('webex')} style={{ backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', padding: '10px', borderRadius: '6px', cursor: 'pointer' }}>Cisco Webex</button>
          <button onClick={() => setMeetingMode('jitsi')} style={{ backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', padding: '10px', borderRadius: '6px', cursor: 'pointer' }}>Jitsi Meeting</button>
          <button onClick={() => setIsRecording(!isRecording)} style={{ backgroundColor: '#1e293b', color: isRecording ? '#ef4444' : '#fb7185', border: '1px solid #334155', padding: '10px', borderRadius: '6px', cursor: 'pointer' }}>
            {isRecording ? '🛑 หยุดบันทึก' : '🎙️ บันทึกเสียง'}
          </button>
        </div>
      </div>

      {/* แถบลากปรับขนาดกลาง */}
      <div onMouseDown={() => { isResizing.current = true; }} style={{ width: '10px', backgroundColor: '#e2e8f0', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, userSelect: 'none' }}>⋮</div>

      {/* ฝั่งขวา: ช่องแชท AI สนับสนุนกรรมการ */}
      <div style={{ flex: 1, minWidth: '320px', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#0f172a' }}>Prove AI Assistant Suite (v4)</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{statusInfo}</div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div onClick={() => setUseTranslation(!useTranslation)} style={{ backgroundColor: useTranslation ? '#16a34a' : '#e2e8f0', color: useTranslation ? 'white' : '#475569', padding: '4px 8px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
              {useTranslation ? 'ประหยัด Token ON' : 'โหมดปกติ'}
            </div>
            <Link href="/api-test" style={{ backgroundColor: '#2563eb', color: 'white', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
              ⚙️ ปรับแต่ง API
            </Link>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ maxWidth: '85%', padding: '12px 16px', borderRadius: '12px', fontSize: '0.95rem', lineHeight: '1.5', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', backgroundColor: msg.role === 'user' ? '#2563eb' : '#f1f5f9', color: msg.role === 'user' ? 'white' : '#0f172a', border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0' }}>
              {msg.text}
            </div>
          ))}
        </div>

        <div style={{ padding: '15px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px', backgroundColor: 'white' }}>
          <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); askAI(); } }} placeholder="พิมพ์สอบถามระเบียบที่นี่..." style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', resize: 'none', height: '42px', outline: 'none' }} />
          <button onClick={askAI} style={{ border: 'none', borderRadius: '8px', backgroundColor: '#2563eb', color: 'white', padding: '0 15px', cursor: 'pointer', fontWeight: 'bold' }}>ส่ง</button>
        </div>
      </div>

    </div>
  );
}