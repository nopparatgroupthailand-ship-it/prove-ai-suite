"use client";

import React, { useState, useEffect, useRef } from "react";

export default function MeetingMainPage() {
  // --- ระบบ State หลักตามรูปแบบฟังก์ชันของโครงการ ---
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [meetingProvider, setMeetingProvider] = useState("webex");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [savedMeetingUrl, setSavedMeetingUrl] = useState("");
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      id: "1",
      role: "ai",
      text: "สวัสดีครับ ผมคือผู้ช่วย AI ประจำคณะกรรมการจัดซื้อจัดจ้าง ท่านสามารถสอบถามระเบียบพัสดุ ตรวจสอบข้อกฎหมาย หรืออัปโหลดเอกสารวาระเพื่อให้ผมสรุปข้อมูลก่อนเริ่มประชุมได้ทันทีครับพี่",
    },
  ]);
  const [isRecording, setIsRecording] = useState(false);

  // --- State การเลือกโมเดลและ Endpoint/Token แบบหน้าทดสอบ API ---
  const [selectedModel, setSelectedModel] = useState("gemini");
  const [apiToken, setApiToken] = useState("");

  // --- Refs สำหรับควบคุม DOM element และการลากขยายหน้าจอ ---
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isResizingRef = useRef(false);

  // สลับคลาส dark ที่ root html element ตามความต้องการใช้งาน
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDarkMode]);

  // --- ระบบลากปรับขนาดหน้าจอ (Resizer) ---
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizingRef.current || !containerRef.current || !leftPaneRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    let newWidthPercent = (e.clientX / containerWidth) * 100;
    
    // ตั้งค่าขั้นต่ำและขั้นสูงสุด (15% - 85%) ตามตัวอย่างเพื่อความสวยงาม
    if (newWidthPercent > 15 && newWidthPercent < 85) {
      leftPaneRef.current.style.width = `${newWidthPercent}%`;
    }
  };

  const handleMouseUp = () => {
    isResizingRef.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // --- ฟังก์ชันการทำงานของระบบประชุมและเอกสาร ---
  const handleSaveMeetingLink = () => {
    if (!meetingUrl.trim()) {
      alert("กรุณากรอก Link ของห้องประชุมก่อนกดบันทึกครับพี่");
      return;
    }
    setSavedMeetingUrl(meetingUrl.trim());
    setIsMeetingActive(false);
    alert("🎯 บันทึกโครงสร้างห้องประชุมและจัดลงระบบเรียบร้อยแล้วครับ!");
  };

  const handleLaunchMeeting = (provider: string) => {
    setMeetingProvider(provider);
    if (provider === "jitsi") {
      setIsMeetingActive(true);
    } else {
      if (!savedMeetingUrl) {
        alert("กรุณากรอกลิงก์ Cisco Webex ในช่องตั้งค่าและกดบันทึกก่อนใช้งานครับพี่");
        return;
      }
      setIsMeetingActive(true);
      window.open(savedMeetingUrl, "_blank");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "system",
        text: `📎 แนบไฟล์เอกสารพัสดุสำเร็จ: "${file.name}" (กำลังส่งให้ AI ประมวลผลก่อนเริ่มวาระ...)`,
      },
    ]);

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          text: `📚 อ่านไฟล์เอกสารกฎหมายเวียน "${file.name}" เรียบร้อยครับพี่! มีเนื้อหาผูกพันกับวาระการจัดซื้อจัดจ้างนี้ พี่สอบถามข้อสงสัยต่อได้เลยครับ`,
        },
      ]);
    }, 1200);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg = { id: Date.now().toString(), role: "user", text: chatInput.trim() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");

    const aiMsgId = (Date.now() + 1).toString();
    setChatMessages((prev) => [...prev, { id: aiMsgId, role: "ai", text: "🤖 กำลังค้นหาข้อมูลระเบียบพัสดุและวิเคราะห์คำตอบ..." }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text, model: selectedModel, token: apiToken }),
      });

      const data = await response.json();
      if (response.ok && data.reply) {
        setChatMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, text: data.reply } : m))
        );
      } else {
        setChatMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, text: `⚠️ ระบบ Pool แจ้งปัญหา: ${data.error || "ตรวจสอบสัญญาณปลายทาง"}` } : m))
        );
      }
    } catch (err: any) {
      setChatMessages((prev) =>
        prev.map((m) => (m.id === aiMsgId ? { ...m, text: `❌ การเชื่อมต่อล้มเหลว: ${err.message}` } : m))
      );
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={`flex w-screen h-screen overflow-hidden ${isDarkMode ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"}`}
    >
      
      {/* ================= ฝั่งซ้าย: MEETING PANEL ================= */}
      <div 
        ref={leftPaneRef} 
        style={{ width: "60%" }} 
        className="min-w-[200px] bg-black flex flex-col justify-between overflow-hidden"
      >
        {/* หน้าต่างแสดงผลวิดีโอหลัก (Video Area) */}
        <div className="flex-1 flex items-center justify-center p-4 bg-slate-950 relative">
          {isMeetingActive ? (
            meetingProvider === "jitsi" ? (
              <iframe 
                src="https://meet.jit.si/PhraeMeetingRoom" 
                allow="microphone; camera" 
                className="w-full h-full border-none rounded-lg"
              />
            ) : (
              <div className="text-center p-6 bg-slate-900 rounded-xl border border-slate-800 max-w-md">
                <div className="text-emerald-500 text-5xl mb-3">🌐</div>
                <h4 className="text-base font-bold text-white mb-1">Cisco Webex กำลังทำงานในหน้าต่างใหม่</h4>
                <p className="text-xs text-slate-400 mb-4">ระบบเปิดท่อลิงก์เพื่อเรียกแอปพลิเคชันหรือแท็บภายนอกเรียบร้อยแล้วครับ</p>
                <a
                  href={savedMeetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-700 transition"
                >
                  คลิกเพื่อเปิด Webex อีกครั้ง
                </a>
              </div>
            )
          ) : (
            <div className="text-center text-slate-500">
              <div className="text-5xl mb-3">📹</div>
              <p className="text-sm font-medium">กรุณาเลือกโหมดสัญญาณระบบการประชุมด้านล่างครับพี่</p>
            </div>
          )}
        </div>

        {/* แผงควบคุมระบบการประชุมและการอัดบันทึกด้านล่างฝั่งซ้าย */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex gap-3 justify-center items-center">
          <button
            onClick={() => handleLaunchMeeting("webex")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-1.5 transition"
          >
            🔵 Cisco Webex
          </button>
          
          <button
            onClick={() => handleLaunchMeeting("jitsi")}
            className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-4 py-2 rounded text-xs font-semibold flex items-center gap-1.5 transition"
          >
            🟢 Jitsi Meeting (Backup)
          </button>
          
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`border px-4 py-2 rounded text-xs font-bold flex items-center gap-1.5 transition ${
              isRecording 
                ? "bg-rose-950 text-rose-400 border-rose-800 animate-pulse" 
                : "bg-slate-800 text-rose-400 border-slate-700 hover:bg-slate-700"
            }`}
          >
            🔴 {isRecording ? "กำลังบันทึกเสียง..." : "บันทึกเสียงรายงาน"}
          </button>
        </div>
      </div>

      {/* ================= แถบกลาง: RESIZER BAR (ลากได้ราบรื่น) ================= */}
      <div 
        onMouseDown={handleMouseDown}
        className="w-2 bg-slate-300 dark:bg-slate-800 cursor-col-resize hover:bg-blue-500 dark:hover:bg-blue-600 flex items-center justify-center font-bold text-[10px] text-slate-500 select-none transition-colors duration-200"
      >
        ||
      </div>

      {/* ================= ฝั่งขวา: AI ASSISTANT TERMINAL WORKSPACE ================= */}
      <div className={`flex-1 min-w-[300px] flex flex-col ${isDarkMode ? "bg-slate-900" : "bg-white"}`}>
        
        {/* หัวหน้าต่างควบคุมและสลับโมเดล AI (Header Config) */}
        <div className={`p-4 border-b flex flex-col gap-3 ${isDarkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
          
          {/* แถวกรอก URL ห้องประชุมหลักมหาดไทย */}
          <div className="flex gap-2">
            <input
              type="text"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="กรอก/วาง URL Link สำหรับห้องประชุม Cisco Webex..."
              className={`flex-1 text-xs px-3 py-2 rounded-md border focus:outline-none ${
                isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"
              }`}
            />
            <button
              onClick={handleSaveMeetingLink}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-bold rounded-md transition"
            >
              บันทึก Link
            </button>
          </div>

          {/* แถวการเลือกโมเดลและปุ่มสลับธีม */}
          <div className="flex gap-2 items-center justify-between">
            <div className="flex gap-2 flex-1">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className={`text-xs p-2 rounded-md border focus:outline-none font-medium ${
                  isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"
                }`}
              >
                <option value="thaiLLM">ThaiLLM (ระบบหลักโครงการ)</option>
                <option value="gemini">Google Gemini (วิเคราะห์เร็วสูง)</option>
                <option value="chatgpt">ChatGPT OpenAI (ระบบสำรอง)</option>
              </select>
              
              <input
                type="password"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder={selectedModel === "thaiLLM" ? "ใส่ Token ค่าย ThaiLLM..." : "วาง API Key / Token ที่นี่..."}
                className={`flex-1 text-xs px-3 py-2 rounded-md border focus:outline-none ${
                  isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"
                }`}
              />
            </div>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`ml-2 px-3 py-2 text-xs font-bold rounded-md border transition shrink-0 ${
                isDarkMode 
                  ? "bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700" 
                  : "bg-slate-200 border-slate-300 text-slate-700 hover:bg-slate-300"
              }`}
            >
              {isDarkMode ? "☀️ สว่าง" : "🌙 มืด"}
            </button>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            ℹ️ ปรับสัดส่วนการมองเห็นหน้าจอได้อิสระโดยการคลิกลากแถบคั่นตรงกลางฝั่งซ้ายได้เลยครับ
          </div>
        </div>

        {/* พื้นที่กล่องสนทนาแชต (Chat Box Area) */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[85%] rounded-xl p-3 text-sm leading-relaxed border ${
                msg.role === "user"
                  ? "self-end bg-blue-600 text-white border-blue-500 rounded-br-none"
                  : msg.role === "system"
                  ? "self-center bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-xs border-amber-200 dark:border-amber-900"
                  : isDarkMode
                  ? "self-start bg-slate-800 text-slate-100 border-slate-700 rounded-bl-none"
                  : "self-start bg-slate-50 text-slate-900 border-slate-200 rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>

        {/* พื้นที่อินพุตสำหรับส่งข้อความและอัปโหลดไฟล์วาระ (Input Area) */}
        <div className={`p-4 border-t flex gap-2 items-center ${isDarkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
          <input
            type="file"
            ref={fileInputRef}
            onChange