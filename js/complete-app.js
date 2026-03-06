
/* ── SITE-WIDE GATE ── same hash as admin panel, never plain text in source */
var SITE_HASH = 'ce5fe72586b7b07039f6bf9aa17657414c8380ecb6d1efe6832ac706c8ec2d68';
var SITE_SESSION_KEY = 'lumitya_auth';

async function _siteHash(str){
  var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(function(b){return b.toString(16).padStart(2,'0');}).join('');
}

/* Auto-unlock if session already verified in this tab */
(function(){
  try{
    if(sessionStorage.getItem(SITE_SESSION_KEY) === SITE_HASH){
      document.getElementById('siteGate').style.display = 'none';
    }
  }catch(e){}
})();

async function checkGate(){
  var btn = document.getElementById('gateBtn');
  var inp = document.getElementById('gateInput');
  var err = document.getElementById('gateErr');
  var pw = inp.value;
  if(!pw) return;
  btn.textContent = '⏳ Checking…';
  btn.disabled = true;
  var hash = await _siteHash(pw);
  if(hash === SITE_HASH){
    try{ sessionStorage.setItem(SITE_SESSION_KEY, SITE_HASH); }catch(e){}
    var gate = document.getElementById('siteGate');
    gate.style.transition = 'opacity .35s';
    gate.style.opacity = '0';
    setTimeout(function(){ gate.style.display = 'none'; }, 350);
  } else {
    err.style.display = 'block';
    inp.value = '';
    inp.style.borderColor = '#DC2626';
    inp.focus();
    setTimeout(function(){
      inp.style.borderColor = '#E5E9F5';
      err.style.display = 'none';
    }, 2000);
    btn.textContent = 'Enter →';
    btn.disabled = false;
  }
}

function toggleGatePw(){
  var inp = document.getElementById('gateInput');
  var icon = document.getElementById('eyeIcon');
  if(inp.type === 'password'){
    inp.type = 'text';
    icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>';
  } else {
    inp.type = 'password';
    icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }
}


/* ═════════════════════════ */



/* ═════════════════════════ */



/* ═════════════════════════ */



/* ═════════════════════════ */



/*
 * ══════════════════════════════════════════════════════════════
 *  SUPABASE CONFIGURATION
 *  Replace these 2 values from: Supabase Dashboard → Settings → API
 *  - SUPABASE_URL  = Project URL
 *  - SUPABASE_ANON = anon / public key
 *
 *  REQUIRED TABLES (run this SQL in Supabase SQL Editor):
 *
 *  CREATE TABLE providers (
 *    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 *  CREATE TABLE providers (
 *    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 *    name TEXT NOT NULL,
 *    title_en TEXT DEFAULT '',
 *    title_es TEXT DEFAULT '',
 *    categories TEXT[] DEFAULT '{}',
 *    city TEXT DEFAULT 'Guadalajara',
 *    neighbourhood TEXT DEFAULT '',
 *    rating NUMERIC DEFAULT 4.5,
 *    reviews INT DEFAULT 0,
 *    jobs INT DEFAULT 0,
 *    years_exp TEXT DEFAULT '',
 *    color TEXT DEFAULT '#2B4DB3',
 *    initials TEXT DEFAULT '',
 *    top_rated BOOLEAN DEFAULT false,
 *    tags_en TEXT[] DEFAULT '{}',
 *    tags_es TEXT[] DEFAULT '{}',
 *    provider_reviews JSONB DEFAULT '[]',
 *    created_at TIMESTAMPTZ DEFAULT now()
 *  );
 *
 *  CREATE TABLE submissions (
 *    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 *    type TEXT NOT NULL,
 *    data JSONB NOT NULL,
 *    created_at TIMESTAMPTZ DEFAULT now()
 *  );
 *
 *  -- Enable public read on providers, insert on submissions:
 *  ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
 *  ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
 *
 *  CREATE POLICY "Public read providers" ON providers FOR SELECT USING (true);
 *  CREATE POLICY "Admin insert providers" ON providers FOR INSERT WITH CHECK (true);
 *  CREATE POLICY "Admin delete providers" ON providers FOR DELETE USING (true);
 *  CREATE POLICY "Anyone can submit" ON submissions FOR INSERT WITH CHECK (true);
 *
 * ══════════════════════════════════════════════════════════════
 */
/* ── SUPABASE CONFIG ── */
var _u=['aHR0cHM6Ly9xeWxmdmFqaGlobHhycG16dHBvdQ==','LnN1cGFiYXNlLmNv'];
var _k=['c2JfcHVibGlzaGFibGVfaW9lOTdjTTlsSDZmenBFR25kZkVQd19wV0ZSdVpLWg=='];
var SUPABASE_URL  = atob(_u[0]) + atob(_u[1]);
var SUPABASE_ANON = atob(_k[0]);
var SB_READY = true;

/*
 * ── SUPABASE REST API (direct fetch, no supabase-js library) ──
 *
 * Per supabase.com/docs/reference/javascript/initializing:
 *   The publishable key (sb_publishable_...) is the correct browser key.
 *
 * Supabase PostgREST requires BOTH headers on every request:
 *   apikey        : <publishable_key>        ← identifies the project
 *   Authorization : Bearer <publishable_key> ← sets the RLS anon role
 *
 * THE BUG WE WERE HITTING: _sbHdr() was missing the Authorization header.
 * Without it, PostgREST cannot determine the role → returns 401 / no data.
 *
 * WHY NOT supabase-js:
 *   DataCloneError — the library uses a web worker internally and tries to
 *   postMessage() a Headers object, which is not structured-cloneable in
 *   older browser contexts. Direct fetch() has none of that complexity.
 *
 * FILE:// WARNING:
 *   Browsers block all cross-origin fetch from file:// pages (CORS policy).
 *   This file MUST be served via http:// or https://.
 *   → VS Code: install "Live Server" extension, right-click file → Open with Live Server
 *   → Or upload to any static host (Netlify, GitHub Pages, etc.)
 */

/* Show persistent bottom banner if opened via file:// */
(function(){
  if(window.location.protocol !== 'file:') return;
  var b = document.createElement('div');
  b.id = 'fileProtocolBanner';
  b.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#7C2D12;color:#fff;padding:13px 20px;font-family:sans-serif;font-size:.82rem;line-height:1.55;display:flex;align-items:flex-start;gap:12px;box-shadow:0 -4px 20px rgba(0,0,0,.3)';
  b.innerHTML = '<span style="font-size:1.3rem;flex-shrink:0;margin-top:1px">🚫</span>'
    + '<span><strong>Supabase cannot connect — file:// protocol detected.</strong><br>'
    + 'Browsers block all network requests from local files. '
    + '<strong>Fix: serve this file via a web server.</strong><br>'
    + 'VS Code → install <em>Live Server</em> extension → right-click this file → <em>"Open with Live Server"</em>.</span>'
    + '<button onclick="document.getElementById(\'fileProtocolBanner\').remove()" '
    + 'style="margin-left:auto;flex-shrink:0;background:rgba(255,255,255,.18);border:none;color:#fff;'
    + 'border-radius:6px;padding:5px 11px;cursor:pointer;font-size:.78rem">✕ Dismiss</button>';
  document.addEventListener('DOMContentLoaded', function(){ document.body.appendChild(b); });
})();

/* ── REST helpers ── */
function _sbHdr(overrides){
  var h = {
    'Content-Type'  : 'application/json',
    'apikey'        : SUPABASE_ANON,
    'Authorization' : 'Bearer ' + SUPABASE_ANON  /* required — sets anon RLS role */
  };
  if(overrides) Object.assign(h, overrides);
  return h;
}
function _sbUrl(table, qs){
  return SUPABASE_URL + '/rest/v1/' + table + (qs ? '?' + qs : '');
}
function _sbParse(r){
  return r.text().then(function(txt){
    var d; try{ d = txt ? JSON.parse(txt) : []; }catch(e){ d = txt; }
    if(!r.ok){
      var msg = (d&&d.message)||(d&&d.hint)||('HTTP '+r.status+': '+JSON.stringify(d));
      return {data:[], error:{message:msg, status:r.status}};
    }
    return {data: Array.isArray(d)?d:(d?[d]:[]), error:null};
  });
}
function _sbNetErr(e){
  if(window.location.protocol==='file:') return 'Blocked: file:// protocol — serve via a web server.';
  return e ? (e.message||String(e)) : 'Unknown network error';
}

function sbSelect(table, qs){
  return fetch(_sbUrl(table, qs||'select=*&order=created_at.asc'), {
    method:'GET', mode:'cors', headers:_sbHdr({'Prefer':'return=representation'})
  }).then(_sbParse).catch(function(e){ return {data:[], error:{message:_sbNetErr(e)}}; });
}
function sbInsert(table, rows){
  return fetch(_sbUrl(table), {
    method:'POST', mode:'cors',
    headers:_sbHdr({'Prefer':'return=representation'}),
    body: JSON.stringify(Array.isArray(rows)?rows:[rows])
  }).then(_sbParse).catch(function(e){ return {data:[], error:{message:_sbNetErr(e)}}; });
}
function sbDelete(table, id){
  return fetch(_sbUrl(table,'id=eq.'+id), {
    method:'DELETE', mode:'cors', headers:_sbHdr({'Prefer':'return=minimal'})
  }).then(function(r){ return {error:r.ok?null:{message:'Delete failed HTTP '+r.status}}; })
  .catch(function(e){ return {error:{message:_sbNetErr(e)}}; });
}
function sbDeleteAll(table){
  return fetch(_sbUrl(table,'id=neq.0'), {
    method:'DELETE', mode:'cors', headers:_sbHdr({'Prefer':'return=minimal'})
  }).then(function(r){ return {error:r.ok?null:{message:'Delete all failed HTTP '+r.status}}; })
  .catch(function(e){ return {error:{message:_sbNetErr(e)}}; });
}

/* ── Admin panel connection tester ── */
function testSupabaseConnection(){
  var el = document.getElementById('sbTestResult');
  if(el){ el.innerHTML='⏳ Testing…'; el.style.color='var(--gr)'; }
  if(window.location.protocol==='file:'){
    if(el){ el.innerHTML='🚫 <strong>Blocked — file:// protocol.</strong> Use VS Code Live Server.'; el.style.color='var(--rd)'; }
    return;
  }
  var t0 = Date.now();
  fetch(_sbUrl('providers','select=id&limit=1'), {
    method:'GET', mode:'cors', headers:_sbHdr({'Prefer':'return=representation'})
  })
  .then(function(r){
    var ms = Date.now()-t0;
    return r.text().then(function(txt){
      var rows=[]; try{rows=JSON.parse(txt);}catch(e){}
      if(r.status===200){
        if(el){ el.innerHTML='✅ <strong>Connected</strong> · '+ms+'ms · '+rows.length+' row(s) · HTTP 200'; el.style.color='#16A34A'; }
      } else if(r.status===401||r.status===403){
        if(el){ el.innerHTML='🔑 <strong>Auth error ('+r.status+')</strong> — Check RLS policies: Dashboard → Authentication → Policies. Need "Public read providers" SELECT policy.'; el.style.color='var(--rd)'; }
      } else if(r.status===404){
        if(el){ el.innerHTML='📋 <strong>Table missing (404)</strong> — Run the CREATE TABLE SQL in Supabase SQL Editor.'; el.style.color='var(--am)'; }
      } else {
        if(el){ el.innerHTML='⚠️ HTTP '+r.status+' — '+String(txt).slice(0,150); el.style.color='var(--rd)'; }
      }
    });
  })
  .catch(function(e){
    if(el){ el.innerHTML='❌ <strong>Failed to fetch</strong> — '+e.message; el.style.color='var(--rd)'; }
  });
}

/* ── CONFIG: Replace with your EmailJS credentials ── */
var EK='XTskJo1Oeud-CiX-p';
var ES='service_Lumitya';
var ET_M='template_vhj4i4m';
var ET_P='template_eytkw0n';
var TO='contact@lumitya.com';
try{ emailjs.init({publicKey:EK}); }catch(e){ console.warn('EmailJS init failed:',e); }

/* ── PAGE NAVIGATION ── */
function go(p){
  document.querySelectorAll('.page').forEach(function(e){e.classList.remove('active');});
  var pg=document.getElementById('page-'+p);
  if(pg) pg.classList.add('active');
  window.scrollTo({top:0,behavior:'auto'});
  document.getElementById('nvd').classList.toggle('on',p==='directory');
  document.getElementById('nvp').classList.toggle('on',p==='pricing');
}

/* ── MOBILE NAV ── */
function toggleMobNav(){
  var mn=document.getElementById('mobNav');
  var hb=document.getElementById('hbgBtn');
  if(!mn) return;
  mn.classList.toggle('open');
  if(hb) hb.classList.toggle('open');
  _syncScrollLock();
}
function closeMobNav(){
  var mn=document.getElementById('mobNav');
  if(!mn||!mn.classList.contains('open')) return;
  mn.classList.remove('open');
  var hb=document.getElementById('hbgBtn');
  if(hb) hb.classList.remove('open');
  _syncScrollLock();
}
function syncLangBtns(l){
  ['ben','bes','ben2','bes2','mben','mbes'].forEach(function(id){
    var el=document.getElementById(id);if(!el) return;
    var isEn=(id==='ben'||id==='ben2'||id==='mben');
    el.classList.toggle('on',l==='en'?isEn:!isEn);
  });
}

