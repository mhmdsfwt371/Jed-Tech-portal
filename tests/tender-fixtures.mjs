// Invented QA inputs only. No mailbox content or client documents belong in this repository.
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { zipSync, strToU8 } from '../assets/vendor/fflate.mjs';
export function spreadsheetLibrary() {
  const scope = {}; vm.createContext(scope);
  vm.runInContext(readFileSync(new URL('../assets/vendor/xlsx.full.min.js',import.meta.url),'utf8'),scope);
  return scope.XLSX;
}
export async function fixtures() {
  const pdf = await PDFDocument.create(), font = await pdf.embedFont(StandardFonts.Helvetica), page = pdf.addPage();
  ['Terms and conditions','Scope of work: install thirty cameras.','Site visit is mandatory before submission.','Contract duration: 90 days.','Bid bond: 1%','Submission deadline: 2026-12-04 at 10:00 AM'].forEach((text,i)=>page.drawText(text,{font,size:12,x:40,y:750-i*28}));
  const X = spreadsheetLibrary(), wb = X.utils.book_new();
  X.utils.book_append_sheet(wb,X.utils.aoa_to_sheet([['Item','Description','Qty'],[1,'Camera',30],[2,'Switch',2]]),'BOQ');
  X.utils.book_append_sheet(wb,X.utils.aoa_to_sheet([['Submission deadline','2026-12-05']]),'Schedule');
  const word = '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>كراسة الشروط والمواصفات</w:t></w:r></w:p><w:p><w:r><w:t>الزيارة الميدانية إلزامية</w:t></w:r></w:p><w:p><w:r><w:t>آخر موعد تقديم العروض: ٢٠٢٦/١٢/٠٦</w:t></w:r></w:p></w:body></w:document>';
  return {pdf:new File([await pdf.save()],'terms.pdf'),sheet:new File([X.write(wb,{type:'array',bookType:'xlsx'})],'BOQ.xlsx'),word:new File([zipSync({'word/document.xml':strToU8(word)})],'study.docx')};
}
export async function email(id, { subject='sample: Tender #955512', body='Clarification deadline: 2026-11-28', attachments=[], received=true, date=true, references='' }={}) {
  const lines=['From: sample@example.com','To: qa@example.com','Subject: '+subject,'Message-ID: <'+id+'@example.com>',
    ...(received ? ['Received: from example.com; Thu, 12 Nov 2026 09:02:00 +0300'] : []),
    ...(date ? ['Date: Thu, 12 Nov 2026 09:00:00 +0300'] : []),
    ...(references ? ['In-Reply-To: '+references] : []),'MIME-Version: 1.0','Content-Type: multipart/mixed; boundary="qa"','','--qa','Content-Type: text/plain; charset=utf-8','',body];
  for(const file of attachments) lines.push('--qa','Content-Type: application/octet-stream','Content-Disposition: attachment; filename="'+file.name+'"','Content-Transfer-Encoding: base64','',Buffer.from(await file.arrayBuffer()).toString('base64'));
  lines.push('--qa--',''); return new File([lines.join('\r\n')],id+'.eml');
}
