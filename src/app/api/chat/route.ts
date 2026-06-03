import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { message, apiPool, useTranslation } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'กรุณาระบุข้อความ' }, { status: 400 });
    }

    // คัดกรอง Pool ที่ส่งมาจากหน้าบ้าน
    let activePool = [];
    if (apiPool && Array.isArray(apiPool)) {
      activePool = apiPool.filter(slot => slot && slot.key && slot.key.trim() !== '');
    }

    if (activePool.length === 0) {
      return NextResponse.json({ error: 'ไม่พบ API Key ในระบบ Pool กรุณากรอกคีย์หน้าบ้านและกดบันทึกก่อนครับ' }, { status: 400 });
    }

    let lastError = '';

    // วนลูปตามระบบจัดลำดับ Pool
    for (let i = 0; i < activePool.length; i++) {
      const slot = activePool[i];
      const providerType = slot.provider ? slot.provider.toLowerCase() : '';

      try {
        // 🟢 กรณีเป็นค่าย GOOGLE GEMINI (ยิงเข้า Native API ของ Google โดยตรงเพื่อความเสถียร ไม่เจอ 404)
        if (providerType === 'gemini') {
          const modelName = slot.model || 'gemini-1.5-flash';
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
          lastError = `ค่าย GEMINI ปฏิเสธคำขอ: ${response.status} - ${errData}`;
        } 
        
        // 🔵 กรณีเป็นค่ายอื่นๆ (ThaiLLM / OpenAI) ที่ใช้โครงสร้าง OpenAI Format
        else {
          let cleanUrl = slot.url ? slot.url.trim() : '';
          
          // ดักจับ URL ผิดพลาดของ ThaiLLM
          if (cleanUrl.includes('playground.thaillm.or.th')) {
            cleanUrl = 'https://thaillm.or.th/api/v1';
          }
          if (!cleanUrl) {
            cleanUrl = providerType === 'openai' ? 'https://api.openai.com/v1' : 'https://thaillm.or.th/api/v1';
          }

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
              model: slot.model || 'opentaigpt-thaillm-8b-instruct-v7.2',
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
          lastError = `ค่าย ${providerType.toUpperCase()} แจ้ง Error: ${response.status}`;
        }
      } catch (err: any) {
        lastError = `ช่องลำดับที่ ${i + 1} (${providerType}) เกิดข้อผิดพลาด: ${err.message}`;
      }
    }

    return NextResponse.json({ error: `ระบบ API Pool ล้มเหลวทุกช่องทาง: ${lastError}` }, { status: 502 });

  } catch (error: any) {
    return NextResponse.json({ error: `เกิดข้อผิดพลาดที่ระบบหลังบ้าน: ${error.message}` }, { status: 500 });
  }
}