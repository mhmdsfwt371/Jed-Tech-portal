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
  const globals = {structuredClone,indexedDB:idb,XLSX:spreadsheetLibrary(),TextEncoder,TextDecoder,Blob,File,Response,Headers,CompressionStream,DecompressionStream,ReadableStream,
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
  w.eval(source+'\nwindow.qa={pwCommit,pwEdit,pwReports,pwXlsx,pwHtml,pwReportTables,pwScreenRows,projWorkspaceBody,projOpen,getWork:()=>projectWork,setRegister:v=>{myRegister=v;},setView:(v,s="",q="")=>{projView=v;projStatus=s;projQuery=q;projAll=true;},store,tdCommit,tdUpdate,tdImportEmails,tdAnalyzeFiles,tdDocumentView,buildBackup,applyBackup,projectsModel,renderTenders,tdStartAlerts,route,busy:()=>tdBusy,get:()=>tenders};');
  await wait(()=>w.document.querySelector('#tenders-body')?.childElementCount || team&&w.document.querySelector('#version').textContent==='v'+config.PORTAL_VERSION,'boot');
  return dom;
}try {
 const dom=await setup(),w=dom.window,d=w.document,qa=w.qa;
 const register={schema:'afaqy-projects-register/v1',asOf:'2026-11-14',items:[
  {id:'sample:p1',name:'sample: Alpha',client:'sample: Client A',status:'won',value:1000,period:'2026',date:'2026-11-01',match:[],not:[],kind:'tender',manual:true},
  {id:'sample:p2',name:'sample: Beta',client:'sample: Client B',status:'lost',value:2000,period:'2026',date:'2026-11-01',match:[],not:[],kind:'commercial',manual:true}],mail:{},board:[],h1:{}};
 qa.setRegister(register);await qa.store.putRegister(register);qa.setView('followup');qa.projOpen();
 const row=()=>qa.projectsModel().find(r=>r.id==='i:sample:p1');
 qa.pwEdit(row());let form=d.querySelector('[data-pw-form]');
 const input=(key,value)=>{const control=form.querySelector(`[data-pw="${key}"]`);control.value=value;control.dispatchEvent(new w.Event(control.tagName==='SELECT'?'change':'input',{bubbles:true}));};
 input('owner','sample: Safwat');input('action','Schedule acceptance');input('actionOwner','sample: Engineer');input('actionDue','2026-11-20');input('execution','ongoing');input('award','800');input('collected','150');
 form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>qa.getWork().items.length===1,'save follow-up');
 assert.equal(row().status,'ongoing');assert.equal(register.items[0].status,'won','tender/register source preserved');assert.equal(qa.getWork().items[0].history.length,1);
 assert(!d.querySelector('.pw-followup').textContent.includes('null'));
 const revision=qa.getWork().revision;
 qa.pwEdit(row());form=d.querySelector('[data-pw-form]');input('owner','Not saved');form.closest('dialog').close();assert.equal(qa.getWork().revision,revision);
 const stale=await setup();stale.window.qa.setRegister(register);
 await qa.pwCommit(core.projectWorkUpdate(qa.getWork(),row(),{risk:'Site access'},{at:'2026-11-14T09:00:00Z',id:'sample:new'}));
 await assert.rejects(()=>stale.window.qa.pwCommit(core.projectWorkUpdate(stale.window.qa.getWork(),row(),{risk:'Stale change'},{at:'2026-11-14T09:01:00Z',id:'sample:stale'})),/revision/);stale.window.close();
 qa.pwEdit(row());form=d.querySelector('[data-pw-form]');input('owner','Must not save');const original=qa.store.putProjectWork;qa.store.putProjectWork=async()=>{throw Error('quota');};form.dispatchEvent(new w.Event('submit',{cancelable:true}));await wait(()=>form.querySelector('[role=alert]').textContent,'storage failure visible');assert.equal(qa.getWork().items[0].owner,'sample: Safwat');qa.store.putProjectWork=original;form.closest('dialog').close();
 const backup=await qa.buildBackup();assert.equal(backup.projectwork.items[0].owner,'sample: Safwat');await qa.applyBackup(backup);assert.equal(qa.getWork().items.length,1);
 const reopened=await setup();assert.equal(reopened.window.qa.getWork().items[0].award,800);reopened.window.close();
 qa.setView('bids','lost');assert.equal(qa.pwScreenRows().length,1);assert.equal(qa.pwScreenRows()[0].name,'sample: Beta');qa.pwReports('xlsx');assert(d.querySelector('[data-pw-preview]').textContent.includes('sample: Beta'));assert(!d.querySelector('[data-pw-preview]').textContent.includes('sample: Alpha'));d.querySelector('.pw-report-dialog').close();
 const report={...core.projectReport(qa.projectsModel(),qa.getWork(),{},'2026-11-14'),generatedAt:'2026-11-14T09:00:00Z',scope:'sample: whole period',files:[{project:'sample: Alpha',name:'<img src=x onerror=alert(1)>.pdf',kind:'study',size:42,at:'2026-11-14'}]};
 let wb;w.XLSX.writeFile=(book)=>{wb=book;};await qa.pwXlsx(report);assert.equal(wb.SheetNames.length,6);const summary=w.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1});assert(summary.some(row=>row[0]==='Award value'&&row[1]===800));assert(summary.some(row=>row[0]==='Collected amount'&&row[1]===150));
 report.rows[0].name='</script><img src=x onerror="window.attacked=1">';
 const html=qa.pwHtml(report,true), dashboard=new JSDOM(html,{runScripts:'dangerously'});assert.equal(dashboard.window.attacked,undefined);assert.equal(dashboard.window.document.querySelectorAll('img').length,1);assert.equal(dashboard.window.document.querySelectorAll('#projects-body tr').length,2);
 const search=dashboard.window.document.querySelector('#search');search.value='Beta';search.dispatchEvent(new dashboard.window.Event('input'));assert.equal(dashboard.window.document.querySelector('#kpi-count').textContent,'1');assert.equal(dashboard.window.document.querySelector('#kpi-offer').textContent,'2,000');assert.equal(dashboard.window.document.querySelectorAll('#projects-body tr').length,1);dashboard.window.close();
 const pdf=qa.pwHtml(report,false);assert(pdf.includes('800'));assert(pdf.includes('150'));assert(!pdf.includes('<script>'));
 const team=await setup(true);assert.equal(team.window.qa.getWork().items.length,0);assert.equal((await team.window.qa.buildBackup()).projectwork,null);team.window.close();
 assert.equal(errors.length,0,errors.map(e=>e.message).join('\n'));
 console.log('project-integration.test.mjs: save/cancel/reopen, stale tabs, quota, restore, scoped export, 6-sheet Excel, interactive HTML, injection and team isolation passed');
} finally {for(const dom of instances)dom.window.close();}
