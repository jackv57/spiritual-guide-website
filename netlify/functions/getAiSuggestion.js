// getAiSuggestion.js （2025 年 11 月 06 日最終修好版）
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  console.log("--- 函式開始執行 ---");
  console.log("收到的前端請求內容:", event.body);

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "伺服器 API Key 未設定。" })
      };
    }
    console.log("成功讀取到 API 金鑰。");

    const { prompt } = JSON.parse(event.body);
    console.log("使用者輸入:", prompt);

    // 最終正確寫法（已親測 2025/11/06 20:15 成功）
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        })
      }
    );

    console.log("Gemini 回應狀態碼:", response.status);

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini 錯誤:", err);
      throw new Error(err);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: text })
    };

  } catch (error) {
    console.error("致命錯誤:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "AI 暫時繁忙，請 10 秒後再試～",
        details: error.message 
      })
    };
  }
};
