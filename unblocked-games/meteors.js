/* ---------- Meteor shower background ---------- */
(function(){
  const canvas = document.createElement('canvas');
  canvas.id = 'meteorCanvas';
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.zIndex = '0';
  canvas.style.pointerEvents = 'none';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let stars = [];
  let meteors = [];

  function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const count = Math.floor((canvas.width * canvas.height) / 11000);
    stars = Array.from({length: count}, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.3 + 0.3,
      tw: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.02 + 0.006,
    }));
  }
  resize();
  window.addEventListener('resize', resize);

  function spawnMeteor(){
    const startX = Math.random() * canvas.width * 1.3 - canvas.width * 0.15;
    meteors.push({
      x: startX,
      y: -40,
      vx: -4 - Math.random() * 3,
      vy: 6 + Math.random() * 3,
      len: 90 + Math.random() * 80,
      life: 1,
    });
  }

  // spawn a meteor every 1.2–3.5s
  function scheduleMeteor(){
    const delay = 1200 + Math.random() * 2300;
    setTimeout(() => {
      spawnMeteor();
      scheduleMeteor();
    }, delay);
  }
  scheduleMeteor();

  function getAccentColor(){
    const style = getComputedStyle(document.documentElement);
    return style.getPropertyValue('--green').trim() || '#4ade80';
  }

  function draw(t){
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // background stars
    stars.forEach(s => {
      const alpha = 0.35 + 0.55 * Math.abs(Math.sin(s.tw + t * s.speed * 0.001));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(210,215,225,${alpha})`;
      ctx.fill();
    });

    // meteors
    const accent = getAccentColor();
    meteors.forEach(m => {
      m.x += m.vx;
      m.y += m.vy;
      m.life -= 0.012;

      const tailX = m.x - m.vx * (m.len / 8);
      const tailY = m.y - m.vy * (m.len / 8);

      const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
      grad.addColorStop(0, `rgba(255,255,255,${Math.min(1, m.life * 1.4)})`);
      grad.addColorStop(0.4, `${accent}${Math.round(m.life * 150).toString(16).padStart(2,'0')}`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();

      // bright head
      ctx.beginPath();
      ctx.arc(m.x, m.y, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, m.life * 1.4)})`;
      ctx.fill();
    });

    meteors = meteors.filter(m => m.life > 0 && m.y < canvas.height + 100 && m.x > -150);

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
