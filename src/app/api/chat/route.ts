import { NextResponse } from 'next/server';

export const runtime = 'edge'; // รันระบบหลังบ้านแบบความเร็วสูงบน Edge Runtime ของ Vercel

// ฟังก์ชันจำลองการแปลภาษาอย่างง่าย (ไทย -> อังกฤษ) เพื่อประหยัด Token ตามที่พี่ออกแบบไว้
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

    // 🎯 ระบบจัดลำดับ API ลำดับที่ 1 -> 2 -> 3 -> 4 (API Pool Failover System ชุดครอบจักรวาล)
    // หากหน้าบ้านไม่มีการส่งค่ามา ระบบจะใช้ชุดคีย์หลักของระบบที่ใส่ไว้ให้ตรงนี้ทันทีครับพี่!
    const activePool = apiPool && apiPool.length > 0 ? apiPool : [
      // ช่องที่ 1: ThaiLLM (Gateway หลัก)
      { 
        provider: 'thaillm', 
        url: 'https://playground.thaillm.or.th/api/v1', 
        key: process.env.THAILLM_API_KEY || 'mbnr62PY5yMtnDOjDq4rAQ5uhszXKDEt', 
        model: 'opentaigpt-thaillm-8b-instruct-v7.2' 
      },
      // ช่องที่ 2: Gemini API ของ Google (สำหรับงานวิเคราะห์เอกสารฉับไว)
      { 
        provider: 'gemini', 
        url: 'https://generativelanguage.googleapis.com/v1beta/openai', 
        key: process.env.GEMINI_API_KEY || 'AIzaSyYourGeminiKeyHere...', // 💡 พี่สามารถเอารหัสคีย์จริงมาวางแทนตรงนี้ได้เลยครับ
        model: 'gemini-1.5-flash' 
      },
      // ช่องที่ 3: ChatGPT API ของ OpenAI (ระบบสำรองข้อมูลมาตรฐานสากล)
      { 
        provider: 'openai', 
        url: 'https://api.openai.com/v1', 
        key: process.env.OPENAI_API_KEY || 'sk-proj-YourOpenAIKeyHere...', // 💡 พี่สามารถเอารหัสคีย์จริงมาวางแทนตรงนี้ได้เลยครับ
        model: 'gpt-4o-mini' 
      }
    ];

    let lastError = '';
    
    // วนลูปทดสอบเรียกใช้งานตามลำดับความสำคัญ (หากคีย์แรกตาย จะกระโดดไปคีย์ถัดไปทันที)
    for (let i = 0; i < activePool.length; i++) {
      const slot = activePool[i];
      if (!slot.key || !slot.key.trim() || slot.key.includes('Your')) continue; // ข้ามช่องที่ไม่มีคีย์จริง

      try {
        let fetchUrl = '';
        let headers: Record<string, string> = { 'Content-Type': 'application/json' };
        let bodyPayload = {};

        // 🟢 แยกโครงสร้างการเรียกตามประเภทของ Provider อัจฉริยะ
        if (slot.provider === 'openai' || slot.provider === 'thaillm' || slot.provider === 'gemini') {
          // จัดระเบียบข้อกำหนด URL ปลายทางของแต่ละค่ายให้ถูกต้องผ่านช่องทางสากล (OpenAI Compatibility)
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
        } else if (slot.provider === 'ollama') {
          // รองรับกรณีพี่เปิดรันเซิร์ฟเวอร์ Local โมเดลในเครื่องคอมพิวเตอร์สำนักงาน
          fetchUrl = `${slot.url || 'http://localhost:11434'}/api/generate`;
          bodyPayload = {
            model: slot.model || 'llama3',
            prompt: promptContent,
            stream: false
          };
        }

        // ยิงคำขอจากหลังบ้าน Vercel (ปลอดภัย 100% ไม่ติด CORS และไม่เห็นคีย์รั่วไหลไปหน้าบ้าน)
        const response = await fetch(fetchUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(bodyPayload),
          signal: AbortSignal.timeout(12000) // ดึงข้อมูลไม่เกิน 12 วินาที ป้องกันหน้าเว็บค้าง
        });

        if (response.ok) {
          const data = await response.json();
          let replyText = '';

          // แตกโครงสร้าง JSON รับค่าของแต่ละค่าย
          if (slot.provider === 'openai' || slot.provider === 'thaillm' || slot.provider === 'gemini') {
            replyText = data.choices?.[0]?.message?.content || '';
          } else if (slot.provider === 'ollama') {
            replyText = data.response || '';
          }

          if (replyText) {
            // ส่งคำตอบกลับหน้าบ้านทันทีเมื่อเจอกล่องที่ทำงานได้สำเร็จ!
            return NextResponse.json({
              reply: replyText,
              usedSlot: i + 1, // บอกหน้าบ้านว่าความสำเร็จรอบนี้มาจากกล่องลำดับที่เท่าไร
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

    // หากทดสอบจนครบทุกกล่องแล้วไม่มีตัวไหนผ่านเลย จะส่งสรุปขยะข้อมูลนี้ไปฟ้องหน้าจอหน้าเว็บ
    return NextResponse.json({ error: `ระบบ API Pool ล้มเหลวทุกช่องทางล่าสุด: ${lastError}` }, { status: 502 });

  } catch (error: any) {
    return NextResponse.json({ error: `เกิดข้อผิดพลาดในระบบประมวลผลเครือข่าย: ${error.message}` }, { status: 500 });
  }
}