/* ── LANGUAGE ── */
var lang='en';
function applyTranslations(l){
  var t=T[l];if(!t) return;
  /* Update all [data-i18n] elements */
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    var key=el.getAttribute('data-i18n');
    if(t[key]!==undefined){
      /* Use innerHTML for keys that may contain HTML tags */
      el.innerHTML=t[key];
    }
  });
  /* Nav buttons */
  var nvd=document.getElementById('nvd');if(nvd) nvd.innerHTML='&#128269; '+(l==='es'?t.n_dir:'Find Providers');
  var nvp=document.getElementById('nvp');if(nvp) nvp.textContent=l==='es'?t.n_price:'For Contractors';
  var mobNvd=document.getElementById('mob-nvd');if(mobNvd) mobNvd.innerHTML='&#128269; '+t.n_dir;
  var mobNvp=document.getElementById('mob-nvp');if(mobNvp) mobNvp.textContent=t.n_price;
  var mobNsup=document.getElementById('mob-nsup');if(mobNsup) mobNsup.innerHTML='&#129521; '+t.n_join;
  /* Mobile language label */
  document.querySelectorAll('[data-i18n-mob-lang]').forEach(function(el){el.textContent=l==='es'?'Idioma':'Language';});
  /* Alert banner */
  var ab=document.getElementById('ab');
  if(ab){
    var abx=ab.querySelector('.abx');
    ab.innerHTML='<strong>'+t.ab_b+'</strong>'+t.ab_t;
    var btn=document.createElement('button');
    btn.className='abx';btn.innerHTML='&#10005;';btn.setAttribute('aria-label','Dismiss');
    btn.onclick=function(){document.getElementById('ab').style.display='none';};
    ab.appendChild(btn);
  }
  /* Hero section */
  var h1=document.querySelector('.hero h1');if(h1) h1.innerHTML=t.h_h1;
  var hs=document.querySelector('.hs');if(hs) hs.textContent=t.h_sub;
  var hdb=document.querySelector('.hd strong');if(hdb) hdb.textContent=t.hd_b;
  var hdt=document.querySelector('.hd');
  if(hdt){var txt=hdt.innerHTML.replace(/<strong>[^<]*<\/strong>/,'<strong>'+t.hd_b+'</strong>');hdt.innerHTML='<strong>'+t.hd_b+'</strong> '+t.hd_t;}
  var hbtn1=document.querySelector('.ha .bh');if(hbtn1) hbtn1.textContent=t.h_c1;
  var hbtn2=document.querySelector('.ha .bho');if(hbtn2) hbtn2.textContent=t.h_c2;
  /* Hero cards */
  var hcls=document.querySelectorAll('.hcl');var hcts=document.querySelectorAll('.hct');var hsss=document.querySelectorAll('.hss');
  if(hcls[0]) hcls[0].textContent=t.c1l;if(hcts[0]) hcts[0].textContent=t.c1t;if(hsss[0]) hsss[0].textContent=t.c1s;
  if(hcls[1]) hcls[1].textContent=t.c2l;if(hcts[1]) hcts[1].textContent=t.c2t;if(hsss[1]) hsss[1].textContent=t.c2s;
  if(hcls[2]) hcls[2].textContent=t.c3l;if(hcts[2]) hcts[2].textContent=t.c3t;if(hsss[2]) hsss[2].textContent=t.c3s;
  /* How it works */
  var hw=document.querySelector('.how');
  if(hw){
    var stg=hw.querySelector('.stg');if(stg) stg.textContent=t.hw_tag;
    var h2=hw.querySelector('h2');if(h2) h2.textContent=t.hw_h;
    var ss=hw.querySelector('.ss');if(ss) ss.textContent=t.hw_s;
    var steps=hw.querySelectorAll('.step');
    var sd=[[t.s1h,t.s1p],[t.s2h,t.s2p],[t.s3h,t.s3p]];
    steps.forEach(function(s,i){if(sd[i]){var h3=s.querySelector('h3');var p=s.querySelector('p');if(h3) h3.textContent=sd[i][0];if(p) p.textContent=sd[i][1];}});
  }
  /* Services */
  var svc=document.querySelector('.svc');
  if(svc){
    var stg=svc.querySelector('.stg');if(stg) stg.textContent=t.sv_tag;
    var h2=svc.querySelector('h2');if(h2) h2.textContent=t.sv_h;
    var ss=svc.querySelector('.ss');if(ss) ss.textContent=t.sv_s;
    var cards=svc.querySelectorAll('.sc');
    var sd=[[t.s1t,t.s1d],[t.s2t,t.s2d],[t.s3t,t.s3d],[t.s4t,t.s4d],[t.s5t,t.s5d],[t.s6t,t.s6d]];
    cards.forEach(function(c,i){if(sd[i]){var h3=c.querySelector('h3');var p=c.querySelector('p');if(h3) h3.textContent=sd[i][0];if(p) p.textContent=sd[i][1];}});
  }
  /* Platform section */
  var plat=document.querySelector('.plat');
  if(plat){
    var stg=plat.querySelector('.stg');if(stg) stg.textContent=t.pl_tag;
    var h2=plat.querySelector('h2');if(h2) h2.textContent=t.pl_h;
    var ss=plat.querySelector('.ss');if(ss) ss.textContent=t.pl_s;
    var pdsc=plat.querySelector('.pdsc');if(pdsc) pdsc.innerHTML=t.pl_d;
    var pits=plat.querySelectorAll('.pit');
    var pd=[[t.pi1t,t.pi1d],[t.pi2t,t.pi2d],[t.pi3t,t.pi3d],[t.pi4t,t.pi4d]];
    pits.forEach(function(p,i){if(pd[i]){var tn=p.querySelector('.pitn');var td=p.querySelector('.pidc');if(tn) tn.textContent=pd[i][0];if(td) td.textContent=pd[i][1];}});
  }
  /* For Suppliers/Contractors section */
  var fp=document.querySelector('.fp');
  if(fp){
    var stg=fp.querySelector('.stg');if(stg) stg.textContent=t.fp_tag;
    var h2=fp.querySelector('h2');if(h2) h2.textContent=t.fp_h;
    var fpp=fp.querySelector('.fpi > div > p');if(fpp) fpp.textContent=t.fp_s;
    var lis=fp.querySelectorAll('.bls li span:last-child');
    var bd=[t.b1,t.b2,t.b3,t.b4];
    lis.forEach(function(li,i){if(bd[i]) li.textContent=bd[i];});
    var btns=fp.querySelectorAll('.ha .bh,.fpi > div > div button');
    /* target the two action buttons specifically */
    var fpbtns=fp.querySelectorAll('button');
    fpbtns.forEach(function(b){
      if(b.getAttribute('onclick')&&b.getAttribute('onclick').indexOf('pricing')>-1) b.textContent=t.fp_plans;
      if(b.getAttribute('onclick')&&b.getAttribute('onclick').indexOf('Supplier')>-1) b.innerHTML='&#129521; '+t.fp_apply;
    });
    /* Provider card */
    var pvrl=fp.querySelector('.pvrl');if(pvrl) pvrl.textContent=t.pv_r;
    var pvs=fp.querySelectorAll('.pvsl');if(pvs[0]) pvs[0].textContent=t.pv_s1;if(pvs[1]) pvs[1].textContent=t.pv_s2;
    var bid=fp.querySelector('.bid');if(bid) bid.innerHTML='&#129434; '+t.pv_id;
    var pvsi=fp.querySelector('.pvh span[style]');if(pvsi) pvsi.textContent=t.pv_since;
    var pvdn=fp.querySelector('.pvdn');if(pvdn) pvdn.textContent=t.pv_dn;
  }
  /* Local/Cities section */
  var local=document.querySelector('.local');
  if(local){
    var stg=local.querySelector('.stg');if(stg) stg.textContent=t.lo_tag;
    var h2=local.querySelector('h2');if(h2) h2.textContent=t.lo_h;
    var lp=local.querySelector('p');if(lp) lp.textContent=t.lo_s;
    var lvbs=local.querySelectorAll('.ccb.lv');lvbs.forEach(function(b){b.textContent=t.lv;});
    var snbs=local.querySelectorAll('.ccb.sn2');snbs.forEach(function(b){b.textContent=t.sn;});
    var exb=local.querySelector('.expb strong');if(exb) exb.textContent=t.ex_b;
    var ext=local.querySelector('.expb span');if(ext) ext.textContent=t.ex_t;
  }
  /* CTA section */
  var cta=document.querySelector('.fcta');
  if(cta){
    var h2=cta.querySelector('h2');if(h2) h2.textContent=t.ct_h;
    var p=cta.querySelector('p');if(p) p.textContent=t.ct_s;
    var b=cta.querySelector('button');if(b) b.textContent=t.ct_b;
  }
  /* Footer */
  var ft=document.querySelector('footer');
  if(ft){
    var fab=ft.querySelector('.fab');if(fab) fab.textContent=t.ft_ab;
    var fln=ft.querySelector('.fln');if(fln) fln.textContent=t.ft_ln;
    var fhs=ft.querySelectorAll('h4');
    if(fhs[0]) fhs[0].textContent=t.ft_pl;
    if(fhs[1]) fhs[1].textContent=t.ft_lg;
    if(fhs[2]) fhs[2].textContent=t.ft_co;
    var fas=ft.querySelectorAll('ul li a');
    var ftl=[t.ft_hm,t.ft_lg?undefined:undefined,'','',t.ft_tc,t.ft_pp,t.ft_pa];
    /* Target by onclick */
    ft.querySelectorAll('ul li a').forEach(function(a){
      var oc=a.getAttribute('onclick')||'';
      if(oc.indexOf("'home'")>-1) a.textContent=t.ft_hm;
      else if(oc.indexOf("'directory'")>-1) a.textContent=t.n_dir;
      else if(oc.indexOf("'pricing'")>-1) a.textContent=t.ft_pl+' '+t.n_price;
      else if(oc.indexOf("'terms'")>-1&&oc.indexOf('fbt')===-1) a.textContent=t.ft_tc;
      else if(oc.indexOf("'privacy'")>-1&&oc.indexOf('fbt')===-1) a.textContent=t.ft_pp;
      else if(oc.indexOf("'pagree'")>-1) a.textContent=t.ft_pa;
    });
    var fbt=ft.querySelector('.fbt');
    if(fbt){
      var cr=fbt.querySelector('span:first-child');if(cr) cr.textContent=t.ft_cr;
      var tl=fbt.querySelector('a[onclick*="terms"]');if(tl) tl.textContent='Terms';
      var pl=fbt.querySelector('a[onclick*="privacy"]');if(pl) pl.textContent='Privacy';
    }
  }
  /* Pricing page */
  var ph=document.querySelector('.ph');
  if(ph){
    var h1=ph.querySelector('h1');if(h1) h1.textContent=t.pr_h1;
    var p=ph.querySelector('p');if(p) p.textContent=t.pr_sub;
  }
  /* Directory page */
  var ds=document.getElementById('dsearch');
  if(ds) ds.placeholder=l==='es'?'Buscar por nombre o servicio...':'Search by name or service...';
  /* html lang attribute */
  document.documentElement.lang=l;
}
function setLang(l){
  lang=l;
  /* Sync all lang buttons: desktop .nr, always-visible mobile switcher, mobile drawer */
  ['ben','bes','ben2','bes2','mben','mbes','mben2','mbes2'].forEach(function(id){
    var el=document.getElementById(id);if(!el) return;
    var isEn=(id==='ben'||id==='ben2'||id==='mben'||id==='mben2');
    el.classList.toggle('on',l==='en'?isEn:!isEn);
  });
  applyTranslations(l);
  renderDir();
}

