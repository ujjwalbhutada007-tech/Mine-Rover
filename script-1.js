var T={ch4:[1,2],co:[35,100],o2:[19.5,18],temp:[40,50]};
var S={ch4:.3,co:8,o2:20.8,temp:32,leak:0,t:0,bat:92,rtb:0,hist:[]};
var W=[{n:"Ravi",x:120,y:170,d:1,z:"A"},{n:"Meena",x:250,y:60,d:1,z:"Refuge"},{n:"Imran",x:300,y:170,d:0,z:"B",sos:0},{n:"Kiran",x:470,y:290,d:-1,z:"C"}];
var R={x:60,y:170,p:0},lastLvl={},lastSt="SAFE";
function $(i){return document.getElementById(i)}
function log(m){var l=document.createElement("li"),t=new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"});l.innerHTML="<time>"+t+"</time>"+m;$("log").prepend(l)}
function lvl(k,v){var t=T[k];if(k=="o2")return v<t[1]?2:v<t[0]?1:0;return v>=t[1]?2:v>=t[0]?1:0}
var names={ch4:["Methane","%",2],co:["Carbon monoxide","ppm",0],o2:["Oxygen","%",1],temp:["Temperature","°C",0]};
var max={ch4:4,co:150,o2:21,temp:60};
function zoneOf(x,y){return y<120?"Refuge":x<200?"A":x<400?"B":"C"}
function tick(){
 S.t++;
 var tg=S.leak?{ch4:3.4,co:120,o2:17.8,temp:52}:{ch4:.3,co:8,o2:20.8,temp:32};
 for(var k in tg){S[k]+=(tg[k]-S[k])*.06+(Math.random()-.5)*(k=="ch4"?.03:k=="o2"?.03:.5)}
 S.hist.push(S.ch4);if(S.hist.length>60)S.hist.shift();
 S.bat=Math.max(5,S.bat-.02);
 // workers
 W.forEach(function(w){
  if(w.n=="Imran"&&S.leak){if(S.t%1==0&&w.stopAt==null)w.stopAt=S.t;return}
  if(w.n=="Meena"){w.x+=w.d*.6;if(w.x>300||w.x<230)w.d*=-1;return}
  if(w.n=="Kiran"){w.x+=w.d*.5;if(w.x>520||w.x<420)w.d*=-1;return}
  if(w.n=="Ravi"){w.x+=w.d*.7;if(w.x>170||w.x<80)w.d*=-1;return}
  w.x+=w.d*.4;
 });
 var im=W[2];if(S.leak&&S.t-(im.stopAt||S.t)>15&&!im.sos){im.sos=1;log("<b>SOS</b> pressed by Imran in Zone B")}
 if(!S.leak){im.stopAt=null;im.sos=0}
 // rover
 var tx=S.rtb?60:(S.leak?270:300),ty=170;
 R.x+=(tx-R.x)*.03;
 render();
}
function render(){
 var lv=0,g="";
 for(var k in names){var l=lvl(k,S[k]);lv=Math.max(lv,l);var n=names[k];
  var pct=Math.min(100,S[k]/max[k]*100);
  g+='<div class="g '+["","warn","danger"][l]+'"><div class="n">'+n[0]+'</div><div class="v">'+S[k].toFixed(n[2])+' <small>'+n[1]+'</small></div><div class="bar"><i style="width:'+pct+'%"></i></div></div>';
  if(lastLvl[k]!==l){if(lastLvl[k]!==undefined&&l>0)log(n[0]+" "+(l==2?"<b>DANGER</b>":"warning")+": "+S[k].toFixed(n[2])+" "+n[1]);lastLvl[k]=l}}
 $("gases").innerHTML=g;
 var st=["SAFE","WARNING","DANGER"][lv];$("st").textContent=st;$("hd").className=["","warn","danger"][lv];
 if(st!==lastSt){log("Status changed to <b>"+st+"</b>");lastSt=st}
 $("bat").textContent=Math.round(S.bat)+"%";
 var m=Math.floor(S.t/60),s=S.t%60;$("tm").textContent=("0"+m).slice(-2)+":"+("0"+s).slice(-2);
 $("lnk").textContent=R.x>200?"LoRa, good":"LoRa, strong";
 $("dep").textContent=Math.round(240+(R.x-60)*.15)+" m";
 // trend
 var pts=S.hist.map(function(v,i){return (i*300/59).toFixed(1)+","+(66-Math.min(v,4)/4*60).toFixed(1)}).join(" ");$("tr").setAttribute("points",pts);
 $("wl").setAttribute("y1",66-1/4*60);$("wl").setAttribute("y2",66-1/4*60);$("dl").setAttribute("y1",66-2/4*60);$("dl").setAttribute("y2",66-2/4*60);
 // heat
 var h=$("heat");h.setAttribute("r",10+Math.min(S.ch4,3.5)*22);h.setAttribute("opacity",Math.min(.5,Math.max(0,(S.ch4-.4)*.2)));
 // map markers
 var wh="";W.forEach(function(w){var bad=w.sos;wh+='<g transform="translate('+w.x+','+w.y+')"><circle r="8" fill="'+(bad?"var(--danger)":"var(--safe)")+'" stroke="var(--panel)" stroke-width="2"/><text y="-13" text-anchor="middle" font-size="11" fill="var(--ink)">'+w.n+'</text></g>'});
 $("workers").innerHTML=wh;
 $("rover").setAttribute("transform","translate("+R.x+",170)");
 // worker table
 var t="";W.forEach(function(w){var z=zoneOf(w.x,w.y);var still=(w.n=="Imran"&&S.leak);
  t+="<tr><td>"+w.n+"</td><td>"+z+"</td><td>"+(still?Math.max(0,S.t-(w.stopAt||S.t))+"s ago":"live")+"</td><td><span class='tag "+(w.sos?"bad":"ok")+"'>"+(w.sos?"SOS, no movement":"Moving")+"</span></td></tr>"});
 $("wt").innerHTML=t;
 // zone risk
 var rb=Math.round(Math.min(100,S.ch4/2*60+(S.co/100)*25+Math.max(0,S.temp-35)));
 var rk={A:Math.round(rb*.35+4),B:rb,C:Math.round(rb*.2+3)};
 var zh="";["A","B","C"].forEach(function(z){var v=Math.min(100,rk[z]);zh+='<div class="z '+(v>60?"danger":v>30?"warn":"")+'"><div style="color:var(--mute);font-size:12px">Zone '+z+'</div><b>'+v+'</b></div>'});
 $("zones").innerHTML=zh;
 $("ai").textContent=S.rtb?"Rover returning to base. Zone B still under watch.":S.leak?(W[2].sos?"Zone B: methane rising, heat rising. Imran has not moved and pressed SOS. Send rover to Zone B, start ventilation, prepare rescue team.":"Zone B: methane rising fast. Warn workers and clear the zone."):"All zones normal. Continue patrol.";
}
$("leak").onclick=function(){S.leak=1;S.rtb=0;log("Test: gas leak started in Zone B")};
$("rst").onclick=function(){S.leak=0;S.rtb=0;log("Scenario reset")};
$("rtb").onclick=function(){S.rtb=1;log("Rover ordered to return to base")};
log("System started. Rover online.");
render();setInterval(tick,1000);
