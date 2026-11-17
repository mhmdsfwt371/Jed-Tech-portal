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
  w.eval(source+'\nwindow.qa={store,tdCommit,tdUpdate,tdImportEmails,tdImportStudies,tdAnalyzeFiles,tdDocumentView,buildBackup,applyBackup,projectsModel,renderTenders,tdStartAlerts,route,busy:()=>tdBusy,get:()=>tenders,tdTeamText:typeof tdTeamText==="function"?tdTeamText:null,tdTenderText:typeof tdTenderText==="function"?tdTenderText:null,tdYearHtml:typeof tdYearHtml==="function"?tdYearHtml:null,tenderYearReport:injected.tenderYearReport};');
  await wait(()=>w.document.querySelector('#tenders-body')?.childElementCount || team&&w.document.querySelector('#version').textContent==='v'+config.PORTAL_VERSION,'boot');
  return dom;
}
try {
  const dom = await setup(), w = dom.window, d=w.document, qa=w.qa;
  const select=s=>d.querySelector(s), event=()=>new w.Event('change',{bubbles:true});
  const choose=(selector,files)=>{const input=select(selector);assert(input,selector);Object.defineProperty(input,'files',{value:files,configurable:true});input.dispatchEvent(event());};
  const button=text=>[...d.querySelectorAll('button')].find(button=>button.textContent===text);
  // v9.57: the deadline is two days from whenever the test runs. It was the fixed day 15 November 2026, so the «closing soon» alert
  // asserted below existed only until that day passed — and the whole suite turned red on the 16th with no change to the code.
  const soonDay=new Date(Date.now()+3*36e5+2*864e5).toISOString().slice(0,10);
  const legacy={id:'sample:legacy',subject:'sample: Historical bid',date:'2026-11-01',stage:'submitted',stageAt:'2026-11-10',submittedOn:'2026-11-10',due:soonDay,askDue:'2026-11-08',status:'ready',att:[],etimadNo:'1234'};
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
  // v9.54 (ADR-0128): the offer files are optional — a tender moves to «ready» without them, and back for the rest of this run
  await stage('ready');assert.equal(row().stage,'ready');await stage('received');
  const upload=async(kind,file)=>{const control=select('.td-detail .td-file-controls select');control.value=kind;choose('.td-detail .td-file-controls input',[file]);await wait(()=>row().files.some(f=>f.name===file.name)&&!qa.busy(),'upload '+file.name);};
  await upload('technical',new File([await f.pdf.arrayBuffer()],'technical.pdf'));
  await upload('financial',new File([await f.sheet.arrayBuffer()],'financial.xlsx'));
  await stage('prep');await stage('ready');assert.equal(row().stage,'ready');
  const removeTech=[...d.querySelectorAll('.td-file button')].find(x=>x.textContent==='✕'&&x.getAttribute('aria-label').endsWith('technical.pdf'));removeTech.click();
  await wait(()=>!row().files.some(f=>f.name==='technical.pdf'),'an offer file can be removed while ready');assert.equal(row().stage,'ready');
  await stage('submitted');assert.equal(row().stage,'submitted');assert.equal(qa.projectsModel().filter(p=>p.tender===row().id).length,1);assert(qa.tdStartAlerts());
  for (const next of ['received','screen','decide','prep','ready','submitted','won','lost','cancelled','declined','submitted']) {
    await stage(next);assert.equal(row().stage,next,'lifecycle '+next);
  }
  assert(row().activity.some(entry=>entry.action==='stage'&&entry.label==='won'));
  assert.equal(row().reason,'QA reason');
  assert.equal(qa.get().items.find(x=>x.id===legacy.id).due,soonDay);
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
  // ---- v9.55, the audit's findings. Each of these failed on v9.54. ----
  // (1) A site visit and a bid opening read from an attached document reach the record — they were worked out and then dropped.
  const mk=(id,subject,text)=>({id,subject,date:'2026-11-12',stage:'received',stageAt:'2026-11-12',status:'open',att:[],files:[{id:id+':f',name:'terms.txt',kind:'other',blob:new Blob([text])}]});
  await qa.tdCommit({...qa.get(),items:[mk('sample:dates','sample: dates from the booklet','Site visit date: 2026-11-20\nBid opening: 2026-12-01\nSubmission deadline: 2026-11-30'),...qa.get().items]});
  await qa.tdAnalyzeFiles('sample:dates',['sample:dates:f']);
  const dated=()=>qa.get().items.find(x=>x.id==='sample:dates');
  assert.equal(dated().due,'2026-11-30');assert.equal(dated().visit,'2026-11-20','the site visit read from a document is saved');assert.equal(dated().openAt,'2026-12-01','the bid opening read from a document is saved');
  assert.equal(dated().dateSources.visit,'document');
  // (2) The same study imported twice writes one history line, not two.
  const studyFile=()=>new File([JSON.stringify({schema:'afaqy-tender-study/v1',tool:'QA analyzer',tenders:[{subject:'sample: dates from the booklet',etimadNo:'777001',fees:'1,500',value:'see the BOQ',decision:'review',decisionWhy:'needs a partner',dates:{askDue:'2026-11-18',visit:'20/11/2026'}}]})],'study.json');
  await qa.tdImportStudies([studyFile()]);
  assert.equal(dated().etimadNo,'777001');assert.equal(dated().fees,1500,'an amount written as text is read');assert.equal(dated().askDue,'2026-11-18','a date written as plain text is read');assert(dated().value==null,'words are not an amount');
  const lines=dated().activity.filter(a=>a.action==='study').length;assert.equal(lines,1);
  // (3) What the study held but the register could not read is said on the page, by field name.
  assert(select('.td-study-res .td-study-skip')?.textContent.includes('Estimated value'),'the unread value is named');assert(select('.td-study-res .td-study-skip').textContent.includes('Site-visit'),'the day-first date is named');
  await qa.tdImportStudies([studyFile()]);
  assert.equal(dated().activity.filter(a=>a.action==='study').length,lines,'a repeated import adds no history line');
  // (4) The result block can be put away.
  select('.td-study-res .td-study-close').click();assert.equal(select('.td-study-res'),null,'the import result closes');
  // (5) An empty amount stays empty across reloads: it used to come back as 0 after a save, hiding «to fill» and blocking the study.
  const again=await setup();assert.equal(again.window.qa.get().items.find(x=>x.id==='sample:dates').value,null);
  await again.window.qa.tdUpdate('sample:dates',{note:'saved after a reload'});again.window.close();
  const third=await setup(), kept=third.window.qa.get().items.find(x=>x.id==='sample:dates');
  assert.equal(kept.value,null,'an empty estimated value is still empty after reload, save, reload');assert.equal(kept.fees,1500);
  assert(core.tenderNeeds(kept).includes('due')===false&&core.tenderNeeds({...kept,stage:'prep'}).includes('value'),'and it is still asked for while preparing');third.window.close();
  // ---- v9.57 (ADR-0130): the correspondence read from the mails themselves. Each of these failed on v9.56. ----
  // A window of its own: the checks above saved from other windows, so the first one holds an older copy of the register and
  // (rightly) may not write over the newer one.
  { const dom5=await setup(), w=dom5.window, d=w.document, qa=w.qa, select=s=>d.querySelector(s);
  // (1) A tender that first reaches the register as a reply: the quoted message is read as its own entry, with its writer and time,
  //     and the tender takes the day of that oldest message — not the day of the reply.
  const older=['From: Rami Qasim <r.qasim@example.com>','Sent: Tuesday, November 10, 2026 9:15 AM','To: Zaid Fares <zaid.fares@example.com>','Subject: sample: Thread tender','','The booklet is attached. Submission deadline: 2026-11-19 at 10:00 AM','','Rami Qasim','+966 50 000 0001'];
  const reply=()=>email('sample-thread-1',{subject:'RE: sample: Thread tender',body:['Thanks, received.','',...older].join('\r\n')});
  await qa.tdImportEmails([await reply()]);
  const th=()=>qa.get().items.find(x=>x.id==='sample: thread tender');
  assert(th(),'the reply registered its tender');
  assert.deepEqual(th().thread.map(e=>[e.at,e.name||e.addr,e.text]),[['2026-11-10T09:15','Rami Qasim','The booklet is attached. Submission deadline: 2026-11-19 at 10:00 AM'],['2026-11-12T09:00','sample@example.com','Thanks, received.']]);
  assert.equal(th().date,'2026-11-10','first seen through a reply: the oldest message dates it');assert.equal(th().dateSource,'thread');assert.equal(th().stageAt,'2026-11-10');
  assert.equal(th().due,'2026-11-19');assert.equal(th().dueTime,'10:00');
  const panel=()=>select('dialog.td-dlg .td-thread'), entries=()=>[...d.querySelectorAll('dialog.td-dlg .td-thr-entry')];
  // v9.58: the card shows the latest messages; the whole conversation is a fold that «The whole timeline» opens
  assert(!panel().open,'the conversation is folded under the card');assert.equal(d.querySelectorAll('dialog.td-dlg .td-card-msg').length,2,'the latest messages are on the card');assert.equal(entries().length,2);
  select('dialog.td-dlg .td-card-all').click();assert(panel().open,'«The whole timeline» opens the fold');
  assert(entries()[0].textContent.includes('Rami Qasim')&&entries()[0].textContent.includes('The booklet is attached'));assert(!panel().textContent.includes('+966'),'no phone number on the page');
  assert(select('dialog.td-dlg .td-thr-sum').textContent.includes('Messages: 2 · writers: 2'));assert(select('dialog.td-dlg .td-thr-sum').textContent.includes('the deadline: 6'),'Tuesday 10 to Thursday 19 November: six full working days between');
  assert(select('.td-row.on').textContent.includes('From the oldest message in the thread'),'the list says where the date came from');
  // (2) The same mail again leaves no mark; a later reply that quotes the whole conversation adds only its own message, and the date stays.
  await qa.tdImportEmails([await reply()]);assert.equal(th().thread.length,2);assert.equal(th().messages.length,1);
  const later=await email('sample-thread-2',{subject:'RE: sample: Thread tender',from:'Zaid Fares <zaid.fares@example.com>',sent:'Mon, 16 Nov 2026 18:30:00 +0300',
    body:['The offer is attached for review.','','Zaid Fares','','From: sample@example.com','Sent: Thursday, November 12, 2026 9:00 AM','Subject: RE: sample: Thread tender','','Thanks, received.','',...older].join('\r\n')});
  await qa.tdImportEmails([later]);
  assert.deepEqual(th().thread.map(e=>e.at),['2026-11-10T09:15','2026-11-12T09:00','2026-11-16T18:30'],'three messages, each once');assert.equal(th().thread[2].text,'The offer is attached for review.');
  assert.equal(th().date,'2026-11-10');assert.equal(th().messages.length,2);
  // (3) The hand-over is the manager's mark: one message at a time, and the margin to the deadline is worked out only from it.
  assert(!select('dialog.td-dlg .td-thr-sum').textContent.includes('hand-over'),'nothing is worked out before a message is marked');
  entries()[2].querySelector('.td-thr-mark').click();await wait(()=>th().thread[2].mark==='handover','hand-over marked');
  assert(select('dialog.td-dlg .td-thr-sum').textContent.includes('2 d 15 h before the deadline'),select('dialog.td-dlg .td-thr-sum').textContent);
  assert.equal(d.querySelectorAll('dialog.td-dlg .td-thr-on').length,1);assert.equal(entries()[2].querySelector('.td-thr-mark').getAttribute('aria-pressed'),'true');
  entries()[0].querySelector('.td-thr-mark').click();await wait(()=>th().thread[0].mark==='handover','mark moved');assert.equal(th().thread.filter(e=>e.mark).length,1,'one hand-over message at a time');
  entries()[0].querySelector('.td-thr-mark').click();await wait(()=>!th().thread.some(e=>e.mark),'mark removed');
  entries()[2].querySelector('.td-thr-mark').click();await wait(()=>th().thread[2].mark==='handover','hand-over marked again');
  // (4) Mails kept before this version are read from their saved files; reading them again writes nothing.
  const reread=async()=>{select('dialog.td-dlg .td-thr-rebuild').click();await wait(()=>!qa.busy()&&!select('dialog.td-dlg .td-thr-rebuild').disabled,'re-read');await new Promise(r=>setTimeout(r,50));};
  await reread();assert.equal(th().activity.filter(a=>a.action==='thread').length,0,'nothing new: no history line');assert.equal(th().thread[2].mark,'handover');
  await qa.tdUpdate(th().id,{thread:[]});qa.renderTenders();assert.equal(entries().length,0);assert.equal(select('dialog.td-dlg .td-card-all'),null,'no messages, no link to them');
  await reread();await wait(()=>th().thread.length===3,'the saved mails were read');assert.equal(th().activity.filter(a=>a.action==='thread').length,1);
  await reread();assert.equal(th().activity.filter(a=>a.action==='thread').length,1,'a second reading leaves no mark');
  entries()[2].querySelector('.td-thr-mark').click();await wait(()=>th().thread[2].mark==='handover','hand-over marked after the re-read');
  // (5) The copied text is the same timeline and the same lines.
  let copied='';Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async text=>{copied=text;}},configurable:true});
  select('dialog.td-dlg .td-thr-copy').click();await wait(()=>copied,'copied');
  assert(copied.startsWith('Correspondence timeline — RE: sample: Thread tender'));assert.equal(copied.split('\n').filter(l=>l.startsWith('- ')).length,3);
  assert(copied.includes('Zaid Fares: The offer is attached for review. [Offer hand-over]'));assert(copied.includes('2 d 15 h before the deadline'));
  // (6) The summary window: one row for the tender, with the same facts; the short-notice tile narrows the list.
  select('dialog.td-dlg').close();
  select('.td-sum-btn').click();const sum=select('dialog.cr-modal');assert(sum,'the summary window opened');
  const sumRow=[...sum.querySelectorAll('tbody tr')].find(tr=>tr.textContent.includes('Thread tender'));assert(sumRow,'the tender has its row');
  assert(sumRow.textContent.includes('working days: 6'));assert(sumRow.textContent.includes('2 d 15 h before the deadline'));assert(sumRow.children[3].textContent.startsWith('3 · '));
  const allRows=sum.querySelectorAll('tbody tr').length, handTile=[...sum.querySelectorAll('button.km-tile')].find(b=>b.textContent.includes('Hand-over message marked'));
  assert.equal(handTile.querySelector('b').textContent,'1');handTile.click();assert.equal(sum.querySelectorAll('tbody tr').length,1,'the tile narrows the list to its rows');handTile.click();assert.equal(sum.querySelectorAll('tbody tr').length,allRows);
  sum.close();
  // (7) Backup, restore and a reload keep the conversation and the mark.
  const tb=JSON.parse(JSON.stringify(await qa.buildBackup()));assert.equal(tb.tenders.items.find(x=>x.id==='sample: thread tender').thread.length,3);
  await qa.tdUpdate(th().id,{thread:[]});await qa.applyBackup(tb);assert.equal(th().thread.length,3);assert.equal(th().thread[2].mark,'handover');assert.equal(th().dateSource,'thread');
  w.close();const fourth=await setup(), keptThread=fourth.window.qa.get().items.find(x=>x.id==='sample: thread tender');
  assert.deepEqual(keptThread.thread.map(e=>[e.at,e.mark||'']),[['2026-11-10T09:15',''],['2026-11-12T09:00',''],['2026-11-16T18:30','handover']]);fourth.window.close();
  }
  // ---- v9.58 (ADR-0131): following a tender — the card, «missed», inquiries, the team message, the year report. Each failed on v9.57. ----
  { const dom6=await setup(), w=dom6.window, d=w.document, qa=w.qa, select=s=>d.querySelector(s), ev=()=>new w.Event('change',{bubbles:true});
    const soon=new Date(Date.now()+3*36e5+9*864e5).toISOString().slice(0,10), arrived=new Date(Date.now()+3*36e5-2*864e5).toISOString().slice(0,10);
    const base={subject:'sample: Card tender',date:arrived,stage:'received',stageAt:arrived,status:'open',att:[],due:soon,dueTime:'10:00',entity:'Sample entity',site:'Sample site, gate 3'};
    const was=qa.get()||{items:[],to:null,pulledAt:''};await qa.tdCommit({...was,items:[{...base,id:'sample:card'},...was.items.filter(x=>x.id!=='sample:card')]});qa.renderTenders();
    const card=()=>qa.get().items.find(x=>x.id==='sample:card');
    [...d.querySelectorAll('.td-row')].find(r=>r.textContent.includes('Card tender')).querySelector('.td-subj').click();await wait(()=>select('dialog.td-dlg[open] .td-card'),'card open');
    // (1) one card: four tiles, the stage strip, the dates line, the entity and site on top
    assert.equal(d.querySelectorAll('dialog.td-dlg .td-tile').length,4);assert(select('dialog.td-dlg .td-steps .td-step.now').textContent.includes('Arrived'));
    assert(select('dialog.td-dlg .td-tile-hand').textContent.includes('working days before closing'),'the hand-over tile');assert(select('dialog.td-dlg .td-tl'),'the dates line');
    assert(select('dialog.td-dlg .td-card-chips').textContent.includes('Sample entity'));
    // (2) what is missing is typed on the card itself; the rest is folded, by stage: no value field at arrival
    assert.deepEqual([...d.querySelectorAll('dialog.td-dlg .td-need-box input.td-need')].map(x=>[...x.classList].find(c=>/^td-(owner|etimadNo|due)$/.test(c))).sort(),['td-etimadNo','td-owner']);
    assert(!select('dialog.td-dlg .td-fold-data[open]'),'all data is folded');assert.equal(select('dialog.td-dlg input.td-value'),null,'no estimated value asked at arrival');
    assert(select('dialog.td-dlg .td-fold-data input.td-site'),'a field with a value is shown in its fold');
    // (3) inquiries: added, raised, answered — the answer dates itself
    // what is typed survives a redraw of the window before «Add» is pressed (on a slow machine the window redrew in between)
    const nq=select('dialog.td-dlg .td-inq-new');nq.value='Where is the station?';nq.dispatchEvent(new w.Event('input',{bubbles:true}));qa.renderTenders();
    assert.equal(select('dialog.td-dlg .td-inq-new').value,'Where is the station?','the draft is kept');select('dialog.td-dlg .td-inq-add-btn').click();await wait(()=>(card().inquiries||[]).length===1,'inquiry added');
    assert(card().activity.some(a=>a.action==='inq'),'written in the history');assert.equal(select('dialog.td-dlg .td-inq-new').value,'','the draft is cleared once added');
    const q=()=>card().inquiries[0];const asked=select('dialog.td-dlg .td-inq-asked');asked.value=arrived;asked.dispatchEvent(ev());await wait(()=>q().askedOn===arrived,'raised');
    assert(qa.tdTeamText(card()).includes('Inquiries raised and still unanswered'),'a raised question waits for its answer in the team message');
    const ans=select('dialog.td-dlg .td-inq-ans');ans.value='Gate 3, north side';ans.dispatchEvent(ev());await wait(()=>q().answer==='Gate 3, north side'&&q().answeredOn,'answered');
    assert(select('dialog.td-dlg .td-fold-inq > summary').textContent.includes('unanswered 0'));
    // (4) the team message and the summary say the same dates the card shows
    const team=qa.tdTeamText(card());assert(team.startsWith('Dear colleagues in the tenders team,'));assert(team.includes('working days before closing'));assert(team.includes('Card tender'));assert(!team.includes('Inquiries raised and still unanswered'),'an answered question is not chased');
    assert(qa.tdTenderText(card()).includes('Sample entity'));
    // (5) «missed the deadline» is an outcome with its reason, and it asks for nothing more
    const stSel=select('dialog.td-dlg .td-dlg-top select.td-stage');stSel.value='missed';stSel.dispatchEvent(ev());await wait(()=>card().stage==='missed','missed');
    assert.equal(card().reason,'QA reason');assert(card().decidedOn,'deciding to bid is dated');assert.deepEqual(core.tenderNeeds(card()),[]);
    assert(select('dialog.td-dlg .td-step-end.td-end-missed'),'the strip ends on the outcome');assert(select('dialog.td-dlg .td-fold-data input.td-reason'),'its reason field shows');
    assert(select('.td-pipe-node[data-stage=missed]'),'the pipeline counts it');
    // (6) the year report counts it, with its reason, and the printable page escapes what it prints
    select('dialog.td-dlg').close();select('.td-year-btn').click();const yr=select('dialog.td-yr-dlg');assert(yr,'the year report opened');
    assert([...yr.querySelectorAll('.km-tile')].some(x=>x.textContent.includes('Missed the deadline')&&x.querySelector('b').textContent==='1'));
    const R=qa.tenderYearReport(qa.get().items,arrived.slice(0,4)),html=qa.tdYearHtml(R);assert(html.includes('QA reason'));assert(!html.includes('<img src=x'),'a subject is printed as text');yr.close();
    // (7) the card's new data survives a backup and a reload
    const bk=JSON.parse(JSON.stringify(await qa.buildBackup()));await qa.tdUpdate('sample:card',{inquiries:[],entity:'',site:''});await qa.applyBackup(bk);
    assert.equal(card().inquiries[0].answer,'Gate 3, north side');assert.equal(card().entity,'Sample entity');assert.equal(card().site,'Sample site, gate 3');
    w.close();const again=await setup(),k2=again.window.qa.get().items.find(x=>x.id==='sample:card');assert.equal(k2.stage,'missed');assert.equal(k2.inquiries.length,1);assert.equal(k2.site,'Sample site, gate 3');again.window.close();
  }
  // ---- v9.60 (ADR-0132): the Etimad radar and the platform's dates. Each failed on v9.59. ----
  { const dom7=await setup(), w=dom7.window, d=w.document, qa=w.qa, select=s=>d.querySelector(s);
    const arrived=new Date(Date.now()+3*36e5-2*864e5).toISOString().slice(0,10), ahead=(n)=>new Date(Date.now()+3*36e5+n*864e5).toISOString().slice(0,10);
    const dash={id:'sample:dash',subject:'توريد وتركيب داش كام - جهة تجريبية',date:arrived,stage:'prep',stageAt:arrived,status:'open',att:[],due:'2026-11-19',dueTime:'',fees:0,etimadNo:'',dateSources:{due:'analyzer'},fieldSources:{fees:'analyzer'}};
    const exact={id:'sample:exact',subject:'sample: Exact tender',date:arrived,stage:'received',stageAt:arrived,status:'open',att:[],due:'',etimadNo:'261139000777'};
    const was=qa.get()||{items:[],to:null,pulledAt:''};await qa.tdCommit({...was,items:[dash,exact,...was.items.filter(x=>!x.id.startsWith('sample:dash')&&x.id!=='sample:exact')]});qa.renderTenders();
    const it=(id)=>qa.get().items.find(x=>x.id===id);
    const pull={schema:'afaqy-etimad-radar/v1',pulledAt:`${arrived}T15:38`,partial:true,tenders:[
      {ref:'261139004629',no:'126526 / 130720',title:'WM - توريد وتركيب داش كام',entity:'جهة تجريبية بالمدينة المنورة',status:'active',due:`${ahead(13)} 09:59`,askDue:ahead(8),fees:200,link:'https://tenders.etimad.sa/Tender/DetailsForVisitor?STenderId=qa1'},
      {ref:'261139000777',title:'sample: Exact tender',entity:'Sample entity',status:'active',due:`${ahead(20)} 10:00`,fees:500},
      {ref:'261139000888',title:'توريد كاميرات مراقبة للمستودع',entity:'أمانة محافظة جدة',status:'active',due:`${ahead(5)} 09:59`,fees:300},
      {ref:'261139000999',title:'توريد وتركيب شبكة لاسلكية للمبنى',entity:'جهة تجريبية',status:'active',due:`${ahead(25)} 09:59`,fees:100},
      {ref:'261139000555',title:'توريد أدوية',entity:'جهة تجريبية',status:'active',due:`${ahead(4)} 09:59`}]};
    // (1) the pull file dropped anywhere on the register is told apart from a study, and Etimad sets the dates of the tender it knows by number
    const file=new w.File([JSON.stringify(pull)],'etimad-radar.json',{type:'application/json'}),any=select('.td-drop-any input');Object.defineProperty(any,'files',{value:[file],configurable:true});any.dispatchEvent(new w.Event('change',{bubbles:true}));
    await wait(()=>it('sample:exact').due===ahead(20)&&!qa.busy(),'Etimad applied');
    assert.equal(it('sample:exact').dueTime,'10:00');assert.equal(it('sample:exact').dateSources.due,'etimad');assert.equal(it('sample:exact').fees,500);assert.equal(it('sample:exact').fieldSources.fees,'etimad');
    assert.equal(it('sample:dash').due,'2026-11-19','a looser title is not linked by itself');assert(select('.et-res'),'the import says what it did');
    assert(select('.et-res').textContent.includes('incomplete'),'a partial pull is declared');
    assert(it('sample:exact').activity.some(a=>a.action==='etimad'),'written in the history');
    // (2) the radar window: only our scope, the West filter, a link suggested for the dash-cam tender
    select('.td-radar-btn').click();const rad=()=>select('dialog.et-modal');assert(rad(),'the radar opened');
    const refs=()=>[...rad().querySelectorAll('tr.et-row')].map(r=>r.dataset.ref);
    assert.deepEqual(refs().sort(),['261139000777','261139000888','261139000999','261139004629'],'the medicines tender is not ours');
    [...rad().querySelectorAll('.pill-btn')].find(b=>b.textContent==='Western Region').click();assert.deepEqual(refs().sort(),['261139000888','261139004629']);
    [...rad().querySelectorAll('.pill-btn')].find(b=>b.textContent==='Whole Kingdom').click();
    assert(rad().querySelector('.et-sugg').textContent.includes('WM - توريد وتركيب داش كام'));rad().querySelector('.et-sugg .et-link').click();
    await wait(()=>it('sample:dash').etimadNo==='261139004629','linked');
    assert.deepEqual([it('sample:dash').due,it('sample:dash').dueTime,it('sample:dash').fees,it('sample:dash').dateSources.due],[ahead(13),'09:59',200,'etimad']);
    assert.deepEqual(it('sample:dash').etimadWas,[{field:'due',was:'2026-11-19',src:'analyzer'},{field:'fees',was:'0',src:'analyzer'}]);
    // (3) follow one, hide another
    rad().querySelector('tr[data-ref="261139000888"] .et-follow').click();await wait(()=>qa.get().items.some(x=>x.etimadNo==='261139000888'),'followed');
    const fol=qa.get().items.find(x=>x.etimadNo==='261139000888');assert.deepEqual([fol.stage,fol.due,fol.dueTime,fol.fees,fol.entity],['received',ahead(5),'09:59',300,'أمانة محافظة جدة']);assert(!rad(),'the window closed onto the new tender');
    select('.td-radar-btn').click();rad().querySelector('tr[data-ref="261139000999"] .et-hide').click();await wait(()=>(qa.get().radarIgnore||[]).includes('261139000999'),'hidden');
    assert(!refs().includes('261139000999'));rad().close();
    // (4) the card says what Etimad corrected and where the deadline came from
    [...d.querySelectorAll('.td-row')].find(r=>r.dataset.id==='sample:dash').querySelector('.td-subj').click();await wait(()=>select('dialog.td-dlg[open] .td-card'),'card open');
    const etc=select('dialog.td-dlg .et-card');assert(etc&&etc.textContent.includes('Corrected by Etimad')&&etc.textContent.includes('2026-11-19')&&etc.textContent.includes('the analyzer’s study of the booklet'),etc&&etc.textContent);
    assert(select('dialog.td-dlg .td-tile-due').textContent.includes('Source: the Etimad platform'));assert.equal(select('dialog.td-dlg .et-chip-link').getAttribute('href'),'https://tenders.etimad.sa/Tender/DetailsForVisitor?STenderId=qa1');
    select('dialog.td-dlg').close();
    // (5) a study whose Hijri date was converted wrongly is corrected from the booklet's own words, and says so
    const hij={id:'sample:hijri',subject:'sample: Hijri tender',date:arrived,stage:'received',stageAt:arrived,status:'open',att:[],due:''};await qa.tdCommit({...qa.get(),items:[hij,...qa.get().items]});
    const study=new w.File([JSON.stringify({schema:'afaqy-tender-study/v1',tenders:[{subject:'sample: Hijri tender',dates:{due:{date:'2026-11-19',time:''}},evidence:{due:{file:'booklet.pdf',page:4,quote:'وقت التسليم 16ص 09:30 1448/06/'}}}]})],'study.json',{type:'application/json'});
    await qa.tdImportStudies([study]);assert.equal(it('sample:hijri').due,'2026-11-26');assert(select('.td-study-fix').textContent.includes('Umm al-Qura'));
    // (6) a backup and a reload keep the Etimad facts, what was hidden, and the radar itself (kept on the device)
    const bk=JSON.parse(JSON.stringify(await qa.buildBackup()));await qa.tdCommit({...qa.get(),radarIgnore:[],items:qa.get().items.map(x=>x.id==='sample:dash'?{...x,etimadWas:[],link:''}:x)});await qa.applyBackup(bk);
    assert.deepEqual([...qa.get().radarIgnore],['261139000999']);assert.equal(it('sample:dash').etimadWas.length,2);assert.equal(it('sample:dash').link,'https://tenders.etimad.sa/Tender/DetailsForVisitor?STenderId=qa1');
    w.close();const again=await setup(),d2=again.window.document;assert(d2.querySelector('.td-radar-btn').textContent.includes('2 open tenders'),d2.querySelector('.td-radar-btn').textContent);
    assert.equal(again.window.qa.get().items.find(x=>x.id==='sample:dash').dateSources.due,'etimad');again.window.close();
  }
  assert.deepEqual(errors,[],'uncaught UI errors');
  console.log('tender-integration: passed Outlook import, source dates, conflict review, categories, table preview, filtering, deletion, deduplication, offer gates, stage transitions, My Projects, alerts, backup/restore, reload, stale tabs, 120-file reading/pagination/search, storage-failure reporting, missing-date rejection, literal HTML display, all management routes, languages, theme, team separation, the tender card, «missed», inquiries, the team message, the year report and the correspondence timeline (thread reading, de-duplication, hand-over mark, re-read, copy, summary window, backup and reload)');
} finally { for(const dom of instances) dom.window.close(); }
