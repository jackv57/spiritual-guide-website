// getAiSuggestion.js
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  console.log("--- 函式開始執行 ---");
  console.log("收到的前端請求內容:", event.body);

  try {
    // 1. 讀取 API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("致命錯誤：找不到環境變數 GEMINI_API_KEY！");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "伺服器 API Key 未設定。" })
      };
    }
    console.log("成功讀取到 API 金鑰。準備向 Gemini 發送請求...");

    // 2. 解析前端傳來的 prompt
    const { prompt } = JSON.parse(event.body);
    console.log("使用者輸入的問題是:", prompt);

    // 3. 【2025 年最新正確寫法】使用 gemini-1.5-flash-latest + v1（不再用 v1beta）
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    console.log("收到 Gemini 的回應，狀態碼:", response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API 回傳錯誤:", errorData);
      throw new Error(`Gemini API error: ${errorData}`);
    }

    const data = await response.json();
    console.log("成功解析來自 Gemini 的 JSON 資料。");

    if (!data.candidates || data.candidates.length === 0) {
      console.error("Gemini 回應中沒有 candidates");
      throw new Error("AI 未能產生有效的回答。");
    }

    const aiResponseText = data.candidates[0].content.parts[0].text;
    console.log("準備回傳給前端的純文字:", aiResponseText);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: aiResponseText })
    };

  } catch (error) {
    console.error("--- 函式執行時發生致命錯誤 ---:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "伺服器內部錯誤，請稍後再試或聯絡管理員",
        details: error.message 
      })
    };
  }
};
