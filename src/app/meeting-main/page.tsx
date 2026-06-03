"use client";

import React, { useState, useRef, useEffect } from "react";

export default function SmartBoardroom() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: "ai", text: "สวัสดีครับ ผมคือผู้ช่วย AI ประจำคณะกรรมการ ท่านสามารถสอบถามระเบียบหรืออัปโหลดเอกสารวาระประชุมได้ที่นี่ครับ" }
  ]);
  const [userInput, setUserInput] = useState("");
  const leftPaneRef = useRef<HTMLDivElement>(null);

  // จำลองการเรียก API
  const handleAskAI = async () => {
    if (!userInput.trim()) return;
    
    const newUserMsg = { role: "user", text: userInput };
    setChatMessages(prev => [...prev, newUserMsg]);
    setUserInput("");

    // จำลอง Loading
    const loadingId = Date.now();
    setChatMessages(prev => [...prev, { role: "ai", text: "กำลังวิเคราะห์ข้อมูล..." }]);

    // ที่นี่คือจุดที่พี่สามารถใส่ Logic เรียก API แบบในตัวอย่างเดิมได้เลย
    console.log("Calling API...");
  };

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans">
      {/* --- ส่วนซ้าย: Meeting Area --- */}
      <div ref={leftPaneRef} className="w-[60%] bg-black flex flex-col">
        <div className="flex-1 flex items-center justify-center text-slate-500">
          <div className="text-center">
            <p className="text-4xl mb-4">📹</p>
            <p>เลือกโหมดการประชุม</p>
          </div>
        </div>
        <div className="h-16 bg-slate-900 flex justify-center items-center gap-4 text-white">
          <button className="text-xs border border-slate-600 px-4 py-2 rounded">Webex</button>
          <button className="text-xs border border-slate-600 px-4 py-2 rounded">Jitsi (Backup)</button>
          <button className="text-xs text-red-400 border border-red-900 px-4 py-2 rounded">บันทึกเสียง</button>
        </div>
      </div>

      {/* --- ส่วนกลาง: Resizer --- */}
      <div className="w-2 bg-slate-300 cursor-col-resize hover:bg-blue-500 transition-colors" />

      {/* --- ส่วนขวา: AI Assistant (หน้าจอตั้งค่า API) --- */}
      <div className="flex-1 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <select className="w-full border p-2 mb-2 rounded text-sm">
            <option>Google Gemini</option>
            <option>Ollama (Local)</option>
            <option>ChatGPT</option>
          </select>
          <input className="w-full border p-2 rounded text-sm" placeholder="วาง API Key หรือ URL ที่นี่" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white self-end ml-auto' : 'bg-slate-100 text-slate-800'}`}>
              {msg.text}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-200 flex gap-2">
          <button className="px-3 bg-slate-200 rounded">📄</button>
          <input 
            className="flex-1 border p-2 rounded text-sm" 
            value={userInput} 
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="พิมพ์คำถามที่นี่..." 
          />
          <button onClick={handleAskAI} className="px-4 bg-blue-600 text-white rounded">ส่ง</button>
        </div>
      </div>
    </div>
  );
}