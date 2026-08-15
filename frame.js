/* ---------- Shared: open any game via about:blank popup ----------
   Opens a new tab at about:blank, then writes a styled player card into
   it — the address bar shows about:blank instead of the real domain.
   sideGames (optional): the full games list, used to show random
   suggestions down each side of the frame.
   currentUser (optional): username string if signed in, otherwise null/undefined.
   Comments are only postable when currentUser is provided.
--------------------------------------------------------------------- */
function openAboutBlank(url, title, sideGames, currentUser){
  const win = window.open('about:blank', '_blank');
  if(!win){
    window.open(url, '_blank', 'noopener');
    return;
  }

  const allGames = Array.isArray(sideGames) ? sideGames : [];
  const shuffled = allGames.slice().sort(() => Math.random() - 0.5);
  const leftGames = shuffled.slice(0, 4);
  const rightGames = shuffled.slice(4, 8);

  function favicon(u){
    try{ return `https://www.google.com/s2/favicons?sz=128&domain=${new URL(u).hostname}`; }
    catch(e){ return ''; }
  }

  function sideThumbs(list){
    return list.map(g => `
      <div class="side-thumb" onclick="loadGame('${g.url.replace(/'/g,"\\'")}', '${(g.name||'').replace(/'/g,"\\'")}')">
        <img src="${favicon(g.url)}" alt="">
        <span class="side-thumb-label">${g.name}</span>
      </div>
    `).join('');
  }

  const mainFavicon = favicon(url);
  const loggedIn = !!currentUser;

  // absolute links back to the main site, computed from this window's own location
  const baseHref = location.href;
  function siteLink(path){
    try{ return new URL(path, baseHref).href; }
    catch(e){ return path; }
  }

  const commentAreaHTML = loggedIn
    ? `
      <textarea id="commentInput" placeholder="Leave a comment about this game..."></textarea>
      <br>
      <button class="post-btn" onclick="postComment()">Post as ${currentUser}</button>
    `
    : `
      <div class="comment-locked">
        <i class="bi bi-lock-fill"></i> Log in to leave a comment.
      </div>
    `;

  win.document.open();
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title || 'Loading...'}</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
      <style>
        *{ box-sizing:border-box; }
        html, body {
          margin:0; min-height:100%; overflow-y:auto; overflow-x:hidden;
          background:linear-gradient(160deg, #3a4a63, #29354a);
          font-family:'Segoe UI', Rubik, sans-serif;
        }

        .mini-nav{
          position:fixed;
          top:16px; left:16px; bottom:16px;
          width:56px;
          background:rgba(15,18,24,0.85);
          backdrop-filter:blur(10px);
          border:2px solid #4ade80;
          border-radius:20px;
          z-index:200;
          display:flex;
          flex-direction:column;
          align-items:center;
          gap:6px;
          padding:14px 0;
        }
        .mini-nav a, .mini-nav button{
          width:36px; height:36px;
          border-radius:12px;
          display:flex; align-items:center; justify-content:center;
          color:#c7ccd6;
          text-decoration:none;
          background:transparent;
          border:none;
          cursor:pointer;
          font-size:16px;
        }
        .mini-nav a:hover, .mini-nav button:hover{
          background:rgba(74,222,128,0.15);
          color:#fff;
        }
        .mini-nav .avatar{
          width:32px; height:32px;
          border-radius:50%;
          background:#252b2f;
          margin-bottom:8px;
        }

        .layout{
          display:flex;
          align-items:flex-start;
          justify-content:center;
          gap:16px;
          padding:24px 16px 24px 90px;
          min-height:100vh;
        }
        .side-rail{
          display:flex;
          flex-direction:column;
          gap:12px;
          width:130px;
          flex-shrink:0;
        }
        .side-thumb{
          position:relative;
          aspect-ratio:1/1;
          border-radius:14px;
          overflow:hidden;
          cursor:pointer;
          border:1px solid rgba(255,255,255,0.12);
          transition:transform 0.15s ease;
        }
        .side-thumb:hover{
          transform:translateY(-2px) scale(1.03);
        }
        .side-thumb img{
          width:100%; height:100%;
          object-fit:cover;
          display:block;
        }
        .side-thumb-label{
          position:absolute;
          left:0; right:0; bottom:0;
          padding:6px 8px;
          background:linear-gradient(to top, rgba(0,0,0,0.85), transparent);
          color:#fff;
          font-size:11px;
          font-weight:600;
          line-height:1.2;
        }

        .center-col{
          width:100%;
          max-width:760px;
          display:flex;
          flex-direction:column;
          gap:16px;
        }

        .card{
          background:#000;
          border-radius:18px;
          overflow:hidden;
          box-shadow:0 20px 50px rgba(0,0,0,0.4);
          display:flex;
          flex-direction:column;
        }
        .frame-wrap{
          position:relative;
          width:100%;
          aspect-ratio:16/9;
          background:#000;
          border-radius:18px 18px 0 0;
          overflow:hidden;
        }
        iframe { width:100%; height:100%; border:none; display:block; }

        .bar {
          display:flex; align-items:center; justify-content:space-between;
          padding:10px 16px; background:#e9e9ec;
          font-size:13px;
          border-radius:0 0 18px 18px;
        }
        .bar-left{
          display:flex; align-items:center; gap:10px;
        }
        .bar-left img{
          width:24px; height:24px; border-radius:6px;
        }
        .bar-left .titles{ display:flex; flex-direction:column; line-height:1.25; }
        .bar-left .titles .gname{ font-weight:700; color:#1c1c1e; font-size:13px; }
        .bar-left .titles .gsub{ color:#7c7c82; font-size:11px; }
        .btns{ display:flex; gap:10px; }
        .btns button {
          background:transparent; border:none; color:#3c3c43;
          cursor:pointer; font-size:16px; padding:4px;
        }

        .loading-overlay{
          position:absolute;
          inset:0;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          gap:14px;
          background:#000;
          z-index:5;
          transition:opacity 0.25s ease;
        }
        .loading-overlay.hidden{
          opacity:0;
          pointer-events:none;
        }
        .spinner{
          width:38px; height:38px;
          border:3px solid rgba(255,255,255,0.15);
          border-top-color:#4ade80;
          border-radius:50%;
          animation:spin 0.8s linear infinite;
        }
        @keyframes spin{
          to{ transform:rotate(360deg); }
        }
        .loading-overlay span{
          color:#c7ccd6;
          font-size:12px;
        }

        .fps-overlay{
          position:fixed;
          top:14px; right:14px;
          z-index:9999;
          display:none;
          background:rgba(0,0,0,0.6);
          border:1px solid rgba(74,222,128,0.4);
          border-radius:8px;
          padding:6px 10px;
          color:#4ade80;
          font-family:monospace;
          font-size:12px;
        }
        .fps-overlay.show{
          display:block;
        }

        .comment-box{
          background:rgba(255,255,255,0.06);
          border:1px solid rgba(255,255,255,0.1);
          border-radius:14px;
          padding:16px;
          color:#e8ecf3;
        }
        .comment-box h3{
          margin:0 0 10px;
          font-size:14px;
        }
        .comment-box textarea{
          width:100%;
          min-height:60px;
          border-radius:10px;
          border:1px solid rgba(255,255,255,0.15);
          background:rgba(0,0,0,0.25);
          color:#fff;
          padding:10px;
          font-family:inherit;
          font-size:13px;
          resize:vertical;
        }
        .comment-box .post-btn{
          margin-top:8px;
          background:#4ade80;
          color:#0b0f0d;
          border:none;
          border-radius:8px;
          padding:8px 16px;
          font-weight:700;
          font-size:13px;
          cursor:pointer;
        }
        .comment-locked{
          display:flex;
          align-items:center;
          gap:8px;
          font-size:13px;
          color:#a9b2c3;
          background:rgba(0,0,0,0.2);
          border-radius:10px;
          padding:12px;
        }
        .comment-list{
          margin-top:14px;
          display:flex;
          flex-direction:column;
          gap:10px;
        }
        .comment-item{
          background:rgba(0,0,0,0.2);
          border-radius:10px;
          padding:10px 12px;
          font-size:13px;
        }
        .comment-item .meta{
          font-size:11px;
          color:#a9b2c3;
          margin-top:4px;
        }
        .comment-empty{
          font-size:12px;
          color:#a9b2c3;
        }

        @media (max-width:900px){
          .side-rail{ display:none; }
        }
        @media (max-width:600px){
          .mini-nav{ width:46px; }
          .layout{ padding-left:66px; }
        }
      </style>
    </head>
    <body>
      <nav class="mini-nav">
        <div class="avatar"></div>
        <a href="${siteLink('games.html')}" title="Home"><i class="bi bi-house-fill"></i></a>
        <a href="${siteLink('game-tab.html')}" title="Games"><i class="bi bi-controller"></i></a>
      </nav>

      <div class="layout">
        ${leftGames.length ? `<div class="side-rail">${sideThumbs(leftGames)}</div>` : ''}

        <div class="center-col">
          <div class="card">
            <div class="frame-wrap">
              <div class="loading-overlay" id="loadingOverlay">
                <div class="spinner"></div>
                <span>Loading game...</span>
              </div>
              <iframe id="gf" src="${url}" data-src="${url}" allowfullscreen onload="hideLoading()"></iframe>
            </div>
            <div class="bar">
              <div class="bar-left">
                <img src="${mainFavicon}" alt="">
                <div class="titles">
                  <span class="gname" id="gname">${title || 'Game'}</span>
                  <span class="gsub">Hosted externally</span>
                </div>
              </div>
              <div class="btns">
                <button onclick="refreshFrame()" title="Refresh"><i class="bi bi-arrow-clockwise"></i></button>
                <button onclick="goFullscreen()" title="Fullscreen"><i class="bi bi-arrows-fullscreen"></i></button>
              </div>
            </div>
          </div>

          <div class="fps-overlay" id="fpsOverlay">FPS: <span id="fpsVal">60</span></div>

          <div class="comment-box">
            <h3>Comments</h3>
            ${commentAreaHTML}
            <div class="comment-list" id="commentList"></div>
          </div>
        </div>

        ${rightGames.length ? `<div class="side-rail">${sideThumbs(rightGames)}</div>` : ''}
      </div>

      <script>
        var isLoggedIn = ${loggedIn ? 'true' : 'false'};

        function refreshFrame(){
          var f = document.getElementById('gf');
          var u = f.getAttribute('data-src');
          showLoading();
          f.src = 'about:blank';
          setTimeout(function(){ f.src = u; }, 50);
        }
        function goFullscreen(){
          var f = document.getElementById('gf');
          if(f.requestFullscreen) f.requestFullscreen();
          else if(f.webkitRequestFullscreen) f.webkitRequestFullscreen();
        }
        function loadGame(u, name){
          var f = document.getElementById('gf');
          showLoading();
          f.src = u;
          f.setAttribute('data-src', u);
          document.getElementById('gname').textContent = name;
          document.title = name;
          renderComments();
        }

        function showLoading(){
          document.getElementById('loadingOverlay').classList.remove('hidden');
        }
        function hideLoading(){
          document.getElementById('loadingOverlay').classList.add('hidden');
        }

        /* FPS counter — only shown while the frame is fullscreen.
           Measures this popup's own render loop (a game running
           cross-origin inside the iframe can't be measured directly). */
        var fpsOverlay = document.getElementById('fpsOverlay');
        var lastFrame = performance.now();
        var frames = 0;
        var fpsAcc = 0;
        function fpsLoop(now){
          frames++;
          fpsAcc += now - lastFrame;
          lastFrame = now;
          if(fpsAcc > 500){
            document.getElementById('fpsVal').textContent = Math.round((frames * 1000) / fpsAcc);
            frames = 0;
            fpsAcc = 0;
          }
          requestAnimationFrame(fpsLoop);
        }
        requestAnimationFrame(fpsLoop);

        document.addEventListener('fullscreenchange', function(){
          var isFs = !!document.fullscreenElement;
          fpsOverlay.classList.toggle('show', isFs);
        });
        document.addEventListener('webkitfullscreenchange', function(){
          var isFs = !!document.webkitFullscreenElement;
          fpsOverlay.classList.toggle('show', isFs);
        });

        function commentKey(){
          var f = document.getElementById('gf');
          return 'ug_comments_' + encodeURIComponent(f.getAttribute('data-src'));
        }
        function getComments(){
          try{ return JSON.parse(localStorage.getItem(commentKey()) || '[]'); }
          catch(e){ return []; }
        }
        function renderComments(){
          var list = getComments();
          var el = document.getElementById('commentList');
          if(list.length === 0){
            el.innerHTML = '<div class="comment-empty">No comments yet' + (isLoggedIn ? ' — be the first.' : '.') + '</div>';
            return;
          }
          el.innerHTML = list.slice().reverse().map(function(c){
            return '<div class="comment-item"><strong>' + (c.author || 'Anonymous') + ':</strong> ' + c.text.replace(/</g,'&lt;') +
              '<div class="meta">' + c.date + '</div></div>';
          }).join('');
        }
        function postComment(){
          if(!isLoggedIn) return;
          var input = document.getElementById('commentInput');
          var text = input.value.trim();
          if(!text) return;
          var list = getComments();
          list.push({ text: text, author: '${loggedIn ? currentUser.replace(/'/g,"\\'") : ''}', date: new Date().toLocaleString() });
          localStorage.setItem(commentKey(), JSON.stringify(list));
          input.value = '';
          renderComments();
        }
        renderComments();
      </script>
    </body>
    </html>
  `);
  win.document.close();
}