/* ── COLONIES ── */
var COLS={
  Guadalajara:['Americana','Analco','Arcos Vallarta','Chapultepec','Chapalita','Ciudad del Sol','Col. Moderna','Del Fresno','Expiatorio','Huentitan el Alto','Jardines Alcalde','Jardines del Bosque','Ladron de Guevara','Lafayette','Lomas del Valle','Mezquitan Country','Miravalle','Oblatos','Patria','Providencia','San Andres','Santa Cecilia','Santa Tere','Sector Hidalgo','Sector Juarez','Sector Libertad','Tetlan','Vallarta Norte','Vallarta Poniente','Zona Centro','Otra'],
  Zapopan:['Andares','Arboledas','Bugambilias','Colinas de San Javier','Country Club','El Colli','El Palomar','Jardin Real','La Cima','La Estancia','Las Aguilas','Miramar','Monraz','Paseos del Sol','Pinar de la Calma','Plaza del Sol','Puerta de Hierro','Residencial Victoria','Santa Anita','Santa Margarita','Tesistan','Valle Real','Villa Universitaria','Zapopan Centro','Zona Rio','Otra']
};
function updCol(sid,cid){
  var city=document.getElementById(cid).value;
  var sel=document.getElementById(sid);
  if(!city){sel.innerHTML='<option value="" disabled selected>Select city first</option>';sel.disabled=true;return;}
  sel.disabled=false;
  sel.innerHTML='<option value="" disabled selected>Select neighbourhood</option>';
  (COLS[city]||[]).forEach(function(n){var o=document.createElement('option');o.value=n;o.textContent=n;sel.appendChild(o);});
}
// ---- TRANSLATIONS ----
var T={
en:{
  ab_b:'Lumitya is a digital listing & matching platform.',ab_t:' We connect homeowners with independent contractors. We do not supervise, guarantee, or endorse any work.',
  n_dir:'Find Providers',n_price:'For Contractors',n_join:'Join as Provider',n_match:'Get Matched',
  h_h1:'Connect With Home<br>Service Professionals.<br><em>Fast & Simple.</em>',
  h_sub:'Lumitya is a digital matching platform connecting homeowners with independent contractors in Guadalajara & Zapopan.',
  hd_b:'Platform notice:',hd_t:"Lumitya provides a listing and matching service only. We do not supervise, guarantee, or endorse any work.",
  h_c1:'Find a Professional',h_c2:'Browse Listings',
  c1l:'New Request',c1t:'Kitchen Renovation · Guadalajara',c1s:'3 providers matched',
  c2l:'Provider Listed',c2t:'Ing. Marco Torres — Architect',c2s:'ID Checked · 47 jobs listed',
  c3l:'Quote Received',c3t:'Roofing · MXN 42,000',c3s:'Review before deciding',
  hw_tag:'How It Works',hw_h:'Simple. Direct. Transparent.',hw_s:'Three steps to connect with an independent professional.',
  s1h:'Submit Your Request',s1p:'Tell us what you need, your area, and budget. Under 2 minutes.',
  s2h:'We Share Your Lead',s2p:'Your request is forwarded to 1–3 listed professionals in your area.',
  s3h:'You Decide & Hire',s3p:'Review profiles, compare quotes, and hire directly. Full control.',
  sv_tag:'Service Categories',sv_h:'Browse by Category',sv_s:'Independent professionals across the most common home service categories.',
  s1t:'Architecture & Design',s1d:'Architects and designers for new builds, additions, and redesigns.',
  s2t:'Plumbing',s2d:'Independent plumbers for installations, repairs, and drainage.',
  s3t:'Electrical',s3d:'Electricians for wiring, panels, lighting, and repairs.',
  s4t:'Roof & Waterproofing',s4d:'Roofing professionals for repair, installation, and waterproofing.',
  s5t:'Material Supply',s5d:'Suppliers of construction materials, hardware, and building products.',
  s6t:'Renovation & Remodeling',s6d:'Contractors for full-room or whole-home renovation projects.',
  pl_tag:'What Lumitya Is',pl_h:'A Digital Matching Platform — Nothing More.',
  pl_s:'We built Lumitya to make finding the right professional easier.',
  pl_d:'Lumitya does <strong>not</strong> employ, supervise, certify, or endorse any provider. All contractors are independent. Any agreement is directly between you and the provider.',
  pi1t:'Digital Listing & Matching',pi1d:'We list independent contractors and route your request to relevant ones nearby.',
  pi2t:'Identity Check (INE / CURP)',pi2d:'We collect identity documents for listing purposes only. NOT professional license verification.',
  pi3t:'User Reviews',pi3d:'Reviews reflect user opinions only. Lumitya does not guarantee their accuracy.',
  pi4t:'Your Agreement, Your Risk',pi4d:'Any contract or dispute is solely between you and the provider. Lumitya is not a party.',
  fp_tag:'For Contractors',fp_h:'List Your Services on Lumitya',
  fp_s:'Get your profile in front of homeowners in Guadalajara & Zapopan. Simple monthly subscription — no commission.',
  b1:'Profile listing visible to homeowners in your area',b2:'Receive leads directly — no middleman on the job',
  b3:'Flat monthly fee — zero commission on your work',b4:'You remain fully independent',
  fp_plans:'See Plans & Pricing',fp_apply:'Apply to Join',
  pv_r:'Independent Architect · Guadalajara',pv_s1:'Jobs Listed',pv_s2:'Avg. Rating',
  pv_id:'ID Checked',pv_since:'Listed since 2025',pv_dn:'Independent contractor. Not employed or supervised by Lumitya. Payment = listing visibility only.',
  lo_tag:'Where We Operate',lo_h:'Active in Guadalajara & Zapopan',
  lo_s:'We started here to build a focused, quality network before expanding.',
  lv:'✦ Active',sn:'⏳ Soon',ex_b:'Growing city by city.',ex_t:' Quality first. More Jalisco cities in 2026.',
  ct_h:'Need a Home Service Professional?',ct_s:"Submit your request in under 2 minutes. We'll connect you with listed professionals.",ct_b:'Submit a Request',
  ft_ab:'Digital platform. Guadalajara & Zapopan, Mexico.',
  ft_ln:'Technology platform only. We do not employ, supervise, or endorse contractors. All agreements are solely between homeowners and independent providers.',
  ft_pl:'Platform',ft_hm:'Home',ft_lg:'Legal',ft_tc:'Terms & Conditions',ft_pp:'Privacy Notice',ft_pa:'Provider Agreement',ft_co:'Contact',ft_cr:'© 2026 Lumitya. All rights reserved.',
  pr_h1:'Simple, Transparent Pricing',pr_sub:'Monthly subscription for listing visibility. No commissions. No guarantee of work.',
  pr_tag:'Contractor Plans',pr_h2:'Choose Your Plan',pr_nt:'Guadalajara & Zapopan market entry pricing. Listing access only.',
  pb1:'✦ Basic Plan',ph1:'Basic Listing',pmo:'/ month',
  pf1:'Profile listing on Lumitya directory',pf2:'Up to X leads per month (by area)',pf3:'Rating and review visibility',
  pf4:'Lead notifications via email & WhatsApp',pf5:'Identity-checked badge on profile',
  pn1:'Payment grants listing visibility only. No guarantee of leads, contracts, or revenue.',
  pc1:'Apply & Get Listed',pb2:'⏳ Coming Soon',ph2:'Premium Listing',
  pp1:'Priority placement in search results',pp2:'More leads per month',pp3:'Highlighted profile card',
  pp4:'Everything in Basic',pp5:'Early access to new features',
  pn2:'Premium plan launching soon. Join Basic now and upgrade when available.',pc2:'Notify Me When Available',
  pg_b:'Important:',pg_t:'Fees are for listing access only. Lumitya does not guarantee leads or revenue. Non-refundable unless required by law.',
  proc_h:'How to Get Listed',
  ps1h:'Apply Online',ps1p:'Fill out the provider form with your details.',
  ps2h:'Submit Documents',ps2p:'INE, address proof, RFC (if business). Identity only — not license verification.',
  ps3h:'Pay Subscription',ps3p:'Receive a payment link once approved. Profile live after payment.',
  ps4h:'Receive Leads',ps4p:'Get notifications via email & WhatsApp. You close the deal directly.',
  di_h1:'Browse Listed Professionals',di_sub:'Independent contractors in Guadalajara & Zapopan.',
  di_dc:'⚠ Lumitya lists independent contractors. We do not supervise or guarantee their work. Always do your own due diligence before hiring.',
  di_all:'All Cities',ca_all:'All',di_rs:'listed providers',
  dn_h:'No providers found',dn_p:'Try adjusting your search or filters.',
  bk:'Back',tc_h1:'Terms and Conditions',tc_upd:'Last updated: March 2026',
  tc_w:'Please read these Terms carefully before using Lumitya. By accessing the platform you agree to these Terms.',
  tc1h:'Platform Nature',tc1p:'Lumitya is a digital intermediary platform. It does not provide services, supervise projects, guarantee results, or act as a party to user agreements.',
  tc2h:'Independent Contractors',tc2p:'Providers are independent third parties. Lumitya does not employ them, control their work, or verify professional licenses. Users must do their own due diligence.',
  tc3h:'No Liability',tc3p:'Lumitya is not liable for service quality, delays, damages, loss, disputes, injury, property damage, or fraud. Agreements are solely between the parties involved.',
  tc4h:'Reviews',tc4p:'Reviews must be genuine and lawful. Lumitya may remove content and is not responsible for user-generated content.',
  tc5h:'Disputes',tc5p:'Lumitya is not responsible for user disputes and has no obligation to mediate.',
  tc6h:'Platform Fees',tc6p:'Fees are for listing access only. They do not guarantee work or revenue.',
  tc7h:'Limitation of Liability',tc7p:"Lumitya's total liability shall not exceed amounts paid in the preceding 30 days.",
  tc8h:'Jurisdiction',tc8p:'Governed by Mexican law. Disputes go to courts of Guadalajara, Jalisco.',
  tc9h:'Modifications',tc9p:'Terms may be updated at any time. Continued use constitutes acceptance.',
  tc_c:'Questions? Contact: contacto@lumitya.com',
  pp_h1:'Privacy Notice',pp_upd:'Last updated: March 2026 · LFPDPPP Compliant',
  pp1h:'Responsible Party',pp1p:'Lumitya, Guadalajara, Jalisco, Mexico. Contact: contacto@lumitya.com',
  pp2h:'Personal Data Collected',pp2hw:'From Homeowners:',pp2h1:'Name, email address, phone number',
  pp2h2:'Location (city/area)',pp2h3:'Service request details',pp2cw:'From Contractors:',
  pp2c1:'Name, business name, contact information',pp2c2:'Service category and service area',
  pp2c3:'Identity documents (INE, CURP, RFC) — for listing purposes only, not license verification',
  pp2c4:'Billing information (if applicable)',
  pp3h:'Purpose of Processing',pp3p:'Data is used to connect users, facilitate communication, manage access, process payments, and improve performance. Lumitya does not sell personal data.',
  pp4h:'Data Transfer',pp4p:'Contact info may be shared between homeowners and selected providers. Not shared commercially.',
  pp5h:'ARCO Rights',pp5p:'Users may access, rectify, cancel, or oppose data. Email: contacto@lumitya.com',
  pp6h:'Data Security',pp6p:'Reasonable technical and administrative measures are in place. No platform is completely secure.',
  pp7h:'Cookies',pp7p:'Used for analytics and UX. Disable via browser settings.',
  pp8h:'Changes',pp8p:'This notice may be updated. Check this page for the latest version.',
  pa_h1:'Service Provider Agreement',pa_upd:'Last updated: March 2026',
  pa_w:'By applying to list on Lumitya, you agree to this agreement.',
  pa1h:'Independent Status',pa1p:'Provider is an independent contractor, not an employee of Lumitya. Lumitya does not supervise work or guarantee results.',
  pa2h:'Responsibility',pa2p:'Provider is responsible for their work, licenses, taxes, and compliance with all applicable laws.',
  pa3h:'Platform Fees',pa3p:'Monthly fees are non-refundable unless required by law. Payment = listing visibility only.',
  pa4h:'No Guarantee of Work',pa4p:'Lumitya does not guarantee leads, revenue, project value, or customer selection.',
  pa5h:'Indemnification',pa5p:'Provider indemnifies Lumitya from any claims, damages, or legal expenses arising from their services.',
  pa6h:'Reviews',pa6p:'Customers may leave reviews. Lumitya may publish or remove them at its sole discretion.',
  pa7h:'Termination',pa7p:'Lumitya may suspend or remove listings at its sole discretion without liability.',
  pa8h:'Jurisdiction',pa8p:'Disputes resolved in Guadalajara, Jalisco, Mexico.',
  pa_rd:'Ready to apply?',pa_rdt:'By submitting, you confirm you agree to this agreement.',
  mm_tg:'⚡ Free & Quick',mm_h:'Submit a Service Request',mm_s:"We'll share your request with 1–3 listed professionals.",
  mm_dn_b:'Note:',mm_dn:'Lumitya is a matching platform only. We do not supervise or guarantee any work.',
  merr:'⚠ Something went wrong. Please email contacto@lumitya.com',
  f_nm:'Full Name',f_ct:'City',f_col:'Neighbourhood',f_sv:'Service Needed',f_ds:'Project Description',
  f_bg:'Budget (approx.)',f_ug:'Timeline',f_ph:'Phone',f_em:'Email',
  sc:'Select city',cov:'Guadalajara & Zapopan only.',
  fn_t:'Private & secure.',ms_b:'Send Request →',ms_h:'Request Sent!',ms_p:'Listed providers will be in touch directly.',cl:'Close',
  pm_tg:'🔧 Apply to List',pm_h:'Apply as a Service Provider',pm_s:'Get listed in Guadalajara & Zapopan.',
  pm_s1:'Personal Information',f_bz:'Business Name',f_wb:'Website / Social',f_tm:'Team Size',
  pm_s2:'Service Categories',pm_s3:'Experience & Details',f_yr:'Years of Experience',
  yr0:'Less than 1 yr',yr1:'1–3 yrs',yr2:'3–5 yrs',yr3:'5–10 yrs',yr4:'10+ yrs',
  err_cat:'Select at least one category.',err_yr:'Select your experience level.',
  f_dsc:'Description of Services',f_zn:'Service Coverage',
  ag_b:'I confirm I am an independent service provider and fully responsible for my own services.',
  ag_t:' I understand Lumitya is a listing platform only, does not supervise my work, and does not guarantee leads or revenue. I agree to the ',
  ag_l:'Provider Agreement',ag_tc:'Terms & Conditions',
  err_ag:'You must confirm this before submitting.',
  fn_p:'Reviewed before publishing.',ps_b:'Submit Application →',ps_h:'Application Received!',
  ps_p:"We'll review your details and send a payment link within 48 hours. Profile goes live after payment.",
  cp_tg:'Contact',cp_s:'Your message goes directly to the provider.',
  cp_dn_b:'Reminder:',cp_dn:'Any agreement is directly with this independent provider. Lumitya is not a party.',
  cp_mg:'Message',cp_b:'Send Message →',cp_h:'Message Sent!',
  cp_p:'The provider will contact you directly. Always do your own due diligence before hiring.',
  prof_id:'ID Checked',prof_top:'Top Rated',prof_jobs:'Jobs',prof_revs:'Reviews',prof_contact:'Contact',prof_view:'View',
  err_ph:'Invalid phone number.',err_em:'Invalid email address.',
  nf_tg:'Premium Plan',nf_h:'Get Notified When Premium Launches',nf_s:'Leave your details and we\u2019ll reach out as soon as it\u2019s available.',
  nf_wa:'WhatsApp',nf_svc:'Service Type',nf_b:'Notify Me \u2192',nf_h2:'Registered!',nf_p:'We\u2019ll let you know when the Premium Plan is available.',
  apc_h:'How would you like to join Lumitya?',apc_s:'Choose the option that best describes your business.',
  apc_con:'Contractor',apc_con_d:'I provide home services like plumbing, electrical, roofing, renovation, painting, etc.',
  apc_sup:'Supplier',apc_sup_d:'I supply building materials like cement, steel, sand, concrete, hardware, etc.',
},
es:{
  ab_b:'Lumitya es una plataforma digital de listado y conexión.',ab_t:' Conectamos propietarios con contratistas independientes. No supervisamos ni garantizamos ningún trabajo.',
  n_dir:'Encontrar Proveedores',n_price:'Para Contratistas',n_join:'Únete como Proveedor',n_match:'Buscar Profesional',
  h_h1:'Conecta con Profesionales<br>de Servicios del Hogar.<br><em>Rápido y Simple.</em>',
  h_sub:'Lumitya es una plataforma digital que conecta propietarios con contratistas independientes en Guadalajara y Zapopan.',
  hd_b:'Aviso de plataforma:',hd_t:'Lumitya es un servicio de listado y conexión únicamente. No supervisamos, garantizamos ni respaldamos ningún trabajo.',
  h_c1:'Encontrar un Profesional',h_c2:'Ver Listados',
  c1l:'Nueva Solicitud',c1t:'Remodelación Cocina · GDL',c1s:'3 proveedores conectados',
  c2l:'Proveedor Listado',c2t:'Ing. Marco Torres — Arquitecto',c2s:'ID Verificado · 47 trabajos',
  c3l:'Cotización Recibida',c3t:'Techo · MXN 42,000',c3s:'Revisa antes de decidir',
  hw_tag:'Cómo Funciona',hw_h:'Simple. Directo. Transparente.',hw_s:'Tres pasos para conectar con un profesional independiente.',
  s1h:'Envía tu Solicitud',s1p:'Cuéntanos qué servicio necesitas, tu área y presupuesto.',
  s2h:'Compartimos tu Lead',s2p:'Tu solicitud se envía a 1–3 profesionales listados en tu área.',
  s3h:'Tú Decides y Contratas',s3p:'Revisa perfiles, compara cotizaciones y contrata directamente.',
  sv_tag:'Categorías de Servicio',sv_h:'Explorar por Categoría',sv_s:'Profesionales independientes en las categorías más comunes.',
  s1t:'Arquitectura y Diseño',s1d:'Arquitectos e interioristas para proyectos y remodelaciones.',
  s2t:'Plomería',s2d:'Plomeros independientes para instalaciones, reparaciones y drenaje.',
  s3t:'Electricidad',s3d:'Electricistas para cableado, tableros, iluminación y reparaciones.',
  s4t:'Techo e Impermeabilización',s4d:'Profesionales en techos para reparación e impermeabilización.',
  s5t:'Materiales de Construcción',s5d:'Proveedores de materiales y ferretería.',
  s6t:'Renovación y Remodelación',s6d:'Contratistas para renovación y remodelación de espacios.',
  pl_tag:'Qué es Lumitya',pl_h:'Una Plataforma de Conexión Digital — Nada Más.',
  pl_s:'Creamos Lumitya para facilitar encontrar al profesional correcto.',
  pl_d:'Lumitya <strong>no</strong> emplea, supervisa ni certifica a ningún proveedor. Son terceros independientes. Cualquier acuerdo es directamente entre tú y el proveedor.',
  pi1t:'Listado y Conexión Digital',pi1d:'Listamos contratistas independientes y enviamos tu solicitud a los más relevantes.',
  pi2t:'Verificación de Identidad (INE/CURP)',pi2d:'Documentos de identidad solo para el listado. NO es verificación de licencia profesional.',
  pi3t:'Reseñas de Usuarios',pi3d:'Reflejan opiniones de usuarios. Lumitya no garantiza su exactitud.',
  pi4t:'Tu Acuerdo, Tu Responsabilidad',pi4d:'Cualquier contrato o disputa es exclusivamente entre tú y el proveedor.',
  fp_tag:'Para Contratistas',fp_h:'Lista tus Servicios en Lumitya',
  fp_s:'Pon tu perfil frente a propietarios en Guadalajara y Zapopan. Suscripción mensual — sin comisiones.',
  b1:'Perfil visible para propietarios en tu área',b2:'Recibe leads directamente',
  b3:'Cuota mensual fija — sin comisión sobre tu trabajo',b4:'Permaneces completamente independiente',
  fp_plans:'Ver Planes y Precios',fp_apply:'Aplicar para Unirse',
  pv_r:'Arquitecto Independiente · Guadalajara',pv_s1:'Trabajos Listados',pv_s2:'Calif. Prom.',
  pv_id:'ID Verificado',pv_since:'Listado desde 2025',pv_dn:'Contratista independiente. No empleado ni supervisado por Lumitya.',
  lo_tag:'Dónde Operamos',lo_h:'Activos en Guadalajara y Zapopan',lo_s:'Empezamos aquí para construir una red de calidad.',
  lv:'✦ Activo',sn:'⏳ Pronto',ex_b:'Creciendo ciudad por ciudad.',ex_t:' Red de calidad primero. Más ciudades en 2026.',
  ct_h:'¿Necesitas un Profesional?',ct_s:'Envía tu solicitud en menos de 2 minutos.',ct_b:'Enviar Solicitud',
  ft_ab:'Plataforma digital. Guadalajara y Zapopan, México.',
  ft_ln:'Solo plataforma tecnológica. No empleamos ni supervisamos contratistas.',
  ft_pl:'Plataforma',ft_hm:'Inicio',ft_lg:'Legal',ft_tc:'Términos y Condiciones',ft_pp:'Aviso de Privacidad',ft_pa:'Acuerdo de Proveedor',ft_co:'Contacto',ft_cr:'© 2026 Lumitya. Todos los derechos reservados.',
  pr_h1:'Precios Simples y Transparentes',pr_sub:'Suscripción mensual para visibilidad. Sin comisiones. Sin garantía de trabajo.',
  pr_tag:'Planes para Contratistas',pr_h2:'Elige tu Plan',pr_nt:'Precios de entrada al mercado GDL/ZAP. Solo acceso al listado.',
  pb1:'✦ Plan Básico',ph1:'Listado Básico',pmo:'/ mes',
  pf1:'Perfil listado en el directorio',pf2:'Hasta X leads por mes (por área)',pf3:'Visibilidad de calificación y reseñas',
  pf4:'Notificaciones de leads por email y WhatsApp',pf5:'Insignia de identidad verificada',
  pn1:'El pago otorga visibilidad de listado únicamente. No garantiza leads ni ingresos.',
  pc1:'Aplicar y Listarme',pb2:'⏳ Próximamente',ph2:'Listado Premium',
  pp1:'Posicionamiento prioritario',pp2:'Más leads por mes',pp3:'Tarjeta de perfil destacada',
  pp4:'Todo lo del Plan Básico',pp5:'Acceso anticipado a nuevas funciones',
  pn2:'Plan Premium próximamente. Únete al Básico ahora.',pc2:'Notificarme cuando esté disponible',
  pg_b:'Importante:',pg_t:'Las cuotas son solo por acceso al listado. No garantizan leads ni ingresos. No reembolsables salvo que la ley lo exija.',
  proc_h:'Cómo Listarte',
  ps1h:'Aplica en Línea',ps1p:'Completa el formulario con tus datos.',
  ps2h:'Envía Documentos',ps2p:'INE, domicilio, RFC. Solo para identidad.',
  ps3h:'Paga tu Suscripción',ps3p:'Recibes enlace de pago. Perfil activo tras el pago.',
  ps4h:'Recibe Leads',ps4p:'Notificaciones por email y WhatsApp. Tú cierras el trato.',
  di_h1:'Explorar Profesionales Listados',di_sub:'Contratistas independientes en Guadalajara y Zapopan.',
  di_dc:'⚠ Lumitya lista contratistas independientes. No supervisamos ni garantizamos su trabajo.',
  di_all:'Todas las Ciudades',ca_all:'Todos',di_rs:'proveedores listados',
  dn_h:'No se encontraron proveedores',dn_p:'Ajusta tu búsqueda o filtros.',
  bk:'Volver',tc_h1:'Términos y Condiciones',tc_upd:'Última actualización: Marzo 2026',
  tc_w:'Lee estos Términos antes de usar Lumitya.',
  tc1h:'Naturaleza de la Plataforma',tc1p:'Lumitya es intermediaria digital. No presta servicios, no supervisa ni garantiza resultados.',
  tc2h:'Contratistas Independientes',tc2p:'Los proveedores son terceros independientes. Los usuarios deben hacer su propia investigación.',
  tc3h:'Sin Responsabilidad',tc3p:'Lumitya no es responsable por calidad, retrasos, daños, pérdidas o disputas.',
  tc4h:'Reseñas',tc4p:'Las reseñas deben ser genuinas. Lumitya puede eliminarlas a su discreción.',
  tc5h:'Disputas',tc5p:'Lumitya no es responsable de disputas y no tiene obligación de mediar.',
  tc6h:'Cuotas de Plataforma',tc6p:'Las cuotas son solo por acceso al listado. No garantizan trabajo ni ingresos.',
  tc7h:'Limitación de Responsabilidad',tc7p:'La responsabilidad de Lumitya no excederá lo pagado en los 30 días previos.',
  tc8h:'Jurisdicción',tc8p:'Rigen las leyes de México. Litigios en Guadalajara, Jalisco.',
  tc9h:'Modificaciones',tc9p:'Los Términos pueden actualizarse. El uso continuado implica aceptación.',
  tc_c:'¿Preguntas? Contacto: contacto@lumitya.com',
  pp_h1:'Aviso de Privacidad',pp_upd:'Última actualización: Marzo 2026 · LFPDPPP',
  pp1h:'Responsable',pp1p:'Lumitya, Guadalajara, Jalisco. contacto@lumitya.com',
  pp2h:'Datos Recopilados',pp2hw:'De Propietarios:',pp2h1:'Nombre, correo, teléfono',
  pp2h2:'Ubicación',pp2h3:'Detalles de solicitud',pp2cw:'De Contratistas:',
  pp2c1:'Nombre, empresa, contacto',pp2c2:'Categoría y área',
  pp2c3:'Documentos de identidad (INE, CURP, RFC) — solo para listado',pp2c4:'Datos de facturación (si aplica)',
  pp3h:'Finalidad',pp3p:'Conectar usuarios, facilitar comunicación y procesar pagos. Lumitya no vende datos personales.',
  pp4h:'Transferencia',pp4p:'Datos compartidos solo entre propietarios y proveedores seleccionados.',
  pp5h:'Derechos ARCO',pp5p:'Acceso, rectificación, cancelación u oposición. Email: contacto@lumitya.com',
  pp6h:'Seguridad',pp6p:'Medidas técnicas razonables. Ninguna plataforma es completamente segura.',
  pp7h:'Cookies',pp7p:'Para análisis y mejora de experiencia. Desactiva en tu navegador.',
  pp8h:'Cambios',pp8p:'Este aviso puede actualizarse. Consulta esta página.',
  pa_h1:'Acuerdo de Proveedor',pa_upd:'Última actualización: Marzo 2026',
  pa_w:'Al aplicar para listarte, aceptas este acuerdo.',
  pa1h:'Estatus Independiente',pa1p:'El proveedor es contratista independiente. Lumitya no supervisa ni garantiza resultados.',
  pa2h:'Responsabilidad',pa2p:'El proveedor es responsable de su trabajo, licencias, impuestos y cumplimiento.',
  pa3h:'Cuotas de Plataforma',pa3p:'No reembolsables salvo por ley. Pago = visibilidad de listado únicamente.',
  pa4h:'Sin Garantía de Trabajo',pa4p:'Lumitya no garantiza leads, ingresos ni valor de proyectos.',
  pa5h:'Indemnización',pa5p:'El proveedor indemniza a Lumitya por reclamaciones derivadas de sus servicios.',
  pa6h:'Reseñas',pa6p:'Los clientes pueden dejar reseñas. Lumitya puede publicarlas o eliminarlas.',
  pa7h:'Terminación',pa7p:'Lumitya puede suspender listados a su sola discreción.',
  pa8h:'Jurisdicción',pa8p:'Disputas en Guadalajara, Jalisco, México.',
  pa_rd:'¿Listo para aplicar?',pa_rdt:'Al enviar confirmas que aceptas este acuerdo.',
  mm_tg:'⚡ Gratis y Rápido',mm_h:'Envía una Solicitud de Servicio',mm_s:'Compartiremos tu solicitud con 1–3 profesionales listados.',
  mm_dn_b:'Nota:',mm_dn:'Lumitya es solo una plataforma de conexión. No supervisamos ni garantizamos ningún trabajo.',
  merr:'⚠ Algo salió mal. Escríbenos a contacto@lumitya.com',
  f_nm:'Nombre Completo',f_ct:'Ciudad',f_col:'Colonia',f_sv:'Servicio Necesario',f_ds:'Descripción del Proyecto',
  f_bg:'Presupuesto (aprox.)',f_ug:'Plazo',f_ph:'Teléfono',f_em:'Correo',
  sc:'Selecciona ciudad',cov:'Solo Guadalajara y Zapopan.',
  fn_t:'Privado y seguro.',ms_b:'Enviar Solicitud →',ms_h:'¡Solicitud Enviada!',ms_p:'Los proveedores listados se pondrán en contacto directamente.',cl:'Cerrar',
  pm_tg:'🔧 Aplica para Listarte',pm_h:'Aplica como Proveedor de Servicios',pm_s:'Lista tu perfil en Guadalajara y Zapopan.',
  pm_s1:'Información Personal',f_bz:'Nombre del Negocio',f_wb:'Sitio Web / Redes',f_tm:'Tamaño del Equipo',
  pm_s2:'Categorías de Servicio',pm_s3:'Experiencia y Detalles',f_yr:'Años de Experiencia',
  yr0:'Menos de 1 año',yr1:'1–3 años',yr2:'3–5 años',yr3:'5–10 años',yr4:'Más de 10 años',
  err_cat:'Selecciona al menos una categoría.',err_yr:'Selecciona tu nivel de experiencia.',
  f_dsc:'Descripción de tus Servicios',f_zn:'Zona de Servicio',
  ag_b:'Confirmo que soy proveedor independiente y soy totalmente responsable de mis propios servicios.',
  ag_t:' Entiendo que Lumitya es solo una plataforma de listado, no supervisa mi trabajo ni garantiza leads. Acepto el ',
  ag_l:'Acuerdo de Proveedor',ag_tc:'Términos y Condiciones',
  err_ag:'Debes confirmar esto antes de enviar.',
  fn_p:'Revisado antes de publicarse.',ps_b:'Enviar Solicitud →',ps_h:'¡Solicitud Recibida!',
  ps_p:'Revisaremos tus datos y enviaremos enlace de pago en 48 hrs. Perfil activo tras el pago.',
  cp_tg:'Contacto',cp_s:'Tu mensaje va directamente al proveedor.',
  cp_dn_b:'Recordatorio:',cp_dn:'Cualquier acuerdo es directamente con este proveedor independiente.',
  cp_mg:'Mensaje',cp_b:'Enviar Mensaje →',cp_h:'¡Mensaje Enviado!',
  cp_p:'El proveedor te contactará directamente. Realiza tu propia investigación antes de contratar.',
  prof_id:'ID Verificado',prof_top:'Mejor Calificado',prof_jobs:'Trabajos',prof_revs:'Reseñas',prof_contact:'Contactar',prof_view:'Ver',
  err_ph:'Número de teléfono inválido.',err_em:'Correo electrónico inválido.',
  nf_tg:'Plan Premium',nf_h:'Recibe Notificación Cuando Esté Disponible',nf_s:'Deja tus datos y te contactaremos cuando esté disponible.',
  nf_wa:'WhatsApp',nf_svc:'Tipo de Servicio',nf_b:'Notificarme →',nf_h2:'¡Registrado!',nf_p:'Te avisaremos cuando el Plan Premium esté disponible.',
  apc_h:'¿Cómo te gustaría unirte a Lumitya?',apc_s:'Elige la opción que mejor describa tu negocio.',
  apc_con:'Contratista',apc_con_d:'Ofrezco servicios del hogar como plomería, electricidad, techos, renovación, pintura, etc.',
  apc_sup:'Proveedor',apc_sup_d:'Suministro materiales de construcción como cemento, acero, arena, concreto, ferretería, etc.',
}};

