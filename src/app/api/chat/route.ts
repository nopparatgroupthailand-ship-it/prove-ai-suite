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

    // 🛡️ คัดกรองข้อมูลระบบ Pool จากหน้าบ้าน
    let activePool = [];
    if (apiPool && Array.isArray(apiPool) && apiPool.length > 0) {
      activePool = apiPool.filter(slot => slot && slot.key && slot.key.trim() !== '');
    }

    // 🎯 ถ้าไม่มีคีย์ส่งมาจากหน้าบ้านเลย จะใช้คีย์ระบบหลักหลังบ้านสำรองให้ทำงาน
    if (activePool.length === 0) {
      activePool = [
        { 
          provider: 'thaillm', 
          url: 'https://thaillm.or.th/api/v1', 
          key: process.env.THAILLM_API_KEY || 'mbnr62PY5yMtnDOjDq4rAQ5uhszXKDEt', 
          model: 'opentaigpt-thaillm-8b-instruct-v7.2' 
        }
      ];
    }

    let lastError = '';
    
    // วนลูปยิงเช็คระบบตามลำดับ Pool
    for (let i = 0; i < activePool.length; i++) {
      const slot = activePool[i];

      try {
        let fetchUrl = '';
        let headers: Record<string, string> = { 'Content-Type': 'application/json' };
        let bodyPayload = {};

        if (slot.provider === 'openai' || slot.provider === 'thaillm' || slot.provider === 'gemini') {
          let cleanUrl = slot.url ? slot.url.trim() : '';

          // 🛠️ จุดดักจับและแก้ไขถาวร: ถ้าตรวจเจอคำว่า playground ให้สลับมาใช้ URL จริงทันทีเพื่อป้องกัน 404
          if (cleanUrl.includes('playground.thaillm.or.th')) {
            cleanUrl = 'https://thaillm.or.th/api/v1';
          }
          
          // ถ้าเป็นค่าว่าง ให้ใช้ URL มาตรฐานของ ThaiLLM
          if (!cleanUrl) {
            cleanUrl = 'https://thaillm.or.th/api/v1';
          }

          // จัดรูปแบบส่วนท้าย Endpoint ให้ตรงตามมาตรฐาน OpenAI Specification
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
          signal: AbortSignal.timeout(12000)
        });

        if (response.ok) {
          const data = await response.json();
          let replyText = '';

          // แตกโครงสร้าง JSON ของผู้ให้บริการแต่ละค่าย
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
          lastError = `ค่าย ${slot.provider.toUpperCase()} แจ้ง Error: ${response.status} (Endpoint ที่เรียก: ${fetchUrl})`;
        }
      } catch (err: any) {
        lastError = `ค่าย ${slot.provider.toUpperCase()} ไม่ตอบสนอง: ${err.message}`;
      }
    }

    return NextResponse.json({ error: `ระบบ API Pool ล้มเหลวทุกช่องทาง: ${lastError}` }, { status: 502 });

  } catch (error: any) {
    return NextResponse.json({ error: `เกิดข้อผิดพลาดที่ระบบหลังบ้าน: ${error.message}` }, { status: 500 });
  }
}