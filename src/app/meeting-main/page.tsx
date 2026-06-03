'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function MeetingMainPage() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', role: 'ai', text: 'สวัสดีครับ ผมคือผู้ช่วย AI ประจำคณะกรรมการจัดซื้อจัดจ้าง ท่านสามารถสอบถามระเบียบพัสดุ อัปโหลดข้อความวาระ หรือสรุปเอกสารในจุดนี้ได้เลยครับ' }
  ]);
  const [meetingMode, setMeetingMode] = useState('none');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // --- ระบบเปิด-ปิดโหมดประหยัด Token (แปลอังกฤษ) ---
  const [useTranslation, setUseTranslation] = useState(true);

  // ข้อมูลสถิติแจ้งผู้ใช้งานว่า AI คุยด้วย Pool กล่องไหน
  const [statusInfo, setStatusInfo] = useState('เชื่อมต่อระบบ API Pool อัตโนมัติ');

  // สำหรับระบบลากปรับขนาด 70:30 เหมือนโครงสร้างเดิม
  const [leftWidth, setLeftWidth] = useState(68); 
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  useEffect(() => {
    // โหลดฟอนต์และไอคอนภายนอกเข้าสู่ระบบ
    const linkFont = document.createElement('link');
    linkFont.href = 'https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap';
    linkFont.rel = 'stylesheet';
    document.head.appendChild(linkFont);

    const linkIcon = document.createElement('link');
    linkIcon.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css';
    linkIcon.rel = 'stylesheet';
    document.head.appendChild(linkIcon);

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || !containerRef.current) return;
      let newWidth = (e.clientX / containerRef.current.clientWidth) * 100;
      if (newWidth > 20 && newWidth < 80) {
        setLeftWidth(newWidth);
      }
    };
    const handleMouseUp = () => { isResizing.current = false; };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // ฟังก์ชันถาม AI อัจฉริยะ (ดึงค่า API Pool จากเบราว์เซอร์ไปประมวลผลหลังบ้าน)
  const askAI = async () => {
    if (!inputText.trim() || loading) return;

    const userText = inputText.trim();
    const userMsgId = Date.now().toString();
    const aiMsgId = (Date.now() + 1).toString();

    // 1. เพิ่มข้อความฝั่งผู้ใช้เข้าหน้าจอ
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', text: userText }]);
    setInputText('');
    setLoading(true);

    // 2. ตั้งสถานะกำลังคิดรอคำตอบ
    setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: 'กำลังประมวลผลข้อมูลผ่านตัวสำรองระบบ...' }]);

    try {
      // 3. ควานหาชุดคีย์จากเครื่องเบราว์เซอร์ที่บันทึกมาจากหน้าเทส
      let savedPool = [];
      const localData = localStorage.getItem('prove_api_pool');
      if (localData) {
        try { savedPool = JSON.parse(localData); } catch(e) { console.error(e); }
      }

      // 4. ส่งข้อมูลไปยัง Dynamic Proxy หลังบ้าน Vercel
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          apiPool: savedPool, // พ่วงคีย์สำรอง 3 กล่องส่งไปทำงานหลังบ้าน
          useTranslation: useTranslation // แจ้งเปิด/ปิด โหมดแปลงภาษาประหยัด Token
        }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const replyText = data.reply || '⚠️ ตัวแบบจำลองส่งข้อมูลกลับมาว่างเปล่า';
      
      // อัปเดตบอกว่าดึงข้อมูลสำเร็จมาจากคีย์สำรองลำดับที่เท่าไหร่
      if (data.usedSlot) {
        setStatusInfo(`✅ ดึงข้อมูลสำเร็จจาก API กล่องลำดับที่ ${data.usedSlot} ${data.translated ? '(เปิดโหมดประหยัด Token ชนิดแปลภาษา)' : ''}`);
      }

      // 5. นำคำตอบ AI ใส่ลงหน้าต่างแชทหลัก
      setMessages(prev =>
        prev.map(msg => msg.id === aiMsgId ? { ...msg, text: replyText } : msg)
      );

    } catch (err: any) {
      setMessages(prev =>
        prev.map(msg => msg.id === aiMsgId ? { ...msg, text: `❌ เกิดข้อผิดพลาดระบบพูล: ${err.message}` } : msg)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" id="container" ref={containerRef}>
      <style dangerouslySetInnerHTML={{ __html: `
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Sarabun', sans-serif; }
        .app-container { display: flex; width: 100vw; height: 100vh; position: relative; background: #f8fafc; }
        
        /* ฝั่งซ้าย: ระบบวิดีโอห้องประชุม */
        .left-pane { min-width: 250px; background: #0b0f19; display: flex; flex-direction: column; overflow: hidden; }
        .video-placeholder { flex: 1; display: flex; align-items: center; justify-content: center; color: #475569; background: #020617; position: relative; }
        .controls { padding: 16px; background: #0f172a; display: flex; gap: 12px; justify-content: center; border-top: 1px solid #1e293b; }
        .btn-ctrl { background: #1e293b; color: #cbd5e1; border: 1px solid #334155; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px; transition: 0.2s; }
        .btn-ctrl:hover { background: #334155; color: white; }
        
        /* ตัวลากปรับความกว้างหน้าจอ */
        .resizer { width: 10px; background: #e2e8f0; cursor: col-resize; transition: background 0.2s; display: flex; align-items: center; justify-content: center; z-index: 10; }
        .resizer:hover { background: #3b82f6; }
        .resizer::after { content: '⋮'; color: #94a3b8; font-size: 14px; font-weight: bold; }
        
        /* ฝั่งขวา: ระบบแชท AI สนับสนุนกรรมการ */
        .right-pane { flex: 1; min-width: 320px; background: #ffffff; display: flex; flex-direction: column; box-shadow: -4px 0 20px rgba(0,0,0,0.03); }
        .ai-header { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; display: flex; justify-content: space-between; align-items: center; }
        .header-left-info { display: flex; flex-direction: column; gap: 2px; }
        .api-badge-status { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: bold; color: #0f172a; }
        
        /* สวิตช์สลับโหมดประหยัด Token */
        .toggle-container { display: flex; align-items: center; gap: 8px; font-size: 12px; background: #e2e8f0; padding: 4px 8px; border-radius: 20px; cursor: pointer; user-select: none; }
        .toggle-active { background: #16a34a; color: white; }

        /* ปุ่มกดเล็กๆ ย้ายไปหน้าต่างทดสอบระบบ */
        .btn-go-test { background: #2563eb; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: bold; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; transition: 0.2s; }