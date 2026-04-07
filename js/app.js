/* ============================================================
   MindBridge AI — Application Logic
   ============================================================ */

(function () {
    'use strict';

    // ============================================================
    // State
    // ============================================================
    const state = {
        apiKey: localStorage.getItem('mindbridge_api_key') || '',
        currentSection: 'home',
        isProcessing: false,
        demoMode: false,
    };

    // ============================================================
    // DOM References
    // ============================================================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const els = {
        apiModal: $('#apiKeyModal'),
        apiInput: $('#apiKeyInput'),
        saveApiBtn: $('#saveApiKey'),
        skipApiBtn: $('#skipApiKey'),
        changeApiBtn: $('#changeApiKey'),
        modeBadge: $('#modeBadge'),
        modeText: $('.mode-text'),
        navLinks: $$('.nav-link'),
        sections: $$('.section'),

        // Perspective
        perspectiveInput: $('#perspectiveInput'),
        perspectiveTarget: $('#perspectiveTarget'),
        perspectiveSubmit: $('#perspectiveSubmit'),
        perspectiveOutput: $('#perspectiveOutput'),

        // Bias
        biasInput: $('#biasInput'),
        biasSubmit: $('#biasSubmit'),
        biasOutput: $('#biasOutput'),

        // Common Ground
        groundInputA: $('#groundInputA'),
        groundInputB: $('#groundInputB'),
        groundSubmit: $('#groundSubmit'),
        groundOutput: $('#groundOutput'),

        // Empathy
        empathyInput: $('#empathyInput'),
        empathySubmit: $('#empathySubmit'),
        empathyOutput: $('#empathyOutput'),

        // De-escalation
        deescalateInput: $('#deescalateInput'),
        deescalateSubmit: $('#deescalateSubmit'),
        deescalateOutput: $('#deescalateOutput'),
    };

    // ============================================================
    // Initialization
    // ============================================================
    function init() {
        if (state.apiKey) {
            hideModal();
            setLiveMode();
        }

        bindEvents();
    }

    // ============================================================
    // Event Binding
    // ============================================================
    function bindEvents() {
        // API Key
        els.saveApiBtn.addEventListener('click', saveApiKey);
        els.skipApiBtn.addEventListener('click', skipApiKey);
        els.changeApiBtn.addEventListener('click', showModal);
        els.apiInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') saveApiKey();
        });

        // Navigation
        els.navLinks.forEach((link) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo(link.dataset.section);
            });
        });

        // Navigation via data-navigate buttons
        $$('[data-navigate]').forEach((el) => {
            el.addEventListener('click', () => navigateTo(el.dataset.navigate));
        });

        // Logo
        $('#logoLink').addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('home');
        });

        // Tool submissions
        els.perspectiveSubmit.addEventListener('click', handlePerspective);
        els.biasSubmit.addEventListener('click', handleBias);
        els.groundSubmit.addEventListener('click', handleCommonGround);
        els.empathySubmit.addEventListener('click', handleEmpathy);
        els.deescalateSubmit.addEventListener('click', handleDeescalate);

        // Copy buttons
        $$('.copy-btn').forEach((btn) => {
            btn.addEventListener('click', () => copyOutput(btn));
        });
    }

    // ============================================================
    // Navigation
    // ============================================================
    function navigateTo(sectionId) {
        state.currentSection = sectionId;

        // Update nav
        els.navLinks.forEach((link) => {
            link.classList.toggle('active', link.dataset.section === sectionId);
        });

        // Update sections
        els.sections.forEach((section) => {
            const isTarget = section.id === `section-${sectionId}`;
            section.classList.remove('active', 'fade-in');
            if (isTarget) {
                section.classList.add('active');
                requestAnimationFrame(() => section.classList.add('fade-in'));
            }
        });

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ============================================================
    // API Key Management
    // ============================================================
    function saveApiKey() {
        const key = els.apiInput.value.trim();
        if (!key) {
            els.apiInput.style.borderColor = 'var(--accent-rose)';
            setTimeout(() => (els.apiInput.style.borderColor = ''), 1500);
            return;
        }
        state.apiKey = key;
        state.demoMode = false;
        localStorage.setItem('mindbridge_api_key', key);
        hideModal();
        setLiveMode();
    }

    function skipApiKey() {
        state.demoMode = true;
        state.apiKey = '';
        hideModal();
        setDemoMode();
    }

    function showModal() {
        els.apiModal.classList.remove('hidden');
    }

    function hideModal() {
        els.apiModal.classList.add('hidden');
    }

    function setLiveMode() {
        els.modeBadge.classList.add('live');
        $('.mode-text').textContent = 'AI Connected';
    }

    function setDemoMode() {
        els.modeBadge.classList.remove('live');
        $('.mode-text').textContent = 'Demo Mode';
    }

    // ============================================================
    // Gemini API Call
    // ============================================================
    async function callGemini(prompt) {
        if (state.demoMode || !state.apiKey) {
            return getDemoResponse(prompt);
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${state.apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: prompt }],
                    },
                ],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 2048,
                    topP: 0.95,
                },
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                ],
            }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `API error ${response.status}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
    }

    // ============================================================
    // Demo Mode Responses
    // ============================================================
    function getDemoResponse(prompt) {
        const lower = prompt.toLowerCase();

        if (lower.includes('perspective translator') || lower.includes('translate this perspective')) {
            return new Promise((r) =>
                setTimeout(
                    () =>
                        r(`## 🔄 Translated Perspective

