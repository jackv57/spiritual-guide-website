// getAiSuggestion.js ─ 永久不會再 404 版
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  console.log("--- 函式開始執行 ---");
  console.log("收到的前端請求:", event.body);

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "API Key 未設定" }) };
    }

    const { prompt } = JSON.parse(event.body);

    // 2025 年 11 月最新穩定模型（Google 官方文檔寫死這個名字）
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.95,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024
          }
        })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini 錯誤:", err);
      throw new Error(err);
    }

    const data = await response.json();
    const result = data.candidates[0].content.parts[0].text;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: result })
    };

  } catch (error) {
    console.error("致命錯誤:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "AI 正在冥想中…請 10 秒後再抽一次～",
        details: error.message 
      })
    };
  }
};
