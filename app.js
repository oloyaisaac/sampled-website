import '@fontsource/italiana/latin-400.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/dm-mono/latin-400.css';
import '@fontsource/dm-mono/latin-500.css';

(() => {
  document.documentElement.classList.add('js');
  const canvas = document.getElementById('world');
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  const sections = [...document.querySelectorAll('.scene-section')];
  const railLinks = [...document.querySelectorAll('.rail-item')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0, height = 0, dpr = 1, scrollTarget = 0, scrollValue = 0, raf = 0;
  let seed = 417;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mix = (a, b, t) => a + (b-a)*t;
  const smooth = (a,b,x) => { const t=clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); };
  const palette = [
    { sky1:'#171b32',sky2:'#39425d',sky3:'#a77165',sun:'#ddad78',far:'#404354',mid:'#313343',near:'#222431',ground:'#292832' },
    { sky1:'#31364f',sky2:'#a77868',sky3:'#e0b27b',sun:'#f0c88b',far:'#6e5e5d',mid:'#604d4b',near:'#483e40',ground:'#453c3a' },
    { sky1:'#575067',sky2:'#ce9270',sky3:'#f0bd7e',sun:'#ffe0a1',far:'#795e59',mid:'#705044',near:'#55413b',ground:'#4b3d39' },
    { sky1:'#57485a',sky2:'#bd806b',sky3:'#e5a46f',sun:'#edb373',far:'#655254',mid:'#59484a',near:'#423b42',ground:'#39363d' },
    { sky1:'#272b3b',sky2:'#8c5e5c',sky3:'#d08c63',sun:'#e6a762',far:'#514550',mid:'#493c44',near:'#342f39',ground:'#2e2c34' }
  ];
  function resize(){
    width=innerWidth; height=innerHeight; dpr=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr);
    canvas.style.width=width+'px'; canvas.style.height=height+'px'; ctx.setTransform(dpr,0,0,dpr,0,0); draw();
  }
  function getColors(p){
    const i=Math.min(3,Math.floor(p)), t=p-i, a=palette[i], b=palette[i+1]; const c={};
    for(const k in a){ c[k]=mixColor(a[k],b[k],t); } return c;
  }
  function mixColor(a,b,t){
    const toRgb=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
    const x=toRgb(a),y=toRgb(b); return `rgb(${Math.round(mix(x[0],y[0],t))},${Math.round(mix(x[1],y[1],t))},${Math.round(mix(x[2],y[2],t))})`;
  }
  function poly(points,fill,stroke=null,line=1){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke()}}
  function ellipse(x,y,rx,ry,fill,stroke=null,line=1){ctx.beginPath();ctx.ellipse(x,y,Math.max(0,rx),Math.max(0,ry),0,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke()}}
  function roundedBuilding(x,y,w,h,color,roof=true){
    ctx.fillStyle=color;ctx.fillRect(x,y,w,h);
    if(roof){poly([[x-4,y+1],[x+w*.12,y-h*.05],[x+w*.42,y-h*.12],[x+w*.8,y-h*.04],[x+w+4,y+2]],color)}
    const rows=Math.max(1,Math.floor(h/32));
    for(let r=0;r<rows;r++)for(let c=0;c<Math.floor(w/22);c++){const wx=x+8+c*22,wy=y+10+r*28;if(wx+6<x+w-2&&wy+12<y+h){ctx.fillStyle='rgba(230,180,125,.24)';ctx.fillRect(wx,wy,5,10)}}
  }
  function cityLayer(yBase,scale,color,count,minW,maxW,maxH,seedOffset){
    seed=seedOffset;
    const total=width*1.55; let x=-width*.25;
    while(x<total){const w=(minW+random()*(maxW-minW))*scale;const h=(maxH*(.25+random()*.75))*scale;const bx=x+(random()*20-10)*scale;roundedBuilding(bx,yBase-h,w,h,color,random()>.12);x+=w*.78+8*scale;}
  }
  function drawSky(colors,p){
    const g=ctx.createLinearGradient(0,0,0,height);g.addColorStop(0,colors.sky1);g.addColorStop(.47,colors.sky2);g.addColorStop(.76,colors.sky3);g.addColorStop(1,colors.ground);ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
    const journey=clamp(p/4,0,1); const sunX=width*(.72-.44*journey), sunY=height*(.72-.38*Math.sin(journey*Math.PI)), r=Math.min(width,height)*(.075+.02*Math.sin(journey*Math.PI));
    const glow=ctx.createRadialGradient(sunX,sunY,1,sunX,sunY,r*3.8);glow.addColorStop(0,'rgba(250,205,143,.34)');glow.addColorStop(.32,'rgba(238,175,125,.12)');glow.addColorStop(1,'rgba(241,180,130,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
    ellipse(sunX,sunY,r,r,colors.sun);
    ctx.globalAlpha=.17;ellipse(sunX,sunY,r*1.38,r*1.38,null,'#ffe2af',1);ctx.globalAlpha=1;
    // fine horizon haze
    const haze=ctx.createLinearGradient(0,height*.43,0,height*.82);haze.addColorStop(0,'rgba(246,195,144,0)');haze.addColorStop(.7,'rgba(244,189,137,.1)');haze.addColorStop(1,'rgba(238,180,130,0)');ctx.fillStyle=haze;ctx.fillRect(0,height*.35,width,height*.5);
  }
  function drawDistantHills(colors){
    const y=height*.64;ctx.beginPath();ctx.moveTo(0,y);
    for(let x=0;x<=width+40;x+=40){const yy=y-Math.sin(x*.004+1)*height*.035-Math.cos(x*.009)*height*.012;ctx.lineTo(x,yy)}ctx.lineTo(width,height);ctx.lineTo(0,height);ctx.closePath();ctx.fillStyle=colors.far;ctx.fill();
    // aqueduct fragments on the horizon
    ctx.globalAlpha=.31;ctx.fillStyle='#dcc5a3';const base=y+height*.04;ctx.fillRect(width*.12,base-37,width*.24,4);ctx.fillRect(width*.12,base-16,width*.24,4);
    for(let i=0;i<6;i++){const x=width*(.13+i*.039);ctx.fillRect(x,base-36,3,38);ctx.beginPath();ctx.arc(x+8,base-15,8,Math.PI,0);ctx.lineWidth=2;ctx.strokeStyle='#dcc5a3';ctx.stroke()}ctx.globalAlpha=1;
  }
  function drawRooftops(colors,amount=1){
    const compact=width<560;
    ctx.globalAlpha=amount;cityLayer(height*(compact?.83:.78),compact?.83:1.1,colors.mid,18,38,102,height*(compact?.17:.25),901);cityLayer(height*(compact?.89:.84),compact?.68:.82,colors.near,20,40,104,height*(compact?.16:.22),3701);ctx.globalAlpha=1;
    // tiled rooftops, sparse warm windows
    seed=743;for(let i=0;i<45;i++){const x=random()*width,y=height*(.56+random()*.26);ctx.fillStyle=`rgba(220,157,103,${.16+random()*.2})`;ctx.fillRect(x,y,2+random()*4,3)}
  }
  function drawGate(colors,p){
    const center=width*.48+(p-.4)*width*.18, base=height*.92, gw=width*.57, gh=height*(width<560?.26:.73);
    // city wall mass
    poly([[0,base-gh*.64],[center-gw*.23,base-gh*.64],[center-gw*.19,base-gh*.77],[center-gw*.11,base-gh*.8],[center-gw*.02,base-gh*.74],[center+gw*.12,base-gh*.74],[center+gw*.17,base-gh*.8],[center+gw*.23,base-gh*.76],[width,base-gh*.74],[width,base],[0,base]],'#9a775d');
    poly([[0,base-gh*.64],[center-gw*.23,base-gh*.64],[center-gw*.19,base-gh*.77],[center-gw*.11,base-gh*.8],[center-gw*.02,base-gh*.74],[center+gw*.12,base-gh*.74],[center+gw*.17,base-gh*.8],[center+gw*.23,base-gh*.76],[width,base-gh*.74],[width,base-gh*.65],[center+gw*.23,base-gh*.69],[center+gw*.16,base-gh*.72],[center+gw*.11,base-gh*.67],[center-gw*.02,base-gh*.67],[center-gw*.11,base-gh*.73],[center-gw*.17,base-gh*.7],[center-gw*.23,base-gh*.57],[0,base-gh*.56]],'#bc9470');
    // gate shadow and arch
    const r=gw*.22, archY=base-gh*.68, archH=gh*.59;
    ctx.fillStyle='#493d42';ctx.beginPath();ctx.moveTo(center-r,base);ctx.lineTo(center-r,archY+archH*.38);ctx.ellipse(center,archY+archH*.38,r,archH*.38,0,Math.PI,0,false);ctx.lineTo(center+r,base);ctx.closePath();ctx.fill();
    const light=ctx.createLinearGradient(center,archY,center,base);light.addColorStop(0,'rgba(243,183,119,.35)');light.addColorStop(1,'rgba(246,183,111,.04)');ctx.fillStyle=light;ctx.fillRect(center-r+2,archY+archH*.36,r*2-4,base-(archY+archH*.36));
    // paving perspective converges into the arch
    const roadY=base-gh*.25;poly([[center-r*.35,roadY],[center+r*.35,roadY],[width*1.1,height],[width*-.1,height]],'#57484a');
    for(let i=1;i<7;i++){const t=i/7,y=roadY+(height-roadY)*t;ctx.strokeStyle=`rgba(226,190,148,${.15*(1-t)})`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(mix(center-r*.35,width*-.1,t),y);ctx.lineTo(mix(center+r*.35,width*1.1,t),y);ctx.stroke()}
    for(let j=-3;j<=3;j++){ctx.strokeStyle='rgba(226,190,148,.13)';ctx.beginPath();ctx.moveTo(center+j*10,roadY);ctx.lineTo(width*.5+j*width*.16,height);ctx.stroke()}
    // crenellations
    for(let x=0;x<width;x+=26){const top=base-gh*(.64+(Math.sin(x*.013)*.025));ctx.fillStyle='#c5a07b';ctx.fillRect(x,top-9,13,12)}
  }
  function drawColosseum(colors,p){
    const cx=width*.58+(p-2)*width*.07, cy=height*.58, rx=width*.38, ry=height*.26;
    // cast shadow and tiered elliptical body
    ellipse(cx,cy+ry*.9,rx*1.12,ry*.26,'rgba(23,19,25,.37)');
    const tiers=4, tierH=height*.095;
    for(let t=0;t<tiers;t++){
      const top=cy-ry+t*tierH*.8, spread=(1-t*.105);
      ctx.beginPath();ctx.ellipse(cx,top+height*.16,rx*spread,ry*spread*.49,0,Math.PI,0);ctx.lineTo(cx+rx*spread,top+height*.16+tierH);ctx.ellipse(cx,top+height*.16+tierH,rx*spread,ry*spread*.49,0,0,Math.PI,true);ctx.closePath();
      const shade=ctx.createLinearGradient(0,top,0,top+tierH);shade.addColorStop(0,['#cfab84','#b99372','#a78367','#8e705d'][t]);shade.addColorStop(1,['#95745f','#8b6c5c','#745b51','#594b4b'][t]);ctx.fillStyle=shade;ctx.fill();ctx.strokeStyle='rgba(61,46,43,.55)';ctx.lineWidth=1.2;ctx.stroke();
      const n=30-t*3;for(let i=0;i<n;i++){const a=Math.PI+(Math.PI*i/(n-1)), x=cx+Math.cos(a)*rx*spread, y=top+height*.16+Math.sin(a)*ry*spread*.49;
        ctx.beginPath();ctx.arc(x,y+3,Math.max(2.4,rx*spread*.019),Math.PI,0);ctx.lineTo(x+Math.max(2.4,rx*spread*.019),y+9);ctx.lineTo(x-Math.max(2.4,rx*spread*.019),y+9);ctx.closePath();ctx.fillStyle=t===3?'#473d42':'#514348';ctx.fill();
      }
    }
    // broken upper rim silhouette
    ctx.strokeStyle='#e1bd93';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(cx,cy-height*.1,rx*.88,ry*.4,0,Math.PI*1.06,Math.PI*1.89);ctx.stroke();
    // perspective approach
    poly([[cx-rx*.13,height*.78],[cx+rx*.13,height*.78],[width*1.2,height],[width*-.2,height]],'rgba(188,139,94,.17)');
  }
  function drawForum(colors,p){
    const ground=height*.79;
    // low forum plinth and stairs
    poly([[width*.16,ground],[width*.88,ground],[width*.94,height*.91],[width*.08,height*.91]],'#78604e');
    for(let i=0;i<4;i++){ctx.strokeStyle='rgba(235,199,157,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(width*(.12-i*.025),ground+i*height*.025);ctx.lineTo(width*(.92+i*.025),ground+i*height*.025);ctx.stroke()}
    // Temple pediment
    const tx=width*.57, ty=height*.34, tw=width*.44, th=height*.26;
    poly([[tx-tw*.59,ty+th*.42],[tx,ty],[tx+tw*.59,ty+th*.42]],'#c7a37d');poly([[tx-tw*.49,ty+th*.41],[tx,ty+th*.1],[tx+tw*.49,ty+th*.41]],'#92745e');
    // cella shadow
    ctx.fillStyle='#816750';ctx.fillRect(tx-tw*.52,ty+th*.4,tw*1.04,height*.31);
    // columns, layered shadows and capitals
    const n=8;for(let i=0;i<n;i++){const x=tx-tw*.47+i*(tw*.94/(n-1));const w=width*.014;ctx.fillStyle='rgba(31,27,32,.22)';ctx.fillRect(x-w*.7,ty+th*.43,w*2,height*.33);ctx.fillStyle='#dfbd93';ctx.fillRect(x-w/2,ty+th*.42,w,height*.34);ctx.fillStyle='#f0d2a8';ctx.fillRect(x-w*.85,ty+th*.4,w*1.7,height*.025);ctx.fillRect(x-w*.7,ty+th*.42+height*.34,w*1.4,height*.022)}
    // broken ruin columns in foreground
    const ruins=[[.12,.64,.29],[.29,.7,.2],[.81,.68,.24],[.91,.74,.17]];
    for(const [xx,yy,hh] of ruins){const x=width*xx,y=height*yy,h=height*hh,w=width*.024;ctx.fillStyle='#b6906d';ctx.fillRect(x-w/2,y-h,w,h);ctx.fillStyle='#dfbd94';ctx.fillRect(x-w*.85,y-h,w*1.7,6);ctx.fillRect(x-w*.7,y-4,w*1.4,5);}
    // columns catch sunset on one edge
    ctx.fillStyle='rgba(245,194,130,.16)';ctx.fillRect(0,ground,width,height-ground);
  }
  function drawEnvironment(progress){
    const colors=getColors(progress);drawSky(colors,progress);drawDistantHills(colors);
    const cityA=smooth(.25,1.2,progress)*(1-smooth(1.6,2.3,progress)*.6);
    drawRooftops(colors,cityA);
    if(progress<1.15){ctx.globalAlpha=1-smooth(.55,1.15,progress);drawGate(colors,progress);ctx.globalAlpha=1}
    if(progress>.65&&progress<3.25){const a=smooth(.75,1.28,progress)*(1-smooth(2.65,3.25,progress));ctx.globalAlpha=a;drawColosseum(colors,progress);ctx.globalAlpha=1}
    if(progress>1.7){ctx.globalAlpha=smooth(1.7,2.45,progress);drawForum(colors,progress);ctx.globalAlpha=1}
    if(progress>3.3){const opacity=smooth(3.2,4,progress);ctx.globalAlpha=opacity;drawRooftops(colors,.55);drawForum(colors,progress);ctx.globalAlpha=1}
    // foreground stone parapet, shifts subtly like a rising camera
    const lift=Math.sin(progress*Math.PI/4)*height*.06;const gy=height*.91-lift;
    const fg=ctx.createLinearGradient(0,gy,0,height);fg.addColorStop(0,'rgba(102,78,65,.03)');fg.addColorStop(1,'rgba(30,29,36,.68)');ctx.fillStyle=fg;ctx.fillRect(0,gy,width,height-gy);
    // sparse drifting dust glints
    if(width>600){for(let i=0;i<16;i++){const xx=(i*173.3+scrollValue*8)%width, yy=(i*89.7+Math.sin(scrollValue*2+i)*24+height*.28)%height;ctx.fillStyle=`rgba(255,218,167,${.12+((i%4)*.025)})`;ctx.beginPath();ctx.arc(xx,yy,1+(i%3)*.35,0,Math.PI*2);ctx.fill()}}
  }
  function draw(){if(!width||document.body.classList.contains('webgl-ready'))return;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);drawEnvironment(scrollValue)}
  function tick(){const delta=scrollTarget-scrollValue;scrollValue+=reducedMotion?delta:delta*.13;if(Math.abs(delta)>.001){draw();raf=requestAnimationFrame(tick)}else{scrollValue=scrollTarget;draw();raf=0}}
  function readScroll(){const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);const p=clamp((scrollY/max)*4,0,4);scrollTarget=p;document.documentElement.style.setProperty('--scene-progress',p);const light=smooth(0,4,p);document.documentElement.style.setProperty('--scene-light',light);document.documentElement.style.setProperty('--progress',`${p/4*100}%`);if(!raf)raf=requestAnimationFrame(tick)}
  function setActive(){let active=0;const focus=innerHeight*.52;sections.forEach((section,i)=>{if(section.getBoundingClientRect().top<focus)active=i});railLinks.forEach((link,i)=>link.classList.toggle('active',i===active));}
  if('IntersectionObserver' in window){const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');revealObserver.unobserve(entry.target)}}),{threshold:.12,rootMargin:'0px 0px -8% 0px'});sections.forEach(section=>revealObserver.observe(section))}else{sections.forEach(section=>section.classList.add('in-view'))}
  addEventListener('resize',resize,{passive:true});addEventListener('scroll',()=>{readScroll();setActive()},{passive:true});
  document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',e=>{const target=document.querySelector(link.getAttribute('href'));if(target){e.preventDefault();target.scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'start'})}}));
  const tickets=[...document.querySelectorAll('.ticket-card')];let selected='Standard';let selectedPrice=18;
  const guestsInput=document.querySelector('#guests');const totalOutput=document.querySelector('#booking-total');
  function updateTotal(){totalOutput.textContent=`€${selectedPrice*Number(guestsInput.value)}`;}
  tickets.forEach(card=>card.addEventListener('click',()=>{selected=card.dataset.ticket;selectedPrice=Number(card.dataset.price);tickets.forEach(c=>{const active=c===card;c.classList.toggle('selected',active);c.setAttribute('aria-pressed',String(active));c.querySelector('.ticket-select').innerHTML=active?'SELECTED <b>✓</b>':'SELECT <b>＋</b>'});updateTotal()}));
  guestsInput.addEventListener('change',updateTotal);
  const dateInput=document.querySelector('#visit-date');const today=new Date();const localDate=new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10);dateInput.min=localDate;
  document.querySelector('#booking-form').addEventListener('submit',e=>{e.preventDefault();const form=e.currentTarget,msg=form.querySelector('.form-message'),email=form.elements.namedItem('email').value.trim(),date=form.elements.namedItem('date').value,guests=form.elements.namedItem('guests').value;msg.textContent='';if(!email||!/^\S+@\S+\.\S+$/.test(email)){msg.textContent='Please enter a valid email address.';form.elements.namedItem('email').focus();return}if(!date||date<localDate){msg.textContent='Choose a valid visit date to continue.';dateInput.focus();return}const pretty=new Date(`${date}T12:00:00`).toLocaleDateString(undefined,{day:'numeric',month:'long',year:'numeric'});msg.textContent=`Preview reservation ready: ${guests} ${Number(guests)===1?'guest':'guests'} · ${selected} · €${selectedPrice*Number(guests)} · ${pretty}. No booking or email has been sent.`;form.querySelector('.reserve-button span:first-child').textContent='VISIT RESERVED';});
  import('./world3d.js').catch(error=>console.warn('WebGL scene unavailable; using the illustrated fallback.',error));
  resize();readScroll();setActive();setTimeout(()=>document.body.classList.add('loaded'),450);
})();
