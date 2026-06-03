import { NextResponse } from 'next/server';

export const runtime = 'edge';

function simpleTranslateToEnglish(text: string): string {
  const lowercaseText = text.toLowerCase();
  if (lowercaseText.includes('สรุปการประชุม') || lowercaseText.includes('สรุปวาระ')) {
    return "Please summarize this procurement meeting agenda in a formal tone.";
  }
  if (lowercaseText.includes('ระเบียบพัสดุ') || lowercaseText.includes('กฎหมายจัดซื้อ')) {
    return "What are the core Thai government procurement regulations related to this context?";
  }
  if (lowercaseText.includes('สัญญา') || lowercaseText.includes('ยกเลิกสัญญา')) {
    return "Explain the standard legal terms and criteria for contract termination under government rules.";
  }
  return `Regarding government procurement and boardroom workflow, please analyze and respond to this query: "${text}"`;
}

export async function POST(req: Request) {
  try {
    const { message, apiPool, useTranslation } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'กรุณาระบุข้อความ' }, { status: 400 });
    }

    const promptContent = useTranslation ? simpleTranslateToEnglish(message) : message;

    // 🎯 ค่าเริ่มต้นระบบสำรอง (Fallback) กรณีหน้าบ้านส่งค่ามาว่างเปล่าทั้งหมด
    const defaultPool = [
      { 
        provider: 'thaillm', 
        url: 'https://playground.thaillm.or.th/api/v1', 
        key: process.env.THAILLM_API_KEY || 'mbnr62PY5yMtnDOjDq4rAQ5uhszXKDEt', 
        model: 'opentaigpt-thaillm-8b-instruct-v7.2' 
      },
      { 
        provider: 'gemini', 
        url: 'https://generativelanguage.googleapis.com/v1beta/openai', 
        key: process.env.GEMINI_API_KEY || '',
        model: 'gemini-1.5-flash' 
      },
      { 
        provider: 'openai', 
        url: 'https://api.openai.com/v1', 
        key: process.env.OPENAI_API_KEY || '',
        model: 'gpt-4o-mini' 
      }
    ];

    // 🛡️ ดักจับและคัดกรองข้อมูลจากหน้าบ้านอย่างละเอียด ป้องกันการพังของโค้ด (Safety Filter)
    let activePool = [];
    if (apiPool && Array.isArray(apiPool) && apiPool.length > 0) {
      activePool = apiPool.filter(slot => {
        return slot && 
               slot.key && slot.key.trim() !== '' && 
               slot.url && slot.url.trim() !== '' &&
               !slot.key.includes('Your'); // ข้ามคีย์ทดสอบที่ไม่ได้เปลี่ยนจริง
      });
    }

    // ถ้าคัดกรองแล้วไม่มีคีย์ใดๆ ส่งมาจากหน้าบ้านเลย ให้สลับไปใช้คีย์หลักของระบบทันที
    if (activePool.length === 0) {
      activePool = defaultPool.filter(slot => slot.key && slot.key.trim() !== '');
    }

    // หากท้ายที่สุดแล้วไม่มีคีย์ของค่ายไหนพร้อมใช้งานเลย ให้แจ้งเตือนหน้าบ้านทันทีอย่างสุภาพ
    if (activePool.length === 0) {
      return NextResponse.json({ error: 'ไม่พบ API Key ที่พร้อมใช้งานในระบบ กรุณากรอกระบุอย่างน้อย 1 ค่ายครับ' }, { status: 400 });
    }

    let lastError = '';
    
    // วนลูปทำงานเฉพาะช่องที่มีข้อมูลจริงเท่านั้น
    for (let i = 0; i < activePool.length; i++) {
      const slot = activePool[i];

      try {
        let fetchUrl = '';
        let headers: Record<string, string> = { 'Content-Type': 'application/json' };
        let bodyPayload = {};

        if (slot.provider === 'openai' || slot.provider === 'thaillm' || slot.provider === 'gemini') {
          // 🛡️ ป้องกันระบบล่ม: ตรวจสอบความปลอดภัยของ URL ก่อนใช้คำสั่งจัดการข้อความ
          let cleanUrl = slot.url ? slot.url.trim() : '';
          if (!cleanUrl) continue;

          if (!cleanUrl.endsWith('/chat/completions')) {
            cleanUrl = cleanUrl.endsWith('/') ? `${cleanUrl}chat/completions` : `${cleanUrl}/chat/completions`;
          }
          fetchUrl = cleanUrl;
          headers['Authorization'] = `Bearer ${slot.key.trim()}`;
          
          bodyPayload = {
            model: slot.model || 'opentaigpt-thaillm-8b-instruct-v7.2',
            messages: [
              { role: 'system', content: 'คุณคือ AI ผู้ช่วยสนับสนุนการประชุมและการจัดซื้อจัดจ้างอัจฉริยะ ตอบคำถามด้วยข้อมูลราชการที่เป็นทางการ แม่นยำ และกระชับ' },
              { role: 'user', content: promptContent }
            ],
            temperature: 0.3,
            max_tokens: 1500
          };
        }

        const response = await fetch(fetchUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(bodyPayload),
          signal: AbortSignal.timeout(12000) // จำกัดเวลา 12 วินาทีต่อค่าย
        });

        if (response.ok) {
          const data = await response.json();
          let replyText = '';

          if (data.choices?.[0]?.message?.content) {
            replyText = data.choices[0].message.content;
          } else if (data.reply) {
            replyText = data.reply;
          } else if (data.response) {
            replyText = data.response;
          } else if (typeof data === 'string') {
            replyText = data;
          } else {
            replyText = JSON.stringify(data);
          }

          if (replyText) {
            return NextResponse.json({
              reply: replyText,
              usedSlot: i + 1,
              provider: slot.provider,
              translated: useTranslation
            });
          }
        } else {
          lastError = `ค่าย ${slot.provider.toUpperCase()} แจ้ง Error: ${response.status}`;
        }
      } catch (err: any) {
        lastError = `ค่าย ${slot.provider.toUpperCase()} ไม่ตอบสนอง: ${err.message}`;
      }
    }

    return NextResponse.json({ error: `ระบบ API Pool ล้มเหลว: ${lastError}` }, { status: 502 });

  } catch (error: any) {
    return NextResponse.json({ error: `เกิดข้อผิดพลาดหลังบ้าน: ${error.message}` }, { status: 500 });
  }
}