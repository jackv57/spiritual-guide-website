// 引入 node-fetch
const fetch = require('node-fetch');

// 這是 Netlify Function 的主體
exports.handler = async function(event, context) {

  // 1. 加上日誌，確認函式有被觸發
  console.log("--- 函式開始執行 ---");
  console.log("收到的前端請求內容:", event.body);

  try {
    // 2. 加上日誌，確認 API 金鑰有被讀取到
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("致命錯誤：找不到環境變數 GEMINI_API_KEY！");
      return { // 直接回傳錯誤，讓前端知道
        statusCode: 500,
        body: JSON.stringify({ error: "伺服器 API Key 未設定。" })
      };
    }
    console.log("成功讀取到 API 金鑰。準備向 Gemini 發送請求...");

    // 從前端傳來的資料中解析出使用者輸入的問題
    const { prompt } = JSON.parse(event.body);
    console.log("使用者輸入的問題是:", prompt);

    // 3. 準備發送請求到 Gemini API
    // 這是【新的】程式碼，請用它來替換
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });
    
    // 4. 加上日誌，看看 Gemini API 的回應狀態
    console.log("收到 Gemini 的回應，狀態碼:", response.status);

    if (!response.ok) {
      // 如果回應不成功 (例如 400, 500 錯誤)，印出詳細錯誤
      const errorData = await response.text();
      console.error("Gemini API 回傳錯誤:", errorData);
      throw new Error(`Gemini API error: ${errorData}`);
    }

    const data = await response.json();
    console.log("成功解析來自 Gemini 的 JSON 資料。");

    // 5. 成功，將 AI 的回答回傳給前端
    const aiResponseText = data.candidates[0].content.parts[0].text;
console.log("準備回傳給前端的純文字:", aiResponseText);

return {
  statusCode: 200,
  body: JSON.stringify({ message: aiResponseText })
};

  } catch (error) {
    // 6. 捕捉到任何前面發生的錯誤，並印出來
    console.error("--- 函式執行時發生致命錯誤 ---:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