### Original Core Message
The original argument centers on protecting young people and advocating for governmental intervention in digital spaces.

### Translated for the Opposite Viewpoint

**"The data on adolescent mental health and social media correlation is concerning, and as people who value personal responsibility and family autonomy, we should consider what market-driven solutions and parental tools could address this — rather than waiting until the problem becomes so severe that heavy-handed regulation becomes the *only* option left."**

### Why This Translation Works

- **Shared value:** Both sides genuinely care about children's wellbeing
- **Reframing:** Instead of "government should ban," it appeals to **proactive, freedom-preserving solutions**
- **Common ground:** Neither side actually wants unchecked harm to kids
- **Bridge language:** "Market-driven solutions" and "parental tools" speak to autonomy values

### Key Insight
> The original argument and this translation share the same *concern* — they differ only in the *mechanism* of the solution. That's where productive dialogue begins.`),
                    1200
                )
            );
        }

        if (lower.includes('bias') || lower.includes('manipulation')) {
            return new Promise((r) =>
                setTimeout(
                    () =>
                        r(`## 🔍 Bias & Manipulation Analysis

### Overall Manipulation Score: 7.2/10 ⚠️

---

### 🚩 Cognitive Biases Detected

**1. Bandwagon Fallacy** — \`HIGH\`
> "Everyone knows that..." — Appeals to assumed consensus without evidence. This phrase bypasses critical thinking by implying dissent is irrational.

**2. Ad Hominem Attack** — \`HIGH\`
> "so-called experts" — Dismisses expert credibility without addressing their actual arguments. The phrase "so-called" is designed to trigger distrust.

**3. Appeal to Identity** — \`MEDIUM\`
> "real Americans" — Creates an in-group/out-group dynamic, implying that experts and their supporters are somehow less authentic or less American.

**4. Catastrophizing** — \`MEDIUM\`
> "will destroy jobs" — Uses absolute language ("will destroy") instead of nuanced analysis ("may impact" or "could affect"). This triggers fear responses.

---

### 🛡️ How to Read This Text More Clearly

1. **Replace "everyone knows" with "I believe"** — makes the claim honest
2. **Replace "destroy" with "may impact"** — makes it accurate
3. **Ask**: What specific data supports the jobs claim?
4. **Ask**: Which experts were consulted, and what did they actually say?

### 💡 A More Honest Version
> "I'm concerned this policy could negatively affect employment, and I'm skeptical of the expert consensus supporting it because [specific reason]."
`),
                    1500
                )
            );
        }

        if (lower.includes('common ground') || lower.includes('viewpoint a') || lower.includes('shared values')) {
            return new Promise((r) =>
                setTimeout(
                    () =>
                        r(`## 🤝 Common Ground Analysis

### Shared Core Values Discovered: 4

---

### ✅ What Both Sides Actually Agree On

**1. Healthcare Should Be Accessible**
Both viewpoints fundamentally agree that people should be able to access healthcare without financial ruin. They differ on the *mechanism*, not the *goal*.

**2. The Current System Has Problems**
Neither side is defending the status quo. Both acknowledge broken elements — just different ones (coverage gaps vs. bureaucratic inefficiency).

**3. Quality Matters**
Both arguments prioritize the *quality* of care. Side A worries about financial barriers reducing access to quality care; Side B worries about lack of competition reducing its quality.

**4. Innovation Is Important**
Both would agree that medical innovation saves lives and should continue. The disagreement is about what *drives* innovation.

---

### 🌉 Bridge Statements Both Sides Can Stand On

> "We both want a system where no one is denied quality care, and where innovation continues to improve medicine. The real question isn't *whether* to fix healthcare, but *how* to do it in a way that's both compassionate and sustainable."

> "What if we focused on the specific failures both of us see — coverage gaps AND inefficiency — and tested solutions for each?"

### 💡 The Real Disagreement
The fundamental tension is **equity vs. efficiency** — and both are legitimate values. The most productive conversation asks: "how do we maximize *both*?" rather than treating them as mutually exclusive.`),
                    1400
                )
            );
        }

        if (lower.includes('empathy') || lower.includes('understand why')) {
            return new Promise((r) =>
                setTimeout(
                    () =>
                        r(`## 💡 Empathy Profile

### Understanding the Perspective You Find Difficult

---

### 👤 A Composite Human Story

**Meet "David"** — a 52-year-old factory worker in a small Ohio town.

David's father worked at the same plant for 35 years. David grew up watching his community thrive — good schools, little league, neighbors who knew each other. Then the plant closed. Then another. Jobs moved overseas and to larger cities.

New people arrived, speaking different languages, opening businesses on the same Main Street where his father once shopped. David doesn't *hate* them — but he feels **invisible**. His community changed without his consent, and no one asked.

---

### 🧠 The Underlying Values & Fears

| What you see | What they feel |
|---|---|
| "Anti-immigration" | Loss of cultural continuity & identity |
| "Closed-minded" | Desire for stability in a chaotic world |
| "Ignoring economic data" | Economic data doesn't match *their local* reality |
| "Fear of the other" | Fear of becoming irrelevant in their own home |

---

### 🔑 Key Insight

> Immigration skepticism is often **not about immigrants** — it's about the experience of **rapid, uncontrolled change** in communities that feel they've already lost too much. Understanding this doesn't mean agreeing — it means seeing the *human pain* behind the position.

### 🌉 How This Understanding Changes the Conversation

Instead of: *"You're wrong because immigrants help the economy"*

Try: *"I can see your community has been through a lot of change. What would help you feel like your concerns are being heard in this process?"*

This validates the emotion without conceding the policy — and opens real dialogue.`),
                    1600
                )
            );
        }

        if (lower.includes('de-escalat') || lower.includes('heated') || lower.includes('confrontational')) {
            return new Promise((r) =>
                setTimeout(
                    () =>
                        r(`## 🕊️ De-escalated Message

### Emotional Temperature
🔴 Original: **9/10** (Hostile)
🟢 Rewritten: **3/10** (Assertive but Respectful)

---

### ✍️ Constructive Rewrite

> "I strongly disagree with this policy approach, and here's why it concerns me: I think it overlooks some real-world consequences that affect people like me directly. I'd genuinely like to understand why you see it differently, because right now we seem to be looking at completely different realities — and that gap worries me."

---

### 🔬 What Changed & Why

| Original Element | Issue | Transformation |
|---|---|---|
| "You're an idiot" | Personal attack | → Removed; focused on the *idea*, not the person |
| "People like you" | Identity-based blame | → "We seem to be looking at different realities" |
| "Falling apart" | Catastrophizing | → "Concerns me" — honest without hyperbole |
| "Wake up!" | Condescension | → "I'd like to understand" — genuine curiosity |

---

### 💡 Why the Original Approach Fails

Every insult in the original message makes the reader **less likely** to consider the underlying point. Research shows that personal attacks trigger defensive responses, making persuasion nearly impossible.

### 🎯 The De-escalated Version:
- ✅ Preserves the sender's **core frustration**
- ✅ Makes the receiver **want to respond** instead of retaliate
- ✅ Opens the door to **actual dialogue**
- ✅ Maintains the sender's **dignity and credibility**`),
                    1300
                )
            );
        }

        // Generic fallback
        return new Promise((r) =>
            setTimeout(
                () =>
                    r(
                        `## Analysis Complete\n\nThis is a demo response. Connect your Gemini API key to get real AI-powered analysis tailored to your specific input.\n\nThe full version will provide deep, nuanced insights powered by advanced language models.`
                    ),
                800
            )
        );
    }

    // ============================================================
    // Simple Markdown → HTML
    // ============================================================
    function renderMarkdown(text) {
        let html = text
            // Headers
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h3 style="font-size:1.15rem;">$1</h3>')
            .replace(/^# (.+)$/gm, '<h3 style="font-size:1.3rem;">$1</h3>')
            // Bold
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            // Inline code
            .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.06);padding:2px 6px;border-radius:4px;font-size:0.9em;">$1</code>')
            // Blockquote
            .replace(
                /^> (.+)$/gm,
                '<blockquote style="border-left:3px solid var(--accent-purple);padding:8px 16px;margin:8px 0;background:rgba(255,255,255,0.03);border-radius:0 8px 8px 0;color:var(--text-secondary);font-style:italic;">$1</blockquote>'
            )
            // HR
            .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:16px 0;">')
            // Unordered list
            .replace(/^\- (.+)$/gm, '<li>$1</li>')
            // Table handling
            .replace(/^\|(.+)\|$/gm, (match) => {
                const cells = match
                    .split('|')
                    .filter((c) => c.trim())
                    .map((c) => c.trim());
                if (cells.every((c) => /^[-:]+$/.test(c))) return '<!--table-sep-->';
                return '<tr>' + cells.map((c) => `<td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);">${c}</td>`).join('') + '</tr>';
            })
            // Paragraphs
            .replace(/\n\n/g, '</p><p>')
            // Line breaks
            .replace(/\n/g, '<br>');

        // Wrap list items
        html = html.replace(/((<li>.*?<\/li><br>?)+)/g, '<ul style="margin:8px 0;padding-left:20px;">$1</ul>');

        // Wrap tables
        html = html.replace(
            /((<tr>.*?<\/tr><br>?)+)/g,
            '<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:0.9rem;">$1</table>'
        );
        html = html.replace(/<!--table-sep--><br>?/g, '');

        // Clean extra br after block elements
        html = html.replace(/<\/(h3|blockquote|hr|ul|table|li)><br>/g, '</$1>');

        return `<div class="output-content md-rendered"><p>${html}</p></div>`;
    }

    // ============================================================
    // Streaming Effect
    // ============================================================
    async function streamToOutput(outputEl, text) {
        const rendered = renderMarkdown(text);
        outputEl.innerHTML = '';

        const container = document.createElement('div');
        container.className = 'output-content';
        container.style.opacity = '0';
        outputEl.appendChild(container);

        // Quick type-in effect
        container.innerHTML = rendered;
        container.style.transition = 'opacity 0.4s ease';
        container.style.opacity = '1';
    }

    // ============================================================
    // Tool Handlers
    // ============================================================
    async function handlePerspective() {
        const text = els.perspectiveInput.value.trim();
        if (!text) return shakeElement(els.perspectiveInput);

        const targetLens = els.perspectiveTarget.value;
        const lensLabel = els.perspectiveTarget.options[els.perspectiveTarget.selectedIndex].text;

        const prompt = `You are MindBridge AI — the world's first empathy engine. Your job is to be a Perspective Translator.

Given the following argument/viewpoint, rewrite it so that it resonates with someone who holds the ${lensLabel} perspective. Preserve the CORE message but reframe the language, values, and framing to connect with that worldview.

Structure your response with:
## 🔄 Translated Perspective
### Original Core Message
(brief summary of the core argument)
### Translated for the ${lensLabel}
(the rewritten argument — this should be compelling and genuinely speak to that worldview's values)
### Why This Translation Works
(explain the reframing technique: what shared values were leveraged, what language was changed and why)
### Key Insight
(a blockquote with the deeper truth about what connects both perspectives)

Original text to translate:
"""
${text}
"""`;

        await runTool(els.perspectiveSubmit, els.perspectiveOutput, prompt);
    }

    async function handleBias() {
        const text = els.biasInput.value.trim();
        if (!text) return shakeElement(els.biasInput);

        const prompt = `You are MindBridge AI — the world's first empathy engine. Your job is to be a Bias & Manipulation Detector.

Analyze the following text for cognitive biases, logical fallacies, and emotional manipulation techniques. Be thorough but fair — not everything is manipulation. Distinguish between intentional persuasion and unconscious bias.

Structure your response with:
## 🔍 Bias & Manipulation Analysis
### Overall Manipulation Score: X/10
(with a brief justification)

### 🚩 Cognitive Biases Detected
(List each bias found with: name, severity tag HIGH/MEDIUM/LOW, the exact quote, and explanation of why it's manipulative)

### 🛡️ How to Read This Text More Clearly
(numbered list of critical thinking questions the reader should ask)

### 💡 A More Honest Version
(rewrite the text removing all manipulation while preserving any legitimate points)

Text to analyze:
"""
${text}
"""`;

        await runTool(els.biasSubmit, els.biasOutput, prompt);
    }

    async function handleCommonGround() {
        const textA = els.groundInputA.value.trim();
        const textB = els.groundInputB.value.trim();
        if (!textA || !textB) {
            if (!textA) shakeElement(els.groundInputA);
            if (!textB) shakeElement(els.groundInputB);
            return;
        }

        const prompt = `You are MindBridge AI — the world's first empathy engine. Your job is to be a Common Ground Finder.

Given two opposing viewpoints, discover the shared values, concerns, and goals that both sides actually agree on — even if they don't realize it. Find the bridge between them.

Structure your response with:
## 🤝 Common Ground Analysis
### Shared Core Values Discovered: [number]

### ✅ What Both Sides Actually Agree On
(List each shared value with a name, and explanation of how both viewpoints implicitly share this value)

### 🌉 Bridge Statements Both Sides Can Stand On
(2-3 specific statements that someone from EITHER position could genuinely agree with — these should be powerful and unifying)

### 💡 The Real Disagreement
(Identify the actual, underlying tension — usually a values trade-off, not a factual dispute. Explain it with nuance.)

Viewpoint A:
"""
${textA}
"""

Viewpoint B:
"""
${textB}
"""`;

        await runTool(els.groundSubmit, els.groundOutput, prompt);
    }

    async function handleEmpathy() {
        const text = els.empathyInput.value.trim();
        if (!text) return shakeElement(els.empathyInput);

        const prompt = `You are MindBridge AI — the world's first empathy engine. Your job is to be an Empathy Simulator.

The user has submitted a viewpoint they find hard to understand. Your task is to humanize the people who hold this opposing view — help the user genuinely understand WHY rational, caring people arrive at this conclusion. Be deeply empathetic without being preachy. Do NOT lecture the user or tell them they're wrong.

Structure your response with:
## 💡 Empathy Profile
### Understanding the Perspective You Find Difficult

### 👤 A Composite Human Story
(Create a brief, vivid narrative of a fictional person who holds this view. Give them a name, age, background. Make them sympathetic and three-dimensional. Show their life experiences that led to this view.)

### 🧠 The Underlying Values & Fears
(A table with two columns: "What you see" | "What they feel" — showing how the same behavior appears differently from inside vs outside the perspective)

### 🔑 Key Insight
(A blockquote with the core emotional truth that drives this perspective — something the user probably never considered)

### 🌉 How This Understanding Changes the Conversation
(Practical advice on how to engage with someone who holds this view in a way that creates connection rather than conflict)

The viewpoint the user wants to understand:
"""
${text}
"""`;

        await runTool(els.empathySubmit, els.empathyOutput, prompt);
    }

    async function handleDeescalate() {
        const text = els.deescalateInput.value.trim();
        if (!text) return shakeElement(els.deescalateInput);

        const prompt = `You are MindBridge AI — the world's first empathy engine. Your job is to be a De-escalation Engine.

Take the following heated, aggressive, or confrontational message and rewrite it to be constructive, empathetic, and respectful — while PRESERVING the sender's core message, frustration, and valid points. The goal is to give them a version they would actually send that would be taken seriously.

Structure your response with:
## 🕊️ De-escalated Message
### Emotional Temperature
🔴 Original: X/10 (description)
🟢 Rewritten: X/10 (description)

### ✍️ Constructive Rewrite
(The complete rewritten message — it should feel authentic, not sanitized. It should convey genuine passion without toxicity.)

### 🔬 What Changed & Why
(A table showing: Original Element | Issue | Transformation — for each change made)

### 💡 Why the Original Approach Fails
(Brief explanation of the psychology of why attacks reduce persuasion)

### 🎯 The De-escalated Version:
(Bullet list of checkmarks showing what the new version achieves)

Heated message to de-escalate:
"""
${text}
"""`;

        await runTool(els.deescalateSubmit, els.deescalateOutput, prompt);
    }

    // ============================================================
    // Run Tool (generic handler)
    // ============================================================
    async function runTool(submitBtn, outputEl, prompt) {
        if (state.isProcessing) return;
        state.isProcessing = true;

        // Show loading
        submitBtn.classList.add('loading');
        outputEl.innerHTML = `
            <div class="output-placeholder" style="min-height:200px;">
                <div class="placeholder-icon" style="animation:bounce 1s ease-in-out infinite;">🧠</div>
                <p>MindBridge is thinking...</p>
                <span style="color:var(--accent-indigo);">Analyzing perspectives and building bridges</span>
            </div>
        `;

        try {
            const result = await callGemini(prompt);
            await streamToOutput(outputEl, result);
        } catch (error) {
            outputEl.innerHTML = `
                <div class="output-placeholder" style="min-height:200px;">
                    <div class="placeholder-icon">⚠️</div>
                    <p style="color:var(--accent-rose);">Something went wrong</p>
                    <span>${error.message}</span>
                    <br><br>
                    <button class="btn btn-sm btn-outline" onclick="document.getElementById('apiKeyModal').classList.remove('hidden')">Check API Key</button>
                </div>
            `;
        } finally {
            submitBtn.classList.remove('loading');
            state.isProcessing = false;
        }
    }

    // ============================================================
    // Utilities
    // ============================================================
    function shakeElement(el) {
        el.style.animation = 'none';
        el.offsetHeight; // reflow
        el.style.animation = 'shake 0.5s ease';
        el.style.borderColor = 'var(--accent-rose)';
        setTimeout(() => {
            el.style.borderColor = '';
            el.style.animation = '';
        }, 1500);
    }

    // Add shake animation
    const shakeStyle = document.createElement('style');
    shakeStyle.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
            20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
    `;
    document.head.appendChild(shakeStyle);

    function copyOutput(btn) {
        const targetId = btn.dataset.target;
        const target = document.getElementById(targetId);
        const text = target.innerText;

        navigator.clipboard.writeText(text).then(() => {
            btn.classList.add('copied');
            btn.textContent = '✅ Copied!';
            setTimeout(() => {
                btn.classList.remove('copied');
                btn.textContent = '📋 Copy';
            }, 2000);
        });
    }

    // ============================================================
    // Init
    // ============================================================
    document.addEventListener('DOMContentLoaded', init);
})();
