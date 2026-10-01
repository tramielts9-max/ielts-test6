/**
 * reading/js-r/reading-builder.js - Module dựng cấu trúc giao diện câu hỏi Reading
 */

window.toggleSocratic = function(qId) {
  const bodyEl = document.getElementById(qId + '_soc_body');
  const btnEl = document.getElementById(qId + '_soc_toggle_btn');
  if (!bodyEl) return;
  const isHidden = bodyEl.style.display === 'none';
  bodyEl.style.display = isHidden ? 'block' : 'none';
  if (btnEl) btnEl.innerText = isHidden ? '▲ Thu gọn lại' : '▼ Mở gợi ý';
};

window.nextSocraticStep = function(qId, step, finalAnswer) {
  var ans = document.getElementById(qId + '_ans_' + step);
  if (ans) ans.style.display = 'block';

  var inp = document.getElementById(qId + '_in_' + step);
  if (inp) inp.disabled = true;
  var btn = document.getElementById(qId + '_btn_' + step);
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'default';
  }

  var next = document.getElementById(qId + '_step_' + (step + 1));
  var badge = document.getElementById(qId + '_badge');

  if (next) {
    next.style.display = 'block';
    var totalSteps = badge ? (badge.getAttribute('data-total') || '3') : '3';
    if (badge) badge.innerText = 'Nấc ' + (step + 1) + '/' + totalSteps;
    var nextInput = document.getElementById(qId + '_in_' + (step + 1));
    if (nextInput) setTimeout(function() { nextInput.focus(); }, 100);
  } else {
    if (badge) {
      badge.innerText = '✓ Đã hoàn thành';
      badge.style.background = '#16a34a';
      badge.style.color = 'white';
    }
    if (finalAnswer) {
      window.syncUserAnswer(qId, finalAnswer);
    }
  }
};

