'use strict';
const apiBase='https://dcarela-api.dcarela-compufoto.workers.dev/crm-lectura/';
const $=id=>document.getElementById(id);
const names={dcarela:'Central','plaza-artesanal':'Plaza Artesanal'};
const format=new Intl.DateTimeFormat('es-DO',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Santo_Domingo'});
let token='',kind='chats',chat=null,rows=[],listTurn=0,messageTurn=0;
let listPages=[null],messagePages=[null],listPage=0,messagePage=0;

function status(value){$('estado').textContent=value;}
function element(tag,value,style){
  const node=document.createElement(tag);node.textContent=value;
  if(style)node.className=style;
  return node;
}
function date(value){
  const parsed=new Date(value||'');
  return Number.isFinite(parsed.getTime())?format.format(parsed):'';
}
function device(){
  const key='dcarela_consulta_device_v1';
  let value=localStorage.getItem(key);
  if(!/^[a-f0-9]{32}$/.test(value||'')){
    value=crypto.randomUUID().replaceAll('-','');localStorage.setItem(key,value);
  }
  return value;
}
async function request(route,body={}){
  const response=await fetch(apiBase+route,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},
    body:JSON.stringify(body),cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(15000)});
  const data=await response.json();
  if(!response.ok){
    if(token&&response.status===401){closeView();status(data.error);}
    throw new Error(data.error||'No se pudo consultar Servicios.');
  }
  return data;
}
function closeView(){
  token='';rows=[];chat=null;listTurn++;messageTurn++;
  $('consulta').hidden=true;$('detalle').hidden=true;$('acceso').hidden=false;
  $('lista').replaceChildren();$('mensajes').replaceChildren();
}
function renderList(){
  const query=$('buscar').value.trim().toLocaleLowerCase('es');
  const match=rows.filter(row=>[row.name,row.phone,row.body].some(value=>String(value||'').toLocaleLowerCase('es').includes(query)));
  const cards=match.map(row=>{
    const card=element(kind==='chats'?'button':'article','', 'tarjeta');
    card.append(element('strong',row.name));
    if(kind==='chats'){
      card.type='button';
      card.append(element('span',[row.channel,date(row.date)].filter(Boolean).join(' · '),'suave'));
      if(row.body)card.append(element('span',row.body));
      card.onclick=()=>{
        chat=row;messagePages=[null];messagePage=0;
        $('chatTitulo').textContent=chat.name;$('detalle').hidden=false;
        void loadMessages(true);
      };
    }else card.append(element('span',[row.phone,row.email].filter(Boolean).join(' · '),'suave'));
    return card;
  });
  $('lista').replaceChildren(...(cards.length?cards:[element('p','Sin coincidencias en esta página.','suave')]));
}
async function loadList(){
  const turn=++listTurn;
  $('lista').replaceChildren(element('p','Consultando Servicios…','suave'));
  $('anterior').disabled=$('siguiente').disabled=true;
  status('');
  try{
    const data=await request(kind,{branch:$('sucursal').value,after:listPages[listPage]});
    if(turn!==listTurn)return;
    rows=data.rows;listPages[listPage+1]=data.next;
    renderList();$('pagina').textContent='Página '+(listPage+1);
    $('anterior').disabled=listPage===0;$('siguiente').disabled=!data.next;
  }catch(error){
    if(turn!==listTurn)return;
    $('lista').replaceChildren();status(error.message);
  }
}
async function loadMessages(scroll=false){
  const turn=++messageTurn;
  $('mensajes').replaceChildren(element('p','Consultando mensajes…','suave'));
  $('masNuevos').disabled=$('masViejos').disabled=true;
  if(scroll)$('detalle').scrollIntoView({block:'nearest'});
  try{
    const data=await request('messages',{branch:$('sucursal').value,chat:chat.id,after:messagePages[messagePage]});
    if(turn!==messageTurn)return;
    messagePages[messagePage+1]=data.next;
    const results=data.rows.slice().reverse().map(row=>{
      const message=element('article','','mensaje');
      const label={inbound:'Recibido',outbound:'Enviado',in:'Recibido',out:'Enviado'}[row.direction];
      message.append(element('div',[label,date(row.date)].filter(Boolean).join(' · '),'suave'),element('div',row.body));
      return message;
    });
    $('mensajes').replaceChildren(...(results.length?results:[element('p','No hay mensajes guardados en esta página.','suave')]));
    $('masNuevos').disabled=messagePage===0;$('masViejos').disabled=!data.next;
  }catch(error){if(turn===messageTurn)$('mensajes').replaceChildren(element('p',error.message));}
}
function choose(next){
  kind=next;listPage=0;listPages=[null];chat=null;messageTurn++;
  $('detalle').hidden=true;$('mensajes').replaceChildren();$('buscar').value='';
  $('chats').setAttribute('aria-pressed',kind==='chats');
  $('contactos').setAttribute('aria-pressed',kind==='contacts');
  void loadList();
}
$('login').onsubmit=async event=>{
  event.preventDefault();const button=event.currentTarget.querySelector('button');
  button.disabled=true;status('');
  try{
    const data=await request('session',{email:$('correo').value,password:$('clave').value,deviceKey:device()});
    token=data.token;
    $('sucursal').replaceChildren(...data.branches.map(id=>{
      const option=element('option',names[id]);option.value=id;return option;
    }));
    $('acceso').hidden=true;$('consulta').hidden=false;
    choose('chats');
  }catch(error){status(error.message);}
  finally{$('clave').value='';button.disabled=false;}
};
$('chats').onclick=()=>choose('chats');
$('contactos').onclick=()=>choose('contacts');
$('sucursal').onchange=()=>choose(kind);
$('busqueda').onsubmit=event=>{event.preventDefault();renderList();};
$('buscar').oninput=renderList;
$('anterior').onclick=()=>{listPage--;void loadList();};
$('siguiente').onclick=()=>{listPage++;void loadList();};
$('masNuevos').onclick=()=>{messagePage--;void loadMessages();};
$('masViejos').onclick=()=>{messagePage++;void loadMessages();};
$('salir').onclick=async()=>{
  try{await request('logout');}
  catch{}
  finally{closeView();status('Consulta cerrada.');}
};
