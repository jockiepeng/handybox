import { LIMITS, parsePageRanges } from './core.mjs';
export async function pdfLibrary() {
  const imported=await import('pdf-lib');
  return imported.PDFDocument?imported:imported.default;
}
export async function loadPdf(input) {
  const bytes=input instanceof Uint8Array?input:new Uint8Array(input);
  if(bytes.byteLength>LIMITS.pdfBytes)throw new Error('PDF exceeds 100 MiB limit');
  if(!new TextDecoder().decode(bytes.subarray(0,1024)).includes('%PDF-'))throw new Error('Invalid PDF header');
  const {PDFDocument}=await pdfLibrary();
  let doc;
  try {doc=await PDFDocument.load(bytes,{updateMetadata:false});}catch(e){if(/encrypt/i.test(String(e)))throw new Error('Encrypted PDFs are not supported');throw new Error('Cannot read PDF. Use a valid unencrypted PDF');}
  if(doc.isEncrypted)throw new Error('Encrypted PDFs are not supported');
  if(doc.getPageCount()<1||doc.getPageCount()>LIMITS.pdfPages)throw new Error('PDF must contain 1–1000 pages');
  return doc;
}
export async function assemblePdf(documents,ranges,shouldCancel=()=>false) {
  const {PDFDocument}=await pdfLibrary(),out=await PDFDocument.create();
  let total=0;
  for(let i=0;i<documents.length;i++){
    if(shouldCancel())throw new Error('Cancelled');
    const doc=documents[i],pages=ranges?parsePageRanges(ranges[i],doc.getPageCount()):doc.getPageIndices();
    total+=pages.length;if(total>LIMITS.pdfPages)throw new Error('Output exceeds 1000 page limit');
    const copied=await out.copyPages(doc,pages);for(const p of copied)out.addPage(p);
    await new Promise(resolve=>setTimeout(resolve,0));
  }
  if(!total)throw new Error('Select at least one PDF');
  if(shouldCancel())throw new Error('Cancelled');
  const output=await out.save();
  if(shouldCancel())throw new Error('Cancelled');
  if(output.byteLength>LIMITS.pdfBytes)throw new Error('PDF output exceeds 100 MiB limit');
  return output;
}
export async function splitPdf(doc,groups,shouldCancel=()=>false) {
  const ranges=String(groups).split(';');if(ranges.length>20)throw new Error('Split limit is 20 output files');
  let total=0;for(const range of ranges)total+=parsePageRanges(range,doc.getPageCount()).length;
  if(total>LIMITS.pdfPages)throw new Error('Output exceeds 1000 page limit');
  const results=[];let outputBytes=0;
  for(const range of ranges){if(shouldCancel())throw new Error('Cancelled');const output=await assemblePdf([doc],[range],shouldCancel);outputBytes+=output.byteLength;if(outputBytes>LIMITS.pdfBytes)throw new Error('PDF output exceeds 100 MiB limit');results.push(output);}
  return results;
}
