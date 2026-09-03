/* ---------- Shared: open any game via about:blank popup ----------
   Opens a new tab at about:blank, then writes a styled player card into
   it — the address bar shows about:blank instead of the real domain.
   sideGames (optional): the full games list, used to show random
   suggestions down each side of the frame.
   currentUser (optional): username string if signed in, otherwise null/undefined.
   Comments are only postable when currentUser is provided.
--------------------------------------------------------------------- */
function openAboutBlank(url, title, sideGames, currentUser, contentType='game'){
  const win = window.open('about:blank', '_blank');
  if(!win){
    window.open(url, '_blank', 'noopener');
    return;
  }

  const allGames = Array.isArray(sideGames) ? sideGames : [];
  const isApp = contentType === 'app';

  function favicon(u){
    try{ return `https://www.google.com/s2/favicons?sz=128&domain=${new URL(u).hostname}`; }
    catch(e){ return ''; }
  }

  const mainFavicon = favicon(url);
  const loggedIn = !!currentUser;

  // absolute links back to the main site, computed from this window's own location
  const baseHref = (window.opener && window.opener.location) ? window.opener.location.href : location.href;
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
          background:
            radial-gradient(circle at 50% 10%, rgba(var(--accent-rgb),.14), transparent 32%),
            radial-gradient(circle at 15% 80%, rgba(var(--accent-rgb),.10), transparent 30%),
            linear-gradient(145deg, #101722 0%, #182437 45%, #293b54 100%);
          background-attachment:fixed;
          font-family:'Segoe UI', Rubik, sans-serif;
          --accent:#4ade80; --accent2:#22c55e; --accent-rgb:74,222,128;
        }
        html[data-theme='purple']{--accent:#a879ff;--accent2:#7b5bff;--accent-rgb:168,121,255;}
        html[data-theme='blue']{--accent:#38bdf8;--accent2:#0ea5e9;--accent-rgb:56,189,248;}
        html[data-theme='red']{--accent:#f87171;--accent2:#ef4444;--accent-rgb:248,113,113;}
        html[data-theme='amber']{--accent:#fbbf24;--accent2:#f59e0b;--accent-rgb:251,191,36;}

        .player-sidebar{position:fixed;left:16px;top:16px;bottom:16px;width:64px;z-index:400;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:8px;padding:10px 7px;border:2px solid var(--accent);border-radius:20px;background:rgba(12,16,22,.88);backdrop-filter:blur(12px);box-shadow:0 12px 40px rgba(0,0,0,.42),0 0 22px rgba(var(--accent-rgb),.16);}
        .player-nav{width:100%;display:flex;flex-direction:column;gap:7px;height:100%;}
        .player-nav a{width:100%;height:46px;border-radius:13px;display:grid;place-items:center;color:#aab4c4;text-decoration:none;border:1px solid transparent;transition:.15s ease;}
        .side-profile,.player-action{width:100%;height:46px;border-radius:13px;display:grid;place-items:center;color:#aab4c4;background:transparent;border:1px solid transparent;cursor:pointer;font:inherit;transition:.15s ease;}
        .side-profile{background:#252d3a;color:#d9e2ef;margin-bottom:2px;}
        .player-action:hover{background:rgba(var(--accent-rgb),.13);color:#fff;border-color:rgba(var(--accent-rgb),.35);}
        .player-nav a:hover,.player-nav a.active{background:rgba(var(--accent-rgb),.13);color:#fff;border-color:rgba(var(--accent-rgb),.35);}
        .player-nav a.active{background:var(--accent);color:#0b0f0d;border-color:var(--accent);box-shadow:0 8px 20px rgba(var(--accent-rgb),.25);}
        .player-nav a.settings{margin-top:auto;}
        .layout{
          display:flex;
          align-items:flex-start;
          justify-content:center;
          gap:16px;
          padding:82px 18px 34px;
          min-height:100vh;
        }
        .player-shell{display:flex;align-items:flex-start;justify-content:center;gap:14px;width:100%;}
        .side-games{width:178px;display:flex;flex-direction:column;gap:12px;flex:0 0 178px;}
        .side-game{display:block;text-decoration:none;color:#fff;background:rgba(17,24,35,.88);border:1px solid rgba(255,255,255,.12);border-radius:14px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,.25);transition:.16s ease;}
        .side-game:hover{transform:translateY(-2px);border-color:var(--accent);box-shadow:0 14px 32px rgba(var(--accent-rgb),.16);}
        .side-game img{display:block;width:100%;height:104px;object-fit:cover;background:#0a0e14;}
        .side-game span{display:block;padding:8px 9px 10px;font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .app-layout .center-col{max-width:1180px;}
        .app-layout .frame-wrap{aspect-ratio:16/9;min-height:76vh;}
        .app-layout .card{width:100%;}
        @media(max-width:1100px){.side-games{display:none}.center-col{max-width:1000px}}
        .center-col{
          width:100%;
          max-width:1000px;
          display:flex;
          flex-direction:column;
          gap:16px;
        }

        .card{
          background:#000;
          border-radius:18px;
          overflow:hidden;
          box-shadow:0 24px 70px rgba(0,0,0,0.46), 0 0 0 1px rgba(168,121,255,.08);
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
          gap:16px;
          padding:12px 16px; background:#eef0f4;
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
        .bar-right{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;}
        .vote-group{display:flex;align-items:center;gap:6px;}
        .vote-btn{
          min-width:70px;height:36px;padding:0 11px;border-radius:10px;
          border:1px solid #d5d7dc;background:#fff;color:#555b66;
          display:flex;align-items:center;justify-content:center;gap:6px;
          font:700 12px 'Segoe UI',sans-serif;cursor:pointer;transition:.15s ease;
        }
        .vote-btn:hover{transform:translateY(-1px);border-color:var(--accent);}
        .vote-btn.like.active{background:#e7fff1;border-color:#38c879;color:#13924f;}
        .vote-btn.dislike.active{background:#fff0f0;border-color:#ef6464;color:#d33f3f;}
        .btns{display:flex;gap:6px;}
        .btns button {
          width:36px;height:36px;border-radius:10px;
          background:#fff;border:1px solid #d5d7dc;color:#3c3c43;
          cursor:pointer;font-size:15px;padding:0;display:flex;align-items:center;justify-content:center;
        }
        .btns button:hover{border-color:var(--accent);color:#7b5bff;}

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
          border-top-color:var(--accent);
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
          border:1px solid rgba(var(--accent-rgb),.4);
          border-radius:8px;
          padding:6px 10px;
          color:var(--accent);
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
          background:var(--accent);
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


        .popup-overlay{position:fixed;inset:0;z-index:10000;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.62);backdrop-filter:blur(8px);padding:20px;}
        .popup-overlay.open{display:flex;}
        .popup-card{position:relative;width:min(440px,100%);background:#171c25;color:#eef2f8;border:1px solid rgba(255,255,255,.14);border-radius:18px;padding:24px;box-shadow:0 24px 80px rgba(0,0,0,.55);}
        .popup-card h2{margin:0 0 10px;font-size:22px;}
        .popup-card p{color:#b9c2d0;line-height:1.5;font-size:14px;}
        .popup-small{font-size:12px!important;color:#8792a3!important;}
        .popup-close{position:absolute;top:10px;right:10px;width:34px;height:34px;border:0;border-radius:10px;background:#252c38;color:#fff;font-size:24px;cursor:pointer;}
        .popup-label{display:block;margin:16px 0 7px;font-size:12px;color:#9da8b8;}
        .popup-select{width:100%;padding:12px;border-radius:11px;border:1px solid #3c4655;background:#222936;color:#fff;outline:none;}

        @media (max-width:900px){
        }
        @media (max-width:600px){
          .player-sidebar{left:8px;top:8px;bottom:8px;width:52px;padding:8px 5px;border-radius:16px;}
          .player-nav a{height:42px;border-radius:11px;}
          .layout{ padding:72px 10px 24px 70px; }
        }
      </style>
    </head>
    <body>
      <nav class="player-sidebar" aria-label="Player navigation">
        <div class="player-nav">
          <div class="side-profile" title="Profile"><i class="bi bi-person-fill"></i></div>
          <a href="${siteLink('index.html')}" title="Home"><i class="bi bi-house-fill"></i></a>
          <a href="${siteLink('index.html#apps')}" title="Apps" class="${isApp ? 'active' : ''}"><i class="bi bi-grid-1x2-fill"></i></a>
          <a href="${siteLink('index.html')}" title="Games" class="${!isApp ? 'active' : ''}"><i class="bi bi-controller"></i></a>
          <button type="button" class="player-action" id="playerInfo" title="Info"><i class="bi bi-info-circle-fill"></i></button>
          <button type="button" class="player-action settings" id="playerSettings" title="Settings"><i class="bi bi-gear-fill"></i></button>
        </div>
      </nav>

      <div class="layout ${isApp ? 'app-layout' : 'game-layout'}">
        <div class="player-shell">
          ${!isApp ? `<aside class="side-games" id="sideGames"></aside>` : ''}
          <div class="center-col">
          <div class="card">
            <div class="frame-wrap">
              <div class="loading-overlay" id="loadingOverlay">
                <div class="spinner"></div>
                <span>Loading game...</span>
              </div>
              <iframe id="gf" src="${url}" data-src="${url}" allow="fullscreen; autoplay; gamepad; clipboard-read; clipboard-write; accelerometer; gyroscope; web-share" referrerpolicy="no-referrer-when-downgrade" allowfullscreen onload="hideLoading()"></iframe>
            </div>
            <div class="bar">
              <div class="bar-left">
                <img src="${mainFavicon}" alt="">
                <div class="titles">
                  <span class="gname" id="gname">${title || 'Game'}</span>
                  <span class="gsub">Hosted externally</span>
                </div>
              </div>
              <div class="bar-right">
                ${!isApp ? `<div class="vote-group" aria-label="Rate this game">
                  <button class="vote-btn like" id="likeBtn" onclick="voteGame('like')" title="Like this game"><i class="bi bi-hand-thumbs-up-fill"></i><span id="likeCount">0</span></button>
                  <button class="vote-btn dislike" id="dislikeBtn" onclick="voteGame('dislike')" title="Dislike this game"><i class="bi bi-hand-thumbs-down-fill"></i><span id="dislikeCount">0</span></button>
                </div>` : ''}
                <div class="btns">
                  <button onclick="refreshFrame()" title="Refresh"><i class="bi bi-arrow-clockwise"></i></button>
                  <button onclick="goFullscreen()" title="Fullscreen"><i class="bi bi-arrows-fullscreen"></i></button>
                </div>
              </div>
            </div>
          </div>

          <div class="fps-overlay" id="fpsOverlay">FPS: <span id="fpsVal">60</span></div>

          ${!isApp ? `<div class="comment-box">
            <h3>Comments</h3>
            ${commentAreaHTML}
            <div class="comment-list" id="commentList"></div>
          </div>` : ''}
          </div>
          ${!isApp ? `<aside class="side-games" id="sideGamesRight"></aside>` : ''}
        </div>
      </div>

      <div class="popup-overlay" id="aboutPopup" onclick="if(event.target===this)closePopup('aboutPopup')">
        <div class="popup-card">
          <button class="popup-close" onclick="closePopup('aboutPopup')">×</button>
          <h2>About</h2>
          <p>This ${isApp ? 'app' : 'game'} is hosted externally. Use the controls below to refresh or enter fullscreen.</p>
          <p class="popup-small">Powered by your unb site.</p>
        </div>
      </div>
      <div class="popup-overlay" id="settingsPopup" onclick="if(event.target===this)closePopup('settingsPopup')">
        <div class="popup-card">
          <button class="popup-close" onclick="closePopup('settingsPopup')">×</button>
          <h2>Settings</h2>
          <p>Use the main sidebar to change your account and theme settings.</p>
        </div>
      </div>

      <script>
        var isLoggedIn = ${loggedIn ? 'true' : 'false'};
        function applySavedTheme(){ document.documentElement.setAttribute('data-theme', localStorage.getItem('ug_theme') || 'green'); }
        applySavedTheme();
        window.addEventListener('storage', function(e){ if(e.key==='ug_theme') applySavedTheme(); });

        var API_BASE=''; try{ API_BASE=(window.opener&&window.opener.location&&window.opener.location.origin)||location.origin; }catch(e){ API_BASE=location.origin; }
        function showAbout(){ document.getElementById('aboutPopup').classList.add('open'); }
        function showSettings(){
          document.getElementById('settingsPopup').classList.add('open');
        }
        function closePopup(id){ document.getElementById(id).classList.remove('open'); }

        document.getElementById('playerInfo').addEventListener('click', showAbout);
        document.getElementById('playerSettings').addEventListener('click', showSettings);
        function buildSideGames(){
          var host=document.getElementById('sideGames');
          var right=document.getElementById('sideGamesRight');
          if(!host || !right) return;
          var items=${JSON.stringify(allGames)}.slice ? ${JSON.stringify(allGames)} : [];
          var shuffled=items.slice().sort(function(){return Math.random()-.5;}).slice(0,8);
          var left=shuffled.slice(0,4), rr=shuffled.slice(4,8);
          function card(g){
            var img=g.thumbnail || '';
            if(!img){ try{img='https://www.google.com/s2/favicons?sz=128&domain='+new URL(g.url).hostname;}catch(e){} }
            return '<a class="side-game" href="javascript:void(0)" data-side-url="'+escapeHTML(g.url)+'" data-side-name="'+escapeHTML(g.name)+'"><img src="'+escapeHTML(img)+'" alt=""><span>'+escapeHTML(g.name)+'</span></a>';
          }
          host.innerHTML=left.map(card).join(''); right.innerHTML=rr.map(card).join('');
          [host,right].forEach(function(el){el.addEventListener('click',function(e){var a=e.target.closest('.side-game');if(!a)return;setTimeout(function(){location.href=a.dataset.sideUrl;},0);});});
        }
        function escapeHTML(s){ return String(s||'').replace(/[&<>"']/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];}); }
        if(!isApp) buildSideGames();

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
        function loadGame(u, name){ var f=document.getElementById('gf'); f.src=u; f.setAttribute('data-src',u); document.getElementById('gname').textContent=name||'App'; document.title=name||'App'; if(!isApp){ renderVotes(); renderComments(); } }

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

        function voteStorageKey(u){ return 'ug_votes_' + encodeURIComponent(u); }
        function voterKey(){ return localStorage.getItem('ug_current_user') || 'device'; }
        function getVotes(){
          var key = voteStorageKey(document.getElementById('gf').getAttribute('data-src'));
          try{ return JSON.parse(localStorage.getItem(key) || '{"likes":0,"dislikes":0,"voters":{}}'); }
          catch(e){ return {likes:0,dislikes:0,voters:{}}; }
        }
        function saveVotes(v){
          var key = voteStorageKey(document.getElementById('gf').getAttribute('data-src'));
          localStorage.setItem(key, JSON.stringify(v));
        }
        function renderVotes(){
          var v=getVotes(), who=v.voters[voterKey()];
          document.getElementById('likeCount').textContent=v.likes;
          document.getElementById('dislikeCount').textContent=v.dislikes;
          document.getElementById('likeBtn').classList.toggle('active', who==='like');
          document.getElementById('dislikeBtn').classList.toggle('active', who==='dislike');
        }
        async function voteGame(type){
          var user = null;
          try{ user = window.opener && window.opener.UGAuth && window.opener.UGAuth.getUser ? window.opener.UGAuth.getUser() : null; }catch(_){}
          if(user && !user.local){
            try{
              var res=await fetch(API_BASE+'/api/vote',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:document.getElementById('gf').getAttribute('data-src'),type:type})});
              var data=await res.json();
              if(!res.ok) throw new Error(data.error||'Vote failed');
              document.getElementById('likeCount').textContent=data.vote.likes||0;
              document.getElementById('dislikeCount').textContent=data.vote.dislikes||0;
              document.getElementById('likeBtn').classList.toggle('active',data.vote.myVote==='like');
              document.getElementById('dislikeBtn').classList.toggle('active',data.vote.myVote==='dislike');
              return;
            }catch(e){}
          }
          var v=getVotes(), key=voterKey(), old=v.voters[key];
          if(old===type){ v[type==='like'?'likes':'dislikes']=Math.max(0,v[type==='like'?'likes':'dislikes']-1); delete v.voters[key]; }
          else{ if(old){v[old==='like'?'likes':'dislikes']=Math.max(0,v[old==='like'?'likes':'dislikes']-1);} v[type==='like'?'likes':'dislikes']++; v.voters[key]=type; }
          saveVotes(v); renderVotes();
        }

        function commentKey(){
          return 'ug_comments_' + encodeURIComponent(currentFrameUrl());
        }
        function getLocalComments(){
          try{ return JSON.parse(localStorage.getItem(commentKey()) || '[]'); }
          catch(e){ return []; }
        }
        function escapeHTML(s){ return String(s||'').replace(/[&<>"']/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'})[c]}); }
        async function renderComments(){
          var el=document.getElementById('commentList'); if(!el) return;
          var list=[];
          try{
            var res=await fetch(API_BASE+'/api/comments?url='+encodeURIComponent(currentFrameUrl()),{credentials:'include'});
            if(res.ok){ var data=await res.json(); list=data.comments||[]; } else throw new Error();
          }catch(e){ list=getLocalComments(); }
          if(list.length===0){ el.innerHTML='<div class="comment-empty">No comments yet' + (isLoggedIn?' — be the first.':'.') + '</div>'; return; }
          el.innerHTML=list.slice().reverse().map(function(c){return '<div class="comment-item"><strong>'+escapeHTML(c.author||'Anonymous')+':</strong> '+escapeHTML(c.text)+'<div class="meta">'+escapeHTML(c.date||'')+'</div></div>';}).join('');
        }
        async function postComment(){
          if(!isLoggedIn) return;
          var input=document.getElementById('commentInput'); if(!input) return;
          var text=input.value.trim(); if(!text) return;
          var game=currentFrameUrl();
          try{
            var res=await fetch(API_BASE+'/api/comments',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:game,text:text})});
            var data=await res.json();
            if(!res.ok) throw new Error(data.error||'Could not post comment.');
            input.value=''; await renderComments(); return;
          }catch(e){
            var list=getLocalComments(); list.push({text:text,author:${JSON.stringify(currentUser || 'Player')},date:new Date().toLocaleString()});
            localStorage.setItem(commentKey(),JSON.stringify(list)); input.value=''; await renderComments();
          }
        }
        if(!isApp){ renderVotes(); renderComments(); }
      </script>
    </body>
    </html>
  `);
  win.document.close();
}
