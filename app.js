/* Formation CSE — Destination Prévention — interactions communes */
(function(){
  // Barre de progression de lecture
  var progress = document.getElementById('progress');
  var nav = document.getElementById('nav');
  var btt = document.getElementById('btt');
  function onScroll(){
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? (h.scrollTop || document.body.scrollTop) / max * 100 : 0;
    if(progress) progress.style.width = p + '%';
    var y = window.scrollY || h.scrollTop;
    if(nav){ nav.classList.toggle('show', y > 420); }
    if(btt){ btt.classList.toggle('show', y > 600); }
    // lien actif
    var links = document.querySelectorAll('nav.bar .links a');
    var cur = '';
    document.querySelectorAll('section[id]').forEach(function(s){
      if(s.getBoundingClientRect().top < 140) cur = s.id;
    });
    links.forEach(function(a){
      a.classList.toggle('active', a.getAttribute('href') === '#' + cur);
    });
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('load', onScroll);

  // Apparition des sections
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
    }, {threshold:.08});
    document.querySelectorAll('section').forEach(function(s){ io.observe(s); });
  } else {
    document.querySelectorAll('section').forEach(function(s){ s.classList.add('in'); });
  }

  // Accordéons
  document.querySelectorAll('.acc > button').forEach(function(b){
    b.addEventListener('click', function(){
      var acc = b.parentElement;
      var body = acc.querySelector('.body');
      var open = acc.classList.toggle('open');
      body.style.maxHeight = open ? (body.querySelector('.inner').scrollHeight + 20) + 'px' : '0px';
    });
  });

  // Onglets segmentés (comparaisons)
  document.querySelectorAll('.seg').forEach(function(seg){
    var group = seg.getAttribute('data-group');
    seg.querySelectorAll('button').forEach(function(btn){
      btn.addEventListener('click', function(){
        var k = btn.getAttribute('data-k');
        seg.querySelectorAll('button').forEach(function(x){ x.classList.toggle('on', x===btn); });
        document.querySelectorAll('.panel[data-group="'+group+'"]').forEach(function(p){
          p.classList.toggle('show', p.getAttribute('data-k')===k);
        });
      });
    });
  });

  // Copie au clic (phrases-minute)
  var toast = document.getElementById('toast');
  function showToast(msg){
    if(!toast) return;
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function(){ toast.classList.remove('show'); }, 1800);
  }
  document.querySelectorAll('[data-copy]').forEach(function(el){
    el.addEventListener('click', function(){
      var txt = el.getAttribute('data-copy');
      if(navigator.clipboard){ navigator.clipboard.writeText(txt).then(function(){ showToast('Copié ✓'); }); }
      else { showToast('Copié ✓'); }
    });
  });

  // Retour en haut
  if(btt){ btt.addEventListener('click', function(){ window.scrollTo({top:0, behavior:'smooth'}); }); }

  // ---- Simulateur : heures de délégation (selon l'effectif) ----
  // Barème art. R2314-1
  var bareme = [
    {min:11,max:24,tit:1,h:10},
    {min:25,max:49,tit:2,h:10},
    {min:50,max:74,tit:4,h:18},
    {min:75,max:99,tit:5,h:19},
    {min:100,max:124,tit:6,h:21},
    {min:125,max:149,tit:7,h:21},
    {min:150,max:174,tit:8,h:21},
    {min:175,max:199,tit:9,h:21},
    {min:200,max:249,tit:10,h:22},
    {min:250,max:299,tit:11,h:22},
    {min:300,max:399,tit:11,h:22},
    {min:400,max:499,tit:12,h:22},
    {min:500,max:599,tit:13,h:24},
    {min:600,max:699,tit:14,h:24},
    {min:700,max:799,tit:14,h:24},
    {min:800,max:899,tit:15,h:24},
    {min:900,max:999,tit:16,h:24},
    {min:1000,max:1249,tit:17,h:24},
    {min:1250,max:1499,tit:18,h:24},
    {min:1500,max:1749,tit:20,h:26},
    {min:1750,max:1999,tit:21,h:26},
    {min:2000,max:2249,tit:22,h:26},
    {min:2250,max:2499,tit:23,h:26},
    {min:2500,max:2999,tit:24,h:26},
    {min:3000,max:3499,tit:25,h:26},
    {min:3500,max:3999,tit:26,h:27},
    {min:4000,max:4249,tit:26,h:28},
    {min:4250,max:4749,tit:27,h:28},
    {min:4750,max:4999,tit:28,h:28},
    {min:5000,max:5749,tit:29,h:29},
    {min:5750,max:5999,tit:30,h:29},
    {min:6000,max:6749,tit:31,h:29},
    {min:6750,max:6999,tit:31,h:30},
    {min:7000,max:7499,tit:32,h:30},
    {min:7500,max:7749,tit:32,h:31},
    {min:7750,max:8249,tit:32,h:32},
    {min:8250,max:8999,tit:33,h:32},
    {min:9000,max:9749,tit:34,h:33},
    {min:9750,max:9999,tit:35,h:34},
    {min:10000,max:Infinity,tit:35,h:34}
  ];
  var selDeleg = document.getElementById('sim-effectif');
  if(selDeleg){
    // remplir le select
    bareme.forEach(function(b,i){
      var o = document.createElement('option');
      o.value = i;
      o.textContent = b.max===Infinity ? (b.min + ' salariés et plus') : (b.min + ' à ' + b.max + ' salariés');
      selDeleg.appendChild(o);
    });
    function updDeleg(){
      var b = bareme[selDeleg.value|0];
      document.getElementById('sim-tit').textContent = b.tit;
      document.getElementById('sim-h').textContent = b.h + ' h';
      document.getElementById('sim-tot').textContent = (b.tit * b.h) + ' h';
      var rep = document.getElementById('sim-report');
      if(rep) rep.textContent = (b.h * 1.5) + ' h';
    }
    selDeleg.addEventListener('change', updDeleg);
    selDeleg.value = 2; updDeleg();
  }

  // ---- Simulateur : budget du CSE ----
  var inMasse = document.getElementById('sim-masse');
  var inEff = document.getElementById('sim-eff2');
  if(inMasse && inEff){
    function updBudget(){
      var m = parseFloat(String(inMasse.value).replace(/\s/g,'').replace(',','.')) || 0;
      var eff = parseInt(inEff.value,10) || 0;
      var taux = eff > 2000 ? 0.0022 : 0.0020;
      var fct = m * taux;
      document.getElementById('bud-taux').textContent = (taux*100).toFixed(2).replace('.',',') + ' %';
      document.getElementById('bud-fct').textContent = fct.toLocaleString('fr-FR',{maximumFractionDigits:0}) + ' €';
      document.getElementById('bud-mois').textContent = (fct/12).toLocaleString('fr-FR',{maximumFractionDigits:0}) + ' €';
    }
    inMasse.addEventListener('input', updBudget);
    inEff.addEventListener('input', updBudget);
    updBudget();
  }
})();

/* Bouton flottant "retour au sommaire" — présent sur toutes les fiches (sauf l'accueil) */
(function(){
  var p=location.pathname.split('/').pop();
  if(p===''||p==='index.html') return;
  var a=document.createElement('a');
  a.className='home-fab'; a.href='index.html'; a.setAttribute('aria-label','Retour au sommaire');
  a.innerHTML='<i class="fa-solid fa-house"></i><span>Sommaire</span>';
  document.body.appendChild(a);
})();