/* ── PROVIDERS DATA (Loaded from Supabase) ── */
var PD=[];

/* ── SUPABASE: Load providers from database ── */
function loadProvidersFromDB(){
  var g=document.getElementById('dgrid');
  if(!SB_READY){
    if(g) g.innerHTML='<div style="text-align:center;padding:60px 20px;color:var(--rd);font-size:.88rem"><div style="font-size:2rem;margin-bottom:12px">⚠️</div><strong style="display:block;margin-bottom:6px">Database not connected</strong><span style="color:var(--gr)">Supabase failed to initialize. Check console.</span></div>';
    return;
  }
  if(g) g.innerHTML='<div style="text-align:center;padding:60px 20px;color:var(--gr);font-size:.85rem"><div style="font-size:1.8rem;margin-bottom:10px">⏳</div>Loading providers...</div>';

  sbSelect('providers','select=*&order=created_at.asc').then(function(res){
    if(res.error){
      console.warn('Supabase read failed:', res.error.message);
      if(g) g.innerHTML='<div style="text-align:center;padding:60px 20px;color:var(--rd);font-size:.88rem"><div style="font-size:2rem;margin-bottom:12px">❌</div><strong style="display:block;margin-bottom:6px">Failed to load providers</strong><span style="color:var(--gr)">'+res.error.message+'</span></div>';
      return;
    }
    if(res.data && res.data.length > 0){
      PD=res.data.map(function(row){
        return {
          _sbId: row.id,
          id: row.id,
          name: row.name || '',
          title_en: row.title_en || '',
          title_es: row.title_es || '',
          categories: row.categories || [],
          city: row.city || 'Guadalajara',
          neighbourhood: row.neighbourhood || '',
          rating: parseFloat(row.rating) || 4.5,
          reviews: parseInt(row.reviews) || 0,
          jobs: parseInt(row.jobs) || 0,
          years_exp: row.years_exp || '',
          color: row.color || '#2B4DB3',
          initials: row.initials || '',
          top_rated: row.top_rated || false,
          tags_en: row.tags_en || [],
          tags_es: row.tags_es || [],
          provider_reviews_en: row.provider_reviews_en || [],
          provider_reviews_es: row.provider_reviews_es || []
        };
      });
    } else {
      PD=[];
    }
    renderDir();
  });
}

