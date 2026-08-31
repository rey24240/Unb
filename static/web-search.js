(function(){
  const input = document.getElementById('gameSearch');
  if(!input) return;
  input.addEventListener('keydown',e=>{
    if(e.key !== 'Enter') return;
    const q = input.value.trim();
    if(!q) return;
    e.preventDefault();
    window.location.href = `/browser?url=${encodeURIComponent(q)}`;
  });
  const wrap = input.closest('.games-search');
  if(wrap && !wrap.querySelector('.web-search-btn')){
    const btn = document.createElement('button');
    btn.className='web-search-btn';
    btn.type='button';
    btn.title='Search the web';
    btn.innerHTML='<i class="bi bi-globe2"></i>';
    btn.addEventListener('click',()=>{
      const q=input.value.trim();
      if(q) window.location.href=`/browser?url=${encodeURIComponent(q)}`;
    });
    wrap.appendChild(btn);
  }
})();
