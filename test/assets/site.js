
(function(){
  var pages = ["home","guides","about","tres-cantos","colmenar","compare","schools-colmenar","schools-tres-cantos","mortgages","privacy"];

  var STATIC = document.body.hasAttribute('data-static-page');
  var STATIC_PAGE = document.body.getAttribute('data-static-page');
  var FILES = {home:'index.html',guides:'guides.html',about:'about.html','tres-cantos':'tres-cantos.html',colmenar:'colmenar-viejo.html',compare:'compare.html','schools-colmenar':'schools-colmenar-viejo.html','schools-tres-cantos':'schools-tres-cantos.html',mortgages:'mortgages.html',privacy:'privacy.html'};
  function pageHref(page, anchor){
    if(page==='home' && anchor==='guides')anchor='guide-catalogue';
    if (!STATIC) return '#' + page + (anchor ? '/' + anchor : '');
    return (page === STATIC_PAGE ? '' : './' + FILES[page]) + (anchor ? '#' + anchor : (page === STATIC_PAGE ? '#top' : ''));
  }
  function legacyHref(href){
    if (!STATIC || href.charAt(0) !== '#') return href;
    var bits = href.slice(1).split('/');
    return FILES[bits[0]] ? pageHref(bits[0], bits[1]) : href;
  }

  // UX helpers: session-only state, chapter feedback and portable guide links.
  function readSession(key, fallback){ try { return JSON.parse(sessionStorage.getItem(key)) || fallback; } catch(e){ return fallback; } }
  function saveSession(key, value){ try { if (value === null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, JSON.stringify(value)); } catch(e){} }
  function highlightAnchor(el){
    var disclosure=el && el.closest('details');if(disclosure)disclosure.open=true;
    if (!el || !/^H[1-6]$/.test(el.tagName)) return;
    el.classList.remove('chapter-highlight');
    requestAnimationFrame(function(){el.classList.add('chapter-highlight');});
    clearTimeout(el.__highlightTimer);
    el.__highlightTimer=setTimeout(function(){el.classList.remove('chapter-highlight');},1400);
  }
  function guideUrl(page){ return 'https://madridunpacked.com/' + (page === 'home' ? '' : FILES[page].replace(/\.html$/, '')); }

  var lastTrackedPage = null;
  var trail = [];
  var TITLES = {
    'guides': 'All guides — Madrid Unpacked',
    'home': 'Madrid Unpacked — first-hand guides to Tres Cantos & Colmenar Viejo',
    'about': 'About Patrick — Madrid Unpacked',
    'tres-cantos': 'Tres Cantos, unpacked — Madrid Unpacked',
    'colmenar': 'Colmenar Viejo, unpacked — Madrid Unpacked',
    'compare': 'Tres Cantos vs Colmenar Viejo — Madrid Unpacked',
    'schools-colmenar': 'Schools in Colmenar Viejo, unpacked — Madrid Unpacked',
    'schools-tres-cantos': 'Schools in Tres Cantos, unpacked — Madrid Unpacked',
    'mortgages': 'Mortgages in Spain, unpacked — Madrid Unpacked',
    'privacy': 'Privacy — Madrid Unpacked'
  };
  var labels = {};
  document.querySelectorAll('.page').forEach(function(s){ labels[s.id] = s.getAttribute('data-screen-label'); });
  // The static builder includes these labels; the one-file prototype creates them here.
  var mobileLabels={home:'Madrid Norte',guides:'All guides',about:'About Patrick','tres-cantos':'Tres Cantos',colmenar:'Colmenar Viejo',compare:'Compare towns','schools-colmenar':'Schools · Colmenar','schools-tres-cantos':'Schools · Tres Cantos',mortgages:'Buying a home',privacy:'Privacy'};
  document.querySelectorAll('.page .nav').forEach(function(nav){
    if(!nav.querySelector('.app-call')){var call=document.createElement('a'),section=nav.closest('.page'),offer=section.querySelector('[data-offer]');call.className='app-call';call.href=pageHref(offer?section.id:'home',offer?offer.id:'call');call.setAttribute('data-track','offer_nav_click');call.setAttribute('data-place','mobile_header');call.setAttribute('aria-label','Plan your move with Patrick');call.textContent='Plan your move';nav.appendChild(call);}
    var navbar=nav.closest('.navbar');
    if(!navbar.querySelector('.reading-progress')){var progress=document.createElement('div');progress.className='reading-progress';progress.setAttribute('role','progressbar');progress.setAttribute('aria-label','Reading progress');progress.setAttribute('aria-valuemin','0');progress.setAttribute('aria-valuemax','100');progress.innerHTML='<span></span>';navbar.appendChild(progress);}
  });
  function mobileState(page,anchor){
    var selected=page==='compare'?'compare':(page==='home'?(anchor==='guides'?'guides':'home'):(['about','privacy'].indexOf(page)<0?'guides':null));
    document.querySelectorAll('[data-mobile-tab]').forEach(function(a){
      if(a.getAttribute('data-mobile-tab')===selected)a.setAttribute('aria-current',page==='home'&&anchor==='guides'?'location':'page');else a.removeAttribute('aria-current');
    });
    updateReadingProgress();
    refreshResume();refreshPersonal();
  }
  function updateReadingProgress(){
    var section=document.querySelector('.page.active');if(!section)return;
    var progress=section.querySelector('.reading-progress'),toc=section.querySelector('.toc');if(!progress)return;
    progress.hidden=!toc;if(!toc || window.innerWidth>640)return;
    var first=section.querySelector('.gd-body') || section.querySelector('h2');
    var end=section.querySelector('.share') || section.querySelector('footer');if(!first || !end)return;
    var start=first.getBoundingClientRect().top+window.pageYOffset-window.innerHeight*.25;
    var finish=end.getBoundingClientRect().top+window.pageYOffset-window.innerHeight*.75;
    var percent=Math.round(Math.max(0,Math.min(100,(window.pageYOffset-start)/Math.max(1,finish-start)*100)));
    progress.setAttribute('aria-valuenow',String(percent));progress.querySelector('span').style.transform='scaleX('+percent/100+')';
  }
  function route(){
    if (STATIC) {
      var rawStatic = location.hash.slice(1), bits = rawStatic.split('/');
      if (FILES[bits[0]] && bits[0] !== STATIC_PAGE) { location.replace(pageHref(bits[0], bits[1])); return; }
      var anchorStatic = FILES[bits[0]] ? bits[1] : rawStatic;
      if(STATIC_PAGE==='home' && anchorStatic==='guides')anchorStatic='guide-catalogue';
      mobileState(STATIC_PAGE,anchorStatic);
      if (lastTrackedPage !== STATIC_PAGE) { lastTrackedPage = STATIC_PAGE; track('page_view', {page:STATIC_PAGE}); if (STATIC_PAGE === 'compare') track('comparison_view'); }
      if (anchorStatic === 'ask') { openAsk(); return; }
      setOffsets();
      var targetStatic = anchorStatic && document.getElementById(anchorStatic);
      if (targetStatic) { var closedParent=targetStatic.closest('details');if(closedParent)closedParent.open=true;highlightAnchor(targetStatic);targetStatic.scrollIntoView({block:'start'}); }
      else if(STATIC_PAGE==='guides'){var y=readSession('mu_catalogue_y',0);requestAnimationFrame(function(){window.scrollTo({top:Number(y)||0,behavior:'instant'});});}
      return;
    }
    var raw = (location.hash || '#home').slice(1);
    var parts = raw.split('/');
    var isPage = pages.indexOf(parts[0]) >= 0;
    var slug = isPage ? parts[0] : 'home';
    var anchor = isPage ? parts[1] : parts[0];
    if(slug==='home' && anchor==='guides')anchor='guide-catalogue';
    document.querySelectorAll('.page').forEach(function(s){ s.classList.toggle('active', s.id === slug); });
    mobileState(slug,anchor);
    document.title = TITLES[slug] || (labels[slug] + ' — Madrid Unpacked');
    if (lastTrackedPage !== slug) { lastTrackedPage = slug; track('page_view', { page: slug }); if (slug === 'compare') track('comparison_view'); }
    if (anchor === 'ask') { openAsk(); return; }
    if (anchor) {
      if (!trail.length || trail[trail.length - 1].slug !== slug) trailY(slug); else trail[trail.length - 1].y = window.pageYOffset;
      var el = document.querySelector('#' + slug + ' [id="' + anchor + '"]');
      if (el) { if (compact() && window.innerWidth>640) { var bb = bar(); if (bb) bb.classList.add('hide'); jumping = true; setTimeout(function(){ jumping = false; }, 900); } setOffsets();highlightAnchor(el); el.scrollIntoView({ block: 'start' }); return; }
    }
    var backY = trailY(slug);
    if(slug==='guides')backY=Number(readSession('mu_catalogue_y',backY))||0;
    window.scrollTo({ top: backY, behavior: 'instant' });
    document.querySelectorAll('.navbar').forEach(function(b){ b.classList.remove('hide', 'scrolled'); });
    lastY = 0; if (typeof setOffsets === 'function') setOffsets();
  }
  window.addEventListener('hashchange', route);



  // Keep phone headers stable; compact tablet/short-screen headers can hide on scroll.
  var lastY = window.pageYOffset, jumping = false;
  function bar(){ return document.querySelector('.page.active .navbar'); }
  var lastNavh = -1, lastPad = -1;
  function setOffsets(){
    var b = bar(); if (!b) return;
    var hidden = b.classList.contains('hide');
    var navh = hidden ? 0 : b.offsetHeight;
    var toc = document.querySelector('.page.active .toc');
    var toch = toc && window.innerWidth<1024 ? toc.offsetHeight : 0;
    if (navh !== lastNavh) { lastNavh = navh; document.documentElement.style.setProperty('--navh', navh + 'px'); }
    var pad = navh + toch + 12;
    if (pad !== lastPad) { lastPad = pad; document.documentElement.style.scrollPaddingTop = pad + 'px'; }
  }
  function compact(){ return window.innerWidth <= 760 || window.innerHeight <= 500; }
  function onScroll(){
    var b = bar(); if (!b) return;
    var y = window.pageYOffset, mobile = compact();
    b.classList.toggle('scrolled', y > 8);
    var menuOpen = b.querySelector('.gm-btn[aria-expanded="true"]');
    if (mobile && window.innerWidth>640 && !menuOpen) {
      if (jumping || (y > lastY + 6 && y > 140)) b.classList.add('hide');
      else if (y < lastY - 6 || y <= 140) b.classList.remove('hide');
    } else b.classList.remove('hide');
    lastY = y; setOffsets();updateReadingProgress();
  }
  var navTick = false;
  window.addEventListener('scroll', function(){ if (navTick) return; navTick = true; requestAnimationFrame(function(){ navTick = false; onScroll(); }); }, { passive: true });
  window.addEventListener('resize', onScroll);
  function sizeQuestionSheet(){
    var viewport=window.visualViewport;if(!viewport || viewport.scale>1)return;
    document.documentElement.style.setProperty('--sheet-height',viewport.height+'px');
    document.documentElement.style.setProperty('--sheet-bottom',Math.max(0,window.innerHeight-viewport.height-viewport.offsetTop)+'px');
  }
  if(window.visualViewport){window.visualViewport.addEventListener('resize',sizeQuestionSheet);window.visualViewport.addEventListener('scroll',sizeQuestionSheet);sizeQuestionSheet();}


  // partner share: WhatsApp with the guide title and link
  document.querySelectorAll('[data-share]').forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault();
      var sec = a.closest('.page'), title = sec.querySelector('h1').textContent.trim();
      var msg = 'Have a look at this before we decide — ' + title + ' (Madrid Unpacked): ' + guideUrl(sec.id);
      window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    });
  });

  document.querySelectorAll('[data-copy-guide]').forEach(function(btn){
    btn.addEventListener('click', async function(){
      var wrap=btn.closest('.share'), status=wrap.querySelector('[data-copy-status]');
      var fallback=wrap.querySelector('.copy-fallback'), url=guideUrl(btn.closest('.page').id);
      clearTimeout(btn.__copyTimer);
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(url);
        fallback.hidden=true; btn.textContent='Link copied ✓'; status.textContent='Guide link copied.';
        track('copy_guide', {place:'guide_share'});
        btn.__copyTimer=setTimeout(function(){btn.textContent='Copy guide link';},2200);
      } catch(e){
        fallback.hidden=false; var input=fallback.querySelector('input'); input.value=url; input.focus(); input.select();
        status.textContent='Select and copy the link below.'; track('copy_guide_fallback');
      }
    });
  });

  // paperwork sign-up (prototype: no backend, nothing stored)
  document.querySelectorAll('form.signup').forEach(function(f){
    var inp = f.querySelector('input'), msg = f.querySelector('.signup-msg');
    f.addEventListener('submit', function(e){
      e.preventDefault();
      var v = inp.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
        inp.setAttribute('aria-invalid', 'true'); msg.className = 'signup-msg err';
        msg.textContent = v ? "That email doesn't look quite right — check it and try again." : 'Add your email and I\'ll send it when it\'s ready.';
        inp.focus(); return;
      }
      inp.removeAttribute('aria-invalid');
      f.classList.add('done'); msg.className = 'signup-msg';
      if (typeof track === 'function') track('signup', { page: f.closest('.page').id });
      msg.innerHTML = '<b>You\'re on the list.</b> One email to ' + v.replace(/[<>&"]/g, '') + ' when the paperwork guide is out. Nothing else. — Patrick';
    });
    inp.addEventListener('input', function(){ if (inp.getAttribute('aria-invalid')) { inp.removeAttribute('aria-invalid'); msg.textContent = ''; } });
  });
  // hide the floating Ask button while the hero's own buttons are on screen
  (function(){
    var ctas = document.querySelector('[data-hero-ctas]');
    if (!ctas || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function(es){
      var onHome = document.querySelector('#home').classList.contains('active');
      document.body.classList.toggle('hero-ctas', onHome && es[0].isIntersecting);
    }).observe(ctas);
    window.addEventListener('hashchange', function(){ if (!document.querySelector('#home').classList.contains('active')) document.body.classList.remove('hero-ctas'); });
  })();


  // touch screens have no hover: unpack each card's box once as it scrolls into view
  (function(){
    if (!('IntersectionObserver' in window) || !window.matchMedia('(hover: none)').matches) return;
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('pop'); io.unobserve(e.target); } });
    }, { threshold: 0.9 });
    document.querySelectorAll('.box-ic').forEach(function(s){ io.observe(s); });
  })();

  // guides menu
  var gmBack = document.createElement('div'); gmBack.id = 'gm-backdrop'; document.body.appendChild(gmBack);
  function gmClose(except){
    document.querySelectorAll('[data-gm]').forEach(function(g){
      if (g === except) return;
      g.querySelector('.gm-btn').setAttribute('aria-expanded', 'false');
      g.querySelector('.gm-panel').hidden = true;
    });
    if (!except) gmBack.classList.remove('on');
  }
  document.querySelectorAll('[data-gm]').forEach(function(g){
    var btn = g.querySelector('.gm-btn'), panel = g.querySelector('.gm-panel');
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var open = btn.getAttribute('aria-expanded') !== 'true';
      gmClose(open ? g : null);
      btn.setAttribute('aria-expanded', String(open)); panel.hidden = !open;
      gmBack.classList.toggle('on', open);
      if (open) panel.style.setProperty('--gm-top', Math.round(btn.getBoundingClientRect().bottom + 8) + 'px');
      if (open) { var f = panel.querySelector('[aria-current]') || panel.querySelector('a'); if (f) f.focus({ preventScroll: true }); }
    });
    panel.addEventListener('click', function(e){ if (e.target.closest('a')) gmClose(null); });
    g.addEventListener('keydown', function(e){ if (e.key === 'Escape') { gmClose(null); btn.focus(); } });
  });
  gmBack.addEventListener('click', function(){ gmClose(null); });
  document.addEventListener('click', function(e){ if (!e.target.closest('[data-gm]')) gmClose(null); });
  window.addEventListener('hashchange', function(){ gmClose(null); });

  // chapter strips
  function slug(s){ return s.toLowerCase().replace(/&amp;|&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
  document.querySelectorAll('.page').forEach(function(sec){
    var toc = sec.querySelector('[data-toc] .toc-in'); if (!toc) return;
    var hs = Array.prototype.filter.call(sec.querySelectorAll('h2'), function(h){ return !h.closest('.contact'); });
    if (hs.length < 2) { toc.parentNode.remove(); return; }
    var html = '<a class="top" href="' + pageHref(sec.id) + '">↑ Top</a>';
    hs.forEach(function(h){ var id = sec.id + '-' + slug(h.textContent); h.id = id; html += '<a href="' + pageHref(sec.id, id) + '">' + h.textContent.replace(/:.*$/, '').replace(/ &amp; .*$/, '') + '</a>'; });
    toc.innerHTML = html;
    var mobile=sec.querySelector('.toc-mobile'), mobileNav=sec.querySelector('.toc-chapters');
    if (mobileNav) mobileNav.innerHTML=html;
    if (mobile) mobile.addEventListener('click',function(e){if(e.target.closest('a')) mobile.open=false;});
    // fact labels as jump links
    var map = { 'buy': /housing/i, 'rent': /housing/i, 'commute': /getting around/i, 'vibe': /vibe/i };
    sec.querySelectorAll('.facts em').forEach(function(em){
      var k = em.textContent.toLowerCase().split(' ')[0];
      var target = hs.filter(function(h){ return map[k] && map[k].test(h.textContent); })[0];
      if (target) em.innerHTML = '<a href="' + pageHref(sec.id, target.id) + '">' + em.textContent + '</a>';
    });
    var links = sec.querySelectorAll('.toc a:not(.top)');
    function mark(){
      var cur=null, nav=sec.querySelector('.navbar');
      var threshold=(nav && !nav.classList.contains('hide') ? nav.offsetHeight : 0)+(window.innerWidth<1024?toc.parentNode.offsetHeight:0)+24;
      hs.forEach(function(h){if(h.getBoundingClientRect().top<threshold)cur=h.id;});var tocBox=toc.closest('[data-toc]'),endEl=sec.querySelector('.gd-end')||sec.querySelector('.guide-finish')||sec.querySelector('.share');if(tocBox)tocBox.classList.toggle('past-end',!!endEl && window.innerWidth<1024 && endEl.getBoundingClientRect().top<threshold);
      links.forEach(function(a){
        var on=(STATIC ? a.getAttribute('href').split('#')[1] : a.getAttribute('href').split('/')[1])===cur;
        a.classList.toggle('on',on);
        if(on){a.setAttribute('aria-current','location');}else a.removeAttribute('aria-current');
        if(on && a.parentNode===toc){var l=a.offsetLeft-16;if(l<toc.scrollLeft || a.offsetLeft+a.offsetWidth>toc.scrollLeft+toc.clientWidth)toc.scrollLeft=l;}
      });
      var label=sec.querySelector('[data-current-chapter]'), heading=hs.filter(function(h){return h.id===cur;})[0];
      if(label) label.textContent=heading ? 'Section '+(hs.indexOf(heading)+1)+' of '+hs.length+' · '+heading.textContent.split(':')[0] : 'Choose a section';
      if(heading && sec.classList.contains('active'))rememberChapter(sec.id,heading);
    }
    function edge(){ toc.classList.toggle('at-end', toc.scrollLeft + toc.clientWidth >= toc.scrollWidth - 4); }
    toc.addEventListener('scroll', edge, { passive: true }); window.addEventListener('resize', edge);
    var tick = false;
    window.addEventListener('scroll', function(){ if (tick || !sec.classList.contains('active')) return; tick = true; requestAnimationFrame(function(){ tick = false; mark(); edge(); }); }, { passive: true }); mark(); edge();
    hs.forEach(function(h,i){
      var actions=document.createElement('div');actions.className='chapter-actions';
      var ask=document.createElement('button');ask.type='button';ask.setAttribute('data-open-ask','');ask.setAttribute('data-ask-section',h.textContent.trim());ask.setAttribute('data-ask-page',sec.id);ask.innerHTML='<span class="ca-full">Ask about '+esc(h.textContent.split(':')[0])+'</span><span class="ca-short">Ask Patrick</span>';actions.appendChild(ask);
      var next=hs[i+1],a=document.createElement('a');a.href=next?pageHref(sec.id,next.id):pageHref('guides');a.textContent=next?'Next: '+next.textContent.split(':')[0]+' →':'Explore more guides →';actions.appendChild(a);
      var boundary=next || sec.querySelector('.share');if(boundary)boundary.before(actions);
    });
    if(sec.id==='compare'){
      var topics=document.createElement('nav');topics.className='compare-topics';topics.setAttribute('aria-label','Comparison topics');
      ['Housing','Schools','Commute','Lifestyle'].forEach(function(topic){var match={Housing:/housing/i,Schools:/schools/i,Commute:/getting around/i,Lifestyle:/character/i}[topic],h=hs.find(function(h){return match.test(h.textContent);});if(h){var a=document.createElement('a');a.href=pageHref(sec.id,h.id);a.textContent=topic;topics.appendChild(a);}});
      var table=sec.querySelector('.towns-tbl');if(table)table.before(topics);
    }
    var tocWrap=toc.parentNode,body=tocWrap.nextElementSibling;if(body){var restBlocks=[],nextBlock=body;while(nextBlock&&nextBlock.tagName!=='FOOTER'&&nextBlock.tagName!=='SCRIPT'){restBlocks.push(nextBlock);nextBlock=nextBlock.nextElementSibling;}if(restBlocks.length>1){body=document.createElement('div');restBlocks[0].before(body);restBlocks.forEach(function(block){block.classList.add('reading-block');body.appendChild(block);});}var layout=document.createElement('div');layout.className='reading-layout';tocWrap.before(layout);layout.appendChild(tocWrap);layout.appendChild(body);body.classList.add('reading-article');toc.setAttribute('role','navigation');toc.setAttribute('aria-label','Guide chapters');}
  });

  // Only a guide/chapter pointer is stored across visits; messages stay session-only.
  function readingStore(value){try{if(value===undefined)return JSON.parse(localStorage.getItem('mu_reading'));if(value===null)localStorage.removeItem('mu_reading');else localStorage.setItem('mu_reading',JSON.stringify(value));}catch(e){if(value===undefined)return readSession('mu_reading',null);saveSession('mu_reading',value);}}
  function rememberChapter(page,heading){
    var previous=readingStore();if(previous && previous.page===page && previous.anchor===heading.id)return;
    readingStore({page:page,anchor:heading.id,chapter:heading.textContent.trim().slice(0,160)});
  }
  function refreshResume(){
    var saved=readingStore();document.querySelectorAll('[data-resume]').forEach(function(card){
      var valid=saved && FILES[saved.page] && !['home','guides','about','privacy'].includes(saved.page) && typeof saved.anchor==='string' && saved.anchor.indexOf(saved.page+'-')===0 && /^[a-z0-9-]+$/.test(saved.anchor);
      card.hidden=!valid;if(card.parentNode.hasAttribute('data-home-resume'))card.parentNode.hidden=!valid;if(!valid)return;
      card.innerHTML='<div class="resume-heading"><b>Continue reading</b><button type="button" class="text-button" data-forget-reading aria-label="Clear saved reading position">Clear</button></div><p><strong>'+esc(mobileLabels[saved.page])+'</strong><span>'+esc(saved.chapter || '')+'</span></p><a class="resume-link" href="'+pageHref(saved.page,saved.anchor)+'">Resume guide →</a>';
      card.querySelector('button').onclick=function(){readingStore(null);refreshResume();refreshPersonal();};
    });
  }
  var homeCatalog=document.querySelector('#home [data-home-resume]');if(homeCatalog){var resume=document.createElement('div');resume.className='resume-card';resume.setAttribute('data-resume','');resume.hidden=true;homeCatalog.appendChild(resume);}
  refreshResume();
  document.querySelectorAll('.guide-filters').forEach(function(filters){filters.hidden=false;});
  function readLocal(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback;}catch(e){return readSession(key,fallback);}}
  function writeLocal(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(e){saveSession(key,value);return false;}}
  var savedSections=readLocal('mu_saved_sections',[]);
  if(!Array.isArray(savedSections))savedSections=[];
  savedSections=savedSections.filter(function(s){return s && FILES[s.page] && typeof s.anchor==='string' && /^[a-z0-9-]+$/.test(s.anchor) && typeof s.title==='string';});
  function renderSaved(){refreshPersonal();if(typeof updateDirectBookmarks==='function')updateDirectBookmarks();if(typeof updateSavedTray==='function')updateSavedTray();document.querySelectorAll('[data-section-key]').forEach(function(utility){var key=utility.getAttribute('data-section-key'),on=savedSections.some(function(s){return s.page+'/'+s.anchor===key;}),button=utility.querySelector('[data-save-section]');if(button){button.textContent=on?'Saved ✓':'Save section';button.setAttribute('aria-pressed',String(on));}});document.querySelectorAll('[data-saved-sections]').forEach(function(list){
    list.innerHTML='<p>Saved on this device. No account needed.</p>'+(savedSections.length?savedSections.map(function(s,i){return '<div class="saved-section"><a href="'+pageHref(s.page,s.anchor)+'"><small>'+esc(mobileLabels[s.page])+'</small><strong>'+esc(s.title)+'</strong><span>Read section →</span></a><button type="button" data-remove-saved="'+i+'" aria-label="Remove '+esc(s.title)+' from saved sections">Remove</button></div>';}).join(''):'<p>No saved sections yet. Use the bookmark beside a section title to save it.</p>');
    list.querySelectorAll('[data-remove-saved]').forEach(function(button){button.onclick=function(){removeStoredBookmark(Number(button.getAttribute('data-remove-saved')));writeLocal('mu_saved_sections',savedSections);renderSaved();var filter=document.querySelector('[data-saved-toggle]');if(filter)filter.focus({preventScroll:true});};});
    var owner=list.closest('.personal-reading')||list.closest('.guide-library'),toggle=owner&&owner.querySelector('[data-saved-toggle]');if(toggle)toggle.textContent='Saved sections ('+savedSections.length+')';
  });if(typeof showBookmarkUndo==='function')showBookmarkUndo();}
  document.querySelectorAll('.guide-library').forEach(function(library){var filters=library.querySelector('.guide-filters');if(!filters)return;var button=document.createElement('button');button.type='button';button.setAttribute('data-guide-filter','saved');button.setAttribute('aria-pressed','false');button.textContent='Saved';filters.appendChild(button);var list=document.createElement('div');list.setAttribute('data-saved-sections','');list.hidden=true;filters.after(list);});renderSaved();
  document.querySelectorAll('.visit-checklist').forEach(function(checklist){
    var saved;try{saved=JSON.parse(localStorage.getItem('mu_visit')) || {};}catch(e){saved=readSession('mu_visit',{});}
    var items=Array.from(checklist.querySelectorAll('[data-visit-item]')),reset=checklist.querySelector('[data-visit-reset]');reset.hidden=false;
    items.forEach(function(input){input.checked=saved && saved[input.getAttribute('data-visit-item')]===true;});
    function updateVisit(persist){var values={},count=0;items.forEach(function(input){values[input.getAttribute('data-visit-item')]=input.checked;if(input.checked)count++;});checklist.querySelector('[data-visit-progress]').textContent=count+' of 4 checked'+(count===4?' · Ready to compare your notes.':'');if(persist){try{localStorage.setItem('mu_visit',JSON.stringify(values));}catch(e){saveSession('mu_visit',values);}}}
    checklist.addEventListener('change',function(){updateVisit(true);});reset.onclick=function(){items.forEach(function(input){input.checked=false;});updateVisit(true);};updateVisit(false);
    var noteLabel=document.createElement('label');noteLabel.className='visit-notes';noteLabel.innerHTML='<span><b>Your visit notes</b><small>Saved on this device. Clearing ticks keeps your notes.</small></span><textarea rows="3" maxlength="2000" placeholder="Neighbourhoods, school questions, homes to revisit…" aria-label="Your visit notes"></textarea><small data-note-status aria-live="polite"></small>';
    reset.before(noteLabel);var notes=noteLabel.querySelector('textarea'),noteValue=readLocal('mu_visit_notes','');notes.value=typeof noteValue==='string'?noteValue:'';
    notes.addEventListener('input',function(){var persistent=writeLocal('mu_visit_notes',notes.value);noteLabel.querySelector('[data-note-status]').textContent=persistent?'Notes saved on this device.':'Notes kept for this session.';});
  });
  document.querySelectorAll('[data-guide-filter]').forEach(function(button){button.addEventListener('click',function(){
    var library=button.closest('.guide-library'),filter=button.getAttribute('data-guide-filter'),count=0;
    library.querySelectorAll('[data-guide-filter]').forEach(function(b){b.setAttribute('aria-pressed',String(b===button));});
    library.querySelectorAll('[data-guide-category]').forEach(function(card){card.hidden=filter!=='all' && card.getAttribute('data-guide-category')!==filter;if(card.closest('.library-entry'))card.closest('.library-entry').hidden=card.hidden;if(!card.hidden)count++;});
    library.querySelector('[data-filter-status]').textContent=filter==='saved'?savedSections.length+' saved sections':count+' '+(count===1?'guide':'guides');
    if(filter!=='saved')saveSession('mu_catalogue_filter',filter);
  });});
  document.querySelectorAll('.share').forEach(function(wrap){
    if(!navigator.share)return;
    var button=document.createElement('button');button.type='button';button.className='b2 sm';button.textContent='Share guide';button.setAttribute('data-native-share','');
    var copy=wrap.querySelector('[data-copy-guide]');if(copy)copy.before(button);else wrap.appendChild(button);
    button.addEventListener('click',async function(){var sec=wrap.closest('.page'),status=wrap.querySelector('[data-copy-status]');button.disabled=true;try{await navigator.share({title:sec.querySelector('h1').textContent.trim(),url:guideUrl(sec.id)});track('native_share',{page:sec.id});}catch(e){if(e.name!=='AbortError' && status)status.textContent='Sharing unavailable. Use Copy guide link or WhatsApp below.';}finally{button.disabled=false;}});
  });

  // Native horizontal scrolling remains available without JavaScript.
  document.querySelectorAll('.tq-grid').forEach(function(track){
    var cards=Array.from(track.querySelectorAll('.tq')),current=0,timer;
    track.setAttribute('role','region');track.setAttribute('aria-label','Sample family quotes');
    var controls=document.createElement('div');controls.className='tq-controls';
    controls.innerHTML='<button type="button" data-quote-prev aria-label="Previous quote">←</button><div class="tq-dots">'+cards.map(function(card,i){return '<button type="button" data-quote-index="'+i+'" aria-label="Show quote '+(i+1)+' of '+cards.length+'"></button>';}).join('')+'</div><span class="tq-count" aria-live="polite" aria-atomic="true"></span><button type="button" data-quote-next aria-label="Next quote">→</button>';
    track.after(controls);
    var prev=controls.querySelector('[data-quote-prev]'),next=controls.querySelector('[data-quote-next]');
    function update(index){current=index;prev.disabled=index===0;next.disabled=index===cards.length-1;controls.querySelector('.tq-count').textContent=(index+1)+' / '+cards.length;controls.querySelectorAll('[data-quote-index]').forEach(function(button,i){if(i===index)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');});}
    function go(index){
      index=Math.max(0,Math.min(cards.length-1,index));
      var left=track.scrollLeft+cards[index].getBoundingClientRect().left-track.getBoundingClientRect().left;
      track.scrollTo({left:left,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});update(index);
    }
    prev.onclick=function(){go(current-1);};next.onclick=function(){go(current+1);};
    controls.querySelectorAll('[data-quote-index]').forEach(function(button){button.onclick=function(){go(Number(button.getAttribute('data-quote-index')));};});
    track.addEventListener('scroll',function(){clearTimeout(timer);timer=setTimeout(function(){var left=track.getBoundingClientRect().left,best=0,distance=Infinity;cards.forEach(function(card,i){var d=Math.abs(card.getBoundingClientRect().left-left);if(d<distance){best=i;distance=d;}});update(best);},120);},{passive:true});
    track.addEventListener('keydown',function(e){if(window.innerWidth>640 || e.target!==track)return;if(e.key==='ArrowRight' || e.key==='ArrowLeft'){e.preventDefault();go(current+(e.key==='ArrowRight'?1:-1));}});
    function size(){if(window.innerWidth<=640)track.setAttribute('tabindex','0');else track.removeAttribute('tabindex');}
    size();window.addEventListener('resize',size);update(0);
  });

  // Mobile chapter links open a reader without moving the underlying guide.
  function swipeSheet(panel,contentSelector,close){
    var handle=document.createElement('div');handle.className='sheet-handle';handle.setAttribute('aria-hidden','true');panel.prepend(handle);
    var start=null,drag=0;
    function reset(){start=null;drag=0;panel.style.transform='';}
    panel.addEventListener('touchstart',function(e){
      var content=panel.querySelector(contentSelector);
      if(window.innerWidth>640 || e.touches.length!==1 || (content && content.scrollTop>0) || e.target.closest('button,a,input,textarea,summary,nav'))return;
      start={x:e.touches[0].clientX,y:e.touches[0].clientY};
    },{passive:true});
    panel.addEventListener('touchmove',function(e){
      if(!start)return;if(e.touches.length!==1){reset();return;}
      var dy=e.touches[0].clientY-start.y,dx=Math.abs(e.touches[0].clientX-start.x);
      if(dy<0 || dx>Math.abs(dy)){reset();return;}
      if(dy>8){e.preventDefault();drag=dy;panel.style.transform='translateY('+Math.min(dy,240)+'px)';}
    },{passive:false});
    panel.addEventListener('touchend',function(){var dismiss=drag>90;reset();if(dismiss)close();});
    panel.addEventListener('touchcancel',reset);
  }
  var reader=document.createElement('dialog');reader.className='chapter-reader';reader.setAttribute('aria-labelledby','reader-title');document.body.appendChild(reader);
  var readerSection=null,readerHeadings=[],readerIndex=0,readerOpener=null,readerOverflow='',readerAfterClose=null;
  var readerPositions=readSession('mu_reader_positions')||{};
  function saveReaderPosition(){
    var content=reader.querySelector('.reader-content');if(!reader.open || !content)return;
    readerPositions[readerSection.id+'/'+readerHeadings[readerIndex].id]={top:content.scrollTop,details:Array.from(content.querySelectorAll('details')).map(function(d){return d.open;})};
    saveSession('mu_reader_positions',readerPositions);
  }
  function hideReader(){if(!reader.open)return;saveReaderPosition();reader.close();document.body.style.overflow=readerOverflow;if(readerOpener && readerOpener.isConnected)readerOpener.focus({preventScroll:true});}
  function closeReader(after){
    if(!reader.open){if(typeof after==='function')after();return;}
    hideReader();
    if(history.state && history.state.muReader){readerAfterClose=typeof after==='function'?after:null;history.back();}
    else if(typeof after==='function')after();
  }
  function readerHistory(replace){
    try{var state=Object.assign({},history.state||{},{muReader:{page:readerSection.id,anchor:readerHeadings[readerIndex].id,origin:document.querySelector('.page.active').id}});history[replace?'replaceState':'pushState'](state,'',location.href);}catch(e){}
  }
  function selectReader(index){saveReaderPosition();readerIndex=index;renderReader();readerHistory(true);}
  function makeSectionTools(page,heading){
    var utility=document.createElement('div');utility.className='reader-utility';utility.innerHTML='<button type="button" data-share-section>Share section</button><p role="status"></p><input readonly hidden aria-label="Section link to copy">';
    utility.setAttribute('data-section-key',page+'/'+heading.id);
    var status=utility.querySelector('[role="status"]');
    utility.querySelector('[data-share-section]').onclick=async function(){var url=guideUrl(page)+'#'+heading.id;
      try{if(navigator.share){await navigator.share({title:heading.textContent+' · Madrid Unpacked',url:url});return;}}catch(e){if(e.name==='AbortError')return;}
      try{if(!navigator.clipboard)throw new Error('Unavailable');await navigator.clipboard.writeText(url);status.textContent='Section link copied.';}catch(e){var input=utility.querySelector('input');input.hidden=false;input.value=url;input.focus();input.select();status.textContent='Select and copy this section link.';}
    };
    return utility;
  }
  function renderReader(){
    var heading=readerHeadings[readerIndex];
    reader.innerHTML='<div class="reader-head"><div><details class="reader-chapters"><summary class="reader-position" aria-label="Choose a section">'+esc(mobileLabels[readerSection.id])+' · Section '+(readerIndex+1)+' of '+readerHeadings.length+' <span aria-hidden="true">⌄</span></summary><nav aria-label="Guide sections">'+readerHeadings.map(function(h,i){return '<button type="button" data-reader-chapter="'+i+'"'+(i===readerIndex?' aria-current="true"':'')+'>'+esc(h.textContent)+'</button>';}).join('')+'</nav></details><h2 class="reader-title" id="reader-title" tabindex="-1">'+esc(heading.textContent)+'</h2></div><button type="button" class="reader-close" aria-label="Close section">×</button></div><div class="reader-content"></div><div class="reader-footer"><div class="reader-controls"><button type="button" data-reader-prev>← Previous</button><button type="button" data-reader-next>Next →</button></div><div class="reader-actions"><a data-reader-full href="'+pageHref(readerSection.id,heading.id)+'">Read in full guide</a><button type="button" data-reader-ask>Ask about this section</button></div></div>';
    reader.querySelector('#reader-title').classList.add('bookmark-heading');reader.querySelector('#reader-title').appendChild(directBookmark(readerSection.id,heading));updateDirectBookmarks();
    var content=reader.querySelector('.reader-content'),node=heading.nextElementSibling;
    if(!reader.dataset.swipeWired){swipeSheet(reader,'.reader-content',function(){closeReader();});reader.dataset.swipeWired='true';}
    else {var handle=document.createElement('div');handle.className='sheet-handle';handle.setAttribute('aria-hidden','true');reader.prepend(handle);}
    while(node && node.tagName!=='H2' && !node.classList.contains('share')){if(!node.classList.contains('chapter-actions') && !node.classList.contains('desktop-section-tools'))content.appendChild(node.cloneNode(true));node=node.nextElementSibling;}
    content.querySelectorAll('[data-mark-read]').forEach(function(button){button.onclick=function(){var original=readerSection.querySelector('[data-mark-read]');if(original){original.click();var status=content.querySelector('.completion-status');if(status)status.textContent=readerSection.querySelector('.completion-status').textContent;}};});
    content.querySelectorAll('[id]').forEach(function(el){el.removeAttribute('id');});
    content.querySelectorAll('.gl').forEach(function(el){el.replaceWith(document.createTextNode(el.textContent));});
    reader.querySelector('.reader-close').onclick=function(){closeReader();};
    reader.querySelectorAll('[data-reader-chapter]').forEach(function(button){button.onclick=function(){selectReader(Number(button.getAttribute('data-reader-chapter')));};});
    var prev=reader.querySelector('[data-reader-prev]'),next=reader.querySelector('[data-reader-next]');prev.disabled=readerIndex===0;next.disabled=readerIndex===readerHeadings.length-1;
    next.textContent=next.disabled?'Last section':'Next: '+readerHeadings[readerIndex+1].textContent+' →';
    reader.querySelector('.reader-content').prepend(makeSectionTools(readerSection.id,heading));
    prev.onclick=function(){selectReader(readerIndex-1);};next.onclick=function(){selectReader(readerIndex+1);};
    reader.querySelector('[data-reader-full]').onclick=function(e){e.preventDefault();var href=this.getAttribute('href');closeReader(function(){location.href=href;});};
    var ask=reader.querySelector('[data-reader-ask]');ask.setAttribute('data-ask-section',heading.textContent);ask.setAttribute('data-ask-page',readerSection.id);
    ask.onclick=function(e){e.stopPropagation();var opener=readerOpener;closeReader(function(){openAsk(ask);askOpener=opener;});};
    var saved=readerPositions[readerSection.id+'/'+heading.id];
    if(saved && Array.isArray(saved.details))content.querySelectorAll('details').forEach(function(d,i){d.open=!!saved.details[i];});
    content.scrollTop=saved && Number.isFinite(saved.top)?Math.max(0,saved.top):0;
    content.addEventListener('scroll',saveReaderPosition,{passive:true});
    reader.querySelector('#reader-title').focus({preventScroll:true});rememberChapter(readerSection.id,heading);refreshResume();refreshPersonal();
  }
  function openReader(section,heading,opener,fromHistory){
    var wasOpen=reader.open;saveReaderPosition();
    readerSection=section;readerHeadings=Array.from(section.querySelectorAll('h2')).filter(function(h){return !h.closest('.contact');});readerIndex=readerHeadings.indexOf(heading);readerOpener=opener;
    if(!reader.open){readerOverflow=document.body.style.overflow;document.body.style.overflow='hidden';reader.showModal();}
    renderReader();if(!fromHistory)readerHistory(wasOpen);
  }
  reader.addEventListener('cancel',function(e){e.preventDefault();closeReader();});
  reader.addEventListener('click',function(e){if(e.target===reader){var r=reader.getBoundingClientRect();if(e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom)closeReader();}});
  document.querySelectorAll('.page').forEach(function(section){
    if(!section.querySelector('[data-toc]'))return;
    section.querySelectorAll('.toc-chapters a,.compare-topics a,.chapter-actions a').forEach(function(link){
      var href=link.getAttribute('href'),anchor=STATIC?(href.charAt(0)==='#'?href.slice(1):null):(href.indexOf('#'+section.id+'/')===0?href.split('/')[1]:null);
      var heading=anchor && section.querySelector('[id="'+anchor+'"]');if(!heading || heading.tagName!=='H2')return;
      link.setAttribute('data-reader-link','');link.setAttribute('aria-label','Read section: '+heading.textContent);
    });
  });
  document.addEventListener('click',function(e){
    if(window.innerWidth>640 || e.defaultPrevented || e.button>0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)return;
    var link=e.target.closest('a[href]');if(!link || link.hasAttribute('data-reader-full') || link.closest('#ask-root'))return;
    var section=document.querySelector('.page.active');if(!section || !section.querySelector('[data-toc]'))return;
    var href=link.getAttribute('href'),anchor=STATIC?(href.charAt(0)==='#'?href.slice(1):null):(href.indexOf('#'+section.id+'/')===0?href.split('/')[1]:null);
    var heading=anchor && section.querySelector('[id="'+anchor+'"]');if(!heading || heading.tagName!=='H2')return;
    e.preventDefault();var contents=section.querySelector('.toc-mobile');if(contents)contents.open=false;openReader(section,heading,link.closest('.chapter-reader')?readerOpener:link);
  });
  window.addEventListener('popstate',function(){
    var marker=history.state && history.state.muReader,section=document.querySelector('.page.active');
    if(marker && window.innerWidth<=640 && section && (section.id===marker.page || section.id===marker.origin)){section=document.getElementById(marker.page);var heading=section && section.querySelector('[id="'+marker.anchor+'"]');if(heading && heading.tagName==='H2')openReader(section,heading,readerOpener,true);}
    else hideReader();
    var after=readerAfterClose;readerAfterClose=null;if(after)after();
  });
  window.addEventListener('hashchange',hideReader);window.addEventListener('resize',function(){if(window.innerWidth>640)closeReader();});

  var GUIDE_INDEX = [{"page": "tres-cantos", "anchor": "tres-cantos-the-vibe", "title": "The vibe", "text": "Patrick’s experience and research It's striking how much the atmosphere changes the moment you cross from Colmenar Viejo into Tres Cantos. This is a town full of young, often international families. Wherever you end up living, you're almost certainly within walking distance of bars, restaurants, and parks. If you're weighing up the north of town, look into the Parque Paraninfo project — it's shaping up to be a real anchor for that part of Tres Cantos. This is also, notably, one of the more affluent towns in Spain, with one of the highest average household incomes in the country."}, {"page": "tres-cantos", "anchor": "tres-cantos-housing-buying-vs-renting", "title": "Housing: buying vs renting", "text": "Check before decidingAbout these ranges. Patrick’s indicative housing ranges, not a market average. Compare like-for-like homes with current sale listings and current rentals. Prices in Tres Cantos are already high, and still climbing. You're unlikely to spend less here than you would in the city itself — but you do get more for your money: three bedrooms, a communal pool, parking, and, to varying degrees, a terrace. New-build · to buy €630K–€700K New-build · to rent €1,850–€2,100/mo For a new-build flat in Tres Cantos North with that spec, expect to pay the ranges above — new-build comfort comes at a premium."}, {"page": "tres-cantos", "anchor": "tres-cantos-neighbourhoods-old-town-vs-north", "title": "Neighbourhoods: old town vs north", "text": "Old town Established and settled. Walking distance to excellent schools, sports centres, shops, bars and restaurants, and never far from trees or open green space. Closer to the current train station. Flats are older — around 30 years old — but still commonly come with a communal pool, even if the terrace is smaller or absent. North Up-and-coming, and already delivering: brand-new tennis courts, an impressive children's park, and a growing mix of restaurants, shops and bars. Also home to Spain's Netflix production studios. Major investment on the way: a new hospital has just opened, a new train station is underway, and the planned Parque Paraninfo will bring a school, library, theatre and culture centre. Right now it's still a lot of building sites — but things move fast. New builds here typically come with aerotermia, a genuine game-changer for a Spanish summer — and all of this is already priced in, so the north doesn't come cheap."}, {"page": "tres-cantos", "anchor": "tres-cantos-schools", "title": "Schools", "text": "Check before decidingCheck school types and language options in the official Madrid school directory; see the admissions process and dates. An excellent range of schools across every type. The public schools are consistently high quality — worth a special mention is Colegio Aldebarán, a rare example of a public school taking a modern, respectful approach to early years education. On the concertado side, Humanitas stands out for its facilities. And for private, international options, you have King's College Soto de Viñuelas (British curriculum) and Casvi International American School (American curriculum, with IB from age 3)."}, {"page": "tres-cantos", "anchor": "tres-cantos-facilities-and-day-to-day-life", "title": "Facilities & day-to-day life", "text": "Placeholder · Parque de los Niños Parque de los Niños — a huge, Scandinavian-style park with bars and restaurants right across the road. Placeholder · [second park name] [Second park name] — a large green space with cycling paths, ideal with children, dotted with excellent play parks. There's also a genuinely great Argentinian food-truck style spot to eat right in the park. Placeholder · tennis courts, north Brand-new tennis courts in the north, a new sports centre on the way, and good tennis facilities scattered across the rest of the town. Placeholder · shopping centre Bike lanes run throughout, and the whole town is unusually walkable thanks to its planned layout. There's also a shopping centre with a cinema."}, {"page": "tres-cantos", "anchor": "tres-cantos-getting-around", "title": "Getting around", "text": "Check before decidingJourney times depend on your destination and departure. Check your trip in Renfe’s current timetable. The train is excellent, running the full length of Madrid from Chamartín down to Atocha. Within the town itself, bike lanes and walking paths are everywhere. Parking can be a real pain depending on where you need to be in the old town. The drive into Madrid is short outside of rush hour — but at peak times it can more than double, so if that's your situation, take the train."}, {"page": "tres-cantos", "anchor": "tres-cantos-pros-and-cons", "title": "Pros & cons", "text": "Pros Exceptional school choice across public, concertado, private and bilingual Genuinely family- and child-friendly design — green space, playgrounds, bike lanes everywhere Fast, direct train into central Madrid (~28 minutes) New builds come with aerotermia — a real quality-of-life upgrade for Spanish summers Major infrastructure investment landing soon: new hospital, new train station, Parque Paraninfo Safe, walkable, well-planned throughout Strong community of young, international families Good local amenities, including a shopping centre with a cinema Cons One of the most expensive commuter towns near Madrid, and still rising The north is still under construction — building sites for now, not yet a finished picture Parking in the old town can be genuinely frustrating Driving at rush hour can more than double your commute The north's future potential is already priced into today's cost"}, {"page": "tres-cantos", "anchor": "tres-cantos-is-tres-cantos-right-for-you", "title": "Is Tres Cantos right for you?", "text": "You'll love it here if: School choice is your top priority and you want every option on the table You're happy paying for new-build comforts like aerotermia You want walkability and green space without sacrificing a fast train into Madrid You're drawn to a young, international, family-dense community It might frustrate you if: Budget is tight — you'll get noticeably less space here than in Colmenar Viejo for the same money You want things finished and settled now, rather than construction happening around you You're hoping for a big house with a garden — flats dominate this market You're after a slower, more traditionally Spanish pace of life"}, {"page": "colmenar", "anchor": "colmenar-the-vibe", "title": "The vibe", "text": "Patrick’s experience and research For all its rapid growth and modernisation, Colmenar Viejo still has a distinctly \"Spanish pueblo\" feel. That's not a plus or a minus — it depends entirely on what you're looking for. Speaking Spanish here isn't optional if you want to really integrate, though it's a genuinely great place to learn if you're willing. We're still discovering beautiful walks on the edge of town, with panoramic views taking in both the Madrid Sierra and the city skyline in the same glance."}, {"page": "colmenar", "anchor": "colmenar-housing-buying-vs-renting", "title": "Housing: buying vs renting", "text": "Check before decidingAbout these ranges. Patrick’s indicative housing ranges, not a market average. Compare like-for-like homes with current sale listings and current rentals. Prices in Colmenar Viejo are rising fast, but it remains significantly and meaningfully cheaper than Tres Cantos. It's also currently one of the most active new-development areas in the region, so there's real choice on the market. If you can, we'd strongly recommend looking for a new build with aerotermia — the underfloor heating and cooling system has been a genuine game-changer for us living in Spain, transforming the summer: you can finally enjoy the heat during the day and still sleep as well as you do in winter. ~€500K budget 3-bed ground-floor flat Good-sized terrace or garden, communal pool ~€600K budget Semi-new chalet Garden, communal pool There aren't as many off-plan new builds underway as there were a year ago, but plenty of semi-new builds (10 years old or less) come onto the market regularly."}, {"page": "colmenar", "anchor": "colmenar-neighbourhoods", "title": "Neighbourhoods", "text": "The one area we wouldn't recommend is the town centre itself. It's suffered from years of under-investment, though the town hall is now starting to invest and improve it gradually. Beyond that, there are three newer neighbourhoods worth knowing, plus one older one: Adelfillas \"The new neighbourhood.\" Excellent motorway connections, very close to the main town, schools and supermarkets. Quiet and residential — roughly 90% modern flats and houses with large communal areas and pools, full of young families from Madrid. About a 10-minute drive to the train station, with free parking. La Estación Similar feel to Adelfillas, but within walking distance of the train station. Benefits from the Samaranch sports centre and a good pizza place, though short on everyday amenities for now — a new shopping centre has been announced. Served by two newer schools, Peñalvento and Héroes Dos de Mayo. Cerro Tejera The newest neighbourhood, at the top of the town, often with stunning Sierra views. A short walk to Los Arcos for some. A peaceful, slightly out-of-the-way area, projected to keep growing with a new concertado school scheduled nearby. Fuentesanta An older neighbourhood built around a lovely, tree-filled park. Houses here are older — worth considering if you don't mind a renovation. Plenty come with communal pools and shared spaces of their own."}, {"page": "colmenar", "anchor": "colmenar-schools", "title": "Schools", "text": "Check before decidingCheck school types and language options in the official Madrid school directory; see the admissions process and dates. Schools here generally have a good reputation. Among the state schools, Antonio Machado, Fuentesanta, Ángel León, Héroes Dos de Mayo, and Federico García Lorca are consistently the preferred choices. On the concertado side, there are two options: Zurbarán and Peñalvento. Peñalvento wins hands-down on facilities — a big, modern, open campus with its own swimming pool — but it's worth knowing it's a Catholic school with a fairly strict environment where Catholic rituals are practiced; not a downside or an upside, just something to factor in. Zurbarán's facilities are older, but the standard of teaching is excellent and the environment is warm and family-oriented."}, {"page": "colmenar", "anchor": "colmenar-facilities-and-day-to-day-life", "title": "Facilities & day-to-day life", "text": "Placeholder · Parque de los Héroes Parque de los Héroes — one of several excellent parks for children scattered around town. Placeholder · El Vivero El Vivero and Fuentesanta — more green space among the town's better-loved parks. Placeholder · Los Arcos Los Arcos has a great atmosphere at weekends — good for a drink and something to eat while the kids play in the square. Placeholder · town amenities The town is big enough to have everything you need day to day: several supermarkets, a market, tennis courts, football pitches, swimming pools, restaurants and cafés. There are also countless walks with genuinely stunning scenery just on the edge of town, and we're still discovering new ones. Colmenar sits at a really nice middle point between nature and city: half an hour one way and you're in Madrid with everything it has to offer; half an hour the other way and you're deep in the Sierra, with beautiful hikes and great old-school mountain restaurants."}, {"page": "colmenar", "anchor": "colmenar-getting-around", "title": "Getting around", "text": "Check before decidingJourney times depend on your destination and departure. Check your trip in Renfe’s current timetable. The train is excellent, running the full length of Madrid from Chamartín down to Atocha. The town itself is large and spread out, so in most neighbourhoods you'll rely on the car fairly often. The drive into Madrid is short outside rush hour, but it can more than double at peak times — if that's likely to be your situation, the train is strongly recommended."}, {"page": "colmenar", "anchor": "colmenar-pros-and-cons", "title": "Pros & cons", "text": "Pros Significantly cheaper than Tres Cantos, for meaningfully more space — a garden or a house is realistic here One of the most active new-development areas in the region, so real choice on the market New builds commonly come with aerotermia — a genuine game-changer for Spanish summers Strong schools, both state and concertado Genuinely stunning nature and walks on the doorstep, with easy access to both Madrid and the Sierra Peaceful, family-dense new neighbourhoods full of others who've made the same move Fast, easy integration into the community Cons Retains a real \"Spanish pueblo\" feel, which won't suit everyone Speaking Spanish is genuinely necessary to integrate here — less of an English-speaking bubble than Tres Cantos Town centre itself feels under-invested, at least for now Spread-out layout means you'll lean on the car more than in Tres Cantos Some newer neighbourhoods (like La Estación) feel short on day-to-day amenities for now Slower commute than Tres Cantos (~45 min train vs ~28 min)"}, {"page": "colmenar", "anchor": "colmenar-is-colmenar-viejo-right-for-you", "title": "Is Colmenar Viejo right for you?", "text": "You'll love it here if: You want noticeably more space and value for your money — a garden and a house are realistic here You're happy to speak Spanish day-to-day and want a real, gradual integration You want easy access to both Madrid and genuine nature and hiking You're comfortable with a town that's still finding its finished shape, rather than fully polished You want a strong sense of community among other young families who've made the same move It might frustrate you if: You're hoping for an international, English-speaking bubble — that's not really what's on offer here A shorter commute matters more to you than almost anything else You'd rather move somewhere fully \"finished\" than one still investing in its centre and amenities You're not willing to learn or use Spanish regularly"}, {"page": "compare", "anchor": "compare-shared-history-different-paths", "title": "Shared history, different paths", "text": "Patrick’s experience and research Tres Cantos and Colmenar Viejo were the same municipality until Tres Cantos split off in 1991 — they're not distant alternatives, they're siblings. They sit about 8km apart, roughly 9 minutes by train on the same C-4 Cercanías line, so visiting both to compare in person takes an afternoon, not a research project. ChamartínTres CantosColmenar Viejo MADRID~28 MIN~45 MINC-4 CERCANÍAS nine minutes apart ChamartínTresCantosColmenarViejo MADRID~28 MIN~45 MIN nine minutes apart"}, {"page": "compare", "anchor": "compare-housing-what-your-money-actually-buys", "title": "Housing: what your money actually buys", "text": "Tres CantosBudgetHigher housing costs.SpaceFlats dominate the choices.LocationCompare the established town and the newer north.Colmenar ViejoBudgetMore space for a fixed budget.SpaceMore house-with-garden options.LocationCompare the old centre and newer neighbourhoods. Patrick’s full takeThis is where the decision usually starts, and the numbers tell a clear story. A 3-bedroom flat in Tres Cantos will cost you more than — or about the same as — a new-build house with a garden in Colmenar Viejo. That single comparison is often the real decision, dressed up as a dozen smaller ones. If your budget is fixed and space matters more than location prestige, Colmenar Viejo stretches further. If you'd rather have less space in a more polished, planned environment, Tres Cantos is worth the premium — but go in knowing it is a premium. often the real decision"}, {"page": "compare", "anchor": "compare-character-international-suburb-vs-spanish-pueblo", "title": "Character: international suburb vs Spanish pueblo", "text": "Tres CantosAtmospherePlanned, international suburb.CommunityAn international family environment.Daily lifeWalkable parks, shops and restaurants.Colmenar ViejoAtmosphereTraditional Spanish town.CommunitySpanish life and integration.Daily lifeTown life with countryside nearby. Patrick’s full take Tres Cantos Feels like a planned, affluent, international suburb — young families, an easy walk to bars and restaurants wherever you live, and one of the highest average household incomes in Spain. Colmenar Viejo Feels like a real Spanish pueblo that's growing fast around the edges — rougher at first impression, a genuine grower, and a town where speaking Spanish day-to-day isn't optional. Neither is \"better\" — they're built for different answers to the same question: do you want to live inside an international bubble, or do you want to properly integrate into Spanish life?"}, {"page": "compare", "anchor": "compare-schools", "title": "Schools", "text": "Tres CantosCurriculumSpanish and international routes.OptionsIncludes British and American/international schools.School runTest the journey from your chosen neighbourhood.Colmenar ViejoCurriculumSpanish state and concertada routes.OptionsFor international options, look towards Tres Cantos.School runTest any cross-town school journey before committing. Patrick’s full take ! Key differentiator: Tres Cantos has private/international school options; Colmenar Viejo does not. Tres Cantos offers the full range — strong public schools (including Colegio Aldebarán), a well-regarded concertado option in Humanitas, and two private international schools: King's College Soto de Viñuelas (British curriculum) and Casvi International American School (American curriculum, IB from age 3). Colmenar Viejo's schools are also genuinely good — Antonio Machado, Fuentesanta, Ángel León and others among the state schools, plus concertado options in Zurbarán and Peñalvento — but there's no dedicated private or international school in the town itself. Families who want an IB, British, or American curriculum specifically will need to look at commuting into Tres Cantos, which — thanks to that 9-minute train link — some Colmenar families do."}, {"page": "compare", "anchor": "compare-day-to-day-life-and-facilities", "title": "Day-to-day life & facilities", "text": "Tres CantosParksPlanned parks, paths and sports facilities.ErrandsA compact, walkable daily routine.LifestyleUrban-planned convenience.Colmenar ViejoParksTown parks and nearby countryside.ErrandsNeighbourhood choice affects daily travel.LifestyleSmall-town life close to nature. Patrick’s full take Tres Cantos Leans urban-planned: parks, bike lanes, a shopping centre with a cinema, brand-new tennis courts, everything walkable. \"Everything nearby.\" Colmenar Viejo Leans small-town-meets-nature: a lively weekend square at Los Arcos, a proper local market, and genuinely stunning hiking on the edge of town. \"Everything nearby, plus real countryside.\""}, {"page": "compare", "anchor": "compare-getting-around", "title": "Getting around", "text": "Tres CantosRailThe shorter train journey into Madrid.Local travelWalking and cycling are practical.What to testThe complete journey, including station access.Colmenar ViejoRailFarther along the same C-4 line.Local travelMore spread out; a car can matter more.What to testThe full commute plus school and daily errands. Patrick’s full takeBoth towns sit on the same C-4 Cercanías line into Madrid (Chamartín to Atocha), but Tres Cantos is notably faster and more convenient — about 28 minutes versus Colmenar Viejo's 45. Colmenar Viejo is also more spread out as a town, so you'll lean on a car more often day-to-day, while Tres Cantos is built to be walked and cycled."}, {"page": "compare", "anchor": "compare-the-decision-framework", "title": "The decision framework", "text": "Budget vs. space Tight or fixed budget → Colmenar Viejo gets you meaningfully more house for the money. Flexible budget → Tres Cantos flats become genuinely competitive. International bubble vs. Spanish immersion Easy landing among international families → Tres Cantos. Want to properly integrate and use Spanish daily → Colmenar Viejo. School priorities Need an IB/British/American curriculum → Tres Cantos (or a Colmenar Viejo base with a commute). Happy with strong Spanish public or concertado schools → either works. Commute vs. lifestyle Commute speed matters most → Tres Cantos. Nature access and space matter more than shaving almost 20 minutes off the train → Colmenar Viejo. Finished vs. still-growing Both have a construction story right now: Tres Cantos North is still building out its new infrastructure, and Colmenar Viejo's town centre is only beginning to see investment. This one's about which kind of in-progress you'd rather live through."}, {"page": "compare", "anchor": "compare-is-there-a-middle-ground", "title": "Is there a middle ground?", "text": "More often than you'd think, yes. Because the two towns are only 9 minutes apart by train, it's genuinely common for a family to live in Colmenar Viejo — for the space and the budget — while sending their children to a private or international school in Tres Cantos. It's worth knowing that hybrid option exists before assuming it has to be an either/or choice."}, {"page": "compare", "anchor": "compare-what-to-test-on-your-visit", "title": "What to test on your visit", "text": "Try the same everyday tasks in both towns, then compare your notes.Station access: walk from a realistic home to the station and try your work journey.School run: test the route at drop-off time, especially if you would cross between towns.Housing space: view homes within the same budget and compare space, condition and location.Neighbourhood feel: walk local streets, parks and shops at more than one time of day.Use the visit checklist →"}, {"page": "schools-colmenar", "anchor": "schools-colmenar-before-you-start-how-spanish-schools-work", "title": "Before you start: how Spanish schools work", "text": "Patrick’s experience and research If you're completely new to the Spanish school system, there are three types of school to understand before anything else: State colegios públicos Fully public; the only real cost is school dinners. No uniform. Follow the state curriculum exclusively. Typically take children from around age 2 through to 11 or 14, depending on the school. Private colegios privados Fully private, with fees ranging anywhere from around €600 to over €1,000 a month. Usually cover every age through to university entrance. Concertada colegios concertados A hybrid: half publicly funded, half privately funded. They follow the state curriculum but often run longer school days with extra classes on top. Usually cover every age through to university entrance. In Colmenar Viejo itself, your real choice is between concertada and state schools. For a private school, you'd need to look at Tres Cantos, Alcobendas, or further afield. Generally, Colmenar's state schools are excellent, with the exception of a handful in the town centre that carry a weaker reputation, largely due to serving children from more difficult home environments."}, {"page": "schools-colmenar", "anchor": "schools-colmenar-schools-at-a-glance", "title": "Schools at a glance", "text": "Check before decidingSchool descriptions reflect Patrick’s experience and research. For current categories, language options and contact details, use the official Madrid school directory. See admissions and dates, and ask each school for its current fees. School Type Location Standout Federico García Lorca State, bilingual Just outside Adelfillas Modern, respectful approach — no homework until the end of primaria (age 12) Antonio Machado State, bilingual El Olivar (older town) Large outdoor space; car usually needed from newer neighbourhoods Fuentesanta State, bilingual Fuentesanta Right next to the leafy Fuentesanta park; car usually needed from newer areas Héroes Dos de Mayo State, bilingual La Estación Newest facilities in town; only state school in La Estación Ángel León State, bilingual — Strong teaching, a bit more academic push than most Zurbarán Concertada Near Adelfillas Small, family-oriented, excellent teaching; facilities need updating Peñalvento Concertada La Estación Best facilities in town, own swimming pool; strict, religious environment"}, {"page": "schools-colmenar", "anchor": "schools-colmenar-the-state-schools", "title": "The state schools", "text": "Here are the state schools with genuinely strong reputations. Since they largely share the same overall approach, I've focused on location and whatever stands out about each one. Placeholder · Federico García Lorca Federico García Lorca Worth a serious look if you end up in Adelfillas. It sits just outside the neighbourhood — the immediate location isn't the prettiest — but it's an easy walk, and the school itself is very good. It's one of the few state schools taking a slightly more modern, respectful approach to education, including no homework until the end of primaria (age 12). Placeholder · Antonio Machado Antonio Machado An excellent state school with a large outdoor space, found in the older El Olivar neighbourhood. If you're in one of the newer developments, you'll most likely need the car for this one. Placeholder · Fuentesanta Fuentesanta Another excellent school, in a lovely neighbourhood, right next to the leafy Fuentesanta park. As with Antonio Machado, if you live in one of the newer neighbourhoods, expect to need the car. Placeholder · Héroes Dos de Mayo Colegio Héroes Dos de Mayo The newest state school in Colmenar, with newer facilities to match. It's the only state school in La Estación, so if that's where you end up, it's well worth a look — and with any luck, the commute could be a short walk. Placeholder · Ángel León Ángel León Another state school with a strong reputation, similar in spirit to Fuentesanta — good teaching, and a bit more of an academic push than some of the others, which is either a plus or a minus depending on your outlook. All of the schools above are bilingual, meaning roughly half of subjects are taught in English and half in Spanish. all bilingual"}, {"page": "schools-colmenar", "anchor": "schools-colmenar-the-concertada-options", "title": "The concertada options", "text": "Now for the two concertada schools in Colmenar Viejo. Placeholder · Colegio Zurbarán Concertada Colegio Zurbarán Teaching quality here is excellent, often from long-serving staff who are themselves former students. It's a small school with a genuinely friendly, family-oriented atmosphere. Like Fuentesanta and Ángel León, it tends to push a bit harder academically, which you'd expect from a concertada. If you're in Adelfillas, it's an excellent option, likely within walking distance. Expect to pay around €140/month more than a state school. The main downside: the facilities are badly in need of an upgrade. Placeholder · Colegio Peñalvento Concertada Colegio Peñalvento The facilities are the headline here. As the newest concertada in Colmenar, it has large outdoor space, new buildings, and its own swimming pool. It's a strongly religious school with several chapels on site, and the atmosphere is noticeably stricter and more controlled than elsewhere — again, a plus or a minus depending on your preferences. It's in La Estación, so if you're in that neighbourhood, you'll likely be able to walk."}, {"page": "schools-colmenar", "anchor": "schools-colmenar-what-about-tres-cantos", "title": "What about Tres Cantos?", "text": "You can, of course, also consider schools in Tres Cantos while living in Colmenar Viejo — some families do exactly that for access to private or international curricula. But take that decision seriously: once you're leaving town at rush hour for the school run, the traffic makes it a real daily commitment, not a small inconvenience."}, {"page": "schools-tres-cantos", "anchor": "schools-tres-cantos-before-you-start-how-spanish-schools-work", "title": "Before you start: how Spanish schools work", "text": "Patrick’s experience and research If you're completely new to the Spanish school system, there are three types of school to understand before anything else: State colegios públicos Fully public; the only real cost is school dinners. No uniform. Follow the state curriculum exclusively. Typically take children from around age 2 through to 11 or 14, depending on the school. Private colegios privados Fully private, with fees ranging anywhere from around €600 to over €1,000 a month. Usually cover every age through to university entrance. Concertada colegios concertados A hybrid: half publicly funded, half privately funded. They follow the state curriculum but often run longer school days with extra classes on top. Usually cover every age through to university entrance. Unlike Colmenar Viejo, Tres Cantos genuinely has all three options on the table — including proper private and international schools, which is one of its biggest draws for families relocating from abroad."}, {"page": "schools-tres-cantos", "anchor": "schools-tres-cantos-schools-at-a-glance", "title": "Schools at a glance", "text": "Check before decidingSchool descriptions reflect Patrick’s experience and research. For current categories, language options and contact details, use the official Madrid school directory. See admissions and dates, and ask each school for its current fees. School Type Location Standout Colegio Aldebarán State Central, near Tres Cantos' central park Montessori-style, respectful approach; taught mostly in Spanish, not bilingual Humanitas Concertada North (new part of town) Modern, non-religious, own swimming pool King's College Soto de Viñuelas Private Tres Cantos area British curriculum, full English-language teaching Casvi International American School Private Tres Cantos American-style, large campus, excellent facilities Life International School Private Tres Cantos American-style, Christian, family-oriented"}, {"page": "schools-tres-cantos", "anchor": "schools-tres-cantos-the-three-we-considered-first-hand", "title": "The three we considered first-hand", "text": "Placeholder · Colegio Aldebarán State Colegio Aldebarán A rare example of a state school doing something genuinely different. If you favour a more respectful, Montessori-style education, this one is worth looking into carefully — it breaks with tradition in several ways to give young children more freedom and autonomy. It also breaks with the usual bilingual trend: most classes are taught in Spanish rather than split with English. As an English dad, I actually see that as a benefit rather than a drawback, though it's a topic that probably deserves its own article. It's fairly central, in the older part of town, just off the end of the main Tres Cantos park. Placeholder · Humanitas Concertada Humanitas A modern, non-religious concertada with excellent facilities, including its own swimming pool. Based in the newer, northern part of town. You get noticeably more in terms of facilities than the state schools, without the full cost of a private school. Definitely worth considering. Placeholder · King's College Soto de Viñuelas Private · British curriculum King's College Soto de Viñuelas A British private school in Tres Cantos. As you'd expect, the facilities are excellent, the full UK curriculum is followed, and day-to-day classroom language is English. As an English dad living in Spain, I liked the idea of my children attending an English-language school — not for the language itself (both of my kids already speak English well), but for the cultural side, and the chance to genuinely grow up feeling half Spanish, half English. In the end, though, the combination of high fees and the commute from Colmenar Viejo ruled it out for us, at least for now. There's also something to be said for deliberately avoiding what can become an exclusive, insular bubble. fees + commute ruled it out"}, {"page": "schools-tres-cantos", "anchor": "schools-tres-cantos-beyond-aldebar-n-the-wider-state-school-picture", "title": "Beyond Aldebarán: the wider state school picture", "text": "We only have firsthand experience of one state school, but it's worth saying: Tres Cantos' state schools are consistently excellent across the board, and the town doesn't carry the same \"rougher town-centre school\" reputation that a couple of central Colmenar Viejo schools do."}, {"page": "schools-tres-cantos", "anchor": "schools-tres-cantos-beyond-king-s-college-other-private-options", "title": "Beyond King's College: other private options", "text": "If a private school is what you're after, there are two American-style options worth knowing about, even though we haven't attended either ourselves: Private · Secondhand Casvi International American School A typical large American-style school, with excellent facilities. Private · Secondhand Life International School Another American-style school, this one Christian and religious in character. The overall feel is warm and family-oriented, noticeably friendlier in tone than the stricter, more formal Catholic atmosphere at somewhere like Peñalvento in Colmenar Viejo."}, {"page": "schools-tres-cantos", "anchor": "schools-tres-cantos-the-bottom-line", "title": "The bottom line", "text": "As you'd expect from one of the highest-earning towns in Spain, Tres Cantos offers a genuinely wide range of high-quality schools — state, concertada, and private — which is exactly why it's such a strong pull for families who want that full range of choice."}, {"page": "mortgages", "anchor": "mortgages-how-much-do-you-actually-need-saved-up", "title": "How much do you actually need saved up?", "text": "Patrick’s experience and research Check before decidingCheck Madrid’s current resale transfer tax and AJD rules, including any applicable reductions. Purchase taxes and mortgage formalisation costs are separate. This is the question everyone asks first, and the honest answer is: more than the deposit alone. Buying costs depend on whether the property is resale or new-build. Use the ranges below as planning estimates, then check the applicable taxes and get quotes for your purchase: Resale property ~7–9% ITP (transfer tax)6% Notary, registry, legal1–2% Madrid's 6% ITP is the lowest of any mainland region. New-build / off-plan ~12–13% IVA10% AJD (stamp duty)0.75% Notary, registry, legal1–2% For the mortgage itself, you pay the valuation and any agreed arrangement fee. The lender pays the mortgage deed’s notary, registry, AJD and gestoría costs. These are separate from the costs of buying the property. See Banco de España’s breakdown. One important detail: Spanish banks lend against the tasación (the bank's own official valuation), not necessarily the price you agreed with the seller. If the tasación comes in lower than your purchase price — which does happen — the bank's loan-to-value calculation is based on the lower figure, and you'll need to cover the gap yourself."}, {"page": "mortgages", "anchor": "mortgages-resident-vs-non-resident-why-it-changes-everything", "title": "Resident vs non-resident: why it changes everything", "text": "Check before decidingLoan-to-value and interest ranges here are indicative examples from Patrick’s research, not current bank quotes. Request a written offer for your own circumstances. This is the single biggest factor in how much you'll actually need saved, and it's not a small difference. Spanish tax resident LTVup to 80% Rate2.5–3.5% You need around 20% of the purchase price as a deposit, plus the buying costs above. Some banks offer up to 90% for particularly strong profiles. Non-resident LTV60–70% Rate3.2–5.2% You'll need 30–40% of the purchase price as a deposit, plus buying costs on top. Paperwork is heavier: several years of tax returns, payslips, bank statements, and a credit report from your home country — typically translated and apostille-certified. Several major Spanish banks run dedicated departments for exactly this situation — Santander's \"World Home\" mortgage, BBVA, and Sabadell's \"Welcome\" service among them — so it's worth specifically asking whether a bank has a non-resident or expat-focused team rather than going through a standard branch process."}, {"page": "mortgages", "anchor": "mortgages-the-contrato-de-arras-committing-before-you-re-fully-approved", "title": "The contrato de arras: committing before you're fully approved", "text": "This is one of the more nerve-wracking parts of buying in Spain if nobody's warned you about it. Once you've agreed a price, the next step is usually signing a contrato de arras — a private deposit contract, typically for 10% of the purchase price, that legally commits both you and the seller to the sale. The most common version (arras penitenciales) works like this: if you pull out afterward, you lose the deposit. If the seller pulls out, they owe you double. ! The risk This contract is often signed before your mortgage is fully, formally approved — sometimes on the strength of a pre-approval alone. If your financing then falls through, you can lose a genuinely large sum of money through no fault of the property itself. Our strong recommendation: get as far into the mortgage approval process as you possibly can before signing the arras, and always have a lawyer review the contract first — never sign it in the estate agent's office on the spot. never sign on the spot"}, {"page": "mortgages", "anchor": "mortgages-fixed-vs-variable-a-bigger-cultural-difference-than-you-d-expect", "title": "Fixed vs variable: a bigger cultural difference than you'd expect", "text": "UK Fixed for 2–5 years Then reverts to variable. You remortgage repeatedly over the life of the loan. US 30-year fixed The standard, unremarkable product. Spain ~90% fixed, full term Once mostly variable (Euribor-linked) — now flipped. Mixed-rate products also exist. If you're coming from the UK, it's worth knowing upfront: there's no such thing as a mortgage that's fixed for the full term. If you're coming from the US, you're used to the opposite. Spain sits in an interesting middle position, and it's shifted a lot in recent years: for a long time, Spanish mortgages were overwhelmingly variable, tied to the Euribor. That's flipped — recent data shows roughly 90% of new Spanish mortgages are now fixed-rate for the full term. Mixed-rate products (fixed for the first few years, then variable) have become more common for non-resident buyers specifically. The practical takeaway: don't assume \"fixed\" means the same thing here that it does at home, and don't assume variable is the default either — ask specifically what you're being offered and for how long the rate actually holds."}, {"page": "mortgages", "anchor": "mortgages-shop-around-properly", "title": "Shop around — properly", "text": "Spanish banks negotiate, and the difference between the first offer and the best offer can be significant. Two ways to do this: Option 1 Use a comparison platform Idealista's mortgage service (Idealista Hipotecas) is a regulated intermediary that compares offers across around a dozen banks and can handle the search and negotiation for you at no direct cost. Option 2 Call the banks yourself If you speak Spanish, you genuinely don't need a platform — ring round, ask for their best offer, then go back to each with competing offers in hand. Spanish banks expect this kind of negotiation. Either way, talk to more than two or three banks. Offers vary more than you'd expect."}, {"page": "mortgages", "anchor": "mortgages-the-insurance-trap-vinculaciones", "title": "The insurance trap (vinculaciones)", "text": "This is the one that catches people out most. Spanish banks commonly offer a lower headline interest rate in exchange for taking out \"linked products\" (vinculaciones) alongside the mortgage — usually home insurance, life insurance, sometimes your salary being paid into an account with them. The trap: a lower rate with insurance bundled in isn't automatically cheaper than a higher rate without it. 2.0% with mandatory home + life insurance through the bank 2.5% no strings attached The 2% offer might genuinely cost more over the life of the loan — it depends entirely on how expensive those bundled products are compared to what you could find independently. Don't take the headline rate at face value. Get the actual insurance quotes, work out the true monthly cost both ways, and compare the total cost over the life of the mortgage — not just the interest rate. This is exactly the kind of side-by-side comparison an AI assistant is genuinely useful for: feed it both offers in full and ask it to model the total cost each way. Disclaimer: rates, taxes, and lending rules change, and I'm not a mortgage broker or financial advisor — this is what we learned going through the process ourselves. Always confirm current numbers with your bank or a gestor before relying on them."}]; // generated guide index
  function refreshPersonal(){document.querySelectorAll('.personal-reading').forEach(function(area){var resume=area.querySelector('[data-resume]');area.hidden=!(savedSections.length || (resume && !resume.hidden) || !!area.querySelector('.visit-progress-link:not([hidden])'));});}
  // Catalogue choices, personal reading and chapter previews.
  document.querySelectorAll('.guide-library').forEach(function(library){
    var paths=library.querySelector('.reading-paths'),choices=Array.from(paths.querySelectorAll('.path-grid details'));
    var selector=document.createElement('div');selector.className='intent-selector';selector.setAttribute('role','group');selector.setAttribute('aria-label','What are you working out?');
    var result=document.createElement('div');result.className='intent-result';
    var names=['Choose a town','Find schools','Prepare to buy'];
    function choose(index){choices.forEach(function(d){d.hidden=true;});selector.querySelectorAll('button').forEach(function(b,i){b.setAttribute('aria-pressed',String(i===index));});var links=Array.from(choices[index].querySelectorAll('a'));result.innerHTML=links.map(function(a,i){return '<a href="'+esc(a.getAttribute('href'))+'"><small>'+ (i===0?'Recommended starting point':'Then explore')+'</small><strong>'+esc(a.textContent)+'</strong><span>Read guide →</span></a>';}).join('');saveSession('mu_catalogue_intent',index);}
    choices.forEach(function(d,i){var b=document.createElement('button');b.type='button';b.textContent=names[i];b.onclick=function(){choose(i);};selector.appendChild(b);});paths.querySelector('.path-grid').hidden=true;paths.appendChild(selector);paths.appendChild(result);var intent=Number(readSession('mu_catalogue_intent',0));choose(intent>=0 && intent<3?intent:0);
    var personal=document.createElement('section');personal.className='personal-reading';personal.setAttribute('aria-label','Your reading');personal.innerHTML='<h2>Your reading</h2><button type="button" data-saved-toggle aria-expanded="false">Saved sections</button>';
    library.prepend(personal);var resume=library.querySelector('[data-resume]');personal.appendChild(resume);var savedList=library.querySelector('[data-saved-sections]');personal.appendChild(savedList);
    var oldSaved=library.querySelector('[data-guide-filter="saved"]');if(oldSaved)oldSaved.remove();
    var savedToggle=personal.querySelector('[data-saved-toggle]');savedToggle.textContent='Saved sections ('+savedSections.length+')';savedToggle.onclick=function(){savedList.hidden=!savedList.hidden;savedToggle.setAttribute('aria-expanded',String(!savedList.hidden));};
    var chosen=readSession('mu_catalogue_filter','all'),filter=library.querySelector('[data-guide-filter="'+(['all','towns','schools','buying'].includes(chosen)?chosen:'all')+'"]');if(filter)filter.click();
    var checklist=library.querySelector('.visit-checklist'),visit=document.createElement('details');visit.className='visit-planner';var summary=document.createElement('summary');summary.innerHTML='<strong>Plan your visit</strong><span data-visit-summary></span>';visit.appendChild(summary);checklist.before(visit);visit.appendChild(checklist);
    function progress(){summary.querySelector('span').textContent=checklist.querySelector('[data-visit-progress]').textContent;}
    checklist.addEventListener('change',progress);checklist.querySelector('[data-visit-reset]').addEventListener('click',progress);progress();
    var vGrid=library.querySelector('.guide-grid'),vHref=pageHref('guides','visit-checklist');if(vGrid){var vEntry=document.createElement('article');vEntry.className='visit-entry';vEntry.innerHTML='<a class="visit-card" href="'+vHref+'" data-open-visit><small>Checklist · 4 checks · 5 min</small><h2>Plan your visit</h2><p>Four everyday tests to try in both towns: the commute, the neighbourhood, schools and housing.</p><span class="visit-card-cta">Open the checklist →</span><span class="visit-card-progress"></span></a>';vGrid.appendChild(vEntry);var syncVisitFilter=function(){var on=library.querySelector('[data-guide-filter][aria-pressed="true"]'),f=on?on.getAttribute('data-guide-filter'):'all';vEntry.hidden=!(f==='all'||f==='towns');};library.querySelectorAll('[data-guide-filter]').forEach(function(b){b.addEventListener('click',function(){setTimeout(syncVisitFilter);});});syncVisitFilter();}var vRow=document.createElement('a');vRow.className='visit-progress-link';vRow.href=vHref;vRow.setAttribute('data-open-visit','');vRow.hidden=true;personal.appendChild(vRow);function syncVisit(){var n=checklist.querySelectorAll('[data-visit-item]:checked').length,pr=library.querySelector('.visit-card-progress');if(pr)pr.textContent=n?n+' of 4 checked':'';vRow.hidden=!n;vRow.textContent='Visit checklist · '+n+' of 4 →';refreshPersonal();}checklist.addEventListener('change',syncVisit);checklist.querySelector('[data-visit-reset]').addEventListener('click',function(){setTimeout(syncVisit);});syncVisit();function revealVisit(){visit.open=true;setTimeout(function(){visit.scrollIntoView({block:'start',behavior:window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});},40);}library.addEventListener('click',function(e){var a=e.target.closest('[data-open-visit]');if(!a)return;e.preventDefault();e.stopPropagation();revealVisit();track('visit_checklist_open',{place:a.classList.contains('visit-card')?'catalogue':'reading_strip'});});function visitFromHash(){if(/visit-checklist$/.test(location.hash))revealVisit();}window.addEventListener('hashchange',visitFromHash);setTimeout(visitFromHash,80);window.addEventListener('load',function(){setTimeout(visitFromHash,60);});
  });
  window.addEventListener('scroll',function(){var active=document.querySelector('.page.active');if(active && active.id==='guides')saveSession('mu_catalogue_y',window.pageYOffset);},{passive:true});
  document.querySelectorAll('.reading-article').forEach(function(article){var page=article.closest('.page').id;article.querySelectorAll('h2').forEach(function(heading){if(heading.closest('.contact'))return;var tools=makeSectionTools(page,heading),wrap=document.createElement('details');wrap.className='desktop-section-tools';wrap.innerHTML='<summary title="Share this section" aria-label="Share this section"></summary>';wrap.appendChild(tools);heading.after(wrap);});});document.querySelectorAll('.comparison-pair').forEach(function(pair){var towns=Array.from(pair.querySelectorAll('.comparison-town'));if(towns.length!==2)return;var rows=towns.map(function(t){return Array.from(t.querySelectorAll('dl > div'));});if(!rows[0].length||rows[0].length!==rows[1].length)return;var sbs=document.createElement('div');sbs.className='comparison-sbs';sbs.setAttribute('role','table');if(pair.getAttribute('aria-label'))sbs.setAttribute('aria-label',pair.getAttribute('aria-label'));var head=document.createElement('div');head.className='sbs-head';head.setAttribute('role','row');towns.forEach(function(t){var c=document.createElement('span');c.className=t.classList.contains('cv')?'cv':'tc';c.setAttribute('role','columnheader');c.textContent=t.querySelector('h3').textContent;head.appendChild(c);});sbs.appendChild(head);rows[0].forEach(function(r,i){var row=document.createElement('div');row.className='sbs-row';row.setAttribute('role','row');var lab=document.createElement('p');lab.className='sbs-label';lab.setAttribute('role','rowheader');lab.textContent=r.querySelector('dt').textContent;row.appendChild(lab);var cells=document.createElement('div');cells.className='sbs-cells';[rows[0][i],rows[1][i]].forEach(function(src,j){var c=document.createElement('div');c.className=j?'cv':'tc';c.setAttribute('role','cell');c.innerHTML=src.querySelector('dd').innerHTML;cells.appendChild(c);});row.appendChild(cells);sbs.appendChild(row);});pair.after(sbs);});function alignSectionTools(){document.querySelectorAll('.reading-article h2+details.desktop-section-tools').forEach(function(d){var h=d.previousElementSibling,s=d.firstElementChild;if(!h||!s)return;s.style.top=(h.getBoundingClientRect().top-d.getBoundingClientRect().top+3)+'px';});}alignSectionTools();window.addEventListener('resize',alignSectionTools);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(alignSectionTools);
  var preview=document.createElement('dialog');preview.className='chapter-reader guide-preview-dialog';preview.setAttribute('aria-labelledby','preview-title');document.body.appendChild(preview);var previewOpener=null,previewOverflow='';
  function closePreview(){if(!preview.open)return;preview.close();document.body.style.overflow=previewOverflow;if(previewOpener && previewOpener.isConnected)previewOpener.focus({preventScroll:true});}
  document.querySelectorAll('.guide-preview summary').forEach(function(summary){summary.addEventListener('click',function(e){if(window.innerWidth>640)return;e.preventDefault();previewOpener=summary;previewOverflow=document.body.style.overflow;var entry=summary.closest('.library-entry');preview.innerHTML='<div class="reader-head"><h2 id="preview-title">'+esc(entry.querySelector('h2').textContent)+'</h2><button type="button" class="reader-close" aria-label="Close guide preview">×</button></div><div class="reader-content"><p>Choose a section or read the full guide.</p>'+summary.nextElementSibling.outerHTML+'<a class="b1" href="'+esc(entry.querySelector('.library-card').getAttribute('href'))+'">Read full guide →</a></div>';preview.querySelector('button').onclick=closePreview;preview.querySelectorAll('a').forEach(function(a){a.addEventListener('click',closePreview);});document.body.style.overflow='hidden';preview.showModal();preview.querySelector('button').focus({preventScroll:true});});});
  preview.addEventListener('cancel',function(e){e.preventDefault();closePreview();});preview.addEventListener('click',function(e){if(e.target===preview){var r=preview.getBoundingClientRect();if(e.clientY<r.top || e.clientY>r.bottom || e.clientX<r.left || e.clientX>r.right)closePreview();}});window.addEventListener('hashchange',closePreview);window.addEventListener('resize',function(){if(window.innerWidth>640)closePreview();});

  // Search the published section text locally; no query leaves the browser.
  function searchWords(value){return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(function(w){return w.length>1 && !['the','to','in','of','a','an','and','what','how','is','are','we','our','can','do','does'].includes(w);}).map(function(w){return w.length>3?w.replace(/s$/,''):w;});}
  document.querySelectorAll('.guide-library').forEach(function(library){
    var search=document.createElement('section');search.className='guide-search';search.innerHTML='<label for="guide-search">Find an answer in the guides</label><div><input id="guide-search" type="search" placeholder="Try school fees or train to Madrid" autocomplete="off"><button type="button" data-clear-search>Clear</button></div><p role="status" data-search-status></p><div data-search-results></div>';library.querySelector('.reading-paths').before(search);
    var input=search.querySelector('input'),results=search.querySelector('[data-search-results]'),status=search.querySelector('[data-search-status]');
    function find(){var words=searchWords(input.value);results.innerHTML='';if(!words.length){status.textContent=input.value.trim()?'Try a topic such as schools, housing or commuting.':'';return;}
      var matches=GUIDE_INDEX.map(function(item){var body=searchWords(item.title+' '+item.text+' '+mobileLabels[item.page]),title=searchWords(item.title);return {item:item,score:words.every(function(w){return body.includes(w);})?words.reduce(function(n,w){return n+(title.includes(w)?4:1);},0):0};}).filter(function(r){return r.score>0;}).sort(function(a,b){return b.score-a.score;});
      status.textContent=matches.length?(matches.length>8?'Showing 8 of '+matches.length:matches.length)+' matching sections':'No matching sections. Try “schools”, “housing” or “train”.';
      results.innerHTML=matches.slice(0,8).map(function(r){var item=r.item,plain=item.text,pos=plain.toLowerCase().indexOf(words[0]),start=Math.max(0,pos-45),excerpt=plain.slice(start,start+180);return '<a href="'+pageHref(item.page,item.anchor)+'"><small>'+esc(mobileLabels[item.page])+'</small><strong>'+esc(item.title)+'</strong><p>'+(start?'…':'')+esc(excerpt)+(start+180<plain.length?'…':'')+'</p><span>Read section →</span></a>';}).join('');
    }
    input.addEventListener('input',find);search.querySelector('[data-clear-search]').onclick=function(){input.value='';find();input.focus();};
  });
  document.addEventListener('click',function(e){
    if(window.innerWidth>640 || e.defaultPrevented || e.button>0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)return;
    var a=e.target.closest('.guide-preview-dialog nav a,.guide-preview nav a,[data-saved-sections] a,[data-search-results] a,.intent-result a');if(!a)return;
    var href=a.getAttribute('href'),page,anchor;
    if(STATIC){var parts=href.split('#');anchor=parts[1];page=parts[0]?Object.keys(FILES).find(function(key){return './'+FILES[key]===parts[0];}):STATIC_PAGE;}
    else {var bits=href.slice(1).split('/');page=bits[0];anchor=bits[1];}
    if(!page || !anchor)return;var item=GUIDE_INDEX.find(function(row){return row.page===page && row.anchor===anchor;});if(!item)return;
    e.preventDefault();var opener=a.closest('.guide-preview-dialog')?previewOpener:a;closePreview();
    var section=document.getElementById(page),heading=section && section.querySelector('[id="'+anchor+'"]');
    if(heading)openReader(section,heading,opener);
    else location.href='./'+FILES[page]+'?reader=1#'+anchor;
  });
  var completedGuides=readLocal('mu_completed_guides',{});if(!completedGuides || typeof completedGuides!=='object' || Array.isArray(completedGuides))completedGuides={};
  function renderCompletion(){document.querySelectorAll('[data-mark-read]').forEach(function(button){var done=completedGuides[button.getAttribute('data-mark-read')]===true;button.textContent=done?'Marked as read ✓ · Undo':'Mark as read';button.setAttribute('aria-pressed',String(done));});document.querySelectorAll('.library-card').forEach(function(card){var href=card.getAttribute('href'),page=STATIC?Object.keys(FILES).find(function(key){return './'+FILES[key]===href;}):href.slice(1);var badge=card.querySelector('.read-badge');if(!badge){badge=document.createElement('span');badge.className='read-badge';badge.textContent='Read ✓';card.appendChild(badge);}badge.hidden=completedGuides[page]!==true;});}
  var nextGuides={'tres-cantos':['schools-tres-cantos','Explore school options for your Tres Cantos shortlist.'],colmenar:['schools-colmenar','Check school options near the neighbourhoods you like.'],compare:['guides','Choose the town or school guide that matches your priorities.'],'schools-tres-cantos':['compare','Compare the daily school run and housing trade-offs.'],'schools-colmenar':['compare','Compare where to live alongside your school shortlist.'],mortgages:['compare','Explore what your housing budget buys in each town.']};
  document.querySelectorAll('.reading-article').forEach(function(article){var page=article.closest('.page').id,next=nextGuides[page];if(!next)return;var end=document.createElement('section');end.className='guide-finish';end.innerHTML='<button type="button" data-mark-read="'+page+'" aria-pressed="false">Mark as read</button><p class="completion-status" role="status"></p><h3>Where to go next</h3><p>'+esc(next[1])+'</p><a href="'+pageHref(next[0])+'">'+esc(mobileLabels[next[0]])+' →</a>';var share=article.querySelector('.share');if(share)share.before(end);else article.appendChild(end);end.querySelector('button').onclick=function(){completedGuides[page]=completedGuides[page]!==true;var persistent=writeLocal('mu_completed_guides',completedGuides);renderCompletion();end.querySelector('.completion-status').textContent=persistent?'Reading status saved on this device.':'Reading status saved for this session.';};});renderCompletion();refreshPersonal();document.querySelectorAll('.reading-article').forEach(function(article){var fin=article.querySelector('.guide-finish'),offer=article.querySelector('.gd-end'),rn=article.querySelector('.rn-line');if(!fin)return;if(offer)fin.before(offer);if(rn){var main=fin.querySelector('a[href]'),seen={};if(main)seen[main.getAttribute('href')]=1;var links=[].filter.call(rn.querySelectorAll('a[href]'),function(a){var h=a.getAttribute('href');if(seen[h])return false;seen[h]=1;return true;});if(links.length){var more=document.createElement('p');more.className='finish-more';more.appendChild(document.createTextNode('Or read: '));links.forEach(function(a){var c=document.createElement('a');c.href=a.getAttribute('href');c.textContent=a.textContent.split('→')[0].trim().replace(/\.$/,'');more.appendChild(c);});if(main)main.after(more);else fin.appendChild(more);}rn.hidden=true;}var finPage=article.closest('.page').id;if(['tres-cantos','colmenar','compare'].indexOf(finPage)>=0){var fv=document.createElement('p');fv.className='finish-visit';fv.innerHTML='Visiting soon? <a href="'+pageHref('guides','visit-checklist')+'">Use the visit checklist →</a>';fin.appendChild(fv);}});document.querySelectorAll('.desktop-section-tools>summary').forEach(function(s){s.title='Share this section';});

  // table labels for stacked rows on phones
  document.querySelectorAll('.tbl table').forEach(function(tb){
    var heads = Array.prototype.map.call(tb.querySelectorAll('thead th'), function(th){ return th.textContent.trim(); });
    tb.querySelectorAll('tbody tr').forEach(function(tr){ Array.prototype.forEach.call(tr.children, function(td, i){ if (heads[i]) td.setAttribute('data-l', heads[i]); }); });
  });

  // style-hover / style-focus support
  function parseStyle(str){
    var o = {};
    str.split(';').forEach(function(d){
      var i = d.indexOf(':');
      if (i > 0) o[d.slice(0,i).trim()] = d.slice(i+1).trim();
    });
    return o;
  }
  function wireHover(scope){
    if (!window.matchMedia || !window.matchMedia('(hover: hover)').matches) return;
    scope.querySelectorAll('[style-hover]').forEach(function(el){
      if (el.__wired) return; el.__wired = 1;
      var base = el.getAttribute('style') || '';
      var hov = parseStyle(el.getAttribute('style-hover'));
      el.addEventListener('mouseenter', function(){
        Object.keys(hov).forEach(function(k){ el.style.setProperty(k, hov[k]); });
      });
      el.addEventListener('mouseleave', function(){ el.setAttribute('style', base); });
    });
    scope.querySelectorAll('[style-focus]').forEach(function(el){
      if (el.__wiredF) return; el.__wiredF = 1;
      var base = el.getAttribute('style') || '';
      var f = parseStyle(el.getAttribute('style-focus'));
      el.addEventListener('focus', function(){
        Object.keys(f).forEach(function(k){ el.style.setProperty(k, f[k]); });
      });
      el.addEventListener('blur', function(){ el.setAttribute('style', base); });
    });
  }



  // ---- first-touch source (utm_source, else the referring site), kept for this visit ----
  var SRC = '';
  (function(){
    try { SRC = sessionStorage.getItem('mu_src') || ''; } catch(e){}
    if (!SRC) {
      var q = (location.search.match(/[?&]utm_source=([^&#]+)/) || [])[1];
      if (q) { try { SRC = decodeURIComponent(q.replace(/\+/g, ' ')).replace(/[^\w.-]/g, '').slice(0, 40); } catch(e){} }
      else if (document.referrer) {
        try { var h = new URL(document.referrer).hostname; if (h && h !== location.hostname) SRC = h.replace(/^(www|m|l|lm)\./, '').split('.')[0]; } catch(e){}
      }
      try { if (SRC) sessionStorage.setItem('mu_src', SRC); } catch(e){}
    }
  })();
  function withSrc(href){
    if (!SRC) return href;
    if (/^https:\/\/wa\.me\//.test(href) && href.indexOf('text=') > 0) {
      if (href.indexOf('%20(found%20you%20via%20') > 0) return href;
      return href.replace(/(\.%20We%27re%20looking%20at%20|%3A%20)$/, '%20(found%20you%20via%20' + encodeURIComponent(SRC) + ')$1');
    }
    return href;
  }
  document.addEventListener('click', function(e){
    var a = e.target.closest('a[href^="https://wa.me/34"]'); if (a && !a.closest('#ask-root')) a.href = withSrc(a.getAttribute('href'));
  }, true);

  // ---- analytics hooks (prototype: logs to the console; launch build points MU_ANALYTICS at the real tool) ----
  function track(name, props){
    props = props || {};
    var p = document.querySelector('.page.active'); props.page = props.page || (p ? p.id : 'home');
    if (typeof SRC !== 'undefined' && SRC) props.source = SRC;
    try { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: name, channel: null, place: null, to: null, label: null, result: null, term: null }, props)); } catch(e){}
    try { if (typeof window.plausible === 'function') window.plausible(name, { props: props }); } catch(e){}
    try { if (typeof window.MU_ANALYTICS === 'function') window.MU_ANALYTICS(name, props); } catch(e){}
    if (window.console && console.info) console.info('[track]', name, props);
  }
  window.muTrack = track;
  document.addEventListener('click', function(e){
    var a = e.target.closest('a,button'); if (!a || a.closest('#ask-root')) return;
    var href = a.getAttribute('href') || '', name = a.getAttribute('data-track');
    var place = a.getAttribute('data-place') || (a.closest('.contact') ? 'contact' : a.closest('footer') ? 'footer' : 'other');
    if (name) track(name, {place:place, to:/^(#|\.\/)/.test(href) ? href : undefined, label:a.textContent.trim().slice(0,60)});
    var channel = /^https:\/\/wa\.me\/34/.test(href) ? 'whatsapp' : /^mailto:/.test(href) ? 'email' : '';
    if (channel) track(name === 'booking_click' ? 'booking_handoff' : 'contact_handoff', {channel:channel,place:place});
  }, true);
  // Visibility means a reader saw the offer; opening a messaging app is only a handoff.
  (function(){
    if (!('IntersectionObserver' in window)) return;
    var seen = new WeakSet(), visible = new WeakSet(), timers = new WeakMap();
    var io = new IntersectionObserver(function(entries){ entries.forEach(function(en){
      var el = en.target;
      if (!en.isIntersecting) { visible.delete(el); clearTimeout(timers.get(el)); return; }
      visible.add(el);
      if (seen.has(el)) return;
      clearTimeout(timers.get(el));
      timers.set(el, setTimeout(function(){
        var section = el.closest('.page');
        if (seen.has(el) || !visible.has(el) || !section.classList.contains('active')) return;
        seen.add(el); track('offer_view', {page:section.id,place:section.id === 'home' ? 'home_offer' : 'guide_offer'});
        if (section.id !== 'home') track('guide_end_reached', {page:section.id});
      }, 1000));
    }); }, {threshold:0.25});
    document.querySelectorAll('[data-offer]').forEach(function(el){io.observe(el);});
  })();

  // ---- reading position: going back returns you to where you were ----
  if (!STATIC && 'scrollRestoration' in history) history.scrollRestoration = 'manual';
  function trailY(slug){
    var prev = trail[trail.length - 1];
    if (prev) prev.y = window.pageYOffset;
    if (trail.length >= 2 && trail[trail.length - 2].slug === slug) { trail.pop(); return trail[trail.length - 1].y || 0; }
    trail.push({ slug: slug, y: 0 }); return 0;
  }

  // ---- print / save as PDF ----
  document.addEventListener('click', function(e){ if (e.target.closest('[data-print]')) window.print(); });


  // ---- Which town fits us? Progress, transparent reasons and session continuity. ----
  var PICKER_OPTIONS={budget:{tc:'a flexible budget',cv:'a tight or fixed budget'},landing:{tc:'an international community',cv:'Spanish life and integration'},school:{intl:'an IB, British or American school',either:'a Spanish state or concertada school'},commute:{tc:'a faster commute',cv:'nature and space'}};
  function cleanAnswers(value){
    var out={};Object.keys(PICKER_OPTIONS).forEach(function(k){if(value && Object.prototype.hasOwnProperty.call(PICKER_OPTIONS[k],value[k]))out[k]=value[k];});return out;
  }
  function pickerRecommendation(a){
    var tc=0,cv=0;
    ['budget','landing','commute'].forEach(function(k){if(a[k]==='tc')tc++;else cv++;});
    if(a.school==='intl')tc++;
    if(cv>tc && a.school==='intl')return {title:'Colmenar Viejo, with school in Tres Cantos',text:'Your lifestyle priorities lean towards Colmenar. Your curriculum choice makes a school visit in Tres Cantos worth including.',href:'#compare/compare-is-there-a-middle-ground',label:'Explore the middle ground',type:'both'};
    if(tc>cv)return {title:'Start with Tres Cantos',text:'More of your selected priorities point towards Tres Cantos. Use the guide to check the trade-offs before making a shortlist.',href:'#tres-cantos',label:'Explore Tres Cantos',type:'tc'};
    if(cv>tc)return {title:'Start with Colmenar Viejo',text:'More of your selected priorities point towards Colmenar Viejo. Use the guide to check the trade-offs before making a shortlist.',href:'#colmenar',label:'Explore Colmenar Viejo',type:'cv'};
    return {title:'Both towns are worth a visit',text:'Your priorities are balanced between the two. Compare the trade-offs and try the school run and commute before deciding.',href:'#compare/compare-the-decision-framework',label:'Read the decision framework',type:'both'};
  }
  function pickerSummary(a){return Object.keys(PICKER_OPTIONS).map(function(k){return PICKER_OPTIONS[k][a[k]];}).filter(Boolean).join('; ');}
  function pickerNextSteps(r){
    var town=r.type==='tc'?'tres-cantos':(r.type==='cv'?'colmenar':'compare');
    var schools=pickerAnswers.school==='intl' || r.type==='tc'?'<a href="'+pageHref('schools-tres-cantos')+'">Explore schools in Tres Cantos</a>':(r.type==='cv'?'<a href="'+pageHref('schools-colmenar')+'">Explore schools in Colmenar Viejo</a>':'<a href="'+pageHref('schools-tres-cantos')+'">Schools in Tres Cantos</a> · <a href="'+pageHref('schools-colmenar')+'">Schools in Colmenar Viejo</a>');
    return '<div class="picker-next"><b>Your next three steps</b><ol><li><a href="'+pageHref(town)+'">'+(town==='compare'?'Read the town trade-offs':'Read the '+mobileLabels[town]+' guide')+'</a></li><li>'+schools+'</li><li><a href="'+pageHref('guides','visit-checklist')+'">Plan a visit with the checklist</a></li></ol></div>';
  }
  var pickerAnswers=cleanAnswers(readSession('mu_picker',{}));
  document.querySelectorAll('[data-picker]').forEach(function(f){
    var out=f.querySelector('.pk-out'), progress=f.querySelector('[data-picker-progress]');
    Object.keys(pickerAnswers).forEach(function(k){var radio=f.querySelector('input[name="pk-'+k+'"][value="'+pickerAnswers[k]+'"]');if(radio)radio.checked=true;});
    var fields=Array.from(f.querySelectorAll('fieldset')),keys=Object.keys(PICKER_OPTIONS),step=keys.findIndex(function(k){return !pickerAnswers[k];}),returnToReview=false,reviewFromResult=false;if(step<0)step=5;
    f.classList.add('wizard');
    var stepLabel=document.createElement('p');stepLabel.className='pk-step-label';stepLabel.setAttribute('aria-live','polite');progress.after(stepLabel);
    var review=document.createElement('div');review.className='pk-review';review.hidden=true;out.before(review);
    var controls=document.createElement('div');controls.className='pk-step-controls';controls.innerHTML='<button type="button" class="b2 sm" data-picker-back>Back</button><button type="button" class="b1 sm" data-picker-next>Next →</button>';out.before(controls);
    var back=controls.querySelector('[data-picker-back]'),next=controls.querySelector('[data-picker-next]');
    function drawStep(focus){
      f.classList.toggle('show-result',step===5);fields.forEach(function(field,i){field.classList.toggle('step-active',i===step);});
      stepLabel.textContent=step<4?'Question '+(step+1)+' of 4':(step===4?'Review your answers':'Your starting point');
      back.disabled=step===0 && !returnToReview;back.textContent=returnToReview?'Back to review':(step===4 && reviewFromResult?'Back to result':'Back');back.hidden=step===5;next.hidden=step===5;controls.hidden=step===5;
      next.disabled=step<4 && !f.querySelector('input[name="pk-'+keys[step]+'"]:checked');next.textContent=returnToReview?'Done →':(step>=3?'See recommendation →':'Next →');
      review.hidden=step!==4;
      if(step===4)review.innerHTML='<b>Does this sound like your family?</b>'+keys.map(function(k,i){var label=fields[i].querySelector('legend').textContent;return '<div class="pk-review-row"><p><b>'+esc(label.replace(/\?\s*$/,''))+':</b> '+esc(PICKER_OPTIONS[k][pickerAnswers[k]])+'</p><button type="button" data-picker-change="'+i+'" aria-label="Change '+esc(label)+'">Change</button></div>';}).join('');
      if(focus){var target=step<4?fields[step].querySelector('legend'):(step===4?review:out);target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}
    }
    review.addEventListener('click',function(e){var button=e.target.closest('[data-picker-change]');if(!button)return;step=Number(button.getAttribute('data-picker-change'));returnToReview=true;drawStep(true);});
    back.onclick=function(){if(returnToReview)step=4;else if(step===4 && reviewFromResult)step=5;else step=Math.max(0,step-1);returnToReview=false;reviewFromResult=false;drawStep(true);};
    next.onclick=function(){if(next.disabled)return;step=returnToReview?4:(step===3?5:Math.min(5,step+1));returnToReview=false;if(step===5)reviewFromResult=false;drawStep(true);};
    f.addEventListener('submit',function(e){e.preventDefault();});
    function update(animate){
      var a={};Object.keys(PICKER_OPTIONS).forEach(function(k){var c=f.querySelector('input[name="pk-'+k+'"]:checked');if(c)a[k]=c.value;});
      pickerAnswers=a;saveSession('mu_picker',a);
      var count=Object.keys(a).length;progress.textContent=count+' of 4 answered';
      f.querySelector('.pk-edit').hidden=count===0;
      if(count<4){out.className='pk-out';out.innerHTML='<p class="pk-wait">'+(count ? 'Answer '+(4-count)+' more '+(count===3?'question':'questions')+' to see where to start.' : 'Answer all four to see where to start.')+'</p>';drawStep(false);return;}
      var r=pickerRecommendation(a);
      var reasons=Object.keys(PICKER_OPTIONS).map(function(k){return '<li>'+esc(PICKER_OPTIONS[k][a[k]])+'</li>';}).join('');
      out.className='pk-out on '+r.type+(animate?' picker-reveal':'');
      out.innerHTML='<p class="pk-h">'+r.title+'</p><p>'+r.text+'</p><p class="pk-reasons-label">Based on your priorities</p><ul class="pk-reasons">'+reasons+'</ul><div class="pk-result-actions"><a class="b1 sm" href="'+legacyHref(r.href)+'" data-track="picker_go">'+r.label+' →</a><button type="button" class="b2 sm" data-picker-discuss>Discuss this result with Patrick</button></div>';
      out.insertAdjacentHTML('beforeend',pickerNextSteps(r));
      var tradeoff=r.type==='tc'?'Expect higher housing costs and less space for the same budget than in Colmenar. Check whether the school choice and commute are worth that trade-off for you.':(r.type==='cv'?'Expect a longer journey into Madrid and fewer international school options in town. Try the school run and station access before choosing a neighbourhood.':(a.school==='intl'?'Living in Colmenar and choosing a school in Tres Cantos can balance priorities, but adds a school journey to test in person.':'Neither town meets every priority equally. Compare housing space, school options and the full commute before deciding.'));
      out.querySelector('.picker-next').insertAdjacentHTML('beforebegin','<div class="picker-tradeoffs"><b>What you’d compromise on</b><p>'+esc(tradeoff)+'</p></div>');
      if(animate)track('picker_result',{result:r.type});
      drawStep(false);
    }
    f.addEventListener('change',function(){update(true);});
    f.querySelector('[data-picker-edit]').onclick=function(){step=4;returnToReview=false;reviewFromResult=true;drawStep(window.innerWidth<=640);if(window.innerWidth>640)f.querySelector('input').focus({preventScroll:true});f.scrollIntoView({block:'start'});};
    f.querySelector('[data-picker-reset]').onclick=function(){f.reset();step=0;returnToReview=false;pickerAnswers={};saveSession('mu_picker',null);update(false);f.querySelector('input').focus({preventScroll:true});track('picker_reset');};
    f.addEventListener('click',function(e){if(e.target.closest('[data-picker-discuss]')){if(!draft.trim()){draft='Which town and schools would you suggest we visit first?';saveSession('mu_question',draft);}openAsk(e.target.closest('button'));track('picker_discuss');}});
    update(false);
  });

  // ---- Spanish words explained in place ----
  var GLOSS = [
    [/\bpadr[oó]n\b/i, 'padrón', 'Registering your address at the town hall. You need it for a school place, the health card and most local paperwork.'],
    [/\bNIE\b/, 'NIE', 'Número de Identidad de Extranjero: the number every foreigner needs to buy a home, get a mortgage, open a bank account or start work.'],
    [/\bconcertad[ao]s?\b/i, 'concertada', 'Half publicly, half privately funded. State curriculum, often longer days with extra classes, and a monthly contribution.'],
    [/\barras\b/i, 'arras', 'Contrato de arras: the deposit contract (usually 10% of the price) that commits buyer and seller. Pull out and you lose it; if the seller pulls out, they pay you double.'],
    [/\bvinculaciones\b/i, 'vinculaciones', 'Linked products (insurance, salary paid into the bank, cards) that a bank asks you to take in exchange for a lower mortgage rate.'],
    [/\bgestor\b/i, 'gestor', 'A licensed paperwork professional who handles tax returns, registrations and official forms for you.'],
    [/\bprimaria\b/i, 'primaria', 'Primary school: ages 6 to 12.'],
    [/\baerotermia\b/i, 'aerotermia', 'An air-source heat pump that runs heating, cooling and hot water, usually through the floor in new builds.'],
    [/\btasaci[oó]n\b/i, 'tasación', 'The bank\'s own official valuation. The bank lends against this figure, not the price you agreed.'],
    [/\bITP\b/, 'ITP', 'Impuesto de Transmisiones Patrimoniales: the transfer tax on resale homes. 6% in Madrid.'],
    [/\bIVA\b/, 'IVA', 'VAT. New-build homes pay 10% IVA instead of the transfer tax.'],
    [/\bAJD\b/, 'AJD', 'Actos Jurídicos Documentados: stamp duty, paid on top of IVA when you buy a new build.'],
    [/\bCercan[ií]as\b/i, 'Cercanías', 'Renfe\'s commuter trains around Madrid. The C-4 line runs through Tres Cantos and Colmenar Viejo.'],
    [/\bEuribor\b/i, 'Euribor', 'The euro interest rate that variable Spanish mortgages follow: your rate is Euribor plus a fixed margin.'],
    [/\bpueblo\b/i, 'pueblo', 'A town or village. Here: a traditional Spanish town, with its own old centre, fiestas and pace.']
  ];
  var pop = document.createElement('div'); pop.id = 'gl-pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label','Spanish word explained'); pop.hidden = true; document.body.appendChild(pop);
  var popFor = null;
  function glClose(){ if (popFor) popFor.setAttribute('aria-expanded', 'false'); pop.hidden = true; popFor = null; }
  function glOpen(btn){
    if (popFor === btn) return glClose();
    glClose(); popFor = btn; btn.setAttribute('aria-expanded', 'true');
    var g = GLOSS[+btn.dataset.g];
    pop.innerHTML = '<button type="button" class="gl-close" aria-label="Close definition">×</button><p><b>' + g[1] + '</b> ' + g[2] + '</p>';
    pop.querySelector('.gl-close').onclick=function(){var trigger=popFor;glClose();if(trigger)trigger.focus({preventScroll:true});};
    pop.hidden = false;
    var r = btn.getBoundingClientRect(), w = Math.min(320, innerWidth - 24);
    pop.style.width = w + 'px';
    pop.style.left = Math.max(12, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 12)) + 'px';
    var below = r.bottom + 10, h = pop.offsetHeight;
    pop.style.top = (below + h > innerHeight - 12 ? r.top - h - 10 : below) + 'px';
    pop.querySelector('.gl-close').focus({preventScroll:true});
    track('glossary_open', { term: g[1] });
  }
  document.querySelectorAll('.page').forEach(function(sec){
    if (['home','about','privacy'].indexOf(sec.id) >= 0) return;
    var used = {};
    var walker = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT, { acceptNode: function(n){
      var p = n.parentElement;
      if (!p || p.closest('h1,h2,h3,a,button,label,legend,nav,footer,.toc,.facts,.sv,.pk,.hw,.cap,.gd-call,.signup,.share,.rn-line,.corrections,.gd-head,.badge,script,style')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT; } });
    var nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function(n){
      while (n && n.parentNode) {
        var best = null;
        GLOSS.forEach(function(g, gi){ if (used[gi]) return; g[0].lastIndex = 0; var m = g[0].exec(n.nodeValue); if (m && (!best || m.index < best.m.index)) best = { m: m, gi: gi }; });
        if (!best) break;
        used[best.gi] = 1;
        var after = n.splitText(best.m.index); after.nodeValue = after.nodeValue.slice(best.m[0].length);
        var b = document.createElement('button'); b.type = 'button'; b.className = 'gl'; b.dataset.g = best.gi;
        b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'gl-pop'); b.textContent = best.m[0];
        n.parentNode.insertBefore(b, after);
        n = after;
      }
    });
  });
  document.addEventListener('click', function(e){ var b = e.target.closest('.gl'); if (b) { e.preventDefault(); glOpen(b); } else if (!e.target.closest('#gl-pop')) glClose(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && popFor) { var b = popFor; glClose(); b.focus(); } });
  window.addEventListener('scroll', glClose, { passive: true });
  window.addEventListener('hashchange', glClose);


  // ---- Ask Patrick: native modal isolation and session-only draft continuity. ----
  var draft=readSession('mu_question','');if(typeof draft!=='string')draft='';
  var askSection=readSession('mu_question_section',null);
  if(!askSection || !FILES[askSection.page] || typeof askSection.title!=='string')askSection=null;
  var view='closed',sentVia='',root=document.getElementById('ask-root'),askOpener=null,bookingHref='',oldOverflow='',quickOpen=-1,askFocusQuestion=false;
  var WA_Q='https://wa.me/34615191390',MAIL='patrickjharris91@gmail.com';
  var AV='background:url(&quot;./assets/patrick-avatar.jpg&quot;) center/cover;';
  var QUICK=[
    {label:'What’s the commute like?',answer:['Both towns are on the C-4 Cercanías line into Madrid. Tres Cantos has the shorter train journey; Colmenar Viejo is farther along the line.', 'Tres Cantos is easier to walk and cycle around. Colmenar is more spread out, so a car can matter more for daily life. Compare the whole door-to-door trip, including the station and school run, and check Renfe’s timetable for your exact journey.']},
    {label:'What does our money buy in each town?',answer:['Colmenar Viejo generally gives you more space for the same budget. The guide’s central trade-off is a flat in Tres Cantos versus a larger home, potentially with a garden, in Colmenar.', 'Tres Cantos carries a premium for its planned environment and convenience. If your budget is fixed and space is the priority, start with Colmenar; if convenience matters more, compare Tres Cantos flats. The guide’s price ranges are indicative—check current listings for your shortlist.']},
    {label:'Which schools should we look at?',answer:['Start with the curriculum your children need. For British or American/international schooling, the guides point to King’s College Soto de Viñuelas and Casvi in Tres Cantos. Families can also live in Colmenar and travel to school in Tres Cantos.', 'For Spanish state or concertada schooling, explore both towns. The guides include Aldebarán and Humanitas in Tres Cantos, and Antonio Machado, Fuentesanta, Ángel León, Zurbarán and Peñalvento in Colmenar. Confirm current places, admissions, fees and language provision directly with each school before deciding.']},
    {label:'How much do we need saved for a mortgage?',answer:['The guide’s indicative starting point is around a 20% deposit for a Spanish tax resident, or 30–40% for a non-resident, plus the costs of buying the property. Those costs are separate from the deposit and vary between resale and new-build homes.', 'The bank’s valuation can affect how much it will lend, so a lower valuation can leave an extra gap to cover. Treat these as planning examples, not a mortgage offer: ask the lender for a written breakdown for your property and circumstances.']}
  ];
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function where(){var p=document.querySelector('.page.active'),h=p && p.querySelector('h1');return h ? h.textContent.trim() : 'Madrid Unpacked';}
  function questionContext(){return Object.keys(pickerAnswers).length===4 ? pickerRecommendation(pickerAnswers).title+' — '+pickerSummary(pickerAnswers) : '';}
  function message(){return 'Hi Patrick, a question (I’m reading '+where()+(SRC?'; found you via '+SRC:'')+'): '+draft.trim()+(askSection?'\n\nAbout this section: '+mobileLabels[askSection.page]+' — '+askSection.title:'')+(questionContext()?'\n\nOur town picker result: '+questionContext():'');}
  function questionLinks(){return {wa:WA_Q+'?text='+encodeURIComponent(message()),email:'mailto:'+MAIL+'?subject='+encodeURIComponent('A question about our move')+'&body='+encodeURIComponent(message())};}
  function links(){var a=document.getElementById('ask-wa'),b=document.getElementById('ask-em'),urls=questionLinks();if(a)a.href=urls.wa;if(b)b.href=urls.email;}
  function openAsk(opener){askOpener=opener && opener.nodeType===1 ? opener : document.activeElement;askFocusQuestion=!!(askOpener && (askOpener.hasAttribute('data-ask-section') || askOpener.hasAttribute('data-picker-discuss')));if(askOpener && askOpener.hasAttribute('data-ask-section')){askSection={page:askOpener.getAttribute('data-ask-page'),title:askOpener.getAttribute('data-ask-section')};saveSession('mu_question_section',askSection);}glClose();gmClose(null);view='open';render();track('ask_open');}
  function openPlan(opener){askOpener=opener;glClose();gmClose(null);view='plan';render();}
  function closeAsk(){
    var panel=root.querySelector('dialog');if(panel && panel.open)panel.close();
    view='closed';document.body.style.overflow=oldOverflow;render();
    var target=askOpener && askOpener.isConnected ? askOpener : document.getElementById('ask-open');
    if(target)target.focus({preventScroll:true});askOpener=null;
  }
  function openBooking(a){
    bookingHref=a.href;if(view!=='plan')askOpener=a;sentVia='whatsapp';glClose();gmClose(null);
    window.open(bookingHref,'_blank','noopener');view='booking-ready';render();
  }
  function render(){
    var previous=root.querySelector('dialog');
    if(previous && previous.open)previous.close();
    if(view==='closed'){
      root.innerHTML='<button id="ask-open" class="ask-fab" aria-label="Ask Patrick a question"><span class="ask-fab-av" style="'+AV+'"></span><span class="ask-lbl">Ask Patrick</span></button>';
      document.getElementById('ask-open').onclick=function(e){openAsk(e.currentTarget);};return;
    }
    if(!previous){oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';}
    var body='',booking=view==='booking-ready';
    if(view==='plan'){
      var source=document.querySelector('.page.active [data-track="booking_click"]'),href=source?source.getAttribute('href'):WA_Q+'?text='+encodeURIComponent('Hi Patrick, I’d like to arrange Your move, unpacked (60–90 min, €150).');
      body='<div class="ask-body plan-preview"><h2>Your move, unpacked.</h2><p>Turn your research into a plan for your family, with Patrick.</p><ul><li>A town shortlist that fits your budget</li><li>The schools worth visiting</li><li>Your next three steps</li></ul><p class="plan-duration">60–90 minute video call</p><div class="plan-price"><strong>€150</strong><span>For your planning call</span></div><a class="b1" href="'+esc(href)+'" data-track="booking_click" data-place="plan_preview">Arrange on WhatsApp →</a><p class="ask-small">Message Patrick to agree a time.</p><button type="button" class="text-button" data-plan-question>Have a quick question first?</button></div>';
    }else if(booking){
      body='<div class="ask-body ask-sent"><p class="ask-big">Your message is ready.</p><p>Send it in WhatsApp to agree a time with Patrick.</p><div class="booking-recap"><b>Your move, unpacked</b><span>60–90 minute video call · €150</span></div><a class="b1 sm" id="handoff-retry" href="'+esc(bookingHref)+'">Open WhatsApp again</a><p class="ask-small">Nothing opened? You can also <a href="mailto:'+MAIL+'?subject='+encodeURIComponent('Booking a €150 planning call')+'">email Patrick to arrange your call</a>.</p></div>';
    }else if(view==='ready'){
      var urls=questionLinks(),retry=sentVia==='email'?urls.email:urls.wa;
      body='<div class="ask-body ask-sent"><p class="ask-big">Your message is ready.</p><p>Send it in '+(sentVia==='email'?'your email app':'WhatsApp')+'. Your question and guide context are included.</p><a class="b1 sm" id="handoff-retry" href="'+esc(retry)+'">Open '+(sentVia==='email'?'email':'WhatsApp')+' again</a><button type="button" class="text-button" id="ask-edit">Edit your question</button></div>';
    }else{
      body='<div class="ask-body"><label for="ask-input" class="ask-lab">Your question</label><textarea id="ask-input" rows="3" placeholder="e.g. Two kids, 7 and 10. Which town would you look at first?">'+esc(draft)+'</textarea>'+
        (askSection?'<div class="ask-context"><b>About '+esc(mobileLabels[askSection.page])+'</b><p>'+esc(askSection.title)+'</p><button type="button" class="text-button" id="ask-clear-section">Remove section context</button></div>':'')+
        (questionContext()?'<div class="ask-context"><b>Your town picker result is included</b><p>'+esc(questionContext())+'</p></div>':'')+
        '<p class="ask-err" id="ask-err" aria-live="polite"></p><div class="ask-send"><a id="ask-wa" class="b1 sm" href="#">Open WhatsApp</a><a id="ask-em" class="b2 sm" href="#">Open email</a></div><p class="ask-small">Your draft stays with you as you browse guides in this tab. You send the message in WhatsApp or your email app.</p><p class="ask-lab ask-lab2">Quick answers from the guides</p><div class="ask-quick">'+QUICK.map(function(q,i){var open=quickOpen===i;return '<div class="ask-faq"><button type="button" class="ask-starter" id="ask-question-'+i+'" data-i="'+i+'" aria-expanded="'+open+'" aria-controls="ask-answer-'+i+'">'+esc(q.label)+'<i aria-hidden="true">'+(open?'−':'+')+'</i></button><div class="ask-answer" id="ask-answer-'+i+'" role="region" aria-labelledby="ask-question-'+i+'"'+(open?'':' hidden')+'>'+q.answer.map(function(p){return '<p>'+esc(p)+'</p>';}).join('')+'</div></div>';}).join('')+'</div></div>';
    }
    root.innerHTML='<dialog class="ask-panel" aria-labelledby="ask-dialog-title"><div class="ask-head"><span class="ask-head-av" style="'+AV+'"></span><div><div class="ask-title" id="ask-dialog-title">'+(booking?'Arrange your planning call':'Ask Patrick')+'</div><div class="ask-sub">He reads every question himself.</div></div><button type="button" id="ask-close" aria-label="Close">×</button></div>'+body+'</dialog>';
    var panel=root.querySelector('dialog');panel.showModal();
    swipeSheet(panel,'.ask-body',closeAsk);
    if(view==='plan'){panel.classList.add('plan-panel');panel.querySelector('#ask-dialog-title').textContent='Plan your move with Patrick';panel.querySelector('.ask-sub').textContent='A plan for your family’s situation';panel.querySelector('[data-plan-question]').onclick=function(){var opener=askOpener;openAsk(opener);};}
    var quick=panel.querySelector('.ask-quick');if(quick){var label=quick.previousElementSibling,askBody=panel.querySelector('.ask-body');askBody.prepend(quick);askBody.prepend(label);var write=document.createElement('button');write.type='button';write.className='b2 sm ask-write';write.textContent='Still have a question? Write to Patrick ↓';quick.after(write);write.onclick=function(){askFocusQuestion=true;var field=document.getElementById('ask-input');field.scrollIntoView({block:'center'});field.focus({preventScroll:true});};}
    panel.addEventListener('cancel',function(e){e.preventDefault();closeAsk();});
    panel.addEventListener('click',function(e){if(e.target===panel){var r=panel.getBoundingClientRect();if(e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom)closeAsk();}});
    document.getElementById('ask-close').onclick=closeAsk;
    var clearSection=document.getElementById('ask-clear-section');if(clearSection)clearSection.onclick=function(){askSection=null;saveSession('mu_question_section',null);render();};
    var retry=document.getElementById('handoff-retry');
    if(retry)retry.onclick=function(e){if(sentVia==='whatsapp'){e.preventDefault();window.open(this.href,'_blank','noopener');}track(booking?'booking_handoff':'contact_handoff',{channel:sentVia,place:'handoff_retry'});};
    var edit=document.getElementById('ask-edit');if(edit)edit.onclick=function(){view='open';askFocusQuestion=true;render();};
    var input=document.getElementById('ask-input');
    if(!input){if(retry)retry.focus({preventScroll:true});else {var title=panel.querySelector('#ask-dialog-title');title.setAttribute('tabindex','-1');title.focus({preventScroll:true});}return;}
    if(askFocusQuestion){input.focus({preventScroll:true});requestAnimationFrame(function(){input.scrollIntoView({block:'center'});});}else root.querySelector('.ask-starter').focus({preventScroll:true});input.oninput=function(){draft=input.value;saveSession('mu_question',draft);document.getElementById('ask-err').textContent='';links();};links();
    ['ask-wa','ask-em'].forEach(function(id){document.getElementById(id).onclick=function(e){
      if(!draft.trim()){e.preventDefault();document.getElementById('ask-err').textContent='Write your question first — a sentence or two is plenty.';input.focus();return;}
      sentVia=id==='ask-wa'?'whatsapp':'email';track('contact_handoff',{channel:sentVia,place:'ask_panel'});
      if(sentVia==='whatsapp'){e.preventDefault();window.open(this.href,'_blank','noopener');}
      setTimeout(function(){if(view==='open'){view='ready';render();}},80);
    };});
    root.querySelectorAll('.ask-starter').forEach(function(b){b.onclick=function(){var i=+b.dataset.i;quickOpen=quickOpen===i?-1:i;root.querySelectorAll('.ask-starter').forEach(function(button){var open=+button.dataset.i===quickOpen;button.setAttribute('aria-expanded',String(open));button.querySelector('i').textContent=open?'−':'+';document.getElementById(button.getAttribute('aria-controls')).hidden=!open;});if(quickOpen>=0)track('ask_quick_answer',{question:QUICK[i].label});};});
  }
  document.addEventListener('click',function(e){
    var plan=e.target.closest('.app-call, a[data-track="offer_nav_click"]');if(plan){e.preventDefault();openPlan(plan);return;}
    var question=e.target.closest('[data-open-ask]');if(question){e.preventDefault();openAsk(question);return;}
    var booking=e.target.closest('a[data-track="booking_click"]');if(booking){e.preventDefault();openBooking(booking);}
  });
  window.addEventListener('pagehide',function(){saveSession('mu_question',draft);});
  // BEGIN YOUR MOVE
  // Shared journey state. Free text stays local and is never passed to analytics.
  var move=readLocal('mu_move',{});
  if(!move || typeof move!=='object' || Array.isArray(move))move={};
  var moveOptions={priority:{town:'Choose a town',schools:'Find schools',budget:'Understand the budget',visit:'Prepare a visit'},time:{exploring:'Just exploring',soon:'Within 3 months',year:'Within a year',later:'Later',unsure:'Not sure'},stage:{early:'Early years',primary:'Primary',secondary:'Secondary',mixed:'More than one stage',none:'No school needs'},curriculum:{intl:'British, American or international',spanish:'Spanish state or concertada',unsure:'Not sure yet'},housing:{rent:'Renting',buy:'Buying',unsure:'Undecided'},frequency:{daily:'Most weekdays',weekly:'A few days a week',rare:'Occasionally',remote:'Mostly from home'}};
  Object.keys(moveOptions).forEach(function(k){if(!moveOptions[k][move[k]])delete move[k];});
  move.towns=Array.isArray(move.towns)?move.towns.filter(function(t){return ['tres-cantos','colmenar'].includes(t);}):[];
  move.questions=Array.isArray(move.questions)?move.questions.filter(function(q){return typeof q==='string';}).slice(0,12):[];
  move.tasks=Array.isArray(move.tasks)?move.tasks.filter(function(t){return t==='commute';}):[];
  move.commute=typeof move.commute==='string'?move.commute.slice(0,160):'';
  function persistMove(){return writeLocal('mu_move',move);}
  function importPicker(){if(move.ignorePicker)return;if(pickerAnswers.school && !move.curriculum)move.curriculum=pickerAnswers.school==='intl'?'intl':'spanish';if(Object.keys(pickerAnswers).length)move.picker=Object.assign({},pickerAnswers);persistMove();}
  importPicker();
  var moveDialog=document.createElement('dialog');moveDialog.className='chapter-reader move-dialog';moveDialog.setAttribute('aria-labelledby','move-title');document.body.appendChild(moveDialog);
  var moveOpener=null,moveOverflow='',moveMode='plan';
  var moveMessageDraft=readSession('mu_move_message','');if(typeof moveMessageDraft!=='string')moveMessageDraft='';var moveInclude=readSession('mu_move_include',{preferences:true,shortlist:true,questions:true,notes:false});
  var sheetAfterClose=null;
  function pushSheet(name){try{history.pushState(Object.assign({},history.state||{},{muSheet:name}),'',location.href);}catch(e){}}
  function finishSheetClose(name,after,fromHistory){if(!fromHistory && history.state && history.state.muSheet===name){sheetAfterClose=typeof after==='function'?after:null;history.back();}else if(typeof after==='function')after();}
  function closeMove(after,fromHistory){if(!moveDialog.open){if(typeof after==='function')after();return;}moveDialog.close();document.body.style.overflow=moveOverflow;if(moveOpener && moveOpener.isConnected)moveOpener.focus({preventScroll:true});finishSheetClose('move',after,fromHistory);}
  function moveSelect(key,label){return '<label>'+label+'<select data-move-field="'+key+'"><option value="">Skip for now</option>'+Object.keys(moveOptions[key]).map(function(v){return '<option value="'+v+'"'+(move[key]===v?' selected':'')+'>'+esc(moveOptions[key][v])+'</option>';}).join('')+'</select></label>';}
  function nextMove(){
    if(!move.priority && move.towns.length && move.questions.some(function(q){return q.trim();}))return {page:'guides',anchor:'visit-checklist',title:'Prepare the next visit',reason:'Your shortlist and questions are ready. Use them to test everyday life in the towns.'};
    if(move.priority==='schools' && move.stage==='none')return {page:'compare',title:'Compare housing and everyday life',reason:'You’ve selected no school needs. Focus on the town trade-offs that matter to your household.'};
    if(move.time==='soon' && move.towns.length && !['schools','budget'].includes(move.priority))return {page:'guides',anchor:'visit-checklist',title:'Test your shortlist on a visit',reason:'You’re aiming to move within three months. Check daily life in your shortlisted towns next.'};
    if(move.priority==='town' && (move.commute || move.frequency==='daily'))return {page:'compare',anchor:'compare-getting-around',title:'Compare the daily commute',reason:'Test the complete journey'+(move.commute?' to '+move.commute:'')+', including getting to the station and the school run.'};
    if(move.priority==='visit')return {page:'guides',anchor:'visit-checklist',title:'Plan your first visit',reason:'Turn your shortlist into checks you can try in both towns.'};
    if(move.priority==='schools'){var town=move.towns.length===1?move.towns[0]:null;return {page:move.curriculum==='intl'?'schools-tres-cantos':town==='colmenar'?'schools-colmenar':town==='tres-cantos'?'schools-tres-cantos':'compare',anchor:!town && move.curriculum!=='intl'?'compare-schools':'',title:move.curriculum==='intl'?'Explore international school options':'Compare school options',reason:move.curriculum==='intl'?'The Tres Cantos guide covers British and international routes. Confirm stages and available places with each school.':'Start with curriculum and places, then test the journey from your preferred neighbourhood.'};}
    if(move.priority==='budget')return move.housing==='rent'?{page:'compare',anchor:'compare-housing-what-your-money-actually-buys',title:'Compare housing in both towns',reason:'You’re considering renting. Start with housing options before mortgage guidance.'}:{page:'mortgages',title:'Understand savings and buying costs',reason:move.housing==='buy'?'You’re considering buying. Work out the cash needed before shortlisting homes.':'Explore the costs of buying; you can change your housing preference at any time.'};
    if(move.towns.length===1)return {page:move.towns[0],title:'Explore '+mobileLabels[move.towns[0]],reason:'You have one town shortlisted. Check its daily-life trade-offs before deciding.'};
    return {page:'compare',title:'Compare the two towns',reason:'Compare housing, schools and the daily routine to find your starting point.'};
  }
  function moveMarkup(){var next=nextMove(),school=move.priority==='schools',budget=move.priority==='budget';return '<p class="move-intro">Optional, editable and saved on this device. Start with what matters today.</p><div class="move-priorities" role="group" aria-label="Your current priority">'+Object.keys(moveOptions.priority).map(function(k){return '<button type="button" data-move-priority="'+k+'" aria-pressed="'+(move.priority===k)+'">'+moveOptions.priority[k]+'</button>';}).join('')+'</div><div class="move-next"><small>Your next step</small><a href="'+pageHref(next.page,next.anchor)+'" data-move-recommendation>'+esc(next.title)+' →</a><p>'+esc(next.reason)+'</p></div><details class="move-preferences"'+(school || budget?' open':'')+'><summary>Your preferences</summary>'+moveSelect('time','When might you move?')+(school?moveSelect('stage','School stage')+moveSelect('curriculum','Curriculum preference'):'')+(budget?moveSelect('housing','Renting or buying?'):'')+'<details><summary>More about your move</summary>'+(!school?moveSelect('stage','School stage')+moveSelect('curriculum','Curriculum preference'):'')+(!budget?moveSelect('housing','Renting or buying?'):'')+'<label>Commute destination (optional)<input data-move-field="commute" maxlength="160" value="'+esc(move.commute)+'" placeholder="e.g. Chamartín"></label>'+moveSelect('frequency','How often would you commute?')+'</details>'+(move.picker?'<p class="move-small">Your town-picker preferences are included. <a href="'+pageHref('compare')+'">Review the town picker</a>.</p>':'')+'</details><h3>Your town shortlist</h3><div class="move-towns">'+['tres-cantos','colmenar'].map(function(t){return '<button type="button" data-move-town="'+t+'" aria-pressed="'+move.towns.includes(t)+'">'+mobileLabels[t]+(move.towns.includes(t)?' ✓':' +')+'</button>';}).join('')+'</div><h3>Questions for your visit</h3><div class="move-questions">'+move.questions.map(function(q,i){return '<div><label>Question '+(i+1)+'<textarea rows="2" maxlength="500" data-move-question="'+i+'">'+esc(q)+'</textarea></label><button type="button" data-move-remove-question="'+i+'" aria-label="Remove question '+(i+1)+'">Remove</button></div>';}).join('')+'</div><button type="button" data-move-add-question>Add a question</button>'+(move.tasks.includes('commute')?'<p>✓ Commute test added to your visit preparation.</p>':'')+'<a class="move-visit" href="'+pageHref('guides','visit-checklist')+'">Open your visit checklist and notes →</a><p class="move-small">'+savedSections.length+' saved sections · '+Object.keys(completedGuides).filter(function(k){return completedGuides[k]===true;}).length+' guides marked as read</p>'+ (savedSections.length?'<button type="button" data-open-saved>Your saved guidance ('+savedSections.length+')</button>':'')+'<button type="button" class="b1" data-move-discuss>Discuss my shortlist with Patrick</button><button type="button" class="text-button" data-move-clear>Clear move preferences and shortlist</button><p class="move-status" role="status"></p>';}
  var moveCard=null;
  function moveReturnSummary(){var towns=move.towns.length,questions=move.questions.filter(function(q){return q.trim();}).length;if(towns || questions)return towns+' '+(towns===1?'town':'towns')+' shortlisted · '+questions+' '+(questions===1?'visit question':'visit questions');return moveOptions.priority[move.priority]||'Work out your next step';}
  function renderMove(){if(moveCard){moveCard.querySelector('.move-card-summary').textContent=moveReturnSummary();moveCard.querySelector('.move-card-content').innerHTML=moveMarkup();var first=moveCard.querySelector('.move-priorities');var returning=!!(move.priority || move.towns.length || move.questions.some(function(q){return q.trim();}));moveCard.querySelector('.move-mobile-open').textContent=returning?'Edit plan →':'Open plan →';moveCard.querySelector('.move-mobile-start').innerHTML=(returning?'':first.outerHTML)+(move.priority || move.towns.length || move.questions.some(function(q){return q.trim();})?moveCard.querySelector('.move-next').outerHTML:'');}if(moveDialog.open && moveMode==='plan'){moveDialog.querySelector('.reader-content').innerHTML=moveMarkup();}if(moveMessageDraft)[moveCard,moveDialog.open && moveMode==='plan'?moveDialog:null].forEach(function(scope){if(!scope)return;var primary=scope.querySelector('[data-move-discuss]');if(primary && !scope.querySelector('[data-move-resume]')){var resume=document.createElement('button');resume.type='button';resume.setAttribute('data-move-resume','');resume.textContent='Resume message draft';primary.before(resume);}});}
  function openMove(opener,fromHistory){moveOpener=opener||moveOpener;moveMode='plan';moveOverflow=document.body.style.overflow;moveDialog.innerHTML='<div class="reader-head"><h2 id="move-title">Your move</h2><button type="button" class="reader-close" data-close-move aria-label="Close your move">×</button></div><div class="reader-content"></div>';document.body.style.overflow='hidden';moveDialog.showModal();if(!fromHistory)pushSheet('move');renderMove();moveDialog.querySelector('[data-close-move]').focus({preventScroll:true});}
  var MOVE_PLANNER=false; // Planner hidden while the site covers two towns; set true to bring it back.
  if(!MOVE_PLANNER)document.body.classList.add('no-move-planner');
  var library=document.querySelector('.guide-library');if(library){var workspace=document.createElement('div');workspace.className='guides-workspace';library.before(workspace);workspace.appendChild(library);moveCard=document.createElement('aside');moveCard.className='move-card';moveCard.setAttribute('aria-label','Your move');moveCard.innerHTML='<h2>Your move</h2><p class="move-card-summary"></p><div class="move-mobile-start"></div><button type="button" class="move-mobile-open" data-open-move>Open plan →</button><div class="move-card-content"></div>';workspace.prepend(moveCard);}if(moveCard && MOVE_PLANNER){var personalArea=document.querySelector('.guide-library .personal-reading');if(personalArea){personalArea.classList.add('in-move');moveCard.insertBefore(personalArea,moveCard.querySelector('.move-card-content'));}document.body.classList.add('has-move-card');}
  function moveSummary(include){var lines=['Hi Patrick, I’d like to discuss our move.'];if(include.preferences){Object.keys(moveOptions).forEach(function(k){if(move[k])lines.push(({priority:'Priority',time:'Timing',stage:'School stage',curriculum:'Curriculum',housing:'Housing',frequency:'Commute frequency'}[k])+': '+moveOptions[k][move[k]]);});if(move.commute)lines.push('Commute destination: '+move.commute);if(move.picker)lines.push('Town-picker preferences: '+pickerSummary(cleanAnswers(move.picker)));}if(include.shortlist && move.towns.length)lines.push('Town shortlist: '+move.towns.map(function(t){return mobileLabels[t];}).join(', '));if(include.questions && move.questions.length)lines.push('Our questions:\n'+move.questions.filter(Boolean).join('\n'));if(include.notes){var notes=readLocal('mu_visit_notes','');if(typeof notes==='string' && notes.trim())lines.push('Visit notes:\n'+notes);}return lines.join('\n\n');}
  function reviewMove(opener){if(!moveDialog.open)openMove(opener);moveMode='review';moveDialog.querySelector('#move-title').textContent='Choose what to share';moveDialog.querySelector('.reader-content').innerHTML='<button type="button" data-move-back-plan>← Your move</button><p>Choose what Patrick receives. You can edit the message before opening WhatsApp.</p>'+[['preferences','Your preferences',true],['shortlist','Town shortlist',true],['questions','Visit questions',true],['notes','Include personal visit notes',false]].map(function(a){return '<label class="move-check"><input type="checkbox" data-move-include="'+a[0]+'"'+(moveInclude[a[0]]?' checked':'')+'>'+a[1]+'</label>';}).join('')+'<button type="button" class="b1" data-move-prepare>Review message →</button>';moveDialog.querySelector('[data-move-prepare]').focus({preventScroll:true});}
  document.addEventListener('click',function(e){var b=e.target.closest('button,a');if(!b)return;
    if(b.hasAttribute('data-open-saved')){if(moveDialog.open)closeMove(function(){openSavedTray(false);});else openSavedTray(false);return;}
    if(b.hasAttribute('data-open-move')){openMove(b);return;}
    if(b.hasAttribute('data-close-move')){closeMove();return;}
    if(b.hasAttribute('data-move-priority')){move.priority=b.getAttribute('data-move-priority');persistMove();renderMove();var surface=moveDialog.open?moveDialog:moveCard.querySelector(window.innerWidth<=1000?'.move-mobile-start':'.move-card-content');var target=surface.querySelector('[data-move-priority="'+move.priority+'"]')||moveCard.querySelector('[data-open-move]');if(target)target.focus({preventScroll:true});track('move_priority_selected',{result:move.priority});return;}
    if(b.hasAttribute('data-move-town')){var town=b.getAttribute('data-move-town'),at=move.towns.indexOf(town);if(at<0)move.towns.push(town);else move.towns.splice(at,1);persistMove();renderMove();document.querySelectorAll('[data-move-town]').forEach(function(button){var t=button.getAttribute('data-move-town'),on=move.towns.includes(t);button.setAttribute('aria-pressed',String(on));if(button.closest('.guide-finish'))button.textContent=on?mobileLabels[t]+' shortlisted ✓':'Add '+mobileLabels[t]+' to my shortlist';});track(at<0?'shortlist_added':'shortlist_removed',{result:town});return;}
    if(b.hasAttribute('data-move-add-question')){if(move.questions.length<12){move.questions.push('');persistMove();renderMove();var scope=moveDialog.open?moveDialog:moveCard;var inputs=scope.querySelectorAll('[data-move-question]');inputs[inputs.length-1].focus();}return;}
    if(b.hasAttribute('data-move-remove-question')){move.questions.splice(Number(b.getAttribute('data-move-remove-question')),1);persistMove();renderMove();return;}
    if(b.hasAttribute('data-move-clear')){move={towns:[],questions:move.questions,tasks:move.tasks,commute:'',ignorePicker:true};persistMove();renderMove();return;}
    if(b.hasAttribute('data-move-school-question')){var question='Which schools match '+(move.stage && move.stage!=='none'?moveOptions.stage[move.stage].toLowerCase()+' and ':'')+'our curriculum, have places, and fit the school run?';if(!move.questions.includes(question))move.questions.push(question);persistMove();renderMove();b.textContent='Added to your visit questions ✓';track('visit_question_added',{place:'guide'});return;}
    if(b.hasAttribute('data-move-commute')){if(!move.tasks.includes('commute'))move.tasks.push('commute');persistMove();renderMove();b.textContent='Commute test added ✓';track('visit_task_added',{result:'commute'});return;}
    if(b.hasAttribute('data-move-discuss')){reviewMove(b);track('move_summary_open');return;}
    if(b.hasAttribute('data-move-back-plan')){moveMode='plan';moveDialog.querySelector('#move-title').textContent='Your move';renderMove();return;}
    if(b.hasAttribute('data-move-back-choices')){reviewMove(moveOpener);return;}
    if(b.hasAttribute('data-move-resume')){if(!moveDialog.open)openMove(b);renderMoveMessage();return;}
    if(b.hasAttribute('data-move-prepare')){var include={};moveDialog.querySelectorAll('[data-move-include]').forEach(function(c){include[c.getAttribute('data-move-include')]=c.checked;});if(!moveMessageDraft || JSON.stringify(include)!==JSON.stringify(moveInclude))moveMessageDraft=moveSummary(include);moveInclude=include;saveSession('mu_move_include',include);saveSession('mu_move_message',moveMessageDraft);renderMoveMessage();track('move_summary_prepared');return;}
    if(b.hasAttribute('data-move-send')){e.preventDefault();var text=moveDialog.querySelector('.move-message').value.trim();if(!text){moveDialog.querySelector('.move-status').textContent='Write a message before opening WhatsApp.';return;}window.open(b.href,'_blank','noopener');moveDialog.querySelector('.move-status').textContent='Send your message in WhatsApp when you’re ready.';return;}
    if(b.hasAttribute('data-move-recommendation'))track('move_recommendation_opened',{result:nextMove().page});
    if(b.hasAttribute('data-save-section') || b.hasAttribute('data-mark-read') || b.hasAttribute('data-remove-saved'))renderMove();
    if(b.closest('.move-dialog') && b.tagName==='A' && !b.hasAttribute('data-move-send')){e.preventDefault();var href=b.getAttribute('href');closeMove(function(){location.href=href;});}
  });
  function renderMoveMessage(){moveMode='message';moveDialog.querySelector('#move-title').textContent='Review your message';moveDialog.querySelector('.reader-content').innerHTML='<button type="button" data-move-back-choices>← Sharing choices</button><label>Your message to Patrick<textarea class="move-message" rows="10" maxlength="6000">'+esc(moveMessageDraft)+'</textarea></label><a class="b1" data-move-send data-place="move_summary" href="#">Open WhatsApp →</a><p class="move-small">Your draft stays in this tab. You send the message in WhatsApp.</p><p role="status" class="move-status"></p>';updateMoveLink();}
  function updateMoveLink(){var field=moveDialog.querySelector('.move-message'),link=moveDialog.querySelector('[data-move-send]');if(field && link){moveMessageDraft=field.value;saveSession('mu_move_message',moveMessageDraft);link.href=WA_Q+'?text='+encodeURIComponent(field.value);}}
  function syncMoveCurriculum(){if(!['intl','spanish'].includes(move.curriculum))return;pickerAnswers.school=move.curriculum==='intl'?'intl':'either';saveSession('mu_picker',pickerAnswers);move.picker=Object.assign({},pickerAnswers);document.querySelectorAll('[data-picker]').forEach(function(form){form.querySelectorAll('input[name="pk-school"]').forEach(function(input){input.checked=input.value===pickerAnswers.school;});form.dispatchEvent(new window.Event('change',{bubbles:true}));});}
  document.addEventListener('input',function(e){var el=e.target;if(el.hasAttribute('data-move-question')){move.questions[Number(el.getAttribute('data-move-question'))]=el.value.slice(0,500);persistMove();if(moveCard)moveCard.querySelector('.move-card-summary').textContent=moveReturnSummary();}if(el.getAttribute('data-move-field')==='commute'){move.commute=el.value.slice(0,160);persistMove();}if(el.classList.contains('move-message'))updateMoveLink();});
  document.addEventListener('change',function(e){var key=e.target.getAttribute('data-move-field');if(key && moveOptions[key]){move[key]=moveOptions[key][e.target.value]?e.target.value:'';if(key==='curriculum')syncMoveCurriculum();persistMove();var scope=e.target.closest('.move-dialog')?moveDialog:moveCard;renderMove();var field=scope && scope.querySelector('[data-move-field="'+key+'"]');if(field)field.focus({preventScroll:true});}if(e.target.closest('[data-picker]')){move.ignorePicker=false;importPicker();renderMove();}});
  moveDialog.addEventListener('cancel',function(e){e.preventDefault();closeMove();});moveDialog.addEventListener('click',function(e){if(e.target===moveDialog){var r=moveDialog.getBoundingClientRect();if(e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom)closeMove();}});window.addEventListener('hashchange',function(){closeMove(null,true);});
  document.querySelectorAll('.guide-finish').forEach(function(finish){var page=finish.closest('.page').id,action=document.createElement('button');action.type='button';if(['tres-cantos','colmenar'].includes(page)){action.setAttribute('data-move-town',page);action.setAttribute('aria-pressed',String(move.towns.includes(page)));action.textContent=move.towns.includes(page)?mobileLabels[page]+' shortlisted ✓':'Add '+mobileLabels[page]+' to my shortlist';}else if(page.indexOf('schools-')===0){action.setAttribute('data-move-school-question','');action.textContent='Add school questions to my visit';}else return;finish.prepend(action);});
  document.querySelectorAll('.reading-article h2').forEach(function(h){if(/getting around|commut/i.test(h.textContent)){var button=document.createElement('button');button.type='button';button.className='move-section-action';button.setAttribute('data-move-commute','');button.textContent='Add a commute test to my visit';h.after(button);}});
  document.querySelectorAll('.guide-finish').forEach(function(finish){var open=document.createElement('button');open.type='button';open.setAttribute('data-open-move','');open.textContent='Open my move plan';finish.appendChild(open);});
  renderMove();
  var removedBookmark=null,bookmarkUndoTimer,bookmarkToast=null;
  function removeStoredBookmark(index){if(index<0 || index>=savedSections.length)return;removedBookmark={item:savedSections[index],index:index};savedSections.splice(index,1);}
  function showBookmarkUndo(){
    if(!removedBookmark)return;
    if(!bookmarkToast){bookmarkToast=document.createElement('div');bookmarkToast.className='bookmark-undo';}
    bookmarkToast.innerHTML='<span role="status">Section removed</span><button type="button" data-undo-bookmark>Undo</button><button type="button" data-dismiss-bookmark aria-label="Dismiss notification">×</button>';
    (document.querySelector('dialog[open]')||document.body).appendChild(bookmarkToast);
    function dismiss(){clearTimeout(bookmarkUndoTimer);removedBookmark=null;bookmarkToast.remove();}
    bookmarkToast.querySelector('[data-dismiss-bookmark]').onclick=dismiss;
    bookmarkToast.querySelector('[data-undo-bookmark]').onclick=function(){var old=removedBookmark;dismiss();if(old && !savedSections.some(function(s){return s.page===old.item.page && s.anchor===old.item.anchor;}))savedSections.splice(Math.min(old.index,savedSections.length),0,old.item);writeLocal('mu_saved_sections',savedSections);renderSaved();renderMove();var target=document.querySelector('dialog[open] button')||savedFab;if(target)target.focus({preventScroll:true});};
    clearTimeout(bookmarkUndoTimer);bookmarkUndoTimer=setTimeout(function(){if(!bookmarkToast.contains(document.activeElement))dismiss();},12000);
  }
  function updateDirectBookmarks(){document.querySelectorAll('[data-direct-bookmark]').forEach(function(button){var on=savedSections.some(function(s){return s.page+'/'+s.anchor===button.getAttribute('data-direct-bookmark');});button.setAttribute('aria-pressed',String(on));button.setAttribute('aria-label',(on?'Remove saved section: ':'Save section: ')+button.getAttribute('data-bookmark-title'));});}
  function directBookmark(page,heading){var button=document.createElement('button');button.type='button';button.className='direct-bookmark';button.setAttribute('data-direct-bookmark',page+'/'+heading.id);button.setAttribute('data-bookmark-title',heading.textContent);button.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';button.onclick=function(e){e.stopPropagation();var index=savedSections.findIndex(function(s){return s.page===page && s.anchor===heading.id;});if(index>=0)removeStoredBookmark(index);else savedSections.push({page:page,anchor:heading.id,title:button.getAttribute('data-bookmark-title')});writeLocal('mu_saved_sections',savedSections);renderSaved();renderMove();};return button;}
  document.querySelectorAll('.reading-article h2').forEach(function(heading){if(!heading.closest('.contact')){heading.classList.add('bookmark-heading');heading.appendChild(directBookmark(heading.closest('.page').id,heading));}});updateDirectBookmarks();
  // A persistent saved collection; the badge counts bookmarks, not unread messages.
  var savedFab=document.createElement('button');savedFab.type='button';savedFab.className='saved-fab';savedFab.setAttribute('aria-haspopup','dialog');savedFab.setAttribute('aria-controls','saved-tray');savedFab.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg><span>Saved</span><span class="saved-count" aria-hidden="true">0</span>';document.body.appendChild(savedFab);
  var savedTray=document.createElement('dialog');savedTray.id='saved-tray';savedTray.className='saved-tray';savedTray.setAttribute('aria-labelledby','saved-tray-title');document.body.appendChild(savedTray);
  var savedTrayOverflow='',savedNotice=document.createElement('span');savedNotice.className='saved-announcement';savedNotice.setAttribute('role','status');document.body.appendChild(savedNotice);var previousSavedCount=savedSections.length;
  function closeSavedTray(after,fromHistory){if(!savedTray.open){if(typeof after==='function')after();return;}savedTray.close();document.body.style.overflow=savedTrayOverflow;savedFab.setAttribute('aria-expanded','false');savedFab.focus({preventScroll:true});finishSheetClose('saved',after,fromHistory);}
  function updateSavedTray(){
    if(!savedFab)return;var count=savedSections.length;savedFab.querySelector('.saved-count').textContent=count;savedFab.classList.toggle('is-empty',count===0);savedFab.setAttribute('aria-label','Open saved sections, '+count+' saved');
    if(previousSavedCount!==count){savedNotice.textContent=count+' '+(count===1?'section':'sections')+' saved.';previousSavedCount=count;}
    if(!savedTray.open)return;
    savedTray.innerHTML='<div class="saved-tray-head"><div><p>Your reading collection</p><h2 id="saved-tray-title">Saved sections <span>'+count+'</span></h2></div><button type="button" class="saved-tray-close" aria-label="Close saved sections">×</button></div><div class="saved-tray-body">'+(count?savedSections.map(function(item,index){return {item:item,index:index};}).reverse().map(function(row){var item=row.item;return '<article class="saved-tray-item"><a data-saved-open="'+row.index+'" href="'+pageHref(item.page,item.anchor)+'"><small>'+esc(mobileLabels[item.page])+'</small><strong>'+esc(item.title)+'</strong><span>Read section →</span></a><button type="button" data-tray-remove="'+row.index+'" aria-label="Remove '+esc(item.title)+' from saved sections">Remove</button></article>';}).join(''):'<div class="saved-tray-empty"><strong>Keep useful answers close.</strong><p>Tap the <b>bookmark beside a section title</b>. Your saved titles will appear here.</p></div>')+'</div><p class="saved-tray-note">Saved in this browser on this device.</p>';
    savedTray.querySelector('.saved-tray-close').onclick=function(){closeSavedTray();};
    savedTray.querySelectorAll('[data-tray-remove]').forEach(function(button){button.onclick=function(){removeStoredBookmark(Number(button.getAttribute('data-tray-remove')));writeLocal('mu_saved_sections',savedSections);renderSaved();renderMove();savedTray.querySelector('.saved-tray-close').focus({preventScroll:true});};});
    savedTray.querySelectorAll('[data-saved-open]').forEach(function(link){link.onclick=function(e){var item=savedSections[Number(link.getAttribute('data-saved-open'))];if(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)return;e.preventDefault();var href=link.getAttribute('href');closeSavedTray(function(){if(window.innerWidth>640){location.href=href;return;}var section=document.getElementById(item.page),heading=section && section.querySelector('[id="'+item.anchor+'"]');if(heading)openReader(section,heading,savedFab);else location.href='./'+FILES[item.page]+'?reader=1#'+item.anchor;});};});
  }
  function openSavedTray(fromHistory){savedTrayOverflow=document.body.style.overflow;document.body.style.overflow='hidden';savedTray.showModal();if(!fromHistory)pushSheet('saved');savedFab.setAttribute('aria-expanded','true');updateSavedTray();savedTray.querySelector('.saved-tray-close').focus({preventScroll:true});}
  savedFab.onclick=function(){openSavedTray(false);};
  savedTray.addEventListener('cancel',function(e){e.preventDefault();closeSavedTray();});savedTray.addEventListener('click',function(e){if(e.target===savedTray){var r=savedTray.getBoundingClientRect();if(e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom)closeSavedTray();}});window.addEventListener('hashchange',function(){closeSavedTray(null,true);});updateSavedTray();

  var savedScrollY=window.pageYOffset;window.addEventListener('scroll',function(){var y=window.pageYOffset,delta=y-savedScrollY;if(Math.abs(delta)<12 && y>140)return;var reading=document.querySelector('.page.active [data-toc]');if(!reading || y<140 || delta<0)savedFab.classList.remove('is-compact');else if(delta>0)savedFab.classList.add('is-compact');savedScrollY=y;},{passive:true});savedFab.addEventListener('focus',function(){savedFab.classList.remove('is-compact');});window.addEventListener('hashchange',function(){savedFab.classList.remove('is-compact');savedScrollY=window.pageYOffset;});

  window.addEventListener('popstate',function(){var name=history.state && history.state.muSheet;if(name==='move'){if(!moveDialog.open)openMove(moveOpener,true);}else closeMove(null,true);if(name==='saved'){if(!savedTray.open)openSavedTray(true);}else closeSavedTray(null,true);var after=sheetAfterClose;sheetAfterClose=null;if(after)after();});

  document.querySelectorAll('[data-saved-toggle]').forEach(function(button){button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','saved-tray');button.removeAttribute('aria-expanded');button.onclick=function(){openSavedTray(false);};});

  // END YOUR MOVE
  route();
  if(window.innerWidth<=640 && /(?:^|[?&])reader=1(?:&|$)/.test(location.search)){var requested=document.querySelector('.page.active'),requestedHeading=requested && requested.querySelector('[id="'+location.hash.slice(1).replace(/[^a-z0-9-]/g,'')+'"]');if(requestedHeading && requestedHeading.tagName==='H2' && requested.querySelector('[data-toc]'))openReader(requested,requestedHeading,requested.querySelector('.toc-mobile summary'));}
  wireHover(document);
  render();
})();
