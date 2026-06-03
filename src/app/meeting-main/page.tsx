"use client";

import React, { useState } from "react";

export default function MeetingMainPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* ฝั่งซ้าย: ห้องประชุม */}
      <div className="w-[60%] bg-black flex flex-col">
        <div className="flex-1 flex items-center justify-center text-slate-500">
          <div className="text-center">
            <p>หน้าจอการประชุม</p>
          </div>
        </div>
        <div className="h-16 bg-[#1e293b] flex items-center justify-center gap-2">
          <button className="text-white border border-slate-600 px-4 py-2 rounded text-sm">Webex</button>
          <button className="text-white border border-slate-600 px-4 py-2 rounded text-sm">Jitsi (Backup)</button>
          <button className="text-red-400 border border-slate-600 px-4 py-2 rounded text-sm">บันทึกเสียง</button>
        </div>
      </div>

      {/* แถบกั้น */}
      <div className="w-[10px] bg-slate-200 cursor-col-resize"></div>

      {/* ฝั่งขวา: AI Assistant */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="p-4 border-b border-slate-200">
          <select className="border p-2 w-full mb-2">
            <option>Google Gemini</option>
            <option>ChatGPT</option>
          </select>
          <input className="border p-2 w-full" placeholder="API Key" />
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <div className="bg-slate-100 p-3 rounded-lg text-slate-800">
            สวัสดีครับ ผมคือผู้ช่วย AI ประจำคณะกรรมการ ท่านสามารถสอบถามระเบียบได้ที่นี่ครับ
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 flex gap-2">
          <button className="bg-slate-500 text-white px-4 rounded-lg">📄</button>
          <textarea className="flex-1 border p-2 rounded-lg" placeholder="พิมพ์คำถามที่นี่..."></textarea>
          <button className="bg-blue-600 text-white px-6 rounded-lg">ส่ง</button>
        </div>
      </div>
    </div>
  );
}