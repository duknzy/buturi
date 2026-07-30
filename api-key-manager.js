/* ==========================================================================
   🔑 RE:MIND 共通APIキー管理モジュール
   - Gemini / DeepSeek それぞれ「複数キー」を配列でlocalStorageに保存
   - 旧・単一キー保存("RE_MIND_GEMINI_KEY"等)は自動的に新形式へ移行
   - 追加/削除できる管理モーダルUIをその場で注入
   - fetchWithKeyRotation() で「1つのキーが失敗(429やエラー)したら次のキーへ」を共通化
   ========================================================================== */

const STORAGE = {
    gemini: "RE_MIND_GEMINI_KEYS",
    deepseek: "RE_MIND_DEEPSEEK_KEYS",
};
const LEGACY_STORAGE = {
    gemini: "RE_MIND_GEMINI_KEY",
    deepseek: "RE_MIND_DEEPSEEK_KEY",
};
const LABEL = {
    gemini: "✨ Gemini",
    deepseek: "🐋 DeepSeek",
};

// --------------------------------------------------------------------------
// キーの読み書き（配列形式）＋ 旧形式からの自動移行
// --------------------------------------------------------------------------
function loadKeys(engine) {
    let keys = [];
    try {
        const raw = localStorage.getItem(STORAGE[engine]);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) keys = parsed.filter(k => typeof k === "string" && k.trim());
        }
    } catch (e) {
        keys = [];
    }

    // 旧・単一キー形式が残っていれば配列に取り込んで移行し、旧キーは削除する
    const legacy = localStorage.getItem(LEGACY_STORAGE[engine]);
    if (legacy && legacy.trim() && !keys.includes(legacy.trim())) {
        keys.push(legacy.trim());
        localStorage.setItem(STORAGE[engine], JSON.stringify(keys));
        localStorage.removeItem(LEGACY_STORAGE[engine]);
    }
    return keys;
}

function saveKeys(engine, keys) {
    localStorage.setItem(STORAGE[engine], JSON.stringify(keys));
}

export function getGeminiKeys() { return loadKeys("gemini"); }
export function getDeepseekKeys() { return loadKeys("deepseek"); }

export function addKey(engine, key) {
    const trimmed = (key || "").trim();
    if (!trimmed) return loadKeys(engine);
    const keys = loadKeys(engine);
    if (!keys.includes(trimmed)) keys.push(trimmed);
    saveKeys(engine, keys);
    return keys;
}

export function removeKey(engine, index) {
    const keys = loadKeys(engine);
    keys.splice(index, 1);
    saveKeys(engine, keys);
    return keys;
}

export function clearAllKeys() {
    localStorage.removeItem(STORAGE.gemini);
    localStorage.removeItem(STORAGE.deepseek);
    localStorage.removeItem(LEGACY_STORAGE.gemini);
    localStorage.removeItem(LEGACY_STORAGE.deepseek);
}

// --------------------------------------------------------------------------
// 🔁 キー・ローテーション付きfetch
// buildRequest(key) => { url, options } を渡すと、登録済みキーを先頭から順に試す。
// 429・認証エラー・通信エラーなど、どんな失敗でも「次のキー」へフォールバックし、
// 全キーが失敗した時だけ最後のエラーをthrowする。
// --------------------------------------------------------------------------
export async function fetchWithKeyRotation(keys, buildRequest) {
    if (!keys || keys.length === 0) {
        throw new Error("APIキーが1件も登録されていません。右下の🔑ボタンから登録してください。");
    }

    let lastError = null;
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        try {
            const { url, options } = buildRequest(key);
            const response = await fetch(url, options);

            if (response.status === 429) {
                console.warn(`⚠️ キー#${i + 1} がレート制限（429）に達しました → 次のキーへフォールバック`);
                lastError = new Error(`レート制限(429): キー#${i + 1}`);
                continue;
            }
            if (!response.ok) {
                const errBody = await response.json().catch(() => ({}));
                console.warn(`⚠️ キー#${i + 1} でエラー(${response.status}) → 次のキーへフォールバック`, errBody);
                lastError = new Error(errBody.error?.message || `HTTPエラー: ${response.status}（キー#${i + 1}）`);
                continue;
            }
            return response;
        } catch (networkErr) {
            console.warn(`⚠️ キー#${i + 1} で通信エラー → 次のキーへフォールバック`, networkErr);
            lastError = networkErr;
            continue;
        }
    }
    throw lastError || new Error("登録済みの全APIキーで失敗しました。");
}

