"use client";

import React, { useState, useRef, useEffect } from "react";

export default function MeetingMainPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPaneRef = useRef<HTMLDivElement>(null);

  // ระบบลากปรับขนาด
  const startResizing = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startWidth = leftPaneRef.current?.offsetWidth || 0;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (leftPaneRef.current && containerRef.current) {
        const newWidth = ((startWidth + (moveEvent.clientX - startX)) / containerRef.current.offsetWidth) * 100;
        if (newWidth > 15 && newWidth < 85) {
          leftPaneRef.current.style.width = `${newWidth}%`;
        }
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
    <div ref={containerRef} className="flex w-screen h-screen overflow-hidden bg-white">
      {/* ฝั่งซ้าย: ห้องประชุม (Black Background) */}
      <div ref={leftPaneRef} style={{ width: "60%" }} className="bg-black flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center text-slate-600">
          <div className="text-center">
            <span className="text-4xl">📹</span>
            <p>เลือกโหมดการประชุม</p>
          </div>
        </div>
        <div className="h-16 bg-[#1e293b] flex items-center justify-center gap-2">
          <button className="text-white border border-slate-600 px-4 py-2 rounded text-sm hover:bg-slate-700">Webex</button>
          <button className="text-white border border-slate-600 px-4 py-2 rounded text-sm hover:bg-slate-700">Jitsi (Backup)</button>
          <button className="text-red-400 border border-slate-600 px-4 py-2 rounded text-sm hover:bg-slate-800">บันทึกเสียง</button>
        </div>
      </div>

      {/* แถบสีเทาตรงกลาง (Resizer) */}
      <div 
        onMouseDown={startResizing} 
        className="w-[10px] bg-slate-200 cursor-col-resize hover:bg-blue-600 flex items-center justify-center text-slate-400 font-bold text-xs select-none"
      >
        ||
      </div>

      {/* ฝั่งขวา: AI Assistant */}
      <div className="flex-1 flex flex-col bg-white h-full shadow-[-2px_0_10px_rgba(0,0,0,0.05)]">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="text-xs text-slate-500">
            ปรับสัดส่วนหน้าจอได้โดยการลากแถบสีเทาตรงกลาง
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 text-slate-800 text-lg">
            สวัสดีครับ ผมคือผู้ช่วย AI ประจำคณะกรรมการ ท่านสามารถสอบถามระเบียบหรืออัปโหลดเอกสารวาระประชุมได้ที่นี่ครับ
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 flex gap-2">
          <button className="bg-slate-500 text-white px-4 rounded-lg">📄</button>
          <input className="flex-1 border border-slate-300 rounded-lg p-3" placeholder="พิมพ์คำถามที่นี่..." />
          <button className="bg-blue-600 text-white px-6 rounded-lg">➤</button>
        </div>
      </div>
    </div>
  );
}