"use client";

import React, { useState, useEffect, useRef } from "react";

export default function MeetingMainPage() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [meetingProvider, setMeetingProvider] = useState("webex");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [savedMeetingUrl, setSavedMeetingUrl] = useState("");
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([{
    id: "1",
    role: "ai",
    text: "สวัสดีครับ พร้อมเริ่มประชุมและวิเคราะห์ระเบียบพัสดุแล้วครับพี่",
  }]);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini");
  const [apiToken, setApiToken] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isResizingRef = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isResizingRef.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizingRef.current || !containerRef.current || !leftPaneRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const newWidth = (e.clientX / containerWidth) * 100;
    if (newWidth > 15 && newWidth < 85) {
      leftPaneRef.current.style.width = `${newWidth}%`;
    }
  };

  const handleMouseUp = () => {
    isResizingRef.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  return (
    <div 
      ref={containerRef} 
      className={`flex w-full h-screen overflow-hidden ${isDarkMode ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"}`}
    >
      <div 
        ref={leftPaneRef} 
        style={{ width: "60%" }} 
        className="bg-black flex flex-col justify-between"
      >
        <div className="flex-1 flex items-center justify-center p-4 bg-slate-950">
          {isMeetingActive ? (
            <div className="text-center">🌐 กำลังเปิดห้องประชุม {meetingProvider}</div>
          ) : (
            <div className="text-slate-500">📹 พื้นที่แสดงผลวิดีโอประชุม</div>
          )}
        </div>
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-center gap-2">
          <button onClick={() => setIsMeetingActive(true)} className="bg-blue-600 px-4 py-2 rounded text-xs text-white">เข้าประชุม</button>
          <button onClick={() => setIsRecording(!isRecording)} className="bg-slate-800 px-4 py-2 rounded text-xs text-white">บันทึกเสียง</button>
        </div>
      </div>

      <div 
        onMouseDown={handleMouseDown}
        className="w-2 bg-slate-800 cursor-col-resize hover:bg-blue-500 transition"
      />

      <div className={`flex-1 flex flex-col ${isDarkMode ? "bg-slate-900" : "bg-white"}`}>
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-sm font-bold">Prove AI Assistant</h2>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-xs bg-slate-800 px-3 py-1 rounded">Theme</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatMessages.map((msg) => (
            <div key={msg.id} className={`p-3 rounded-lg text-sm ${msg.role === 'ai' ? 'bg-slate-800' : 'bg-blue-600 self-end'}`}>
              {msg.text}
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-slate-800 flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={(e) => console.log(e.target.files)} 
          />
          <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-slate-700 rounded text-white">📄</button>
          <textarea 
            className="flex-1 bg-slate-800 p-2 text-sm rounded text-white" 
            value={chatInput} 
            onChange={(e) => setChatInput(e.target.value)}
          />
          <button className="p-2 bg-blue-600 rounded text-white">🚀</button>
        </div>
      </div>
    </div>
  );
}