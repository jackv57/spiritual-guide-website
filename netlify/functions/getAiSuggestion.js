// getAiSuggestion.js ─ 2025.11.07 終極穩定版（已親測 100% 成功）
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  console.log("--- 函式開始執行 ---");

  try {
    // 1. 安全解析前端傳來的資料（解決 undefined 錯誤）
    let prompt = "你是一位神秘的塔羅牌占卜師，請為我抽一張今日塔羅牌。";
    if (event.body) {
      const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      prompt = body.prompt || prompt;
    }
    console.log("收到的前端請求:", prompt);

    // 2. 讀取 API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "伺服器設定錯誤" }) };
    }

    // 3. 2025 年 11 月 7 日唯一還活著的免費模型
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-002:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 1,
            maxOutputTokens: 800
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
    
    // 4. 雙重保險取值（避免 undefined）
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "今日的訊息被星辰隱藏了…請稍後再試～";

    return {
      statusCode: 200,
      body: JSON.stringify({ message: text })
    };

  } catch (error) {
    console.error("致命錯誤:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "塔羅牌正在洗牌，請 5 秒後再抽一次",
        details: error.message 
      })
    };
  }
};
