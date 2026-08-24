/* Shared account system.
   Uses the Node API when deployed with the included server.
   Falls back to a clearly local demo account store on static hosts. */
(function(){
  const $ = id => document.getElementById(id);
  const profileOverlay=$('profileOverlay'), profileLabel=$('profileLabel');
  const guestView=$('guestView'), accountView=$('accountView'), accountName=$('accountName');
  const loginForm=$('loginForm'), signupForm=$('signupForm');
  const loginError=$('loginError'), signupError=$('signupError');
  const tabLogin=$('tabLogin'), tabSignup=$('tabSignup');
  if(!profileOverlay || !loginForm || !signupForm) return;

  let currentUser = null;
  let apiAvailable = false;

  async function api(path, options={}){
    const res=await fetch(path,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
    let data={};
    try{ data=await res.json(); }catch(_){}
    if(!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  function localUsers(){
    try{return JSON.parse(localStorage.getItem('ug_users')||'{}')}catch(_){return {}}
  }
  function localHash(str){
    let h=2166136261;
    for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}
    return (h>>>0).toString(16);
  }

  function switchAuthTab(tab){
    const login=tab==='login';
    tabLogin.classList.toggle('active',login);
    tabSignup.classList.toggle('active',!login);
    loginForm.style.display=login?'flex':'none';
    signupForm.style.display=login?'none':'flex';
  }

  function refreshUI(){
    const authButtons=$('authButtons');
    if(currentUser){
      profileLabel.textContent=currentUser.username || currentUser;
      guestView.style.display='none'; accountView.style.display='block';
      accountName.textContent=currentUser.username || currentUser;
      if(authButtons) authButtons.style.display='none';
    }else{
      profileLabel.textContent='Guest';
      guestView.style.display='block'; accountView.style.display='none';
      if(authButtons) authButtons.style.display='flex';
    }
    window.dispatchEvent(new CustomEvent('ug-auth-changed',{detail:{user:currentUser}}));
  }

  async function init(){
    try{
      const data=await api('/api/me');
      apiAvailable=true; currentUser=data.user||null;
    }catch(_){
      const u=localStorage.getItem('ug_current_user');
      currentUser=u?{username:u,local:true}:null;
    }
    refreshUI();
  }

  $('profileBtn')?.addEventListener('click',()=>{profileOverlay.classList.add('open');switchAuthTab('login');loginError.textContent='';signupError.textContent=''});
  $('loginQuickBtn')?.addEventListener('click',()=>{profileOverlay.classList.add('open');switchAuthTab('login');loginError.textContent='';signupError.textContent=''});
  $('signupQuickBtn')?.addEventListener('click',()=>{profileOverlay.classList.add('open');switchAuthTab('signup');loginError.textContent='';signupError.textContent=''});
  $('profileClose')?.addEventListener('click',()=>profileOverlay.classList.remove('open'));
  profileOverlay.addEventListener('click',e=>{if(e.target===profileOverlay)profileOverlay.classList.remove('open')});
  tabLogin.addEventListener('click',()=>switchAuthTab('login'));
  tabSignup.addEventListener('click',()=>switchAuthTab('signup'));

  signupForm.addEventListener('submit',async e=>{
    e.preventDefault(); signupError.textContent='';
    const username=$('signupUsername').value.trim(), password=$('signupPassword').value;
    if(username.length<3){signupError.textContent='Username must be at least 3 characters.';return}
    if(!/^[a-zA-Z0-9_.-]+$/.test(username)){signupError.textContent='Use letters, numbers, dots, dashes, or underscores.';return}
    if(password.length<8){signupError.textContent='Password must be at least 8 characters.';return}
    try{
      if(apiAvailable){
        const data=await api('/api/signup',{method:'POST',body:JSON.stringify({username,password})});
        currentUser=data.user;
      }else{
        const users=localUsers();
        if(users[username]) throw new Error('That username is already taken.');
        users[username]={pass:localHash(password)};localStorage.setItem('ug_users',JSON.stringify(users));
        localStorage.setItem('ug_current_user',username);currentUser={username,local:true};
      }
      refreshUI();profileOverlay.classList.remove('open');signupForm.reset();
    }catch(err){signupError.textContent=err.message}
  });

  loginForm.addEventListener('submit',async e=>{
    e.preventDefault(); loginError.textContent='';
    const username=$('loginUsername').value.trim(), password=$('loginPassword').value;
    try{
      if(apiAvailable){
        const data=await api('/api/login',{method:'POST',body:JSON.stringify({username,password})});
        currentUser=data.user;
      }else{
        const record=localUsers()[username];
        if(!record || record.pass!==localHash(password)) throw new Error('Incorrect username or password.');
        localStorage.setItem('ug_current_user',username);currentUser={username,local:true};
      }
      refreshUI();profileOverlay.classList.remove('open');loginForm.reset();
    }catch(err){loginError.textContent=err.message}
  });

  $('logoutBtn')?.addEventListener('click',async()=>{
    try{if(apiAvailable) await api('/api/logout',{method:'POST'})}catch(_){}
    localStorage.removeItem('ug_current_user');currentUser=null;refreshUI();profileOverlay.classList.remove('open');
  });

  window.UGAuth={
    getUser:()=>currentUser,
    isLoggedIn:()=>!!currentUser && !currentUser.local,
    refresh:init
  };
  init();
})();