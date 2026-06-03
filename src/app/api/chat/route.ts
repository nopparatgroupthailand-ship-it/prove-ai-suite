import { NextResponse } from 'next/server';

export const runtime = 'edge'; // รันระบบหลังบ้านแบบความเร็วสูงบน Edge Runtime ของ Vercel

// ฟังก์ชันจำลองการแปลภาษาอย่างง่าย (ไทย -> อังกฤษ) เพื่อประหยัด Token ตามที่พี่ออกแบบไว้
// 💡 ในอนาคตพี่สามารถเปลี่ยนไปเชื่อมต่อกับ Google Translate API หรือ LLM ตัวเล็กได้ง่ายๆ ตรงจุดนี้ครับ
function simpleTranslateToEnglish(text: string): string {
  const lowercaseText = text.toLowerCase();
  
  // ชุดข้อมูลคำสำคัญสำหรับระบบสนับสนุนการประชุมจัดซื้อจัดจ้างและการพัสดุ
  if (lowercaseText.includes('สรุปการประชุม') || lowercaseText.includes('สรุปวาระ')) {
    return "Please summarize this procurement meeting agenda in a formal tone.";
  }
  if (lowercaseText.includes('ระเบียบพัสดุ') || lowercaseText.includes('กฎหมายจัดซื้อ')) {
    return "What are the core Thai government procurement regulations related to this context?";
  }
  if (lowercaseText.includes('สัญญา') || lowercaseText.includes('ยกเลิกสัญญา')) {
    return "Explain the standard legal terms and criteria for contract termination under government rules.";
  }
  
  // หากคำถามทั่วไป ส่งข้อความแบบมาตรฐานเพื่อประหยัด Token ในโครงสร้างภาษาอังกฤษ
  return `Regarding government procurement and boardroom workflow, please analyze and respond to this query: "${text}"`;
}

export async function POST(req: Request) {
  try {
    const { message, apiPool, useTranslation } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'กรุณาระบุข้อความ' }, { status: 400 });
    }

    // เตรียมข้อความที่จะส่งหา AI (หากเปิดโหมดประหยัด Token จะแปลงเป็นอังกฤษก่อน)
    const promptContent = useTranslation ? simpleTranslateToEnglish(message) : message;

    // ระบบจัดลำดับ API ลำดับที่ 1 -> 2 -> 3 (API Pool Failover System)
    // ดึงค่าอาเรย์รายการคีย์มาจากหน้าบ้านที่ผู้ใช้งานตั้งค่าไว้
    const activePool = apiPool && apiPool.length > 0 ? apiPool : [
      { provider: 'openai', url: 'https://thaillm.or.th/api/v1', key: process.env.THAILLM_API_KEY || 'mbnr62PY5yMtnDOjDq4rAQ5uhszXKDEt', model: 'opentaigpt-thaillm-8b-instruct-v7.2' }
    ];

    let lastError = '';
    
    // วนลูปทดสอบเรียกใช้งานตามลำดับความสำคัญ (กรอบที่ 1 -> กรอบที่ 2 -> กรอบที่ 3)
    for (let i = 0; i < activePool.length; i++) {
      const slot = activePool[i];
      if (!slot.key || !slot.key.trim()) continue; // ข้ามช่องที่ไม่มีคีย์

      try {
        let fetchUrl = '';
        let headers: Record<string, string> = { 'Content-Type': 'application/json' };
        let bodyPayload = {};

        // แยกโครงสร้างการเรียกตามประเภทของ Provider
        if (slot.provider === 'openai' || slot.provider === 'thaillm') {
          // รองรับทั้ง URL สำเร็จรูปและ URL ที่พิมพ์มาเฉพาะโดเมนหลัก
          const cleanUrl = slot.url.endsWith('/chat/completions') ? slot.url : `${slot.url}/chat/completions`;
          fetchUrl = cleanUrl;
          headers['Authorization'] = `Bearer ${slot.key}`;
          bodyPayload = {
            model: slot.model || 'opentaigpt-thaillm-8b-instruct-v7.2',
            messages: [
              { role: 'system', content: 'คุณคือ AI ผู้ช่วยสนับสนุนการประชุมและการจัดซื้อจัดจ้างอัจฉริยะ ตอบคำถามด้วยข้อมูลราชการที่เป็นทางการ แม่นยำ และกระชับ' },
              { role: 'user', content: promptContent }
            ],
            temperature: 0.3,
            max_tokens: 1500
          };
        } else if (slot.provider === 'ollama') {
          fetchUrl = `${slot.url || 'http://localhost:11434'}/api/generate`;
          bodyPayload = {
            model: slot.model || 'llama3',
            prompt: promptContent,
            stream: false
          };
        }

        // ยิงคำขอจากเซิร์ฟเวอร์หลังบ้านของ Vercel (ปลอดภัย ไม่ติดปัญหา CORS 100%)
        const response = await fetch(fetchUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(bodyPayload),
          signal: AbortSignal.timeout(12000) // จำกัดเวลาดึงข้อมูล 12 วินาที ถ้าคีย์ตายหรือช้าเกินไปให้กระโดดไปคีย์ถัดทันที
        });

        if (response.ok) {
          const data = await response.json();
          let replyText = '';

          // แตกโครงสร้างรับค่าให้เข้ากับค่าย AI แตกต่างกัน
          if (slot.provider === 'openai' || slot.provider === 'thaillm') {
            replyText = data.choices?.[0]?.message?.content || '';
          } else if (slot.provider === 'ollama') {
            replyText = data.response || '';
          }

          if (replyText) {
            // ส่งคำตอบกลับหน้าบ้านทันที พร้อมระบุป้ายบอกว่าดึงข้อมูลสำเร็จจาก API ลำดับที่เท่าใด
            return NextResponse.json({
              reply: replyText,
              usedSlot: i + 1, // ส่งกลับบอกหน้าบ้านว่าโควตาความสำเร็จมาจากกล่องลำดับที่เท่าไหร่
              translated: useTranslation
            });
          }
        } else {
          lastError = `กล่องลำดับที่ ${i + 1} ตอบกลับด้วยรหัสข้อผิดพลาด: ${response.status}`;
        }
      } catch (err: any) {
        lastError = `กล่องลำดับที่ ${i + 1} ไม่ตอบสนอง: ${err.message}`;
      }
    }

    // หากวนลูปครบทั้ง 3 กล่องแล้วคีย์พังทั้งหมด จะพ่นข้อผิดพลาดนี้ออกมาบอกหน้าเว็บ
    return NextResponse.json({ error: `ระบบ API Pool ล้มเหลวทุกช่องทางล่าสุด: ${lastError}` }, { status: 502 });

  } catch (error: any) {
    return NextResponse.json({ error: `เกิดข้อผิดพลาดในการประมวลผล: ${error.message}` }, { status: 500 });
  }
}