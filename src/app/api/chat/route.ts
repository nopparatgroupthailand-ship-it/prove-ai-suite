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

    const activePool = apiPool && apiPool.length > 0 ? apiPool : [
      { 
        provider: 'thaillm', 
        url: 'https://playground.thaillm.or.th/api/v1', 
        key: process.env.THAILLM_API_KEY || 'mbnr62PY5yMtnDOjDq4rAQ5uhszXKDEt', 
        model: 'opentaigpt-thaillm-8b-instruct-v7.2' 
      },
      { 
        provider: 'gemini', 
        url: 'https://generativelanguage.googleapis.com/v1beta/openai', 
        key: process.env.GEMINI_API_KEY || 'AIzaSyYourGeminiKeyHere...',
        model: 'gemini-1.5-flash' 
      },
      { 
        provider: 'openai', 
        url: 'https://api.openai.com/v1', 
        key: process.env.OPENAI_API_KEY || 'sk-proj-YourOpenAIKeyHere...',
        model: 'gpt-4o-mini' 
      }
    ];

    let lastError = '';
    
    for (let i = 0; i < activePool.length; i++) {
      const slot = activePool[i];
      if (!slot.key || !slot.key.trim() || slot.key.includes('Your')) continue;

      try {
        let fetchUrl = '';
        let headers: Record<string, string> = { 'Content-Type': 'application/json' };
        let bodyPayload = {};

        if (slot.provider === 'openai' || slot.provider === 'thaillm' || slot.provider === 'gemini') {
          let cleanUrl = slot.url;
          if (!cleanUrl.endsWith('/chat/completions')) {
            cleanUrl = cleanUrl.endsWith('/') ? `${cleanUrl}chat/completions` : `${cleanUrl}/chat/completions`;
          }
          fetchUrl = cleanUrl;
          headers['Authorization'] = `Bearer ${slot.key}`;
          
          bodyPayload = {
            model: slot.model,
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

          // 🎯 ปรับปรุงจุดแกะค่า JSON ใหม่ให้รองรับทุกมิติ ป้องกันคำตอบว่างเปล่า
          if (data.choices?.[0]?.message?.content) {
            replyText = data.choices[0].message.content;
          } else if (data.reply) {
            replyText = data.reply;
          } else if (data.response) {
            replyText = data.response;
          } else if (typeof data === 'string') {
            replyText = data;
          } else {
            // หากได้มาเป็นก้อน Object แปลกๆ ให้แปลงเป็นข้อความอ่านง่ายฟ้องออกมาเลย
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
          lastError = `กล่องลำดับที่ ${i + 1} (${slot.provider}) แจ้ง Error: ${response.status}`;
        }
      } catch (err: any) {
        lastError = `กล่องลำดับที่ ${i + 1} (${slot.provider}) ไม่ตอบสนอง: ${err.message}`;
      }
    }

    return NextResponse.json({ error: `ระบบ API Pool ล้มเหลวทุกช่องทางล่าสุด: ${lastError}` }, { status: 502 });

  } catch (error: any) {
    return NextResponse.json({ error: `เกิดข้อผิดพลาดในระบบประมวลผลเครือข่าย: ${error.message}` }, { status: 500 });
  }
}