window.syncUserAnswer = function(qId, val) {
  if (val === undefined || val === null) return;
  var cleanVal = String(val).trim();

  var textInputs = document.querySelectorAll(`input[id="${qId}_input"]`);
  textInputs.forEach(el => {
    if (el && el.value !== cleanVal) {
      el.value = cleanVal;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  var radios = document.querySelectorAll(`input[name="${qId}"]`);
  radios.forEach(rb => {
    var isMatch = rb.value.trim().toUpperCase() === cleanVal.toUpperCase();
    if (rb.type === 'radio') rb.checked = isMatch;
    var parentLabel = rb.closest('.choice-btn-label') || rb.closest('.mcq-option-item');
    if (parentLabel) {
      if (rb.checked) parentLabel.classList.add('active', 'selected');
      else parentLabel.classList.remove('active', 'selected');
    }
  });

  var badgeBtn = document.getElementById(`badge_${qId}`);
  if (badgeBtn) {
    if (cleanVal !== "") {
      badgeBtn.classList.add('status-answered');
    } else {
      badgeBtn.classList.remove('status-answered');
    }
  }
};

function parseOptionsList(rawOptions) {
  if (!rawOptions) return [];
  if (Array.isArray(rawOptions)) {
    return rawOptions.map((opt, idx) => {
      const defaultKey = String.fromCharCode(65 + idx);
      if (typeof opt === 'string') {
        const m = opt.match(/^([A-Za-z0-9ivxlcdm]+)[\.\:\-\)\s]\s*(.*)$/i);
        if (m) return { key: m[1].toUpperCase(), text: m[2] ? m[2].trim() : opt.trim() };
        return { key: defaultKey, text: opt.trim() };
      }
      return { key: defaultKey, text: String(opt) };
    });
  }
  return [];
}

export function buildReadingHtml(data) {
  if (!data.groups || !data.questions) return data.questionHtml || "";
  let html = '';

  data.groups.forEach(group => {
    html += `<div class="section-title">${group.title}</div>`;
    if (group.instructions) {
      html += `<p style="color:var(--text-muted); font-size:13.5px; margin-bottom:12px; line-height:1.5;">${group.instructions}</p>`;
    }

    const gType = (group.type || '').toLowerCase();
    const gMeta = (group.title + ' ' + (group.instructions || '')).toLowerCase();
    const isTFNG = gType.includes('tfng') || gMeta.includes('true/false/not given');
    const isYNNG = gType.includes('ynng') || gMeta.includes('yes/no/not given');

    if (group.template) {
      let content = group.template;

      group.questionIds.forEach(qId => {
        const q = data.questions[qId];
        const width = q?.inputWidth || "120px";

        const socraticPart = renderSocraticHtml(qId, q);
        const inputPart = `<input type="text" class="fill-input" id="${qId}_input" style="width:${width}; font-weight:700; color:#0284c7; text-align:center;" placeholder="[Câu ${q?.num || qId}]" oninput="window.syncUserAnswer('${qId}', this.value)">`;
        const thoughtPart = `
          <div class="inline-thought-box" id="${qId}_thought_box">
            <label>💭 Mạch suy nghĩ của em (Câu ${q?.num || qId}):</label>
            <textarea id="${qId}_thought" placeholder="Ghi chú lý do em chọn đáp án này..."></textarea>
          </div>
          <div class="result" id="${qId}_result"></div>
          ${renderExplanationHtml(qId, q)}
        `;

        const fullQuestionSlot = `
          ${socraticPart}
          ${inputPart}
          ${thoughtPart}
        `;

        content = content.replace(new RegExp(`{{${qId}}}`, 'g'), fullQuestionSlot);
      });

      html += `
        <div class="unified-notes-card">
          ${(group.noteTitle || group.summaryTitle) ? `<h3>${group.noteTitle || group.summaryTitle}</h3>` : ''}
          <div>${content}</div>
        </div>
      `;
    } else {
      group.questionIds.forEach(qId => {
        const q = data.questions[qId];
        if (!q) return;

        html += `
          <div class="question" id="${qId}" style="margin-bottom:20px; padding:16px;">
            <p style="font-size:15px; line-height:1.55; margin-bottom:10px;"><b>${q.num}.</b> ${q.text}</p>
            ${renderSocraticHtml(qId, q)}
        `;

        const qOptions = parseOptionsList(q.options);

        if (isTFNG || q.type === 'tfng') {
          html += renderChoicePillsHtml(qId, ['TRUE', 'FALSE', 'NOT GIVEN']);
        } else if (isYNNG || q.type === 'ynng') {
          html += renderChoicePillsHtml(qId, ['YES', 'NO', 'NOT GIVEN']);
        } else if (qOptions.length > 0) {
          html += renderMultipleChoiceHtml(qId, qOptions, q.multiple || false);
        } else {
          html += `
            <div style="margin: 12px 0;">
              <input type="text" class="fill-input" id="${qId}_input" placeholder="Nhập đáp án..." style="width:200px; font-weight:600;" oninput="window.syncUserAnswer('${qId}', this.value)">
            </div>
          `;
        }

        html += `
            <div class="inline-thought-box" style="margin-top:12px;">
              <label>💭 Mạch suy nghĩ của em:</label>
              <textarea id="${qId}_thought" placeholder="Ghi chú lý do em chọn đáp án này..."></textarea>
            </div>

            <div class="result"></div>
            ${renderExplanationHtml(qId, q)}
          </div>
        `;
      });
    }
  });

  html += `<button type="button" class="btn-submit" onclick="window.checkAnswers()" style="margin-top:25px; width:100%; padding:14px; font-size:16px;">CHẤM BÀI VÀ XEM KẾT QUẢ</button>`;
  return html;
}

function renderSocraticHtml(qId, q) {
  if (!q.socratic || !q.socratic.steps || q.socratic.steps.length === 0) return '';
  const total = q.socratic.steps.length;
  const ans = q.finalAnswer || '';

  let sHtml = `
    <div class="socratic-card" id="${qId}_soc_card">
      <div class="socratic-header-bar" onclick="window.toggleSocratic('${qId}')">
        <div style="display:flex; align-items:center; gap:8px;">
          <b style="color:#8B1518; font-size:13px;">🪜 GỢI Ý MỚM DẪN DẮT (SOCRATIC)</b>
          <span class="socratic-badge" id="${qId}_badge" data-total="${total}">Nấc 1/${total}</span>
        </div>
        <button type="button" class="socratic-toggle-btn" id="${qId}_soc_toggle_btn">▼ Mở gợi ý</button>
      </div>

      <div class="socratic-body" id="${qId}_soc_body" style="display: none;">
  `;

  q.socratic.steps.forEach((step, idx) => {
    const stepNum = idx + 1;
    const isFirst = stepNum === 1;

    sHtml += `
      <div id="${qId}_step_${stepNum}" style="display:${isFirst ? 'block' : 'none'}; ${!isFirst ? 'margin-top:12px; border-top:1px dashed #cbd5e1; padding-top:10px;' : ''}">
        <p style="margin:0 0 6px 0; font-size:13px; font-weight:700; color:var(--text-main);">
          🤖 Nấc ${stepNum}: ${step.title}<br>
          <span style="font-weight:normal; color:var(--text-muted); font-size:12.5px;">${step.question}</span>
        </p>
        <div style="display:flex; gap:6px;">
          <input type="text" id="${qId}_in_${stepNum}" placeholder="Nhập câu trả lời của em..." style="flex:1; padding:6px 10px; border:1px solid #cbd5e1; border-radius:4px; font-size:12.5px;" onkeydown="if(event.key==='Enter') window.nextSocraticStep('${qId}', ${stepNum}, '${ans}')">
          <button type="button" id="${qId}_btn_${stepNum}" style="background:#8B1518; color:white; border:none; padding:6px 14px; border-radius:4px; font-weight:700; cursor:pointer; font-size:12.5px;" onclick="window.nextSocraticStep('${qId}', ${stepNum}, '${ans}')">Gửi</button>
        </div>
        <div id="${qId}_ans_${stepNum}" style="display:none; background:#f0fdf4; border-left:4px solid #16a34a; padding:8px 12px; border-radius:4px; margin-top:8px; font-size:12.5px; line-height:1.5;">
          <div style="color:#166534; font-weight:700;">🎯 LỜI GIẢI HƯỚNG DẪN:</div>
          <div style="color:#1e293b;">${step.guide}</div>
          ${step.bridge ? `<div style="margin-top:4px; font-style:italic; color:#475569;">🌉 <i>${step.bridge}</i></div>` : ''}
        </div>
      </div>
    `;
  });

  sHtml += `
        <div style="text-align: right; margin-top: 10px;">
          <button type="button" onclick="window.toggleSocratic('${qId}')" style="background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; padding:4px 10px; border-radius:4px; font-size:11.5px; cursor:pointer; font-weight:600;">▲ Thu gọn lại</button>
        </div>
      </div>
    </div>
  `;
  return sHtml;
}

function renderMultipleChoiceHtml(qId, options, isMultiple) {
  let html = `<div class="mcq-options-list">`;
  const inputType = isMultiple ? 'checkbox' : 'radio';

  options.forEach(opt => {
    html += `
      <label class="mcq-option-item" onclick="window.syncUserAnswer('${qId}', '${opt.key}')">
        <input type="${inputType}" name="${qId}" value="${opt.key}">
        <span class="mcq-badge">${opt.key}</span>
        <span style="font-size:14px; line-height:1.45;">${opt.text}</span>
      </label>
    `;
  });
  html += `<input type="hidden" id="${qId}_input"></div>`;
  return html;
}

function renderChoicePillsHtml(qId, choices) {
  let html = `<div class="choice-group">`;
  choices.forEach(ch => {
    html += `
      <label class="choice-btn-label" onclick="window.syncUserAnswer('${qId}', '${ch}')">
        <input type="radio" name="${qId}" value="${ch}">
        <span>${ch}</span>
      </label>
    `;
  });
  html += `<input type="hidden" id="${qId}_input"></div>`;
  return html;
}

function renderExplanationHtml(qId, q) {
  let expSteps = (q.explanation && q.explanation.steps) 
    ? q.explanation.steps.map(s => `<p style="margin:4px 0;">${s}</p>`).join('') 
    : '';
  let hlBtn = q.highlightId ? `<button type="button" class="btn-header" style="background:#0284c7; margin-top:8px;" onclick="window.highlightText('${q.highlightId}')">📍 Xem dẫn chứng bài đọc</button>` : '';

  return `
    <div class="explanation" style="display:none; margin-top: 10px;">
      <div class="kw-exp" style="font-weight:700; color:#8B1518; margin-bottom:6px;">🎯 LỜI GIẢI CHI TIẾT:</div>
      ${expSteps}
      ${hlBtn}
      
      <div class="ai-assistant-box" style="margin-top: 12px; padding: 10px; background: var(--bg-card); border: 1px solid #cbd5e1; border-radius: 6px;">
        <div style="font-weight: 700; font-size: 13px; color: var(--primary-blue); margin-bottom: 6px;">
          🤖 Hỏi Trợ Giảng AI về câu này:
        </div>
        <div style="display: flex; gap: 6px;">
          <input type="text" id="ai_ask_${qId}" placeholder="Hỏi tại sao đúng/sai, dịch nghĩa từ..." 
                 style="flex: 1; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 5px; font-size: 13px;"
                 onkeydown="if(event.key==='Enter') window.askGeminiAI('${qId}')">
          <button type="button" id="ai_btn_${qId}" class="ai-btn" onclick="window.askGeminiAI('${qId}')" style="cursor:pointer; white-space:nowrap; padding:6px 12px; font-size:12px;">
            Gửi AI
          </button>
        </div>
        <div class="ai-response" id="ai_response_${qId}" style="display:none; margin-top:8px; max-height: 350px; overflow-y: auto;"></div>
      </div>
    </div>
  `;
}