/* ── SUPABASE: Save a provider to database ── */
function saveProviderToDB(providerData){
  var row={
    name: providerData.name,
    title_en: providerData.title_en,
    title_es: providerData.title_es,
    categories: providerData.categories,
    city: providerData.city,
    neighbourhood: providerData.neighbourhood,
    rating: providerData.rating,
    reviews: providerData.reviews,
    jobs: providerData.jobs,
    years_exp: providerData.years_exp,
    color: providerData.color,
    initials: providerData.initials,
    top_rated: providerData.top_rated,
    tags_en: providerData.tags_en,
    tags_es: providerData.tags_es,
    provider_reviews_en: providerData.provider_reviews,
    provider_reviews_es: providerData.provider_reviews_es
  };
  return sbInsert('providers', row).then(function(res){
    if(res.error){ console.warn('Insert failed:', res.error.message); return; }
    if(res.data && res.data[0]) providerData._sbId=res.data[0].id;
  });
}

/* ── SUPABASE: Delete a provider from database ── */
function deleteProviderFromDB(sbId){
  if(!sbId) return Promise.resolve();
  return sbDelete('providers', sbId).then(function(res){
    if(res.error) console.warn('Delete failed:', res.error.message);
  });
}

/* ── SUPABASE: Save form submissions ── */
function saveSubmissionToDB(type, data){
  return sbInsert('submissions', {type:type, data:data}).then(function(res){
    if(res.error) console.warn('Submission save failed:', res.error.message);
  });
}

/* ── STAR RENDERER ── */
function strs(r,sm){
  var s=sm?'.63rem':'.76rem';
  var h='<span style="display:flex;gap:1px">';
  for(var i=1;i<=5;i++) h+='<span style="color:'+(r>=i?'#F59E0B':'#D1D5DB')+';font-size:'+s+'">&#9733;</span>';
  return h+'</span>';
}

