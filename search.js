/* Formation CSE — moteur de recherche plein texte (page d'accueil) */
(function(){
  var input = document.getElementById('q');
  if(!input) return;
  var results = document.getElementById('sr-results');
  var meta = document.getElementById('sr-meta');
  var clearBtn = document.getElementById('sr-clear');
  var DATA = [];
  var ready = false;

  function norm(s){
    return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  }
  function deaccent(s){ return s.normalize('NFD').replace(/[̀-ͯ]/g,''); }

  // Chargement de l'index
  fetch('search-index.json').then(function(r){return r.json();}).then(function(j){
    DATA = j.map(function(d){
      return {
        page:d.page, title:d.title, kicker:d.kicker, id:d.id,
        heading:d.heading, text:d.text,
        nTitle:norm(d.title), nHeading:norm(d.heading), nText:norm(d.text)
      };
    });
    ready = true;
    if(input.value.trim()) run();
  }).catch(function(){
    if(meta) meta.textContent = "Index de recherche indisponible.";
  });

  function escapeHtml(s){
    return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});
  }

  // Extrait autour du premier mot trouvé, avec surlignage
  function snippet(item, tokens){
    var t = item.text, nt = item.nText;
    var pos = -1;
    for(var i=0;i<tokens.length;i++){ var p=nt.indexOf(tokens[i]); if(p>=0 && (pos<0||p<pos)) pos=p; }
    if(pos<0) pos=0;
    var start = Math.max(0, pos-60);
    var frag = t.slice(start, start+200);
    if(start>0) frag='…'+frag;
    if(start+200<t.length) frag=frag+'…';
    frag = escapeHtml(frag);
    // surlignage (sur la version non accentuée, on reporte sur l'affichage)
    tokens.forEach(function(tok){
      if(tok.length<2) return;
      var re = new RegExp('('+tok.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi');
      // surligne en tenant compte des accents : on remplace les correspondances normalisées
      frag = highlight(frag, tok);
    });
    return frag;
  }

  function highlight(html, tok){
    // surligne en ignorant les accents
    var plain = html.normalize('NFD').replace(/[̀-ͯ]/g,'');
    var out='', i=0; var tl=tok.length;
    // map index plain -> html : comme NFD ajoute des caractères, on reconstruit prudemment
    // approche simple : recherche insensible accents via parcours
    var lowerPlain = plain.toLowerCase();
    var htmlChars = html.split('');
    // construire correspondance position html <-> plain
    var map=[]; var pj=0;
    for(var hc=0; hc<html.length; hc++){
      var ch=html[hc].normalize('NFD').replace(/[̀-ͯ]/g,'');
      for(var k=0;k<ch.length;k++){ map[pj]=hc; pj++; }
    }
    var res=''; var last=0; var idx;
    var from=0;
    while((idx=lowerPlain.indexOf(tok, from))>=0){
      var hStart=map[idx], hEnd=(map[idx+tl-1]!=null?map[idx+tl-1]+1:html.length);
      res += html.slice(last, hStart) + '<mark>' + html.slice(hStart,hEnd) + '</mark>';
      last = hEnd; from = idx+tl;
    }
    res += html.slice(last);
    return res || html;
  }

  function run(){
    var qraw = input.value.trim();
    clearBtn.classList.toggle('show', qraw.length>0);
    if(!ready){ meta.textContent='Chargement de l\'index…'; return; }
    if(qraw.length<2){ results.innerHTML=''; meta.textContent=''; return; }
    var tokens = norm(qraw).split(/\s+/).filter(function(t){return t.length>=2;});
    if(!tokens.length){ results.innerHTML=''; meta.textContent=''; return; }

    var scored=[];
    DATA.forEach(function(it){
      var score=0, allHit=true;
      tokens.forEach(function(tok){
        var hit=0;
        if(it.nHeading.indexOf(tok)>=0) hit+=6;
        if(it.nTitle.indexOf(tok)>=0) hit+=4;
        var ti=it.nText.indexOf(tok);
        if(ti>=0) hit+=2;
        if(hit===0) allHit=false;
        score+=hit;
      });
      if(allHit && score>0) scored.push({it:it, score:score});
    });
    scored.sort(function(a,b){return b.score-a.score;});

    if(!scored.length){
      results.innerHTML='<div class="sr-empty">Aucun résultat pour « '+escapeHtml(qraw)+' ». Essayez un autre mot-clé (ex. : <b>heures</b>, <b>budget</b>, <b>expertise</b>, <b>harcèlement</b>, <b>entrave</b>).</div>';
      meta.textContent='0 résultat';
      return;
    }
    var top = scored.slice(0,12);
    meta.textContent = scored.length+' résultat'+(scored.length>1?'s':'')+(scored.length>12?' (12 affichés)':'');
    results.innerHTML = top.map(function(s){
      var it=s.it;
      return '<a class="sr-item" href="'+it.page+'#'+it.id+'">'+
        '<span class="sr-mod">'+escapeHtml(it.title)+'</span>'+
        '<span class="sr-h">'+escapeHtml(it.heading)+'</span>'+
        '<span class="sr-sn">'+snippet(it, tokens)+'</span>'+
      '</a>';
    }).join('');
  }

  input.addEventListener('input', run);
  input.addEventListener('keydown', function(e){
    if(e.key==='Enter'){ var first=results.querySelector('.sr-item'); if(first){ window.location.href=first.getAttribute('href'); } }
    if(e.key==='Escape'){ input.value=''; run(); }
  });
  clearBtn.addEventListener('click', function(){ input.value=''; run(); input.focus(); });
})();
