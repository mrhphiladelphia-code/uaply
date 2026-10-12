/* "nav" experiment for the sandbox and dev instances (never loaded by prod).
   Bottom navigation with three dropdowns: Services (Jobs, Internships, Co-ops), Dashboard (Applied, Interview, Rejected),
   Profile (Settings, Preferences, Filters). patch() edits an in-memory copy of index.html; apply() builds the UI. */
(function(){
function once(src,a,b){if(src.indexOf(a)<0)throw new Error("patch target not found: "+a.slice(0,40));return src.replace(a,function(){return b})}

var EXTRA=`,
 {id:13,type:"internship",co:"Calloway Studios",role:"Design Intern",loc:"Remote (US)",mode:"remote",sal:[36000,44000],yrs:0,edu:"High school",skills:["Figma","Prototyping","User research"],blurb:"Ten weeks helping a small studio design onboarding screens for a budgeting app."},
 {id:14,type:"internship",co:"Ironbridge Analytics",role:"Data Science Intern",loc:"New York",mode:"hybrid",sal:[42000,52000],yrs:0,edu:"Associate",skills:["Python","SQL","Excel","Tableau"],blurb:"Summer team placement cleaning data and building dashboards for retail clients."},
 {id:15,type:"internship",co:"Seaside Software",role:"Frontend Intern",loc:"Remote (US)",mode:"remote",sal:[38000,46000],yrs:0,edu:"High school",skills:["JavaScript","React","CSS","HTML"],blurb:"Ship real UI changes with a mentor on a product used by 50,000 people."},
 {id:16,type:"internship",co:"Redwood Marketing",role:"Marketing Intern",loc:"Austin",mode:"onsite",sal:[30000,38000],yrs:0,edu:"High school",skills:["SEO","Copywriting","Analytics"],blurb:"Write and test campaigns for local restaurants alongside the content team."},
 {id:17,type:"coop",co:"Atlas Robotics",role:"Software Co-op",loc:"Pittsburgh",mode:"onsite",sal:[52000,62000],yrs:0,edu:"Associate",skills:["Python","Docker","Testing","SQL"],blurb:"Six-month rotation on the fleet software team, testing code on real robots."},
 {id:18,type:"coop",co:"Harbor Bank",role:"Technology Co-op",loc:"Charlotte",mode:"hybrid",sal:[48000,58000],yrs:0,edu:"Associate",skills:["Java","SQL","Testing","Excel"],blurb:"Support the payments team with test automation and reporting for six months."},
 {id:19,type:"coop",co:"Summit Health",role:"Data Co-op",loc:"Boston",mode:"hybrid",sal:[50000,60000],yrs:0,edu:"Associate",skills:["SQL","Python","Tableau","Excel"],blurb:"Build clinic reports and learn healthcare data from a team of analysts."},
 {id:20,type:"coop",co:"Lumen Labs",role:"Web Co-op",loc:"Remote (US)",mode:"remote",sal:[46000,56000],yrs:0,edu:"Associate",skills:["React","TypeScript","CSS","JavaScript"],blurb:"Full-semester co-op building customer-facing pages for a lighting startup."}`;

var API=`
window.__aply={S:S,JOBS:JOBS,save:save,renderAll:renderAll,show:show,setFilter:setFilter,esc:esc,hue:hue,money:money,tone:tone,cap:cap,
 setType:function(t){TYPE=t;renderDeck();renderDash()},getType:function(){return TYPE},
 setMin:function(n){MINPCT=n;renderDeck();renderDash()},getMin:function(){return MINPCT},getFilter:function(){return F}};`;

function patch(s){
  s=once(s,'regional cookbooks."}','regional cookbooks."}'+EXTRA);
  s=once(s,'var busy=false,F="all";','var busy=false,F="all",TYPE="job",MINPCT=0;');
  s=once(s,'&&(F==="all"||j.mode===F)}).map(function(j){return {j:j,m:evaluate(j,S.profile)}}).sort(',
           '&&(j.type||"job")===TYPE&&(F==="all"||j.mode===F)}).map(function(j){return {j:j,m:evaluate(j,S.profile)}}).filter(function(x){return x.m.pct>=MINPCT}).sort(');
  s=once(s,'<h2>You have seen every job</h2><p>Jobs you passed on can come back, and your applications are in the Applied tab.</p>',
    `<h2>'+(MINPCT>0?"No jobs at "+MINPCT+"% match or higher":(JOBS.filter(function(j){return (j.type||"job")===TYPE&&(j.live||!window.__aplyHideSamples)}).length?"You have seen every one of these":"Nothing listed here right now"))+'</h2><p>'+(MINPCT>0?"Lower the minimum match in Profile, then Filters.":(JOBS.filter(function(j){return (j.type||"job")===TYPE&&(j.live||!window.__aplyHideSamples)}).length?"Jobs you passed on can come back, and your applications are in the Dashboard.":"New postings appear as employers publish them. Try another section or check back soon."))+'</p>`);
  s=once(s,'title:String(x.title||"")};','title:String(x.title||""),st:(x.st==="interview"||x.st==="accepted"||x.st==="rejected")?x.st:"applied",sent:(x.sent&&typeof x.sent==="object")?{at:+x.sent.at||0,to:String(x.sent.to||"").slice(0,120),status:String(x.sent.status||"").slice(0,20)}:undefined};');
  /* profile gets an email so a recruiter can reply */
  s=once(s,'salary:100000,loc:"New York",','salary:100000,loc:"New York",email:"jordan.lee@example.com",');
  s=once(s,'loc:typeof p.loc==="string"?p.loc:"",','loc:typeof p.loc==="string"?p.loc:"",email:typeof p.email==="string"?p.email.slice(0,200):"",');
  s=once(s,'salary:num($("pSalary").value,0,10000000),loc:$("pLoc").value.trim(),','salary:num($("pSalary").value,0,10000000),loc:$("pLoc").value.trim(),email:($("pEmail")?$("pEmail").value.trim():""),');
  s=once(s,'$("pSalary").value=p.salary;$("pLoc").value=p.loc;','$("pSalary").value=p.salary;$("pLoc").value=p.loc;if($("pEmail"))$("pEmail").value=p.email||"";');
  s=once(s,'title:S.profile.title||""};','title:S.profile.title||"",st:"applied"};');
  s=once(s,"<span>'+cap(j.mode)+'</span>","<span>'+cap(j.mode)+'</span>'+(j.type&&j.type!==\"job\"?'<span>'+(j.type===\"internship\"?\"Internship\":\"Co-op\")+'</span>':'')+'");
  s=once(s,'function show(t,focusPane){','function show(t,focusPane){if(window.__aplyOnShow)window.__aplyOnShow(t);');
  s=once(s,'function renderAll(){renderDeck();renderApps();renderDash()}','function renderAll(){renderDeck();renderApps();renderDash()}'+API);
  return s;
}

var CSS=`
.tabs{display:none}
#bnav{display:flex;gap:4px;justify-content:center;flex:none;max-width:1100px;width:100%;margin-inline:auto;background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:4px;position:relative}
.nwrap{position:relative;flex:1;display:flex;min-width:0}
.nb{flex:1;border:0;background:none;border-radius:999px;padding:6px 8px;min-height:48px;font-weight:600;color:var(--muted);display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.15;min-width:0}
.nb small{font:500 11px var(--mono);opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.nb[aria-current="true"]{background:linear-gradient(135deg,var(--accent),var(--accent2));color:var(--accent-ink)}
.nmenu{position:absolute;bottom:calc(100% + 10px);left:50%;transform:translateX(-50%);min-width:220px;background:var(--surface);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);padding:6px;display:flex;flex-direction:column;gap:2px;z-index:20}
.nwrap:first-child .nmenu{left:0;transform:none}
.nwrap:last-child .nmenu{left:auto;right:0;transform:none}
.nitem{display:flex;justify-content:space-between;align-items:center;gap:14px;border:0;background:none;text-align:left;padding:10px 14px;border-radius:10px;font-weight:600;min-height:44px;color:var(--ink)}
.nitem:hover,.nitem:focus-visible{background:var(--bg)}
.nitem[aria-checked="true"]{color:var(--accent);background:var(--bg)}
.nitem .c{font:500 12px var(--mono);color:var(--muted)}
.toast{bottom:calc(88px + env(safe-area-inset-bottom,0px))}
body{padding-bottom:calc(12px + env(safe-area-inset-bottom,0px))}
#pane-track .stats{grid-template-columns:repeat(4,1fr)}
#pane-track .row{flex-wrap:wrap}
#pane-track .acts{display:flex;gap:6px;flex-wrap:wrap;flex-basis:100%}
#pane-track .acts .btn{padding:6px 12px;font-size:13px}
#filtersSec{display:flex;flex-direction:column;gap:14px}
#filtersSec input[type=range]{width:100%;accent-color:var(--accent)}
`;

function apply(w,host){
  var d=w.document,A=w.__aply;
  if(!A)throw new Error("app hooks missing");
  var OPTS=(host&&host.defaultView&&host.defaultView.AplyOpts)||{};   /* e.g. dev sets hideServiceCounts */
  var NK=w.__aplyKey+".nav";
  var SECS={
    svc:{label:"Services",items:[["job","Jobs"],["internship","Internships"],["coop","Co-ops"]]},
    dash:{label:"Dashboard",items:[["applied","Applied"],["accepted","Accepted"],["rejected","Rejected"],["interview","Interviews"]]},
    prof:{label:"Profile",items:[["settings","Settings"],["preferences","Preferences"],["filters","Filters"]]}
  };
  var LEADS={
    settings:"Your details. Every card is scored against them, and they fill in your application note and the email address recruiters reply to.",
    preferences:"What you want in a job. These change every match score.",
    filters:"Choose which opportunities appear in your feed."
  };
  var FIELDS={settings:["pName","pEmail","pTitle","pYears","pEdu","pSkills","pLoc"],preferences:["pSalary","pm-remote"]};
  var nameField=d.getElementById("pName").closest(".field"),emailField=d.createElement("div");
  emailField.className="field";
  emailField.innerHTML='<label for="pEmail">Email (recruiters reply here)</label><input type="text" id="pEmail" inputmode="email" autocomplete="email" placeholder="you@example.com">';
  nameField.after(emailField);
  var cur="svc",sub={svc:"job",dash:"applied",prof:"settings"},going=false;
  function label(k,v){var r="";SECS[k].items.forEach(function(i){if(i[0]===v)r=i[1]});return r}

  var st=d.createElement("style");st.textContent=CSS;d.head.appendChild(st);

  /* saved preferences (own key, separate from the app data) */
  var prefs={};try{prefs=JSON.parse(w.localStorage.getItem(NK))||{}}catch(e){}
  function savePrefs(){try{w.localStorage.setItem(NK,JSON.stringify({type:sub.svc,min:A.getMin(),mode:A.getFilter()}))}catch(e){}}
  if(label("svc",prefs.type)){sub.svc=prefs.type;A.setType(sub.svc)}
  if(prefs.min>0&&prefs.min<=90)A.setMin(+prefs.min);
  if(["remote","hybrid","onsite"].indexOf(prefs.mode)>-1)A.setFilter(prefs.mode);

  /* bottom nav */
  var main=d.getElementById("main"),nav=d.createElement("nav");
  nav.id="bnav";nav.setAttribute("aria-label","Main");
  Object.keys(SECS).forEach(function(k){
    var wrap=d.createElement("div");wrap.className="nwrap";wrap.setAttribute("data-k",k);
    wrap.innerHTML='<button type="button" class="nb" id="nb-'+k+'" aria-haspopup="menu" aria-expanded="false"><span>'+SECS[k].label+'</span><small></small></button><div class="nmenu" role="menu" aria-labelledby="nb-'+k+'" hidden></div>';
    nav.appendChild(wrap);
  });
  main.after(nav);

  function count(k,v){
    var n=0;
    if(k==="prof"||(k==="svc"&&OPTS.hideServiceCounts))return "";
    A.JOBS.forEach(function(j){
      if(w.__aplyHideSamples&&!j.live)return;
      var x=A.S.decisions[j.id];
      if(k==="svc"){if(!x&&(j.type||"job")===v)n++}
      else if(x&&x.s==="applied"&&(x.st||"applied")===v)n++;
    });
    return n;
  }
  function refresh(){
    Object.keys(SECS).forEach(function(k){
      var b=d.getElementById("nb-"+k);
      b.setAttribute("aria-current",k===cur?"true":"false");
      b.querySelector("small").textContent=label(k,sub[k]);
    });
  }
  function closeMenus(except){
    nav.querySelectorAll(".nwrap").forEach(function(wr){
      if(wr===except)return;
      wr.querySelector(".nmenu").hidden=true;wr.querySelector(".nb").setAttribute("aria-expanded","false");
    });
  }
  function openMenu(wrap,focusLast){
    var k=wrap.getAttribute("data-k"),menu=wrap.querySelector(".nmenu");
    closeMenus(wrap);
    menu.innerHTML=SECS[k].items.map(function(i){
      var c=count(k,i[0]);
      return '<button type="button" class="nitem" role="menuitemradio" aria-checked="'+(sub[k]===i[0])+'" data-v="'+i[0]+'"><span>'+i[1]+'</span>'+(c===""?"":'<span class="c">'+c+'</span>')+'</button>';
    }).join("");
    menu.hidden=false;wrap.querySelector(".nb").setAttribute("aria-expanded","true");
    var items=menu.querySelectorAll(".nitem"),on=menu.querySelector('[aria-checked="true"]');
    (focusLast?items[items.length-1]:on||items[0]).focus();
  }
  nav.addEventListener("click",function(e){
    var item=e.target.closest(".nitem"),wrap=e.target.closest(".nwrap");if(!wrap)return;
    var k=wrap.getAttribute("data-k");
    if(item){sub[k]=item.getAttribute("data-v");cur=k;closeMenus();go(k);wrap.querySelector(".nb").focus();return}
    if(e.target.closest(".nb")){wrap.querySelector(".nmenu").hidden?openMenu(wrap):closeMenus()}
  });
  nav.addEventListener("keydown",function(e){
    var wrap=e.target.closest(".nwrap");if(!wrap)return;
    var key=e.key,menu=wrap.querySelector(".nmenu"),btn=wrap.querySelector(".nb"),onBtn=e.target===btn;
    if(key==="ArrowLeft"||key==="ArrowRight"){
      e.stopPropagation();e.preventDefault();
      if(onBtn){var ws=[].slice.call(nav.querySelectorAll(".nwrap")),i=ws.indexOf(wrap)+(key==="ArrowRight"?1:-1);if(ws[i]){closeMenus();ws[i].querySelector(".nb").focus()}}
    }else if(key==="ArrowDown"||key==="ArrowUp"){
      e.stopPropagation();e.preventDefault();
      if(menu.hidden){openMenu(wrap,key==="ArrowUp");return}
      var items=[].slice.call(menu.querySelectorAll(".nitem")),i2=items.indexOf(d.activeElement)+(key==="ArrowDown"?1:-1);
      items[(i2+items.length)%items.length].focus();
    }else if(key==="Escape"&&!menu.hidden){e.stopPropagation();closeMenus();btn.focus()}
  });
  nav.addEventListener("focusout",function(e){if(!e.relatedTarget||!nav.contains(e.relatedTarget))closeMenus()});
  d.addEventListener("pointerdown",function(e){if(!e.target.closest("#bnav"))closeMenus()},true);

  /* dashboard: applications by status */
  var tp=d.createElement("section");tp.id="pane-track";tp.className="pane list";tp.setAttribute("aria-label","Applications");tp.hidden=true;main.appendChild(tp);
  var ACTS={
    applied:[["interview","Interview"],["accepted","Accepted"],["rejected","Rejected"],["withdraw","Withdraw"]],
    accepted:[["applied","Back to applied"],["withdraw","Remove"]],
    rejected:[["applied","Back to applied"],["withdraw","Remove"]],
    interview:[["accepted","Accepted"],["rejected","Rejected"],["applied","Back to applied"],["withdraw","Withdraw"]]
  };
  var EMPTY={
    applied:"No applications waiting. Swipe right on a job, internship or co-op to apply.",
    accepted:"Nothing here yet. Tap Accepted on an application when you get an offer.",
    rejected:"Nothing here. Tap Rejected on an application when you hear back.",
    interview:"Nothing here yet. Tap Interview on an application when a company invites you."
  };
  var TYPE_LABEL={job:"Job",internship:"Internship",coop:"Co-op"};
  function renderTrack(){
    var by={applied:[],accepted:[],rejected:[],interview:[],passed:[]};
    A.JOBS.forEach(function(j){
      var x=A.S.decisions[j.id];if(!x)return;
      if(x.s==="passed")by.passed.push({j:j,x:x});else by[by[x.st]&&x.st!=="passed"?x.st:"applied"].push({j:j,x:x});
    });
    function row(o,acts,view){
      var t=A.tone(o.x.pct),e=A.esc;
      return '<div class="row"><div class="logo" aria-hidden="true" style="background:hsl('+A.hue(o.j.id)+' 60% 46%)">'+e(o.j.co.charAt(0))+'</div><div class="info"><b>'+e(o.j.role)+'</b><small>'+e(o.j.co)+' · '+e(o.j.loc)+' · '+TYPE_LABEL[o.j.type||"job"]+'</small>'+
        (view!=="passed"?'<small>Applied '+new Date(o.x.at).toLocaleDateString(undefined,{month:"short",day:"numeric"})+'</small>':'')+
        (o.x.sent?'<small>Application sent to '+e(o.x.sent.to||"the company")+(o.x.sent.status==="delivered_test"?" (test inbox)":"")+'</small>':'')+'</div><span class="pill tone-'+t+'">'+o.x.pct+'%</span>'+
        '<div class="acts">'+(o.j.url?acts.concat([["open","Open posting"]]):acts).map(function(a,i){return '<button type="button" class="btn'+(i?' ghost':'')+'" data-act="'+a[0]+'" data-id="'+o.j.id+'" aria-label="'+a[1]+': '+e(o.j.role)+' at '+e(o.j.co)+'">'+a[1]+'</button>'}).join("")+'</div></div>';
    }
    var v=sub.dash;
    var h='<div class="stats big">'+[["applied","Applied"],["accepted","Accepted"],["rejected","Rejected"],["interview","Interviews"]].map(function(p){return '<div class="stat"><b>'+by[p[0]].length+'</b><small>'+p[1]+'</small></div>'}).join("")+'</div>';
    h+='<h3>'+label("dash",v)+' ('+by[v].length+')</h3>';
    if(!by[v].length)h+='<p class="note">'+EMPTY[v]+'</p>';
    by[v].sort(function(a,b){return b.x.at-a.x.at}).forEach(function(o){h+=row(o,ACTS[v],v)});
    if(v==="applied"){
      h+='<h3>Passed ('+by.passed.length+')</h3>';
      if(!by.passed.length)h+='<p class="note">Jobs you swipe left on are listed here.</p>';
      by.passed.forEach(function(o){h+=row(o,[["reconsider","Reconsider"]],"passed")});
    }
    tp.innerHTML=h;
  }
  tp.addEventListener("click",function(e){
    var b=e.target.closest("[data-act]");if(!b)return;
    var id=+b.getAttribute("data-id"),act=b.getAttribute("data-act"),x=A.S.decisions[id];if(!x)return;
    if(act==="open"){
      var job=A.JOBS.filter(function(j){return j.id===id})[0];
      if(job&&w.__aplyOpen)w.__aplyOpen(job.url);
      return;
    }
    if(act==="withdraw"||act==="reconsider"){delete A.S.decisions[id];A.S.history=A.S.history.filter(function(i){return i!==id})}
    else x.st=act;
    A.save();A.renderAll();renderTrack();
  });

  /* profile: three sections */
  var form=d.getElementById("form"),lead=form.querySelector(".lead"),secTitle=d.createElement("h3");
  secTitle.id="secTitle";form.insertBefore(secTitle,lead);
  var fs=d.createElement("div");fs.id="filtersSec";fs.hidden=true;
  fs.innerHTML='<div class="field"><label for="fMin"><span class="l">Minimum match</span></label><input type="range" id="fMin" min="0" max="90" step="10" value="0"><small id="fMinV"></small></div>'+
    '<div class="field"><span class="l" id="fWsL">Work style</span><div class="filters" id="fWs" role="group" aria-labelledby="fWsL"><button type="button" data-f="all">All</button><button type="button" data-f="remote">Remote</button><button type="button" data-f="hybrid">Hybrid</button><button type="button" data-f="onsite">On-site</button></div><small>Same as the buttons above the cards.</small></div>'+
    '<div class="field"><span class="l">Jobs you passed on</span><button type="button" class="btn ghost" id="fBack" style="align-self:flex-start">Bring them back</button></div>';
  form.insertBefore(fs,form.querySelector(".formacts"));
  function syncFilters(){
    var m=A.getMin();
    d.getElementById("fMin").value=m;
    d.getElementById("fMinV").textContent=m>0?"Hide anything below "+m+"% match":"Show everything";
    d.querySelectorAll("#fWs button").forEach(function(b){b.setAttribute("aria-pressed",b.getAttribute("data-f")===A.getFilter()?"true":"false")});
  }
  d.getElementById("fMin").addEventListener("input",function(e){A.setMin(+e.target.value);savePrefs();syncFilters()});
  d.querySelectorAll("#fWs button").forEach(function(b){b.onclick=function(){A.setFilter(b.getAttribute("data-f"));savePrefs();syncFilters()}});
  d.querySelectorAll("#filters button").forEach(function(b){b.addEventListener("click",function(){setTimeout(function(){savePrefs();syncFilters()},0)})});
  d.getElementById("fBack").onclick=function(){
    Object.keys(A.S.decisions).forEach(function(k){if(A.S.decisions[k].s==="passed")delete A.S.decisions[k]});
    A.S.history=A.S.history.filter(function(i){return !!A.S.decisions[i]});
    A.save();A.renderAll();this.textContent="Done";var b=this;setTimeout(function(){b.textContent="Bring them back"},1500);
  };
  function section(v){
    secTitle.textContent=label("prof",v);lead.textContent=LEADS[v];
    Object.keys(FIELDS).forEach(function(key){FIELDS[key].forEach(function(id){d.getElementById(id).closest(".field").hidden=(key!==v)})});
    fs.hidden=v!=="filters";
    d.getElementById("saveBtn").hidden=v==="filters";
    d.getElementById("resetBtn").hidden=v!=="filters";
    syncFilters();
  }

  /* routing */
  function go(k){
    going=true;
    if(k==="svc"){A.setType(sub.svc);A.show("swipe");savePrefs()}
    else if(k==="dash"){A.show("apps");d.getElementById("pane-apps").hidden=true;renderTrack();tp.hidden=false}
    else{A.show("profile");section(sub.prof)}
    going=false;refresh();main.scrollTop=0;
  }
  w.__aplyOnShow=function(t){
    tp.hidden=true;
    if(going)return;
    cur=t==="profile"?"prof":"svc";
    if(t==="profile")section(sub.prof);
    refresh();
  };
  section(sub.prof);
  refresh();
}

window.AplyNav={patch:patch,apply:apply};
})();