/* ── DIRECTORY RENDER ── */
var actCat='';
function renderDir(){

  var q=(document.getElementById('dsearch')||{value:''}).value.toLowerCase();
  var cf=(document.getElementById('dcity')||{value:''}).value;

  var list=PD.filter(function(p){

    var isMat=(p.categories||[]).indexOf('Materials')>-1;

    if(dirTab==='suppliers' && !isMat) return false;
    if(dirTab==='contractors' && isMat) return false;

    var mc=!actCat||(p.categories||[]).indexOf(actCat)>-1;
    var mci=!cf||p.city===cf;

    var tgs=lang==='en'?p.tags_en:p.tags_es;

    var ms=!q ||
      (p.name||'').toLowerCase().includes(q) ||
      (tgs||[]).join(' ').toLowerCase().includes(q) ||
      (p.categories||[]).join(' ').toLowerCase().includes(q);

    return mc && mci && ms;
  });

  var g=document.getElementById('dgrid');
  var em=document.getElementById('dempty');
  var ct=document.getElementById('dcount');

  if(!g) return;

  if(ct) ct.innerHTML='<strong>'+list.length+'</strong> listed '+(dirTab==='suppliers'?'suppliers':'contractors');

  updateTabCounts();

  if(!list.length){
    g.innerHTML='';
    g.style.display='none';
    if(em) em.style.display='block';
    return;
  }

  g.style.display='';
  if(em) em.style.display='none';

  g.innerHTML=list.map(function(p){

    var ti=lang==='en'?p.title_en:p.title_es;
    var tags=lang==='en'?p.tags_en:p.tags_es;

    var reviews=p.provider_reviews||[];
    var r1=reviews[0]||{};
    var r2=reviews[1]||{};

    return '<div class="prf">'
      +'<div class="prft">'
        +'<div class="par">'
          +'<div class="pav" style="background:'+(p.color||'#2B4DB3')+'">'+(p.initials||'')+'</div>'
          +'<div class="pbc">'
            +'<div class="bidc">&#129434; ID Checked</div>'
            +(p.top_rated?'<div class="btop">&#11088; Top Rated</div>':'')
          +'</div>'
        +'</div>'

        +'<div class="pnm">'+(p.name||'')+'</div>'
        +'<div class="ptil">'+(ti||'')+'</div>'

        +'<div class="ptgs">'
          +((tags||[]).map(function(tg){
            return '<span class="ptg">'+tg+'</span>';
          }).join(''))
        +'</div>'

        +'<div class="ploc">&#128205; '+(p.neighbourhood||'')+', '+(p.city||'')+'</div>'

        +'<div class="str">'
          +strs(p.rating||0)
          +'<span class="stv">'+(p.rating?Number(p.rating).toFixed(1):'0')+'</span>'
          +'<span class="rco">('+(p.reviews||0)+' reviews)</span>'
        +'</div>'

        +'<div class="pst">'
          +'<div><div class="psv">'+(p.jobs||0)+'</div><div class="psl">Jobs</div></div>'
          +'<div><div class="psv">'+(p.reviews||0)+'</div><div class="psl">Reviews</div></div>'
          +'<div><div class="psv">'+(p.years_exp||0)+'yr</div><div class="psl">Exp.</div></div>'
        +'</div>'

      +'</div>'

      +'<div class="prvs">'

        +(r1.comment?
        '<div class="rvi">'
          +'<div class="rvh">'
            +'<span class="rva">'+(r1.user||'User')+'</span>'
            +'<div class="rvm">'
              +strs(r1.rating||0,true)
            +'</div>'
          +'</div>'
          +'<p class="rvt">'+(r1.comment||'')+'</p>'
        +'</div>'
        :'')

        +(r2.comment?
        '<div class="rvdv"></div>'
        +'<div class="rvi">'
          +'<div class="rvh">'
            +'<span class="rva">'+(r2.user||'User')+'</span>'
            +'<div class="rvm">'
              +strs(r2.rating||0,true)
            +'</div>'
          +'</div>'
          +'<p class="rvt">'+(r2.comment||'')+'</p>'
        +'</div>'
        :'')

      +'</div>'

      +'<div class="pf">'
        +'<button class="btc" onclick="openMatch(\''+(p.name||'').replace(/'/g,"\\'")+'\',' +(p.id||0)+ ')">'
        +(lang==='es'?'Contactar':'Contact')
        +'</button>'

        +'<button class="btv" disabled>'
        +(lang==='es'?'Próximamente':'Coming Soon')
        +'</button>'
      +'</div>'

    +'</div>';

  }).join('');
}
function setCat(el){
  document.querySelectorAll('.dch').forEach(function(c){c.classList.remove('on');});
  el.classList.add('on');
  actCat=el.getAttribute('data-cat');
  renderDir();
}

/* ── MATERIAL ROWS ── */
var MAT_PRESETS=[
  {n:'Cement (50kg bag)',u:'bag'},
  {n:'Mortar mix (Mortero)',u:'bag'},
  {n:'Steel rebar 3/8" (10mm)',u:'rod'},
  {n:'Steel rebar 1/2" (12mm)',u:'rod'},
  {n:'Concrete mix (ready mix)',u:'m3'},
  {n:'Concrete block (tabique)',u:'piece'},
  {n:'Sand (arena gruesa)',u:'m3'},
  {n:'Sand (arena fina)',u:'m3'},
  {n:'Gravel (grava)',u:'m3'},
  {n:'Brick (ladrillo rojo)',u:'piece'},
  {n:'Drywall board',u:'sheet'},
  {n:'PVC pipe 4"',u:'piece'},
  {n:'Roofing tile (teja)',u:'piece'}
];
var UNITS=['bag','m3','kg','ton','rod','sheet','piece','liter','box','roll'];
var matCount=0;

function initMatRows(){
  var rows=document.getElementById('matRows');
  if(!rows) return;
  rows.innerHTML='';matCount=0;
  var defaults=[
    {n:'Cement (50kg bag)',u:'bag'},
    {n:'Mortar mix (Mortero)',u:'bag'},
    {n:'Concrete mix (ready mix)',u:'m3'},
    {n:'Sand (arena gruesa)',u:'m3'},
    {n:'Steel rebar 3/8" (10mm)',u:'rod'}
  ];
  defaults.forEach(function(m){addMatRow(m.n,m.u,'');});
}

function addMatRow(name,unit,price){
  matCount++;
  var id=matCount;
  var container=document.getElementById('matRows');
  if(!container) return;
  var row=document.createElement('div');
  row.className='mat-row';row.id='mat-row-'+id;

  var matSel=document.createElement('select');
  matSel.id='mat-n-'+id;
  var blankOpt=document.createElement('option');
  blankOpt.value='';blankOpt.textContent='Select material...';
  matSel.appendChild(blankOpt);
  MAT_PRESETS.forEach(function(m){
    var o=document.createElement('option');
    o.value=m.n;o.textContent=m.n;
    if(name===m.n) o.selected=true;
    matSel.appendChild(o);
  });

  var unitSel=document.createElement('select');
  unitSel.id='mat-u-'+id;
  UNITS.forEach(function(u){
    var o=document.createElement('option');
    o.value=u;o.textContent=u;
    if(unit===u) o.selected=true;
    unitSel.appendChild(o);
  });

  var priceInp=document.createElement('input');
  priceInp.type='number';priceInp.id='mat-p-'+id;
  priceInp.placeholder='e.g. 185';priceInp.min='0';
  if(price) priceInp.value=price;

  var rmBtn=document.createElement('button');
  rmBtn.className='mat-rm';rmBtn.type='button';rmBtn.textContent='-';
  rmBtn.title='Remove';
  rmBtn.onclick=function(){var el=document.getElementById('mat-row-'+id);if(el)el.remove();};

  row.appendChild(matSel);row.appendChild(unitSel);row.appendChild(priceInp);row.appendChild(rmBtn);
  container.appendChild(row);
}

function getMaterials(){
  var mats=[];
  document.querySelectorAll('.mat-row').forEach(function(r){
    var id=r.id.replace('mat-row-','');
    var n=document.getElementById('mat-n-'+id);
    var u=document.getElementById('mat-u-'+id);
    var p=document.getElementById('mat-p-'+id);
    if(n&&p&&n.value&&p.value) mats.push(n.value+' ('+( u?u.value:'')+') : MXN '+p.value);
  });
  return mats;
}

/* ── DELIVERY ── */
var delChoice='';
function selDel(v){
  delChoice=v;
  document.getElementById('del-no').classList.toggle('sel',v==='no');
  document.getElementById('del-yes').classList.toggle('sel',v==='yes');
  document.getElementById('delDetails').style.display=v==='yes'?'block':'none';
  document.getElementById('delerr').style.display='none';
}

/* ── AGREEMENT CHECKBOX ── */
var agreed=false;
function tglAg(){
  agreed=!agreed;
  var chk=document.getElementById('agchk');
  if(chk){
    chk.classList.toggle('on',agreed);
    chk.innerHTML=agreed?'<svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4l3 3.5 6-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>':'';
  }
  var err=document.getElementById('agerr');
  if(err) err.style.display='none';
}

/* ── MODAL OPEN/CLOSE ── */
var _scrollLocked=false;
var _savedScrollY=0;
function _syncScrollLock(){
  var anyModal=!!document.querySelector('.mo.on');
  var mn=document.getElementById('mobNav');
  var mobOpen=mn&&mn.classList.contains('open');
  var need=anyModal||mobOpen;
  if(need&&!_scrollLocked){
    _scrollLocked=true;
    _savedScrollY=window.scrollY||window.pageYOffset||0;
    document.body.style.position='fixed';
    document.body.style.top='-'+_savedScrollY+'px';
    document.body.style.left='0';
    document.body.style.right='0';
    document.body.style.overflow='hidden';
  }else if(!need&&_scrollLocked){
    _scrollLocked=false;
    document.body.style.position='';
    document.body.style.top='';
    document.body.style.left='';
    document.body.style.right='';
    document.body.style.overflow='';
    window.scrollTo(0,_savedScrollY);
  }
}
function showModal(id){
  var m=document.getElementById(id);
  if(!m) return;
  m.classList.add('on');
  var d=m.querySelector('.md');
  if(d) d.scrollTop=0;
  _syncScrollLock();
}
function hideModal(id){
  var m=document.getElementById(id);
  if(!m) return;
  m.classList.remove('on');
  _syncScrollLock();
}

var _matchProvName='',_matchProvId=0;
function openMatch(provName,provId){
  _matchProvName=provName||'';_matchProvId=provId||0;
  showModal('matchMo');
}
function openProv(){
  showModal('provMo');
  setTimeout(() => {
    if(document.querySelectorAll('.mat-row').length===0) initMatRows();
  }, 0);
}
function openSupplier(){
  showModal('suppMo');
  setTimeout(() => {
    if(document.querySelectorAll('.mat-row').length===0) initMatRows();
  }, 0);
}
function openCont(nm){
  var t=document.getElementById('cpTitle');
  if(t) t.textContent=(lang==='es'?'Contactar a ':'Contact ')+nm;
  showModal('contactMo');
}
function closeMatch(){
  hideModal('matchMo');
  _matchProvName='';_matchProvId=0;
  setTimeout(function(){
    resetModal('mmbody','mmsuc','merr','mbtn');
    clearFields(['mnm','mcity','mcol','msvc','mds','mbg','mug','mph','mem']);
  },320);
}
function closeProv(){
  hideModal('provMo');
  setTimeout(function(){
    resetModal('pmbody','pmsuc','perr','pbtn');
    clearFields(['pnm','pbz','pph','pem','pcity','pcol','pwb','pzn','pdsc','delCostVal','delMaxKm','delMinOrd']);
    initMatRows();
    delChoice='';
    var dn=document.getElementById('del-no');if(dn) dn.classList.remove('sel');
    var dy=document.getElementById('del-yes');if(dy) dy.classList.remove('sel');
    var dd=document.getElementById('delDetails');if(dd) dd.style.display='none';
    var me=document.getElementById('materr');if(me) me.style.display='none';
    var de=document.getElementById('delerr');if(de) de.style.display='none';
    agreed=false;
    var chk=document.getElementById('agchk');if(chk){chk.classList.remove('on');chk.innerHTML='';}
    var ae=document.getElementById('agerr');if(ae) ae.style.display='none';
  },320);
}

function closeSupp(){
  hideModal('suppMo');
  setTimeout(function(){
    resetModal('smbody','smsuc','serr','sbtn');
    clearFields(['snm','sbz','sph','sem','scity','scol','swb','szn','sdsc','delCostVal','delMaxKm','delMinOrd']);
    initMatRows();
    delChoice='';
    var dn=document.getElementById('del-no');if(dn) dn.classList.remove('sel');
    var dy=document.getElementById('del-yes');if(dy) dy.classList.remove('sel');
    var dd=document.getElementById('delDetails');if(dd) dd.style.display='none';
    var me=document.getElementById('materr');if(me) me.style.display='none';
    var de=document.getElementById('delerr');if(de) de.style.display='none';
    suppAgreed=false;
    var chk=document.getElementById('sagchk');if(chk){chk.classList.remove('on');chk.innerHTML='';}
    var ae=document.getElementById('sagerr');if(ae) ae.style.display='none';
  },320);
}

/* ── SUPPLIER AGREEMENT ── */
var suppAgreed=false;
function tglSuppAg(){
  suppAgreed=!suppAgreed;
  var chk=document.getElementById('sagchk');
  if(chk){
    chk.classList.toggle('on',suppAgreed);
    chk.innerHTML=suppAgreed?'<svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4l3 3.5 6-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>':'';
  }
  var err=document.getElementById('sagerr');
  if(err) err.style.display='none';
}

/* ── SUBMIT: SUPPLIER APPLICATION ── */
async function submitSupp(){
  var nm=gv('snm'),bz=gv('sbz'),ph=gv('sph'),em=gv('sem'),ct=sv('scity'),col=sv('scol'),zn=sv('szn');
  var ok=validateForm([['snm',nm],['sbz',bz],['sph',ph],['sem',em],['scity',ct],['scol',col],['szn',zn]],['sph'],[{id:'sem',req:true}]);
  var mats=getMaterials();
  var materr=document.getElementById('materr');
  if(!mats.length){if(materr) materr.style.display='block';ok=false;}
  var delerr=document.getElementById('delerr');
  if(!delChoice){if(delerr) delerr.style.display='block';ok=false;}
  var sagerr=document.getElementById('sagerr');
  if(!suppAgreed){if(sagerr) sagerr.style.display='block';ok=false;}
  if(!ok) return;
  var delSummary='None (pickup only)';
  if(delChoice==='yes'){
    var ct2=sv('delCostType'),cv=gv('delCostVal'),km=gv('delMaxKm'),mo=gv('delMinOrd');
    delSummary='YES - '+ct2+' | '+cv+(km?' | Max '+km+'km':'')+(mo?' | Min order: '+mo:'');
  }
  var fullBody=[
    '=== NEW SUPPLIER APPLICATION ===',
    'Contact: '+nm,'Business: '+bz,'Phone: '+ph,'Email: '+em,
    'City: '+ct+' / '+col,'Coverage: '+zn,'Website: '+(gv('swb')||'N/A'),
    '','--- MATERIALS & PRICES ---',mats.join('\n'),
    '','--- DELIVERY ---',delSummary,
    '','--- NOTES ---',gv('sdsc')||'None'
  ].join('\n');
  var btn=document.getElementById('sbtn');
  var errEl=document.getElementById('serr');
  btn.classList.add('ld');btn.disabled=true;errEl.style.display='none';
  var params={name:nm,business:bz,phone:ph,email_from:em||'no-reply@lumitya.com',city:ct,neighbourhood:col,zone:zn,website:gv('swb'),materials:mats.join('\n'),delivery:delSummary,notes:gv('sdsc'),to_email:'contact@lumitya.com',subject:'New Supplier Application — '+(bz||nm),body:fullBody};
  try{
    await emailjs.send(ES,ET_P,params);
    document.getElementById('smbody').style.display='none';
    document.getElementById('smsuc').style.display='block';
    saveSubmissionToDB('supplier_applications',params);
  }catch(e){
    errEl.textContent='Something went wrong. Please email contact@lumitya.com';
    errEl.style.display='block';
    btn.classList.remove('ld');btn.disabled=false;
  }
}


function closeCont(){
  hideModal('contactMo');
  setTimeout(function(){resetModal('cpbody','cpsuc',null,'cpbtn');clearFields(['cpnm','cpph','cpem','cpmg']);},320);
}

/* ── DIRECTORY TABS (Contractors vs Suppliers) ── */
var dirTab='contractors';
function setDirTab(tab){
  dirTab=tab;
  document.getElementById('tabCon').classList.toggle('on',tab==='contractors');
  document.getElementById('tabSup').classList.toggle('on',tab==='suppliers');
  /* Update category chips visibility for context */
  var chipsEl=document.getElementById('catChips');
  if(tab==='suppliers'){
    chipsEl.style.display='none';
    actCat='';
    document.querySelectorAll('.dch').forEach(function(c){c.classList.remove('on');});
    document.querySelector('.dch[data-cat=""]').classList.add('on');
  } else {
    chipsEl.style.display='';
  }
  renderDir();
}
function updateTabCounts(){
  var conCount=PD.filter(function(p){return p.categories.indexOf('Materials')===-1;}).length;
  var supCount=PD.filter(function(p){return p.categories.indexOf('Materials')>-1;}).length;
  var ce=document.getElementById('tabConCnt');if(ce) ce.textContent=conCount+' listed';
  var se=document.getElementById('tabSupCnt');if(se) se.textContent=supCount+' listed';
}

/* ── APPLY CHOICE MODAL ── */
function openApplyChoice(){
  showModal('applyChoiceMo');
}
function closeApplyChoice(){
  hideModal('applyChoiceMo');
}

/* ── NOTIFY ME MODAL ── */
function openNotify(){
  showModal('notifyMo');
}
function closeNotify(){
  hideModal('notifyMo');
  setTimeout(function(){
    resetModal('nfbody','nfsuc','nferr','nfbtn');
    clearFields(['nfnm','nfph','nfem','nfwa','nfsvc']);
  },320);
}

/* ── SUBMIT NOTIFY FORM ── */
async function submitNotify(){
  var nm=gv('nfnm'),ph=gv('nfph'),em=gv('nfem'),wa=gv('nfwa'),svc=sv('nfsvc');
  if(!validateForm([['nfnm',nm],['nfph',ph],['nfem',em],['nfwa',wa],['nfsvc',svc]],['nfph','nfwa'],[{id:'nfem',req:true}])) return;
  var btn=document.getElementById('nfbtn');
  var errEl=document.getElementById('nferr');
  btn.classList.add('ld');btn.disabled=true;errEl.style.display='none';
  var body=[
    '=== PREMIUM PLAN NOTIFICATION REQUEST ===',
    'Name: '+nm,
    'Phone: '+ph,
    'Email: '+em,
    'WhatsApp: '+wa,
    'Service Type: '+svc
  ].join('\n');
  var params={name:nm,phone:ph,email_from:em||'no-reply@lumitya.com',whatsapp:wa,service_type:svc,to_email:'contact@lumitya.com',subject:'Premium Plan Notification Request — '+nm,body:body};
  try{
    await emailjs.send(ES,ET_M,params);
    document.getElementById('nfbody').style.display='none';
    document.getElementById('nfsuc').style.display='block';
    saveSubmissionToDB('notify_requests',params);
  }catch(e){
    errEl.textContent='Something went wrong. Please email contact@lumitya.com';
    errEl.style.display='block';
    btn.classList.remove('ld');btn.disabled=false;
  }
}
function resetModal(fb,fs,fe,btn){
  var b=document.getElementById(fb);if(b) b.style.display='';
  var s=document.getElementById(fs);if(s) s.style.display='none';
  if(fe){var e=document.getElementById(fe);if(e){e.style.display='none';e.textContent='';}}
  var bt=document.getElementById(btn);if(bt){bt.classList.remove('ld');bt.disabled=false;}
}
function clearFields(ids){
  ids.forEach(function(id){
    var el=document.getElementById(id);if(!el) return;
    el.classList.remove('er');
    if(el.tagName==='SELECT'){el.selectedIndex=0;}else{el.value='';}
    if(id==='mcol'||id==='pcol'){el.disabled=true;el.innerHTML='<option value="" disabled selected>Select city first</option>';}
  });
}
document.addEventListener('click',function(e){
  if(e.target.id==='matchMo') closeMatch();
  else if(e.target.id==='provMo') closeProv();
  else if(e.target.id==='suppMo') closeSupp();
  else if(e.target.id==='contactMo') closeCont();
  else if(e.target.id==='applyChoiceMo') closeApplyChoice();
  else if(e.target.id==='notifyMo') closeNotify();
});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeMatch();closeProv();closeSupp();closeCont();closeApplyChoice();closeNotify();var mn=document.getElementById('mobNav');if(mn&&mn.classList.contains('open'))toggleMobNav();}});

