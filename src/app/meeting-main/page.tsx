"use client";

import React, { useState, useEffect, useRef } from "react";

export default function MeetingMainPage() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: "1", role: "ai", text: "สวัสดีครับ พร้อมช่วยงานคณะกรรมการพัสดุแล้วครับ" }
  ]);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftPaneRef = useRef<HTMLDivElement>(null);

  // สลับธีม
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  // ระบบ Resizer (จัดการสัดส่วนหน้าจอ)
  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startWidth = leftPaneRef.current?.offsetWidth || 0;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);
      if (leftPaneRef.current && containerRef.current) {
        leftPaneRef.current.style.width = `${(newWidth / containerRef.current.offsetWidth) * 100}%`;
      }
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div ref={containerRef} className="flex w-full h-screen overflow-hidden bg-slate-900 text-white">
      {/* ฝั่งซ้าย: ห้องประชุม */}
      <div ref={leftPaneRef} style={{ width: "60%" }} className="flex flex-col border-r border-slate-700">
        <div className="flex-1 flex items-center justify-center bg-black">
          {isMeetingActive ? <div className="text-sm">กำลังเชื่อมต่อ Webex...</div> : <div className="text-slate-500">Video Area</div>}
        </div>
        <div className="h-16 bg-slate-950 flex items-center justify-center gap-4">
          <button onClick={() => setIsMeetingActive(!isMeetingActive)} className="bg-blue-600 px-4 py-2 rounded text-xs">เข้าประชุม</button>
          <button onClick={() => setIsRecording(!isRecording)} className="bg-slate-800 px-4 py-2 rounded text-xs">{isRecording ? "หยุดบันทึก" : "บันทึกเสียง"}</button>
        </div>
      </div>

      {/* แถบปรับขนาด */}
      <div onMouseDown={handleMouseDown} className="w-2 bg-slate-800 cursor-col-resize hover:bg-blue-500" />

      {/* ฝั่งขวา: AI แชท */}
      <div className="flex-1 flex flex-col bg-slate-900">
        <div className="p-4 border-b border-slate-800 flex justify-between">
          <span className="text-xs font-bold">AI Assistant</span>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-[10px] bg-slate-800 px-2 py-1 rounded">Theme</button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          {chatMessages.map(msg => (
            <div key={msg.id} className={`p-2 mb-2 rounded text-sm ${msg.role === 'ai' ? 'bg-slate-800' : 'bg-blue-600'}`}>
              {msg.text}
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-slate-800">
          <input className="w-full bg-slate-800 p-2 text-sm rounded" placeholder="ถามเกี่ยวกับระเบียบพัสดุ..." />
        </div>
      </div>
    </div>
  );
}