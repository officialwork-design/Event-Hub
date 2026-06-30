const CATEGORY_META={
  preparation:{label:"準備物",title:"準備物",amount:false,placeholder:"例：机、椅子、印刷物"},
  expense:{label:"経費",title:"経費",amount:true,placeholder:"例：会場費、飲食費、備品費"},
  schedule:{label:"スケジュール",title:"スケジュール",amount:false,placeholder:"例：受付、開始、撤収"},
  memo:{label:"メモ",title:"メモ",amount:false,placeholder:"例：注意事項、連絡事項"}
};
const state={liffReady:false,profile:null,remoteConfig:{appName:"Event Hub",eventId:"OFFMEETING_001",liffId:""},dashboard:null,activeFilter:"preparation",editingType:null,draftRows:[]};

document.addEventListener("DOMContentLoaded",async()=>{bindEvents();await boot();});

function bindEvents(){
  const reloadButton=document.getElementById("reloadButton");
  if(reloadButton) reloadButton.addEventListener("click",async()=>{await loadDashboard();});

  const editButton=document.getElementById("editCurrentButton");
  if(editButton) editButton.addEventListener("click",()=>openBatchEditor(state.activeFilter||"preparation"));

  document.querySelectorAll(".nav-card").forEach(button=>{
    button.addEventListener("click",()=>{
      state.activeFilter=button.dataset.type;
      renderCurrentCategory();
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach(el=>el.addEventListener("click",closeModal));

  document.getElementById("addRowButton").addEventListener("click",()=>{state.draftRows.push(createEmptyRow());renderDraftRows();});
  document.getElementById("saveCategoryButton").addEventListener("click",saveCurrentCategory);
  document.getElementById("deleteCategoryButton").addEventListener("click",deleteCurrentCategory);
}

async function boot(){
  setStatus("起動中","loading");
  try{
    state.remoteConfig=await loadRemoteConfig();
    await initLiffIfPossible();
    await loadDashboard();
    setStatus("接続OK","success");
  }catch(error){
    console.error(error);
    setStatus("接続エラー","error");
    renderError(error.message||"初期化に失敗しました。");
  }
}

async function loadRemoteConfig(){
  if(!CONFIG.GAS_WEB_APP_URL) throw new Error("config.jsにGAS_WEB_APP_URLが設定されていません。");
  const response=await fetch(buildGasUrl("getConfig"));
  const data=await response.json();
  if(!data.success) throw new Error(data.message||"設定取得に失敗しました。");
  return data;
}

async function initLiffIfPossible(){
  const liffId=state.remoteConfig?.liffId||"";
  if(!liffId||typeof liff==="undefined") return;
  await liff.init({liffId});
  state.liffReady=true;
  if(liff.isLoggedIn()) state.profile=await liff.getProfile();
}

async function loadDashboard(){
  setStatus("読込中","loading");
  const response=await fetch(buildGasUrl("getDashboard",{eventId:state.remoteConfig.eventId||"OFFMEETING_001",lineUserId:getLineUserId()}));
  const data=await response.json();
  if(!data.success) throw new Error(data.message||"ダッシュボード取得に失敗しました。");
  state.dashboard=data;
  renderDashboard(data);
  setStatus("接続OK","success");
}

function buildGasUrl(action,params={}){
  const url=new URL(CONFIG.GAS_WEB_APP_URL);
  url.searchParams.set("action",action);
  Object.entries(params).forEach(([key,value])=>{if(value!==undefined&&value!==null&&value!=="")url.searchParams.set(key,value);});
  return url.toString();
}

async function postGas(action,payload={}){
  const body=Object.assign({action,eventId:state.remoteConfig.eventId||"OFFMEETING_001",lineUserId:getLineUserId(),updatedBy:getDisplayName()},payload);
  const response=await fetch(CONFIG.GAS_WEB_APP_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(body)});
  const data=await response.json();
  if(!data.success) throw new Error(data.message||"保存に失敗しました。");
  return data;
}

function renderDashboard(data){
  const dashboard=data.dashboard||{};
  setText("eventName",dashboard.eventName||"-");
  setText("eventDate",dashboard.eventDate||"-");
  setText("venue",dashboard.venue||"-");
  setText("expectedGuests",dashboard.expectedGuests||"-");
  setText("lastUpdated","最終更新: "+formatDateTime(dashboard.lastUpdatedAt));

  setText("preparationCount",`${parseRowsByType("preparation").length}件`);
  setText("expenseTotal",formatCurrency(sumRows(parseRowsByType("expense"))));
  setText("scheduleCount",`${parseRowsByType("schedule").length}件`);
  setText("memoCount",`${parseRowsByType("memo").length}件`);

  renderCurrentCategory();
}

function renderCurrentCategory(){
  const type=state.activeFilter||"preparation";
  const meta=CATEGORY_META[type]||CATEGORY_META.memo;

  document.querySelectorAll(".nav-card").forEach(btn=>btn.classList.toggle("is-active",btn.dataset.type===type));

  setText("panelTitle",`${meta.label}一覧`);
  setText("panelDescription",`${meta.label}はカテゴリ全体をまとめて編集し、「${meta.label}を更新」を押した時だけ保存されます。`);

  const rows=parseRowsByType(type);
  const block=getBlockByType(type);
  const container=document.getElementById("blockList");
  if(!container) return;

  const total=meta.amount?`<small class="amount">合計 ${formatCurrency(sumRows(rows))}</small>`:"";
  const list=rows.length
    ? `<div class="item-list">${rows.map(row=>renderViewRow(row,meta)).join("")}</div>`
    : `<p class="empty-state">${meta.label}項目がありません。「選択カテゴリを編集」から追加してください。</p>`;

  container.innerHTML=`<article class="category-card">
    <div class="category-card-header">
      <span class="block-type">${meta.label}</span>
      <span class="block-status">${escapeHtml(block?.status||"一括管理")}</span>
    </div>
    <h3>${meta.label}</h3>
    <p>このカテゴリは1行ずつ即保存せず、まとめて編集してから更新します。</p>
    ${list}
    ${total}
    <div class="panel-actions" style="margin-top:14px">
      <button class="primary-button" id="openBatchEditorButton">${meta.label}を編集</button>
      <button class="danger-button" id="deleteBatchButton">${meta.label}全体を削除</button>
    </div>
  </article>`;

  document.getElementById("openBatchEditorButton").addEventListener("click",()=>openBatchEditor(type));
  document.getElementById("deleteBatchButton").addEventListener("click",()=>deleteCategory(type));
}

function renderViewRow(row,meta){
  const amount=meta.amount?`<span>${formatCurrency(row.amount||0)}</span>`:"<span></span>";
  return `<div class="item-row">
    <strong>${escapeHtml(row.title||"")}</strong>
    ${amount}
    <small>${escapeHtml(row.memo||"")}</small>
  </div>`;
}

function openBatchEditor(type){
  state.editingType=type;
  const meta=CATEGORY_META[type]||CATEGORY_META.memo;
  state.draftRows=parseRowsByType(type).map(row=>({title:row.title||"",amount:row.amount||"",memo:row.memo||""}));
  if(!state.draftRows.length) state.draftRows=[createEmptyRow()];

  setText("modalTitle",`${meta.label}編集`);
  setText("modalDescription",`追加・削除・変更はまだ保存されません。「${meta.label}を更新」を押した時だけ保存されます。`);
  setText("saveCategoryButton",`${meta.label}を更新`);
  setText("deleteCategoryButton",`${meta.label}全体を削除`);

  renderDraftRows();
  openModal();
}

function renderDraftRows(){
  const container=document.getElementById("batchRows");
  if(!container) return;

  const type=state.editingType;
  const meta=CATEGORY_META[type]||CATEGORY_META.memo;
  container.innerHTML=state.draftRows.map((row,index)=>`
    <div class="batch-row">
      <input data-field="title" data-index="${index}" placeholder="${meta.placeholder}" value="${escapeAttr(row.title||"")}">
      <input data-field="amount" data-index="${index}" type="number" min="0" step="1" placeholder="金額" value="${escapeAttr(row.amount||"")}" ${meta.amount?"":"disabled"}>
      <textarea data-field="memo" data-index="${index}" placeholder="メモ・詳細">${escapeHtml(row.memo||"")}</textarea>
      <button type="button" class="danger-button" data-delete-row="${index}">削除</button>
    </div>
  `).join("");

  container.querySelectorAll("input,textarea").forEach(input=>{
    input.addEventListener("input",event=>{
      const index=Number(event.target.dataset.index);
      const field=event.target.dataset.field;
      state.draftRows[index][field]=event.target.value;
      updateDraftTotal();
    });
  });

  container.querySelectorAll("[data-delete-row]").forEach(button=>{
    button.addEventListener("click",event=>{
      state.draftRows.splice(Number(event.target.dataset.deleteRow),1);
      if(!state.draftRows.length) state.draftRows=[createEmptyRow()];
      renderDraftRows();
    });
  });

  updateDraftTotal();
}

function updateDraftTotal(){
  const meta=CATEGORY_META[state.editingType]||CATEGORY_META.memo;
  const total=sumRows(state.draftRows);
  setText("batchTotal",meta.amount?`合計 ${formatCurrency(total)}`:`${state.draftRows.filter(isMeaningfulRow).length}件`);
}

async function saveCurrentCategory(){
  const type=state.editingType;
  const meta=CATEGORY_META[type]||CATEGORY_META.memo;
  const block=getBlockByType(type);
  const rows=state.draftRows.filter(isMeaningfulRow).map(row=>({title:(row.title||"").trim(),amount:Number(row.amount||0),memo:(row.memo||"").trim()}));
  const total=sumRows(rows);

  setStatus(`${meta.label}保存中`,"loading");
  try{
    const payload={blockType:type,blockTitle:meta.title,blockContent:JSON.stringify(rows),amount:meta.amount?total:0,status:"更新済み",sortOrder:getSortOrder(type)};
    if(block?.blockId){
      await postGas("updateBlock",Object.assign({blockId:block.blockId},payload));
    }else{
      await postGas("createBlock",payload);
    }
    closeModal();
    await loadDashboard();
  }catch(error){
    alert(error.message);
    setStatus("保存エラー","error");
  }
}

async function deleteCurrentCategory(){
  if(!state.editingType) return;
  await deleteCategory(state.editingType);
}

async function deleteCategory(type){
  const meta=CATEGORY_META[type]||CATEGORY_META.memo;
  const block=getBlockByType(type);
  if(!block?.blockId){
    alert(`削除できる${meta.label}がありません。`);
    return;
  }
  if(!confirm(`${meta.label}全体を削除しますか？`)) return;

  setStatus(`${meta.label}削除中`,"loading");
  try{
    await postGas("deleteBlock",{blockId:block.blockId});
    closeModal();
    await loadDashboard();
  }catch(error){
    alert(error.message);
    setStatus("削除エラー","error");
  }
}

function getBlockByType(type){return(state.dashboard?.blocks||[]).find(block=>block.blockType===type)||null;}

function parseRowsByType(type){
  const block=getBlockByType(type);
  if(!block) return [];
  try{
    const parsed=JSON.parse(block.blockContent||"[]");
    if(Array.isArray(parsed)) return parsed;
  }catch(error){}
  if(block.blockContent){
    return block.blockContent.split(/\n+/).filter(Boolean).map(text=>({title:text,amount:Number(block.amount||0),memo:""}));
  }
  return [];
}

function createEmptyRow(){return{title:"",amount:"",memo:""};}
function isMeaningfulRow(row){return(row.title||"").trim()||Number(row.amount||0)>0||(row.memo||"").trim();}
function sumRows(rows){return rows.reduce((sum,row)=>sum+Number(row.amount||0),0);}
function getSortOrder(type){return{preparation:1,expense:2,schedule:3,memo:4}[type]||999;}

function openModal(){const modal=document.getElementById("batchModal");modal.classList.add("is-open");modal.setAttribute("aria-hidden","false");}
function closeModal(){const modal=document.getElementById("batchModal");modal.classList.remove("is-open");modal.setAttribute("aria-hidden","true");state.editingType=null;state.draftRows=[];}

function renderError(message){const container=document.getElementById("blockList");if(container) container.innerHTML=`<p class="error-state">${escapeHtml(message)}</p>`;}
function getLineUserId(){return state.profile?.userId||"";}
function getDisplayName(){return state.profile?.displayName||"unknown";}
function setStatus(text,type){const element=document.getElementById("connectionStatus");if(!element)return;element.textContent=text;element.className=`status-badge ${type||""}`;}
function setText(id,text){const element=document.getElementById(id);if(element) element.textContent=text;}
function formatCurrency(value){return new Intl.NumberFormat("ja-JP",{style:"currency",currency:"JPY",maximumFractionDigits:0}).format(Number(value||0));}
function formatDateTime(value){if(!value)return"-";const date=new Date(value);if(Number.isNaN(date.getTime()))return value;return new Intl.DateTimeFormat("ja-JP",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(date);}
function escapeHtml(value){return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}
function escapeAttr(value){return escapeHtml(value).replace(/`/g,"&#096;");}