/* ── FIELD HELPERS ── */
function gv(id){var el=document.getElementById(id);return el?el.value.trim():'';}
function sv(id){var el=document.getElementById(id);return el?el.value:'';}
function mk(id,bad){var el=document.getElementById(id);if(el) el.classList.toggle('er',bad);}
function isValidPhone(v){var digits=v.replace(/[^0-9]/g,'');return digits.length===10;}
function isValidEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);}
function validate(fields){
  var ok=true;
  fields.forEach(function(f){mk(f[0],!f[1]);if(!f[1]) ok=false;});
  return ok;
}
function validateForm(fields, phones, emails){
  var ok=validate(fields);
  if(phones) phones.forEach(function(p){
    var v=gv(p);
    if(v&&!isValidPhone(v)){mk(p,true);ok=false;}
  });
  if(emails) emails.forEach(function(e){
    var v=gv(e.id);
    if(e.req){if(!v||!isValidEmail(v)){mk(e.id,true);ok=false;}}
    else{if(v&&!isValidEmail(v)){mk(e.id,true);ok=false;}}
  });
  return ok;
}

async function submitMatch(){
  var nm=gv('mnm'),ct=sv('mcity'),col=sv('mcol'),svc=sv('msvc'),ds=gv('mds'),ug=sv('mug'),ph=gv('mph'),em=gv('mem'),bg=sv('mbg');
  if(!validateForm([['mnm',nm],['mcity',ct],['mcol',col],['msvc',svc],['mds',ds],['mug',ug],['mph',ph]],['mph'],[{id:'mem',req:false}])) return;
  var btn=document.getElementById('mbtn');
  var errEl=document.getElementById('merr');
  btn.classList.add('ld');btn.disabled=true;errEl.style.display='none';

  /* ── Save to Supabase service_requests table ── */
  var row={
    customer_name: nm,
    customer_email: em||'',
    customer_phone: ph,
    service_category: svc,
    service_description: ds+(ug?'\nTimeline: '+ug:''),
    city: ct,
    neighbourhood: col,
    budget: bg||'',
    provider_id: _matchProvId||null,
    provider_name: _matchProvName||null,
    status: 'pending',
    preferred_date: ug||null
  };
  var res=await sbInsert('service_requests', row);
  if(res.error){
    errEl.textContent='Could not save request. Please email '+TO;
    errEl.style.display='block';
    btn.classList.remove('ld');btn.disabled=false;
    return;
  }

  /* ── Also send email notification (best-effort) ── */
  var provLabel=_matchProvName?_matchProvName+' (ID: '+_matchProvId+')':'';
  var body=[
    '=== NEW HOMEOWNER REQUEST ===',
    provLabel?'Service request for: '+provLabel:'',
    'Name: '+nm,'Phone: '+ph,'Email: '+(em||'N/A'),
    'City: '+ct+' / '+col,'Service: '+svc,'Timeline: '+ug,
    'Budget: '+(bg||'Not specified'),'','--- DESCRIPTION ---',ds
  ].filter(Boolean).join('\n');
  var subj=provLabel?'Service Request for '+provLabel+' — '+svc+' ('+ct+')':'New Homeowner Request — '+svc+' ('+ct+')';
  try{
    if(typeof emailjs!=='undefined') await emailjs.send(ES,ET_M,{name:nm,city:ct,neighbourhood:col,service:svc,description:ds,timeline:ug,phone:ph,budget:bg,email_from:em||'contact@lumitya.com',to_email:TO,subject:subj,body:body,provider_name:_matchProvName,provider_id:_matchProvId});
  }catch(ex){ console.warn('Email notification failed:',ex); }

  document.getElementById('mmbody').style.display='none';
  document.getElementById('mmsuc').style.display='block';
}

/* ── SUBMIT: CONTRACTOR APPLICATION ── */
async function submitProv(){
  var nm=gv('pnm'),bz=gv('pbz'),ph=gv('pph'),em=gv('pem'),ct=sv('pcity'),col=sv('pcol'),zn=sv('pzn'),dsc=gv('pdsc');
  var ok=validateForm([['pnm',nm],['pph',ph],['pem',em],['pcity',ct],['pcol',col],['pzn',zn],['pdsc',dsc]],['pph'],[{id:'pem',req:true}]);
  /* Check categories */
  var cats=[];
  document.querySelectorAll('#provMo .ck input:checked').forEach(function(c){cats.push(c.value);});
  var caterr=document.getElementById('caterr');
  if(!cats.length){if(caterr) caterr.style.display='block';ok=false;}
  /* Check years */
  var yrerr=document.getElementById('yrerr');
  if(!yrVal){if(yrerr) yrerr.style.display='block';ok=false;}
  /* Check agreement */
  var agerr=document.getElementById('agerr');
  if(!agreed){if(agerr) agerr.style.display='block';ok=false;}
  if(!ok) return;
  var fullBody=[
    '=== NEW CONTRACTOR APPLICATION ===',
    'Name: '+nm,'Business: '+(bz||'N/A'),'Phone: '+ph,'Email: '+em,
    'City: '+ct+' / '+col,'Coverage: '+zn,
    'Website: '+(gv('pwb')||'N/A'),'Team: '+(sv('ptm')||'N/A'),
    '','Categories: '+cats.join(', '),
    'Experience: '+yrVal,
    '','--- DESCRIPTION ---',dsc
  ].join('\n');
  var btn=document.getElementById('pbtn');
  var errEl=document.getElementById('perr');
  btn.classList.add('ld');btn.disabled=true;errEl.style.display='none';

  /* ── Save to Supabase contractor_applications table ── */
  var init=nm?nm.split(' ').slice(0,2).map(function(w){return (w[0]||'').toUpperCase();}).join(''):'';
  var row={
    name: nm,
    phone: ph,
    email: em,
    title_en: bz||'',
    title_es: '',
    categories: cats,
    city: ct,
    neighbourhood: col,
    years_exp: yrVal||'',
    color: '#2B4DB3',
    initials: init,
    tags_en: [],
    tags_es: [],
    description: dsc+(zn?'\nCoverage: '+zn:'')+(gv('pwb')?'\nWebsite: '+gv('pwb'):'')+(sv('ptm')?'\nTeam: '+sv('ptm'):''),
    status: 'pending'
  };
  var res=await sbInsert('contractor_applications', row);
  if(res.error){
    errEl.textContent='Could not save application. Please email contact@lumitya.com';
    errEl.style.display='block';
    btn.classList.remove('ld');btn.disabled=false;
    return;
  }

  /* ── Also send email notification (best-effort) ── */
  var params={name:nm,business:bz,phone:ph,email_from:em||'no-reply@lumitya.com',city:ct,neighbourhood:col,zone:zn,website:gv('pwb'),team:sv('ptm'),categories:cats.join(', '),experience:yrVal,description:dsc,to_email:'contact@lumitya.com',subject:'New Contractor Application — '+(bz||nm),body:fullBody};
  try{
    if(typeof emailjs!=='undefined') await emailjs.send(ES,ET_P,params);
  }catch(ex){ console.warn('Email notification failed:',ex); }

  document.getElementById('pmbody').style.display='none';
  document.getElementById('pmsuc').style.display='block';
}

/* ── SUBMIT: CONTACT PROVIDER ── */
async function submitCont(){
  var nm=gv('cpnm'),ph=gv('cpph'),mg=gv('cpmg');
  if(!validateForm([['cpnm',nm],['cpph',ph],['cpmg',mg]],['cpph'],[{id:'cpem',req:false}])) return;
  var btn=document.getElementById('cpbtn');
  btn.classList.add('ld');btn.disabled=true;
  try{
    var contBody='=== PROVIDER CONTACT MESSAGE ===\nFrom: '+nm+'\nPhone: '+ph+'\nEmail: '+(gv('cpem')||'N/A')+'\n\nMessage:\n'+mg;
    await emailjs.send(ES,ET_M,{name:nm,phone:ph,email_from:gv('cpem')||'no-reply@lumitya.com',message:mg,to_email:TO,subject:'New Message for Provider — from '+nm,body:contBody});
    document.getElementById('cpbody').style.display='none';
    document.getElementById('cpsuc').style.display='block';
    saveSubmissionToDB('contact_messages',{name:nm,phone:ph,email_from:gv('cpem'),message:mg,to_email:TO});
  }catch(e){
    btn.classList.remove('ld');btn.disabled=false;
  }
}

