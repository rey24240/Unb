/* Generic game save manager.
   It snapshots browser storage for games loaded through the same-origin proxy.
   Games that use localStorage are supported automatically; cross-origin frames
   are detected and the UI explains why a snapshot cannot be taken. */
(function(){
  const PREFIX='ug_game_save_v1:';
  const keyFor=url=>PREFIX+btoa(unescape(encodeURIComponent(url))).replace(/=+$/,'');
  const safeParse=v=>{try{return JSON.parse(v)}catch(_){return v}};
  const cloneValue=value=>{
    try{return JSON.parse(JSON.stringify(value))}catch(_){return String(value)}
  };
  function getFrame(){return document.getElementById('webFrame')}
  function target(){return window.__currentGameUrl||''}
  function getFrameStorage(){
    const frame=getFrame();
    if(!frame?.contentWindow) throw new Error('The game has not finished loading.');
    let ls;
    try{ls=frame.contentWindow.localStorage}catch(_){throw new Error('This game is not available through the same-origin proxy, so its browser save cannot be read.')}
    const local={};
    for(let i=0;i<ls.length;i++){const k=ls.key(i);if(k!=null)local[k]=safeParse(ls.getItem(k))}
    return {localStorage:local};
  }
  function applyFrameStorage(snapshot){
    const frame=getFrame(); if(!frame?.contentWindow) throw new Error('The game is not loaded.');
    let ls; try{ls=frame.contentWindow.localStorage}catch(_){throw new Error('This game cannot be restored because its storage is cross-origin.')}
    ls.clear(); Object.entries(snapshot.localStorage||{}).forEach(([k,v])=>ls.setItem(k,typeof v==='string'?v:JSON.stringify(v)));
    try{frame.contentWindow.location.reload()}catch(_){frame.src=frame.src}
  }
  function save(){
    const url=target(); if(!url) throw new Error('No game is loaded.');
    const snap=getFrameStorage(); snap.version=1;snap.url=url;snap.savedAt=new Date().toISOString();
    localStorage.setItem(keyFor(url),JSON.stringify(snap));
    return snap;
  }
  function load(){
    const url=target(); if(!url) throw new Error('No game is loaded.');
    const raw=localStorage.getItem(keyFor(url)); if(!raw) throw new Error('No saved data was found for this game.');
    const snap=JSON.parse(raw); applyFrameStorage(snap); return snap;
  }
  function remove(){const url=target();if(!url) return;localStorage.removeItem(keyFor(url))}
  function download(){
    const url=target(); if(!url) throw new Error('No game is loaded.');
    const raw=localStorage.getItem(keyFor(url)); if(!raw) save();
    const data=localStorage.getItem(keyFor(url));
    const blob=new Blob([data],{type:'application/json'}), a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download='game-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }
  function importFile(file){
    if(!file) return;
    const reader=new FileReader();reader.onload=()=>{
      try{const snap=JSON.parse(reader.result);if(!snap||typeof snap!=='object'||!snap.localStorage)throw new Error();
        const url=target();if(!url)throw new Error('No game is loaded.');
        snap.url=url;snap.savedAt=new Date().toISOString();localStorage.setItem(keyFor(url),JSON.stringify(snap));applyFrameStorage(snap);notify('Save imported.');
      }catch(_){notify('That save file is invalid.','error')}
    };reader.readAsText(file)
  }
  function notify(message,type='ok'){window.dispatchEvent(new CustomEvent('ug-save-toast',{detail:{message,type}}))}
  window.UGGameSave={save,load,remove,download,importFile,has:()=>!!target()&&!!localStorage.getItem(keyFor(target()))};
  window.addEventListener('ug-save-request',e=>{
    try{
      if(e.detail==='save'){save();notify('Game data saved on this device.')}
      if(e.detail==='load'){load();notify('Game data restored.')}
      if(e.detail==='download'){download();notify('Save file exported.')}
      if(e.detail==='delete'){remove();notify('Saved data deleted.')}
    }catch(err){notify(err.message||'Save failed.','error')}
  });
  window.addEventListener('beforeunload',()=>{try{if(target()) save()}catch(_){} });
})();
