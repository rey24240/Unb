/* ---------- Shared: open any URL via about:blank popup ----------
   Opens a new tab at about:blank, then writes an iframe pointing at
   the real destination into it — the address bar shows about:blank
   instead of the real domain. Used for both search results and games.
--------------------------------------------------------------------- */
function openAboutBlank(url, title){
  const win = window.open('about:blank', '_blank');
  if(!win){
    // popup blocked — fall back to a normal new tab
    window.open(url, '_blank', 'noopener');
    return;
  }
  win.document.open();
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title || 'Loading...'}</title>
      <meta charset="UTF-8">
      <style>
        html, body { margin:0; height:100%; overflow:hidden; background:#000; }
        .bar {
          display:flex; align-items:center; justify-content:space-between;
          padding:8px 14px; background:#17102a; border-bottom:1px solid #332a52;
          font-family:sans-serif; color:#eae6f7; font-size:13px;
        }
        .btns button {
          background:#252b2f; border:1px solid #333b40; color:#eae6f7;
          border-radius:6px; padding:6px 12px; margin-left:6px; cursor:pointer; font-size:12px;
        }
        iframe { width:100%; height:calc(100% - 38px); border:none; display:block; }
      </style>
      <script>
        function refreshFrame(){
          var f = document.getElementById('gf');
          var u = f.getAttribute('data-src');
          f.src = 'about:blank';
          setTimeout(function(){ f.src = u; }, 50);
        }
      </script>
    </head>
    <body>
      <div class="bar">
        <span>${title || ''}</span>
        <span class="btns">
          <button onclick="refreshFrame()">Refresh</button>
          <button onclick="document.getElementById('gf').requestFullscreen && document.getElementById('gf').requestFullscreen()">Fullscreen</button>
        </span>
      </div>
      <iframe id="gf" src="${url}" data-src="${url}" allowfullscreen></iframe>
    </body>
    </html>
  `);
  win.document.close();
}
