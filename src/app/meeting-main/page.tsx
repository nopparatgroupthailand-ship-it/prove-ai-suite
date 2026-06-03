"use client";

import React from "react";

export default function MeetingMainPage() {
  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-900 overflow-hidden">
      
      {/* 1. Sidebar ซ้าย */}
      <aside className="w-20 bg-slate-900 flex flex-col items-center py-8 space-y-10 text-white">
        <div className="text-2xl font-bold text-blue-400">P</div>
        <div className="space-y-6 opacity-60">
          <div>🏠</div>
          <div>📋</div>
          <div>📂</div>
          <div>⚙️</div>
        </div>
      </aside>

      {/* 2. Content กลาง */}
      <main className="flex-1 flex flex-col p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Project Management Dashboard</h1>
            <p className="text-gray-500">โครงการปัจจุบัน | สถานะ: กำลังดำเนินการ</p>
          </div>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">
            + สร้างโครงการใหม่
          </button>
        </header>

        <section className="grid grid-cols-3 gap-6 mb-8">
          {[
            { title: "งบประมาณรวม", val: "—" },
            { title: "ความคืบหน้า", val: "—" },
            { title: "ระดับความเสี่ยง", val: "—" }
          ].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">{item.title}</p>
              <h2 className="text-2xl font-bold">{item.val}</h2>
            </div>
          ))}
        </section>

        <section className="flex-1 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-bold mb-4">ตารางแผนการดำเนินงาน</h3>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
            [ แสดงข้อมูลตาราง ]
          </div>
        </section>
      </main>

      {/* 3. Panel ขวา */}
      <aside className="w-80 bg-white border-l border-gray-200 p-6 flex flex-col">
        <h2 className="font-bold mb-6">AI Project Summary</h2>
        <div className="flex-1 space-y-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-600">ระบบประมวลผลสรุปข้อมูลโครงการและเอกสารที่เกี่ยวข้อง</p>
          </div>
        </div>
        <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium">
          ดาวน์โหลดรายงานสรุป
        </button>
      </aside>
    </div>
  );
}