/* ── EXCEL IMPORT ── */
var importedRows=[];
function handleImpFile(inp){
  if(!inp.files||!inp.files[0]) return;
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var wb=XLSX.read(e.target.result,{type:'binary'});
      var ws=wb.Sheets[wb.SheetNames[0]];
      var data=XLSX.utils.sheet_to_json(ws,{defval:''});
      importedRows=data;
      renderImportPreview(data);
    }catch(err){alert('Could not read file. Please use the provided template.');}
  };
  reader.readAsBinaryString(inp.files[0]);
}
function renderImportPreview(data){
  var tbody=document.getElementById('impTbody');
  if(!tbody) return;
  tbody.innerHTML='';
  var valid=0;
  data.forEach(function(row,i){
    var ok=row.name&&row.title_en&&row.category&&row.city;
    if(ok) valid++;
    var tr=document.createElement('tr');
    tr.innerHTML='<td>'+(i+1)+'</td><td>'+(row.name||'<span class="imp-err">missing</span>')+'</td><td>'+(row.title_en||'')+'</td><td>'+(row.category||'')+'</td><td>'+(row.city||'')+'</td><td>'+(row.rating||'')+'</td><td>'+(ok?'<span class="imp-ok">&#10003; Ready</span>':'<span class="imp-err">&#9888; Missing fields</span>')+'</td>';
    tbody.appendChild(tr);
  });
  var pc=document.getElementById('impPreCount');
  if(pc) pc.textContent=valid+' of '+data.length+' rows ready to import';
  var pre=document.getElementById('impPre');
  if(pre) pre.style.display='block';
}
function applyImport(){
  if(!importedRows.length) return;
  var added=0;
  var promises=[];
  importedRows.forEach(function(r,i){
    if(!r.name||!r.category) return;
    var init=r.initials||(r.name?r.name.split(' ').slice(0,2).map(function(w){return (w[0]||'').toUpperCase();}).join(''):'??');
    var np={
      id:Date.now()+i,name:r.name,title_en:r.title_en||'',title_es:r.title_es||r.title_en||'',
      categories:r.category?[r.category]:[],city:r.city||'Guadalajara',neighbourhood:r.neighbourhood||'',
      rating:parseFloat(r.rating)||4.5,reviews:parseInt(r.reviews)||0,jobs:parseInt(r.jobs)||0,
      years_exp:String(r.years_exp||''),color:r.color||'#2B4DB3',initials:init,
      top_rated:r.top_rated==='true'||r.top_rated===true||r.top_rated==='1'||r.top_rated===1,
      tags_en:r.tags_en?String(r.tags_en).split(',').map(function(s){return s.trim();}):[],
      tags_es:r.tags_es?String(r.tags_es).split(',').map(function(s){return s.trim();}):[] ,
      provider_reviews:[
        {a:r.review1_author||'Client',s:parseInt(r.review1_stars)||5,d:String(r.review1_date||'2026'),te:String(r.review1_en||'Good service.'),ts:String(r.review1_es||'Buen servicio.')},
        {a:r.review2_author||'',s:parseInt(r.review2_stars)||5,d:String(r.review2_date||''),te:String(r.review2_en||''),ts:String(r.review2_es||'')}
      ]
    };
    PD.push(np);
    promises.push(saveProviderToDB(np));
    added++;
  });
  /* Wait for Supabase writes then refresh */
  Promise.all(promises).then(function(){
    renderDir();
    alert('Imported '+added+' providers successfully!'+(SB_READY?' (Saved to Supabase)':' (Local only — connect Supabase to persist)'));
    resetImport();
  }).catch(function(){
    renderDir();
    alert('Imported '+added+' providers locally. Some database writes may have failed.');
    resetImport();
  });
}
function resetImport(){
  importedRows=[];
  var pre=document.getElementById('impPre');if(pre) pre.style.display='none';
  var tb=document.getElementById('impTbody');if(tb) tb.innerHTML='';
  var fi=document.getElementById('impFile');if(fi) fi.value='';
}
function downloadTemplate(){
  if(typeof XLSX==='undefined'){alert('Excel library not loaded yet, please wait a moment.');return;}
  var header=['name','title_en','title_es','category','city','neighbourhood','rating','reviews','jobs','years_exp','color','initials','top_rated','tags_en','tags_es','review1_author','review1_stars','review1_date','review1_en','review1_es','review2_author','review2_stars','review2_date','review2_en','review2_es'];
  var example=[{name:'Example Provider',title_en:'Master Plumber',title_es:'Plomero Maestro',category:'Plumbing',city:'Guadalajara',neighbourhood:'Americana',rating:4.8,reviews:25,jobs:40,years_exp:'5-10',color:'#2B4DB3',initials:'EP',top_rated:false,tags_en:'Plumbing, Leak Repair',tags_es:'Plomeria, Fugas',review1_author:'Ana G.',review1_stars:5,review1_date:'Jan 2026',review1_en:'Great work.',review1_es:'Buen trabajo.',review2_author:'Luis M.',review2_stars:4,review2_date:'Dec 2025',review2_en:'Reliable.',review2_es:'Confiable.'}];
  var ws=XLSX.utils.json_to_sheet(example,{header:header});
  var wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Providers');
  XLSX.writeFile(wb,'lumitya_provider_template.xlsx');
}

/* ── PROVIDER FORM: CATEGORIES & YEARS ── */
function tglCk(el){
  var inp=el.querySelector('input[type=checkbox]');
  if(inp) inp.checked=!inp.checked;
  el.classList.toggle('sel',inp&&inp.checked);
  var err=document.getElementById('caterr');if(err) err.style.display='none';
}
var yrVal='';
function pickYr(el){
  document.querySelectorAll('.yc').forEach(function(e){e.classList.remove('sel');});
  el.classList.add('sel');
  yrVal=el.getAttribute('data-v');
  var err=document.getElementById('yrerr');if(err) err.style.display='none';
}

/* ── ADMIN PASSWORD PROTECTION (SHA-256 Encrypted) ── */
/*
 * The password is stored ONLY as a SHA-256 hash — the actual password
 * NEVER appears in the source code. To change the password:
 * 1. Open browser console on any page
 * 2. Run: crypto.subtle.digest('SHA-256', new TextEncoder().encode('YOUR_NEW_PASSWORD')).then(h => console.log([...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,'0')).join('')))
 * 3. Replace the ADMIN_HASH value below with the console output
 */
var ADMIN_HASH='ce5fe72586b7b07039f6bf9aa17657414c8380ecb6d1efe6832ac706c8ec2d68';

async function sha256(str){
  var buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(function(b){return b.toString(16).padStart(2,'0');}).join('');
}

async function unlockAdmin(){
  var pw=document.getElementById('adminPw').value;
  if(!pw) return;
  var hash=await sha256(pw);
  if(hash===ADMIN_HASH){
    document.getElementById('adminGate').style.display='none';
    document.getElementById('adminPanel').style.display='block';
    document.getElementById('adminPwErr').style.display='none';
    document.getElementById('adminPw').value='';
    updateDbStatus();
    refreshAdminTable();
  } else {
    document.getElementById('adminPwErr').style.display='block';
    document.getElementById('adminPw').value='';
    document.getElementById('adminPw').style.borderColor='var(--rd)';
    setTimeout(function(){document.getElementById('adminPw').style.borderColor='';},1500);
  }
}

function lockAdmin(){
  document.getElementById('adminPanel').style.display='none';
  document.getElementById('adminGate').style.display='block';
}

/* ── SUPABASE STATUS INDICATOR ── */
function updateDbStatus(){
  var el=document.getElementById('fbStatus');
  if(!el) return;
  var proj = SUPABASE_URL.replace('https://','').split('.')[0];
  el.style.cssText='padding:10px 16px;border-radius:8px 8px 0 0;font-size:.78rem;font-weight:600;display:flex;align-items:flex-start;gap:8px;background:#EFF6FF;border:1px solid #BFDBFE;color:var(--bl)';
  el.innerHTML='<span>⏳</span><span>Verifying connection to <strong>'+proj+'.supabase.co</strong>…</span>';
  /* Live test */
  fetch(SUPABASE_URL+'/rest/v1/providers?select=id&limit=1',{method:'GET',mode:'cors',headers:_sbHdr()})
  .then(function(r){
    if(r.status===200){
      el.style.cssText='padding:10px 16px;border-radius:8px 8px 0 0;font-size:.78rem;font-weight:600;display:flex;align-items:flex-start;gap:8px;background:#F0FDF4;border:1px solid #86EFAC;color:#16A34A';
      el.innerHTML='<span>✅</span><span>Connected to <strong>'+proj+'</strong> — REST API responding · HTTP 200</span>';
    } else if(r.status===401||r.status===403){
      el.style.cssText='padding:10px 16px;border-radius:8px 8px 0 0;font-size:.78rem;font-weight:600;display:flex;align-items:flex-start;gap:8px;background:#FEF2F2;border:1px solid #FECACA;color:var(--rd)';
      el.innerHTML='<span>🔑</span><span><strong>Auth error ('+r.status+')</strong> — API key rejected. Go to Supabase Dashboard → Settings → API and copy the correct anon key.</span>';
    } else if(r.status===404){
      el.style.cssText='padding:10px 16px;border-radius:8px 8px 0 0;font-size:.78rem;font-weight:600;display:flex;align-items:flex-start;gap:8px;background:#FFF7ED;border:1px solid #FDE68A;color:#92400E';
      el.innerHTML='<span>📋</span><span><strong>Table not found (404)</strong> — The <code>providers</code> table does not exist. Run the CREATE TABLE SQL in the Supabase SQL Editor.</span>';
    } else {
      el.style.cssText='padding:10px 16px;border-radius:8px 8px 0 0;font-size:.78rem;font-weight:600;display:flex;align-items:flex-start;gap:8px;background:#FFF7ED;border:1px solid #FDE68A;color:#92400E';
      el.innerHTML='<span>⚠️</span><span><strong>HTTP '+r.status+'</strong> — Unexpected response from Supabase.</span>';
    }
  })
  .catch(function(e){
    var isFile = window.location.protocol==='file:';
    el.style.cssText='padding:10px 16px;border-radius:8px 8px 0 0;font-size:.78rem;font-weight:600;display:flex;align-items:flex-start;gap:8px;background:#FEF2F2;border:1px solid #FECACA;color:var(--rd)';
    if(isFile){
      el.innerHTML='<span>🚫</span><span><strong>Blocked by browser (file:// protocol)</strong> — Browsers block cross-origin fetch from local files. <strong>Solution: open the file via a web server</strong> (e.g. VS Code Live Server, or upload to any hosting).</span>';
    } else {
      el.innerHTML='<span>❌</span><span><strong>Failed to fetch</strong> — Cannot reach Supabase. Most likely your <strong>project is paused</strong> (free tier). Go to <a href="https://supabase.com" target="_blank" style="color:var(--bl)">supabase.com</a> → your project → click <strong>Resume</strong>. Then reload this page.</span>';
    }
  });
}

/* ── ADMIN: Provider Management Table ── */
function refreshAdminTable(){
  var tbody=document.getElementById('adminTbody');
  var countEl=document.getElementById('adminProvCount');
  if(!tbody) return;
  tbody.innerHTML='';
  if(countEl) countEl.textContent=PD.length;
  PD.forEach(function(p,i){
    var tr=document.createElement('tr');
    tr.innerHTML='<td>'+(i+1)+'</td>'
      +'<td><strong>'+p.name+'</strong></td>'
      +'<td>'+p.title_en+'</td>'
      +'<td>'+(p.categories||[]).join(', ')+'</td>'
      +'<td>'+p.city+'</td>'
      +'<td>'+p.rating+'</td>'
      +'<td><button onclick="deleteProvider('+i+')" style="font-family:\'DM Sans\',sans-serif;font-size:.7rem;font-weight:600;color:#fff;background:var(--rd);border:none;border-radius:5px;padding:4px 10px;cursor:pointer;transition:all .15s">Delete</button></td>';
    tbody.appendChild(tr);
  });
}

function deleteProvider(index){
  var p=PD[index];
  if(!p) return;
  if(!confirm('Delete "'+p.name+'" from the directory? This cannot be undone.')) return;
  var sbId=p._sbId;
  PD.splice(index,1);
  if(sbId) deleteProviderFromDB(sbId);
  renderDir();
  refreshAdminTable();
}

function clearAllProviders(){
  if(!confirm('DELETE ALL '+PD.length+' providers? This cannot be undone!')) return;
  if(!confirm('Are you absolutely sure? All data will be permanently removed.')) return;
  sbDeleteAll('providers').then(function(res){
    if(res.error){ alert('Delete failed: '+res.error.message); return; }
    PD=[];
    renderDir();
    refreshAdminTable();
    alert('All providers deleted from Supabase.');
  });
}

/* ── INIT ── */
loadProvidersFromDB();


/* ═════════════════════════ */

