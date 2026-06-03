'use client';

import { useState } from 'react';

export default function SmartBoardroom() {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: 'สวัสดีครับ ผมคือผู้ช่วย AI ประจำคณะกรรมการ',
    },
  ]);

  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('ollama');

  const askAI = async () => {
    if (!text.trim()) return;

    const userText = text;
    setText('');

    setMessages((prev) => [
      ...prev,
      { role: 'user', text: userText },
      { role: 'ai', text: 'กำลังคิด...' },
    ]);

    try {
      let reply = '';

      // 🟢 OLLAMA (local)
      if (model === 'ollama') {
        const res = await fetch(`${apiKey}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemma2',
            prompt: userText,
            stream: false,
          }),
        });

        const data = await res.json();
        reply = data.response;
      }

      // 🟡 Gemini placeholder
      else if (model === 'gemini') {
        reply = 'Gemini mode (ต้องใส่ API logic)';
      }

      // 🔵 ChatGPT placeholder
      else if (model === 'chatgpt') {
        reply = 'ChatGPT mode (ต้องใส่ API logic)';
      }

      setMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1 ? { ...m, text: reply } : m
        )
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1
            ? { ...m, text: 'Error: ' + err.message }
            : m
        )
      );
    }
  };

  return (
    <div style={styles.app}>
      {/* LEFT PANEL */}
      <div style={styles.left}>
        <div style={styles.video}>
          🎥 Meeting Area
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={styles.right}>
        <div style={styles.header}>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <option value="ollama">Ollama</option>
            <option value="gemini">Gemini</option>
            <option value="chatgpt">ChatGPT</option>
          </select>

          <input
            placeholder="API Key / URL"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>

        <div style={styles.chat}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                textAlign: m.role === 'user' ? 'right' : 'left',
                margin: 8,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  padding: 10,
                  borderRadius: 10,
                  background:
                    m.role === 'user' ? '#2563eb' : '#eee',
                  color: m.role === 'user' ? '#fff' : '#000',
                }}
              >
                {m.text}
              </span>
            </div>
          ))}
        </div>

        <div style={styles.inputArea}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ flex: 1 }}
          />

          <button onClick={askAI} style={styles.btn}>
            ส่ง
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: any = {
  app: {
    display: 'flex',
    height: '100vh',
    fontFamily: 'sans-serif',
  },
  left: {
    width: '40%',
    background: '#111',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    fontSize: 20,
  },
  right: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    gap: 10,
    padding: 10,
    borderBottom: '1px solid #ddd',
  },
  chat: {
    flex: 1,
    padding: 10,
    overflowY: 'auto',
  },
  inputArea: {
    display: 'flex',
    padding: 10,
    gap: 10,
  },
  btn: {
    padding: '10px 20px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
  },
};