// ==========================================================================
// GEMINI API SETTINGS & SOCRATIC TUTOR LOGIC
// ==========================================================================

// ⚠️注意: フロントエンドにAPIキーを直書きするのはテスト用のみにしてください。
// 本番環境ではセキュリティのため、バックエンド（サーバー）経由で呼び出すのが鉄則です。
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE"; 
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// システムプロンプト（AIへの役割・制約指示）
const SYSTEM_INSTRUCTION = `
あなたは「ソクラテス式問答法」を用いる、物静かだが核心を突く高校生向けのAIチューターです。
物理の壁を突破できるよう、ヒントを小出しにしながら「問いかけ」で導いてください。

# 対話の4原則
1. 【絶対禁止】最終的な答え（数値や最終数式）を自ら提示してはならない。
2. 【ステップ論】一度に多くのことを考えさせない。1回の発言につき「1つの小さな確認」だけを問いかけること。
3. 【共感と軌道修正】生徒の誤りに対して「どこまでは合っているか」を認めつつ、「ここがおかしいかも？」と数式の前提に目を向けさせる。
4. 【UI連携】生徒の理解度を予測し、プログレスバー用の数値を毎ターン算出すること。
`;

// チャットの会話履歴を保持する配列（文脈を維持するため）
let chatHistory = [
    {
        "role": "user",
        "parts": [{ "text": "【問題文】傾きの角 θ のなめらかな斜面を持つ質量 M の台が、水平な床の上に置かれている。この斜面上に質量 m の小球を載せ、静かに手を放した。台が床から受ける垂直抗力 N を表せ。" }]
    },
    {
        "role": "model",
        "parts": [{ "text": "{\"ai_response\": \"どこで迷っていますか？まずは『小球が斜面から受ける垂直抗力』を文字で置いて分解してみましょう。\", \"current_step_label\": \"ステップ1: 働く力の洗い出し\", \"student_understanding_rate\": 20}" }]
    }
];

/**
 * Gemini APIを呼び出してソクラテス式の応答を取得する関数
 */
async function sendMessageToGemini(studentMessage) {
    // ユーザーの発言を履歴に追加
    chatHistory.push({
        "role": "user",
        "parts": [{ "text": studentMessage }]
    });

    // APIへ送るリクエストボディの構築
    const requestBody = {
        "contents": chatHistory,
        "systemInstruction": {
            "parts": [{ "text": SYSTEM_INSTRUCTION }]
        },
        "generationConfig": {
            // ★最重要: 応答を確実にJSONフォーマットに強制する設定
            "responseMimeType": "application/json",
            "temperature": 0.7
        }
    };

    try {
        const response = await fetch(GEMINI_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) throw new Error(`APIエラー: ${response.status}`);

        const data = await response.json();
        // APIから返ってきた生のテキスト（JSON文字列）を取得
        const rawJsonText = data.candidates[0].content.parts[0].text;
        
        // 履歴を汚さないために、AIの生の応答文字列も履歴に保存（文脈維持に必須）
        chatHistory.push({
            "role": "model",
            "parts": [{ "text": rawJsonText }]
        });

        // JSONとしてパースしてオブジェクトに変換
        const parsedResult = JSON.parse(rawJsonText);
        
        // 画面のUI要素に反映
        updateChatUI(studentMessage, parsedResult);

    } catch (error) {
        console.error("通信失敗:", error);
        alert("Geminiとの通信に失敗しました。APIキーまたはネットワークを確認してください。");
    }
}

/**
 * 取得したJSONデータをHTML要素に反映させる関数
 */
function updateChatUI(userText, aiJson) {
    const chatHistoryArea = document.querySelector(".chat-history");
    const stepLabelArea = document.querySelector(".ai-sidebar-tile h3"); // 「リアルタイム・アシスタント」の部分
    const progressPercent = document.querySelector(".glass-card span:nth-child(2)"); // ゲージの％テキスト
    const progressBar = document.querySelector(".glass-card div div"); // ゲージのバー本体

    // 1. ユーザーの発言を画面に追加
    const userBubble = document.createElement("div");
    userBubble.className = "chat-bubble bubble-user";
    userBubble.textContent = userText;
    chatHistoryArea.appendChild(userBubble);

    // 2. AIの応答（ソクラテス式ヒント）を画面に追加
    const aiBubble = document.createElement("div");
    aiBubble.className = "chat-bubble bubble-ai";
    aiBubble.textContent = aiJson.ai_response;
    chatHistoryArea.appendChild(aiBubble);

    // 3. 現在のステップラベルの更新
    if (aiJson.current_step_label) {
        stepLabelArea.textContent = aiJson.current_step_label;
    }

    // 4. アナリティクスエリアの理解度ゲージを同期（もし要素があれば）
    if (progressPercent && progressBar) {
        const rate = aiJson.student_understanding_rate;
        progressPercent.textContent = `${rate}%`;
        progressBar.style.width = `${rate}%`;
    }

    // チャット画面を最下部まで自動スクロール
    chatHistoryArea.scrollTop = chatHistoryArea.scrollHeight;
}

// ==========================================================================
// EVENT LISTENERS (イベントの紐付け)
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    const sendBtn = document.querySelector(".chat-input-wrapper button");
    const inputField = document.querySelector(".chat-input");

    const handleSend = () => {
        const text = inputField.value.trim();
        if (!text) return;
        
        inputField.value = ""; // 入力欄をクリア
        sendMessageToGemini(text); // API送信処理へ
    };

    // 送信ボタンクリック時
    sendBtn.addEventListener("click", handleSend);

    // Enterキー押下時（Shift+Enterは改行と区別する場合など）
    inputField.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleSend();
    });
});