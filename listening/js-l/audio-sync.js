/**
 * listening/js-l/audio-sync.js - Đồng bộ âm thanh với Transcript
 */
export function initAudioTranscriptSync(audioElementId = 'mainAudioElement', containerId = 'passageBox') {
  const audio = document.getElementById(audioElementId);
  const container = document.getElementById(containerId);
  if (!audio || !container) return;

  audio.addEventListener('timeupdate', () => {
    const curTime = audio.currentTime;
    const lines = container.querySelectorAll('.transcript-line[data-time]');
    if (!lines.length) return;

    let activeLine = null;
    lines.forEach(line => {
      const t = parseFloat(line.getAttribute('data-time'));
      if (curTime >= t) {
        activeLine = line;
      }
    });

    if (activeLine && !activeLine.classList.contains('active-audio-line')) {
      lines.forEach(l => l.classList.remove('active-audio-line'));
      activeLine.classList.add('active-audio-line');
      
      // Tự động cuộn theo nếu đang mở cột transcript
      if (document.body.classList.contains('submitted')) {
        activeLine.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  });
}