// --------------------------------------------------------------------------
// 🖥 管理モーダルUI（右下の🔑ボタンから開く / 未登録時は自動で開く）
// --------------------------------------------------------------------------
let uiInjected = false;

function injectStylesAndModal() {
    if (uiInjected) return;
    uiInjected = true;

    const style = document.createElement("style");
    style.textContent = `
        #apikm-fab {
            position: fixed; right: 1.2rem; bottom: 1.2rem; z-index: 100050;
            width: 52px; height: 52px; border-radius: 16px;
            background: var(--card-bg, #050508); border: 1px solid var(--accent-cyan, #00f3ff);
            color: var(--accent-cyan, #00f3ff); font-size: 1.3rem;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; box-shadow: 3px 3px 0px rgba(0,243,255,0.2);
        }
        #apikm-fab:hover { background: rgba(0,243,255,0.08); }
        #apikm-overlay {
            display: none; position: fixed; inset: 0; z-index: 100060;
            background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
            align-items: center; justify-content: center; padding: 1rem;
        }
        #apikm-modal {
            width: 100%; max-width: 560px; max-height: 85vh; overflow-y: auto;
            background: rgba(10,10,18,0.97); border: 1px solid var(--accent-cyan, #00f3ff);
            box-shadow: 0 0 30px rgba(0,243,255,0.25); border-radius: 20px; padding: 1.6rem;
            color: var(--text-main, #fff); font-family: inherit;
        }
        .apikm-title { font-size: 1.2rem; font-weight: 900; margin-bottom: 0.3rem; }
        .apikm-sub { font-size: 0.8rem; color: var(--text-muted, #708590); margin-bottom: 1.2rem; line-height: 1.5; }
        .apikm-section { margin-bottom: 1.4rem; }
        .apikm-section-label { font-size: 0.9rem; font-weight: 800; margin-bottom: 0.6rem; display:flex; align-items:center; gap:0.4rem; }
        .apikm-key-row {
            display: flex; align-items: center; gap: 0.6rem; background: rgba(255,255,255,0.03);
            border: 1px solid #22222a; border-radius: 10px; padding: 0.5rem 0.8rem; margin-bottom: 0.5rem;
        }
        .apikm-key-text { flex-grow: 1; font-family: monospace; font-size: 0.85rem; color: var(--text-bright-muted, #a0b5c0); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .apikm-key-badge { font-size: 0.65rem; font-weight: 800; color: #000; background: var(--accent-cyan,#00f3ff); border-radius: 6px; padding: 0.1rem 0.4rem; flex-shrink:0; }
        .apikm-remove-btn {
            background: transparent; border: 1px solid #ff4545; color: #ff4545; border-radius: 8px;
            width: 28px; height: 28px; flex-shrink: 0; cursor: pointer; font-weight: 900;
        }
        .apikm-remove-btn:hover { background: rgba(255,69,69,0.1); }
        .apikm-empty { font-size: 0.8rem; color: var(--text-muted,#708590); padding: 0.4rem 0.1rem 0.8rem; }
        .apikm-add-row { display: flex; gap: 0.5rem; }
        .apikm-add-input {
            flex-grow: 1; background: #000; border: 1px solid #22222a; color: #fff;
            padding: 0.6rem 0.8rem; border-radius: 10px; font-size: 0.85rem; font-family: monospace;
        }
        .apikm-add-btn {
            background: var(--accent-cyan,#00f3ff); color: #000; border: none; border-radius: 10px;
            padding: 0.6rem 1rem; font-weight: 900; cursor: pointer; flex-shrink: 0;
        }
        .apikm-close-row { display: flex; justify-content: flex-end; margin-top: 0.8rem; }
        .apikm-close-btn {
            background: #111; border: 1px solid #333; color: #fff; border-radius: 10px;
            padding: 0.6rem 1.2rem; cursor: pointer; font-weight: 800;
        }
    `;
    document.head.appendChild(style);

    const fab = document.createElement("button");
    fab.id = "apikm-fab";
    fab.type = "button";
    fab.title = "APIキー管理";
    fab.textContent = "🔑";
    document.body.appendChild(fab);

    const overlay = document.createElement("div");
    overlay.id = "apikm-overlay";
    overlay.innerHTML = `
        <div id="apikm-modal">
            <div class="apikm-title">🔑 APIキー管理</div>
            <div class="apikm-sub">
                各AIにつき複数のAPIキーを登録できます。1つが利用上限（429）や無効エラーになった場合、
                自動で次のキーに切り替えて再試行します。キーはこの端末のブラウザ内だけに保存され、サーバーには送信・保存されません。
            </div>
            <div class="apikm-section" data-engine-section="gemini">
                <div class="apikm-section-label">✨ Gemini キー</div>
                <div class="apikm-key-list" data-list="gemini"></div>
                <div class="apikm-add-row">
                    <input type="password" class="apikm-add-input" data-input="gemini" placeholder="Geminiの新しいAPIキーを貼り付け">
                    <button type="button" class="apikm-add-btn" data-add="gemini">＋ 追加</button>
                </div>
            </div>
            <div class="apikm-section" data-engine-section="deepseek">
                <div class="apikm-section-label">🐋 DeepSeek キー</div>
                <div class="apikm-key-list" data-list="deepseek"></div>
                <div class="apikm-add-row">
                    <input type="password" class="apikm-add-input" data-input="deepseek" placeholder="DeepSeekの新しいAPIキーを貼り付け">
                    <button type="button" class="apikm-add-btn" data-add="deepseek">＋ 追加</button>
                </div>
            </div>
            <div class="apikm-close-row">
                <button type="button" class="apikm-close-btn" id="apikm-close-btn">閉じる</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    function maskKey(key) {
        if (key.length <= 8) return key[0] + "•••" + key.slice(-2);
        return key.slice(0, 4) + "••••••••" + key.slice(-4);
    }

    function renderList(engine) {
        const listEl = overlay.querySelector(`[data-list="${engine}"]`);
        const keys = loadKeys(engine);
        if (keys.length === 0) {
            listEl.innerHTML = `<div class="apikm-empty">まだ${LABEL[engine]}のキーが登録されていません。</div>`;
            return;
        }
        listEl.innerHTML = keys.map((k, i) => `
            <div class="apikm-key-row">
                <span class="apikm-key-badge">${i === 0 ? "優先" : `#${i + 1}`}</span>
                <span class="apikm-key-text">${maskKey(k)}</span>
                <button type="button" class="apikm-remove-btn" data-remove="${engine}:${i}" title="削除">×</button>
            </div>
        `).join("");
    }

    function renderAll() {
        renderList("gemini");
        renderList("deepseek");
    }

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeModal();

        const removeTarget = e.target.closest("[data-remove]");
        if (removeTarget) {
            const [engine, idxStr] = removeTarget.getAttribute("data-remove").split(":");
            removeKey(engine, parseInt(idxStr, 10));
            renderAll();
            return;
        }

        const addTarget = e.target.closest("[data-add]");
        if (addTarget) {
            const engine = addTarget.getAttribute("data-add");
            const input = overlay.querySelector(`[data-input="${engine}"]`);
            if (input.value.trim()) {
                addKey(engine, input.value);
                input.value = "";
                renderAll();
            }
            return;
        }

        if (e.target.id === "apikm-close-btn") closeModal();
    });

    overlay.querySelectorAll(".apikm-add-input").forEach((input) => {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                const engine = input.getAttribute("data-input");
                if (input.value.trim()) {
                    addKey(engine, input.value);
                    input.value = "";
                    renderAll();
                }
            }
        });
    });

    fab.addEventListener("click", () => openModal());

    function openModal() {
        renderAll();
        overlay.style.display = "flex";
    }
    function closeModal() {
        overlay.style.display = "none";
    }

    // 外部からも開けるように公開
    window.__apikmOpen = openModal;
}

/**
 * 各ページの起動時に1回呼ぶ。
 * - モーダルUIとフローティングボタンを注入
 * - 旧形式キーを新形式へ移行
 * - needGemini/needDeepseekで指定したエンジンのキーが0件なら、自動でモーダルを開いて登録を促す
 */
export function initApiKeyManager({ needGemini = false, needDeepseek = false } = {}) {
    injectStylesAndModal();

    const missingGemini = needGemini && getGeminiKeys().length === 0;
    const missingDeepseek = needDeepseek && getDeepseekKeys().length === 0;

    if (missingGemini || missingDeepseek) {
        // UI描画が終わってから開く
        setTimeout(() => {
            if (window.__apikmOpen) window.__apikmOpen();
        }, 200);
    }
}

export function openApiKeyManager() {
    injectStylesAndModal();
    if (window.__apikmOpen) window.__apikmOpen();
}
