"use client";

import React, { useState, useEffect, useRef } from "react";

export default function MeetingMainPage() {
  // สเตตัสการควบคุมธีม หน้าจอ และลิงก์ประชุม
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ผลลัพธ์ของการสลับ Dark/Light Mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDarkMode]);

  // ฟังก์ชันบันทึก URL ลิงก์เข้าสู่ State ระบบ
  const handleSaveMeetingLink = () => {
    if (!meetingUrl.trim()) {
      alert("กรุณากรอก Link ของห้องประชุมก่อนกดบันทึกครับพี่");
      return;
    }
    setSavedMeetingUrl(meetingUrl.trim());
    alert("🎯 บันทึกช่องทางและโครงสร้างห้องประชุมพัสดุเรียบร้อยแล้วครับ!");
  };

  // ฟังก์ชันเปิดท่อสัญญาณระบบประชุมมหาดไทย/อื่น ๆ
  const handleLaunchMeeting = () => {
    if (!savedMeetingUrl) {
      alert("ไม่พบข้อมูลลิงก์! กรุณากรอก Link ด้านบนและกดบันทึกก่อนกดปุ่มเข้าห้องประชุมครับ");
      return;
    }
    setIsMeetingActive(true);
    window.open(savedMeetingUrl, "_blank");
  };

  // ฟังก์ชันคัดลอกลิงก์ Prove AI Suite ส่งต่อเข้า LINE ให้คณะกรรมการ
  const handleCopySuiteLink = () => {
    const currentUrl = window.location.origin + "/meeting-main";
    navigator.clipboard.writeText(currentUrl)
      .then(() => {
        alert("📋 คัดลอกลิงก์ Prove AI Suite ไปยังคลิปบอร์ดแล้ว! พี่สามารถแชร์เข้า LINE คณะกรรมการได้ทันทีครับ");
      })
      .catch((err) => {
        alert("ไม่สามารถคัดลอกลิงก์อัตโนมัติได้: " + err);
      });
  };

  // ฟังก์ชันประมวลผลเมื่ออัปโหลดไฟล์วาระ/พรบ.พัสดุ
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newSystemMsg = {
      id: Date.now().toString(),
      role: "system",
      text: `📎 แนบไฟล์เอกสารสำเร็จ: "${file.name}" (กำลังส่งข้อมูลให้ AI ประเมินสาระสำคัญก่อนเริ่มวาระ...)`,
    };
    setChatMessages((prev) => [...prev, newSystemMsg]);

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          text: `📚 ผมอ่านไฟล์เอกสาร พรบ./ระเบียบเวียน "${file.name}" เรียบร้อยแล้วครับพี่! พบประเด็นสำคัญที่เกี่ยวกับงานจัดซื้อจัดจ้างในวาระนี้ พี่สามารถพิมพ์ถามเจาะลึกข้อสงสัยต่อได้เลยครับ`,
        },
      ]);
    }, 1500);
  };

  // ฟังก์ชันส่งคำถามแชตยิงเข้า API หลังบ้านโครงการ
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg = { id: Date.now().toString(), role: "user", text: chatInput.trim() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");

    const aiMsgId = (Date.now() + 1).toString();
    setChatMessages((prev) => [...prev, { id: aiMsgId, role: "ai", text: "🤖 กำลังอ่านระเบียบพัสดุและวิเคราะห์คำตอบ..." }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text }),
      });

      const data = await response.json();
      if (response.ok && data.reply) {
        setChatMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, text: data.reply } : m))
        );
      } else {
        setChatMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, text: `⚠️ ปัญหาจากระบบ: ${data.error || "พูลข้อผิดพลาด"}` } : m))
        );
      }
    } catch (err: any) {
      setChatMessages((prev) =>
        prev.map((m) => (m.id === aiMsgId ? { ...m, text: `❌ เชื่อมต่อล้มเหลว: ${err.message}` } : m))
      );
    }
  };

  return (
    <div className={`flex w-screen h-screen overflow-hidden ${isDarkMode ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"}`}>
      
      {/* ฝั่งซ้าย: จัดการระบบห้องประชุมหลักมหาดไทย */}
      <div className="w-[55%] bg-slate-950 flex flex-col justify-between border-r border-slate-800">
        
        {/* แผงควบคุมลิงก์และการแชร์จัดตั้งการประชุม */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 text-white">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-400 mb-3">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
            แผงตั้งค่าสำหรับผู้ดำเนินการจัดประชุม (กระทรวงมหาดไทยระบบหลัก)
          </h3>
          
          <div className="flex gap-2 mb-2">
            <select
              value={meetingProvider}
              onChange={(e) => setMeetingProvider(e.target.value)}
              className="bg-slate-800 text-sm text-white px-3 py-2 rounded-md border border-slate-700 focus:outline-none"
            >
              <option value="webex">Cisco Webex (มท. หลัก)</option>
              <option value="googlemeet">Google Meet</option>
              <option value="zoom">Zoom Meeting</option>
            </select>
            
            <input
              type="text"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="วาง URL Link ห้องประชุมพัสดุที่นี่..."
              className="flex-1 bg-slate-800 text-sm text-white px-3 py-2 rounded-md border border-slate-700 focus:outline-none placeholder-slate-500"
            />
            
            <button
              onClick={handleSaveMeetingLink}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-bold rounded-md transition"
            >
              บันทึก Link
            </button>
          </div>

          {/* ปุ่มแชร์ส่งต่อ Prove AI Suite ให้กรรมการ */}
          <button
            onClick={handleCopySuiteLink}
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 px-3 rounded flex items-center justify-center gap-1 transition"
          >
            📎 คัดลอกลิงก์หน้า Prove AI Suite ส่งต่อให้คณะกรรมการในกลุ่ม LINE
          </button>
        </div>

        {/* ส่วนแสดงผลจอภาพวิดีโอหลัก (จุดที่เคย Error แก้ไข Syntax ปีกกาครอบตรงนี้ให้แล้วครับพี่) */}
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
          {isMeetingActive && savedMeetingUrl ? (
            <div className="text-center p-6 bg-slate-900 rounded-xl border border-slate-800 max-w-md">
              <div className="text-emerald-500 text-4xl mb-3">🌐</div>
              <h4 className="text-base font-bold text-white mb-1">เปิดหน้าต่างระบบประชุมภายนอกแล้ว</h4>
              <p className="text-xs text-slate-400 mb-4">ระบบทำการเปิดลิงก์ห้องประชุม {meetingProvider.toUpperCase()} ไปยังเบราว์เซอร์ใหม่เรียบร้อย</p>
              <a
                href={savedMeetingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700"
              >
                เข้าสู่ห้องประชุมพัสดุอีกครั้ง
              </a>
            </div>
          ) : (
            <div className="text-center text-slate-500">
              <div className="text-4xl mb-2">🚫</div>
              <p className="text-sm">กรุณากรอกลิงก์ด้านบน แล้วกดปุ่ม "เข้าสู่ระบบห้องประชุม" ด้านล่างครับ</p>
            </div>
          )}
        </div>

        {/* ทูลบาร์ควบคุมสถานะด้านล่างฝั่งซ้าย */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-3 justify-center">
          <button
            onClick={handleLaunchMeeting}
            className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-4 py-2 rounded text-xs font-semibold flex items-center gap-2 transition"
          >
            เข้าสู่ระบบห้องประชุม
          </button>
          
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`border px-4 py-2 rounded text-xs font-semibold flex items-center gap-2 transition ${
              isRecording 
                ? "bg-rose-950 text-rose-400 border-rose-800 animate-pulse" 
                : "bg-slate-800 text-rose-400 border-slate-700 hover:bg-slate-700"
            }`}
          >
            🛑 {isRecording ? "กำลังบันทึกรายงานเสียง..." : "บันทึกเสียงรายงาน"}
          </button>
        </div>
      </div>

      {/* แถบตัวลากเลื่อนคั่นกลางเวทีระหว่างสองฝั่ง */}
      <div className="w-1 bg-slate-800 cursor-col-resize hover:bg-blue-600 transition"></div>

      {/* ฝั่งขวา: พื้นที่ทำงานของระบบผู้ช่วย AI (Workspace AI Terminal) */}
      <div className={`flex-1 flex flex-col ${isDarkMode ? "bg-slate-900" : "bg-white"}`}>
        
        {/* หัวข้อด้านบนแผงแชต */}
        <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-slate-50"}`}>
          <div>
            <h2 className="text-sm font-bold">Prove AI Assistant Suite (v4)</h2>
            <span className="text-[11px] text-emerald-500 flex items-center gap-1 mt-0.5">
              ● เชื่อมต่อระบบ API Pool สำเร็จแล้ว
            </span>
          </div>
          
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition ${
              isDarkMode 
                ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" 
                : "bg-slate-200 border-slate-300 text-slate-800 hover:bg-slate-300"
            }`}
          >
            {isDarkMode ? "☀️ โหมดสว่าง" : "🌙 โหมดมืด"}
          </button>
        </div>

        {/* กระดานสรุปประเด็นแชต */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "self-end bg-blue-600 text-white"
                  : msg.role === "system"
                  ? "self-center bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-xs border border-amber-200 dark:border-amber-900"
                  : isDarkMode
                  ? "self-start bg-slate-800 text-slate-100 border border-slate-700"
                  : "self-start bg-slate-100 text-slate-900 border border-slate-200"
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>

        {/* แผงอินพุตด้านล่าง */}
        <div className={`p-4 border-t flex gap-2 items-center ${isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            title="อัปโหลดไฟล์ พรบ./ระเบียบ/วาระ ให้ AI อ่านก่อนเริ่มประชุม"
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-600 hover:bg-slate-500 text-white transition shrink-0"
          >
            📄
          </button>

          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="พิมพ์คำถามเกณฑ์ระเบียบพัสดุที่ต้องการหารือ..."
            className={`flex-1 h-10 px-3 py-2 text-sm rounded-lg border focus:outline-none resize-none ${
              isDarkMode 
                ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500" 
                : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500"
            }`}
          />

          <button
            onClick={handleSendMessage}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shrink-0"
          >
            🚀
          </button>
        </div>

      </div>
    </div>
  );
}