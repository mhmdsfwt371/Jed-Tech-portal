import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { JSDOM, VirtualConsole } from 'jsdom';
import { IDBFactory } from 'fake-indexeddb';
import { DOMMatrix, ImageData, Path2D } from '@napi-rs/canvas';
import * as core from '../core.js';
import * as config from '../config.js';
import * as systems from '../systems-core.js';
import * as tour from '../tour-demo.js';
import { fixtures, spreadsheetLibrary, email } from './tender-fixtures.mjs';
Object.assign(globalThis,{DOMMatrix,ImageData,Path2D});
const root = new URL('../',import.meta.url), idb = new IDBFactory(), errors = [], instances = [];
const wait = async (predicate,label) => { for(let n=0;n<600;n++) { if(predicate()) return; await new Promise(r=>setTimeout(r,10)); } throw Error(label); };
async function setup(team=false) {
  const vc = new VirtualConsole(); vc.on('jsdomError',error=>errors.push(error));
  const dom = new JSDOM(readFileSync(new URL('index.html',root),'utf8'),{url:'https://local.test/'+(team?'?portal=team':'')+'#tenders',runScripts:'outside-only',virtualConsole:vc});
  instances.push(dom); const w=dom.window;
  const globals = {indexedDB:idb,XLSX:spreadsheetLibrary(),TextEncoder,TextDecoder,Blob,File,Response,Headers,CompressionStream,DecompressionStream,ReadableStream,
    matchMedia:()=>({matches:false,addEventListener(){}}),confirm:()=>true,prompt:()=> 'QA reason',
    fetch:async target=>{try{return new Response(readFileSync(new URL(new URL(target,w.location.href).pathname.slice(1),root),'utf8'));}catch{return new Response(null,{status:404});}},
    FileReader:class {readAsDataURL(blob){blob.arrayBuffer().then(bytes=>{this.result='data:'+(blob.type||'application/octet-stream')+';base64,'+Buffer.from(bytes).toString('base64');this.onload();},error=>{this.error=error;this.onerror();});}},
    imp:specifier=>import(new URL(specifier,root).href),
    injected:{...core,...config,...systems,...tour,tr:core.t,DEFAULT_SYSTEMS:config.SYSTEMS,DEFAULT_SYSTEM_CATEGORIES:config.SYSTEM_CATEGORIES}};
  for(const [key,value] of Object.entries(globals)) Object.defineProperty(w,key,{value,configurable:true});
  Object.defineProperty(w,'crypto',{value:webcrypto});
  w.URL.createObjectURL=()=> 'blob:qa';w.URL.revokeObjectURL=()=>{};
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
  globalThis.DOMParser=w.DOMParser;
  const source=readFileSync(new URL('app.js',root),'utf8').replace(/^import[\s\S]*?from\s+'[^']+';\s*$/gm,match=>{
    const names=match.slice(match.indexOf('{')+1,match.lastIndexOf('}')).split(',').map(x=>x.trim().replace(/\s+as\s+/,': '));return 'const {'+names.join(',')+'}=injected;';
  }).replaceAll("import('./assets/vendor/tender-mail.min.js')","imp('./assets/vendor/tender-mail.min.js')").replaceAll("import('./assets/tender-documents.js')","imp('./assets/tender-documents.js')");
  w.eval(source+'\nwindow.qa={store,tdCommit,tdUpdate,tdImportEmails,tdAnalyzeFiles,tdDocumentView,buildBackup,applyBackup,projectsModel,renderTenders,tdStartAlerts,route,busy:()=>tdBusy,get:()=>tenders};');
  await wait(()=>w.document.querySelector('#tenders-body')?.childElementCount || team&&w.document.querySelector('#version').textContent==='v'+config.PORTAL_VERSION,'boot');
  return dom;
}
try {
  const dom = await setup(), w = dom.window, d=w.document, qa=w.qa;
  const select=s=>d.querySelector(s), event=()=>new w.Event('change',{bubbles:true});
  const choose=(selector,files)=>{const input=select(selector);assert(input,selector);Object.defineProperty(input,'files',{value:files,configurable:true});input.dispatchEvent(event());};
  const button=text=>[...d.querySelectorAll('button')].find(button=>button.textContent===text);
  const legacy={id:'sample:legacy',subject:'sample: Historical bid',date:'2026-11-01',stage:'submitted',stageAt:'2026-11-10',submittedOn:'2026-11-10',due:'2026-11-15',askDue:'2026-11-08',status:'ready',att:[],etimadNo:'1234'};
  await qa.tdCommit({items:[legacy],to:null,pulledAt:''});qa.renderTenders();
  const f=await fixtures(), message=await email('sample-import',{attachments:[f.pdf,f.sheet,f.word,new File(['x'],'logo.png')]});
  choose('.td-pull .td-mail-drop input',[message]);
  await wait(()=>qa.get().items.length===2&&!qa.busy(),'mail import and extraction');
  const row=()=>qa.get().items.find(row=>row.etimadNo==='955512');
  assert.equal(row().files.length,5);assert.equal(row().date,'2026-11-12');assert.equal(row().dateSource,'received');
  assert.equal(Boolean(row().manual),false,'an imported email must not be labelled manual');
  assert.equal(row().due,'','conflicting document dates need review');assert.equal(row().askDue,'2026-11-28');
  button('Use 2026-12-04 · 10:00').click();await wait(()=>row().due==='2026-12-04','date selected');assert.equal(row().dateSources.due,'manual');
  const category=select('[aria-label="File category study.docx"]') || [...d.querySelectorAll('.td-file-kind')].find(x=>x.getAttribute('aria-label').endsWith('study.docx'));
  category.value='study';category.dispatchEvent(event());await wait(()=>row().files.find(file=>file.name==='study.docx').kind==='study','category');
  const fileFilter=select('[aria-label="Filter file category"]');fileFilter.value='boq';fileFilter.dispatchEvent(event());assert.equal(d.querySelectorAll('.td-file').length,1);
  select('.td-file-view').click();assert(select('.td-doc-dialog').textContent.includes('Camera'));assert(select('.td-doc-dialog').textContent.includes('30'));select('.td-doc-dialog').close();
  const reset=select('[aria-label="Filter file category"]');reset.value='all';reset.dispatchEvent(event());
  const remove=[...d.querySelectorAll('.td-file button')].find(x=>x.textContent==='✕'&&x.getAttribute('aria-label').endsWith('logo.png'));remove.click();await wait(()=>row().files.length===4,'remove attachment');
  const beforeDuplicate=await qa.buildBackup();
  await qa.tdImportEmails([message]);assert.equal(row().files.length,4);assert(select('.td-pull [role=status]').textContent.includes('Duplicates 1'));
  const stage=async (value,expected=value)=>{const input=select('.td-row.on .td-stage');input.value=value;input.dispatchEvent(event());await wait(()=>row().stage===expected,'stage '+value);};
  await stage('ready','received');assert.equal(row().stage,'received');
  const upload=async(kind,file)=>{const control=select('.td-detail .td-file-controls select');control.value=kind;choose('.td-detail .td-file-controls input',[file]);await wait(()=>row().files.some(f=>f.name===file.name)&&!qa.busy(),'upload '+file.name);};
  await upload('technical',new File([await f.pdf.arrayBuffer()],'technical.pdf'));
  await stage('ready','received');assert.equal(row().stage,'received');
  await upload('financial',new File([await f.sheet.arrayBuffer()],'financial.xlsx'));
  await stage('prep');await stage('ready');assert.equal(row().stage,'ready');
  const removeTech=[...d.querySelectorAll('.td-file button')].find(x=>x.textContent==='✕'&&x.getAttribute('aria-label').endsWith('technical.pdf'));removeTech.click();
  await new Promise(r=>setTimeout(r,20));assert(row().files.some(f=>f.name==='technical.pdf'),'cannot remove final required offer while ready');
  await stage('submitted');assert.equal(row().stage,'submitted');assert.equal(qa.projectsModel().filter(p=>p.tender===row().id).length,1);assert(qa.tdStartAlerts());
  for (const next of ['received','screen','decide','prep','ready','submitted','won','lost','cancelled','declined','submitted']) {
    await stage(next);assert.equal(row().stage,next,'lifecycle '+next);
  }
  assert(row().activity.some(entry=>entry.action==='stage'&&entry.label==='won'));
  assert.equal(row().reason,'QA reason');
  assert.equal(qa.get().items.find(x=>x.id===legacy.id).due,'2026-11-15');
  const backup=JSON.parse(JSON.stringify(await qa.buildBackup()));const backed=backup.tenders.items.find(x=>x.id===row().id);
  assert(backed.files.every(f=>f.data.startsWith('data:')));assert(backed.files.find(f=>f.name==='BOQ.xlsx').analysis.tables[0].rows[1][2]==='30');
  await qa.applyBackup(beforeDuplicate);assert.equal(row().due,'2026-12-04');assert.equal(row().stage,'submitted');assert(!row().files.some(f=>f.name==='logo.png'));
  await qa.applyBackup(backup);assert.equal(row().files.find(f=>f.name==='study.docx').kind,'study');
  const reopened=await setup();assert.equal(reopened.window.qa.get().items.find(x=>x.id===row().id).stage,'submitted');reopened.window.close();
  const stale=await setup(), staleState=stale.window.qa.get();
  await qa.tdUpdate(row().id,{note:'Newer tab'});
  await assert.rejects(()=>stale.window.qa.tdCommit({...staleState,to:'2026-11-13'}),'stale tabs must not overwrite newer data');stale.window.close();
  const bulk=Array.from({length:120},(_,index)=>({id:'sample:bulk:'+index,name:'qa-attachment-'+index+'.txt',kind:'other',blob:new Blob(['QA document '+index])}));
  await qa.tdUpdate(row().id,{files:[...row().files,...bulk]});qa.renderTenders();
  assert.equal(d.querySelectorAll('.td-file').length,40,'large file lists use bounded rendering');
  button('Show more files').click();assert.equal(d.querySelectorAll('.td-file').length,80);
  const fileSearch=select('[aria-label="Search files"]');fileSearch.value='qa-attachment-119';fileSearch.closest('form').dispatchEvent(new w.Event('submit',{cancelable:true}));
  assert.equal(d.querySelectorAll('.td-file').length,1);assert(select('.td-file').textContent.includes('qa-attachment-119'));
  await qa.tdAnalyzeFiles(row().id,bulk.map(file=>file.id));assert.equal(row().files.filter(file=>file.id.startsWith('sample:bulk:')&&file.analysis?.state==='read').length,120);
  const originalPut=qa.store.putTenders;qa.store.putTenders=async()=>{throw new Error('QuotaExceededError');};
  assert.equal(await qa.tdUpdate(row().id,{note:'Must not appear saved'}),false);assert.equal(row().note,'Newer tab');qa.store.putTenders=originalPut;
  const invalid=await email('sample-missing-date',{subject:'sample: Missing date',received:false,date:false});
  await qa.tdImportEmails([invalid]);assert.equal(qa.get().items.length,2,'missing receipt and sent dates must not invent today');
  const hostile=await email('sample-hostile',{subject:'sample: <img src=x onerror=alert(1)>',body:'Scope of work: <script>alert(1)</script>'});
  await qa.tdImportEmails([hostile]);assert.equal(d.querySelectorAll('#tenders-body img').length,0);assert(d.querySelector('#tenders-body').textContent.includes('<img src=x onerror=alert(1)>'));
  for(const route of ['home','me','tools','data','kpi','team','weights','dev','guide','mailfile','overtime','planner','readings','tenders']) {w.location.hash='#'+route;qa.route();assert(!select('#view-'+route).hidden,'route '+route);}
  for(const lang of ['ar','ur','en']) {const langSelect=select('#lang-select');langSelect.value=lang;langSelect.dispatchEvent(event());await wait(()=>d.documentElement.lang===lang,'language '+lang);}
  const priorTheme=d.documentElement.dataset.theme;select('#theme-btn').click();assert.notEqual(d.documentElement.dataset.theme,priorTheme);
  const team=await setup(true);assert.equal(team.window.qa.get(),null);assert.equal((await team.window.qa.buildBackup()).tenders,null);team.window.close();
  assert.deepEqual(errors,[],'uncaught UI errors');
  console.log('tender-integration: passed Outlook import, source dates, conflict review, categories, table preview, filtering, deletion, deduplication, offer gates, stage transitions, My Projects, alerts, backup/restore, reload, stale tabs, 120-file reading/pagination/search, storage-failure reporting, missing-date rejection, literal HTML display, all management routes, languages, theme and team separation');
} finally { for(const dom of instances) dom.window.close(); }
