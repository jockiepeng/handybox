import test from 'node:test';
import assert from 'node:assert/strict';
import pdfLib from 'pdf-lib';
const { PDFDocument } = pdfLib;
import { loadPdf, assemblePdf, splitPdf } from '../src/tools/media/pdf.mjs';
async function fixture(widths){const doc=await PDFDocument.create();for(const w of widths)doc.addPage([w,300]);return doc.save();}
test('merged PDF preserves actual pages in input order',async()=>{const a=await loadPdf(await fixture([100,200]));const b=await loadPdf(await fixture([400]));const bytes=await assemblePdf([a,b]);assert.equal(new TextDecoder().decode(bytes.subarray(0,5)),'%PDF-');const out=await PDFDocument.load(bytes);assert.deepEqual(out.getPages().map(p=>p.getWidth()),[100,200,400]);});
test('reorder PDF keeps duplicate selections and requested order',async()=>{const doc=await loadPdf(await fixture([100,200,400]));const out=await PDFDocument.load(await assemblePdf([doc],['3,1,1']));assert.deepEqual(out.getPages().map(p=>p.getWidth()),[400,100,100]);});
test('split emits independent valid PDFs for each range group',async()=>{const doc=await loadPdf(await fixture([100,200,400]));const files=await splitPdf(doc,'1-2;3');assert.equal(files.length,2);const a=await PDFDocument.load(files[0]);const b=await PDFDocument.load(files[1]);assert.deepEqual(a.getPages().map(p=>p.getWidth()),[100,200]);assert.deepEqual(b.getPages().map(p=>p.getWidth()),[400]);});
test('invalid bytes and out-of-bounds PDF pages fail',async()=>{await assert.rejects(()=>loadPdf(new TextEncoder().encode('hello')),/PDF/i);const doc=await loadPdf(await fixture([100]));await assert.rejects(()=>assemblePdf([doc],['2']),/bounds/);await assert.rejects(()=>splitPdf(doc,'1;;1'));});
