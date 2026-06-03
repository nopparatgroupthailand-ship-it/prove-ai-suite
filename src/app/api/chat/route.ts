import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { message, apiPool } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'กรุณาระบุข้อความ' }, { status: 400 });
    }

    // คัดกรองคีย์ที่ส่งมาจากหน้าบ้าน
    let activePool = [];
    if (apiPool && Array.isArray(apiPool)) {
      activePool = apiPool.filter(slot => slot && slot.key && slot.key.trim() !== '');
    }

    if (activePool.length === 0) {
      return NextResponse.json({ error: 'ไม่พบ API Key ในระบบ Pool กรุณากรอกคีย์หน้าบ้านและกดบันทึกก่อนครับ' }, { status: 400 });
    }

    let lastError = '';

    // วนลูปยิงตามชุดลำดับ Pool (ถ้าช่อง 1 พัง จะโดดไปช่อง 2 อัตโนมัติ)
    for (let i = 0; i < activePool.length; i++) {
      const slot = activePool[i];
      const providerType = slot.provider ? slot.provider.toLowerCase() : '';

      try {
        // 🟢 [ท่อที่ 1] กรณีเป็นค่าย GOOGLE GEMINI (ยิงแบบ Native API เพื่อความเสถียรและความเร็ว)
        if (providerType === 'gemini') {
          const modelName = 'gemini-3-flash-preview'; 
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${slot.key.trim()}`;

          const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: message }] }],
              generationConfig: { temperature: 0.3 }
            }),
            signal: AbortSignal.timeout(12000)
          });

          if (response.ok) {
            const data = await response.json();
            const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (replyText) {
              return NextResponse.json({
                reply: replyText,
                usedSlot: i + 1,
                provider: 'gemini'
              });
            }
          }
          const errData = await response.text();
          lastError = `ค่าย GEMINI แจ้งปัญหา: ${response.status} - ${errData}`;
        } 
        
        // 🟡 [ท่อที่ 2] กรณีเป็นค่าย ThaiLLM (อ้างอิงตามโครงสร้าง OpenAI-compatible ของทางสมาคมฯ)
        else if (providerType === 'thaillm') {
          const thaillmUrl = 'https://thaillm.or.th/api/v1/chat/completions';
          const modelName = slot.model || 'opentaigpt-thaillm-8b-instruct-v7.2';

          const response = await fetch(thaillmUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${slot.key.trim()}`
            },
            body: JSON.stringify({
              model: modelName,
              messages: [{ role: 'user', content: message }],
              temperature: 0.3
            }),
            signal: AbortSignal.timeout(12000)
          });

          if (response.ok) {
            const data = await response.json();
            const replyText = data.choices?.[0]?.message?.content;
            if (replyText) {
              return NextResponse.json({
                reply: replyText,
                usedSlot: i + 1,
                provider: 'thaillm'
              });
            }
          }
          const errData = await response.text();
          lastError = `ค่าย ThaiLLM แจ้งปัญหา: ${response.status} - ${errData}`;
        }

        // 🔵 [ท่อที่ 3] กรณีเป็นค่ายอื่นๆ มาตรฐาน (เช่น OpenAI สแตนด์บายสำรองระบบ)
        else {
          let cleanUrl = slot.url ? slot.url.trim() : 'https://api.openai.com/v1';
          if (!cleanUrl.endsWith('/chat/completions')) {
            cleanUrl = cleanUrl.endsWith('/') ? `${cleanUrl}chat/completions` : `${cleanUrl}/chat/completions`;
          }

          const response = await fetch(cleanUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${slot.key.trim()}`
            },
            body: JSON.stringify({
              model: slot.model || 'gpt-4o-mini',
              messages: [{ role: 'user', content: message }],
              temperature: 0.3
            }),
            signal: AbortSignal.timeout(12000)
          });

          if (response.ok) {
            const data = await response.json();
            const replyText = data.choices?.[0]?.message?.content;
            if (replyText) {
              return NextResponse.json({
                reply: replyText,
                usedSlot: i + 1,
                provider: providerType
              });
            }
          }
          lastError = `ค่าย ${providerType.toUpperCase()} แจ้งปัญหา: ${response.status}`;
        }
      } catch (err: any) {
        lastError = `ช่องลำดับที่ ${i + 1} (${providerType}) ตรวจพบปัญหาภายใน: ${err.message}`;
      }
    }

    return NextResponse.json({ error: `ระบบ API Pool ล้มเหลวทุกช่องทาง: ${lastError}` }, { status: 502 });

  } catch (error: any) {
    return NextResponse.json({ error: `เกิดข้อผิดพลาดที่ระบบหลังบ้าน: ${error.message}` }, { status: 500 });
  }
}