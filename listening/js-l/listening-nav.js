/**
 * listening/js-l/listening-nav.js - Thanh điều hướng đáy & Modal Answer Sheet IELTS Listening
 */

export function calculateListeningBandScore(score, total = 40) {
  const scaledScore = total <= 10 ? Math.round((score / total) * 40) : score;

  if (scaledScore >= 39) return "9.0";
  if (scaledScore >= 37) return "8.5";
  if (scaledScore >= 35) return "8.0";
  if (scaledScore >= 32) return "7.5";
  if (scaledScore >= 30) return "7.0";
  if (scaledScore >= 26) return "6.5";
  if (scaledScore >= 23) return "6.0";
  if (scaledScore >= 18) return "5.5";
  if (scaledScore >= 16) return "5.0";
  if (scaledScore >= 13) return "4.5";
  if (scaledScore >= 10) return "4.0";
  if (scaledScore >= 8)  return "3.5";
  if (scaledScore >= 6)  return "3.0";
  if (scaledScore >= 4)  return "2.5";
  return "1.0";
}

export function initListeningNavigation() {
  if (document.getElementById('listeningBottomBar')) return;

  const testData = window.TEST_DATA || { answers: {} };
  const qKeys = Object.keys(testData.answers || {});
  if (qKeys.length === 0) return;

  const bottomBar = document.createElement('div');
  bottomBar.id = 'listeningBottomBar';
  bottomBar.className = 'bottom-nav-bar';

  let currentPartNum = 1;
  const matchPart = window.location.href.match(/-p(\d+)/i);
  if (matchPart) currentPartNum = parseInt(matchPart[1], 10);

  let partsHtml = '';
  for (let p = 1; p <= 4; p++) {
    if (p === currentPartNum) {
      const buttonsHtml = qKeys.map(k => {
        const num = k.replace(/^[a-zA-Z]+/, '');
        return `<button type="button" class="q-badge-btn" id="badge_${k}" data-q="${k}">${num}</button>`;
      }).join(' ');

      partsHtml += `
        <div class="part-nav-group active-part">
          <b>Part ${p}:</b> ${buttonsHtml}
        </div>
      `;
    } else {
      const targetUrl = window.location.href.replace(new RegExp(`-p${currentPartNum}`, 'i'), `-p${p}`);
      partsHtml += `
        <div class="part-nav-group inactive-part" onclick="window.location.href='${targetUrl}'">
          <b>Part ${p}:</b> <i>10 questions</i>
        </div>
      `;
    }
  }

  bottomBar.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <button type="button" class="btn-nav-arrow" id="btnPrevQ" title="Câu trước">←</button>
      <button type="button" class="btn-nav-arrow" id="btnNextQ" title="Câu sau">→</button>
    </div>

    <div class="parts-container">
      ${partsHtml}
    </div>

    <div style="display: flex; align-items: center; gap: 10px;">
      <button type="button" class="btn-sheet-toggle" id="btnOpenSheet" title="Xem bảng đáp án">
        📋 Answer Sheet
      </button>
      <button type="button" class="btn-submit-bar" id="btnBottomSubmit">
        Nộp bài ✈
      </button>
    </div>
  `;

  document.body.appendChild(bottomBar);

  const modalWrapper = document.createElement('div');
  modalWrapper.id = 'lisModalBackdrop';
  modalWrapper.className = 'modal-backdrop';
  modalWrapper.innerHTML = `
    <div class="modal-content-card">
      <button type="button" class="modal-close-btn" id="btnCloseModal">✕</button>
      <div id="modalDynamicBody"></div>
    </div>
  `;
  document.body.appendChild(modalWrapper);

  let activeQIndex = 0;
  function scrollToQuestion(index) {
    if (index < 0 || index >= qKeys.length) return;
    activeQIndex = index;
    const targetId = qKeys[index];
    const el = document.getElementById(targetId) || document.getElementById(`${targetId}_input_mirror`) || document.getElementById(`${targetId}_input`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const inputEl = document.getElementById(`${targetId}_input_mirror`) || document.getElementById(`${targetId}_input`);
      if (inputEl) setTimeout(() => inputEl.focus(), 300);
    }
  }

  qKeys.forEach((k, idx) => {
    document.getElementById(`badge_${k}`)?.addEventListener('click', () => scrollToQuestion(idx));
  });

  document.getElementById('btnPrevQ')?.addEventListener('click', () => scrollToQuestion(activeQIndex - 1));
  document.getElementById('btnNextQ')?.addEventListener('click', () => scrollToQuestion(activeQIndex + 1));

  document.getElementById('btnOpenSheet')?.addEventListener('click', () => {
    openAnswerSheetModal(qKeys);
  });

  document.getElementById('btnCloseModal')?.addEventListener('click', () => {
    modalWrapper.style.display = 'none';
  });
  modalWrapper.addEventListener('click', (e) => {
    if (e.target === modalWrapper) modalWrapper.style.display = 'none';
  });

  document.getElementById('btnBottomSubmit')?.addEventListener('click', () => {
    if (window.checkAnswers) window.checkAnswers();
  });
}

function openAnswerSheetModal(qKeys) {
  const modal = document.getElementById('lisModalBackdrop');
  const body = document.getElementById('modalDynamicBody');
  if (!modal || !body) return;

  let rowsHtml = '';
  qKeys.forEach(k => {
    const num = k.replace(/^[a-zA-Z]+/, '');
    const textInput = document.getElementById(`${k}_input_mirror`) || document.getElementById(`${k}_input`);
    const radio = document.querySelector(`input[name="${k}"]:checked`);
    const select = document.getElementById(`${k}_select`);
    const val = textInput ? textInput.value.trim() : (radio ? radio.value : (select ? select.value : ''));

    rowsHtml += `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 14px; font-weight: 700; width: 60px; text-align: center;">${num}</td>
        <td style="padding: 10px 14px; color: ${val ? '#0f172a' : '#94a3b8'}; font-weight: 600;">
          ${val || '<i style="color:#cbd5e1; font-weight: normal;">(Chưa trả lời)</i>'}
        </td>
      </tr>
    `;
  });

  body.innerHTML = `
    <h3 style="margin: 0 0 14px 0; font-size: 16px; color: #0f172a;">📋 Review Answer Sheet</h3>
    <div style="max-height: 55vh; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #f8fafc; border-bottom: 1.5px solid #e2e8f0;">
            <th style="padding: 10px; width: 60px;">#</th>
            <th style="padding: 10px; text-align: left;">Câu trả lời của bạn</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  `;
  modal.style.display = 'flex';
}
