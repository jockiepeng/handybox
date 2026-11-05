import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectImage, fitDimensions, cropGeometry, parsePageRanges, watermarkPosition, validateImageSize } from '../src/tools/media/core.mjs';

const png = (w,h,animated=false) => { const b=new Uint8Array(animated?53:33); b.set([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82]); const v=new DataView(b.buffer);v.setUint32(16,w);v.setUint32(20,h); b[24]=8;b[25]=6;if(animated){v.setUint32(33,8);b.set([97,99,84,76],37);}return b; };
test('PNG dimensions and alpha derive from bytes',()=>assert.deepEqual(inspectImage(png(640,320)),{mime:'image/png',width:640,height:320,animated:false,alpha:true}));
test('APNG is recognized and rejected',()=>assert.throws(()=>inspectImage(png(2,2,true)),/animated/i));
test('unsupported SVG and GIF cannot be silently rasterized',()=>{assert.throws(()=>inspectImage(new TextEncoder().encode('<svg/>')),/format/i);assert.throws(()=>inspectImage(new TextEncoder().encode('GIF89a')),/format/i);});
test('WebP animation flag is rejected',()=>{const b=new Uint8Array(30);b.set(new TextEncoder().encode('RIFF'));new DataView(b.buffer).setUint32(4,22,true);b.set(new TextEncoder().encode('WEBPVP8X'),8);new DataView(b.buffer).setUint32(16,10,true);b[20]=2;assert.throws(()=>inspectImage(b),/animated/i);});
test('JPEG SOF dimensions ignore misleading extension',()=>{const b=Uint8Array.from([255,216,255,192,0,17,8,0,100,0,200,3,1,17,0,2,17,0,3,17,0,255,217]);assert.deepEqual(inspectImage(b),{mime:'image/jpeg',width:200,height:100,animated:false,alpha:false});});
test('fit never enlarges and preserves ratio within pixel rounding',()=>{assert.deepEqual(fitDimensions(4000,2000,1000),{width:1000,height:500});assert.deepEqual(fitDimensions(80,40,1000),{width:80,height:40});});
test('memory protection rejects oversized dimensions and files',()=>{assert.throws(()=>validateImageSize(6000,6000,50),/limit/i);assert.throws(()=>validateImageSize(100,100,30*1024*1024),/limit/i);assert.throws(()=>validateImageSize(0,1,5),/dimension/i);});
test('crop respects exact user coordinates and bounds',()=>{assert.deepEqual(cropGeometry(640,480,{x:10,y:20,width:100,height:80}),{x:10,y:20,width:100,height:80});assert.throws(()=>cropGeometry(640,480,{x:630,y:0,width:20,height:20}),/bounds/i);assert.throws(()=>cropGeometry(640,480,{x:0,y:0,width:0,height:20}),/positive/i);});
test('PDF ranges support reordering and explicit duplicate pages',()=>assert.deepEqual(parsePageRanges('3, 1-2, 2',4),[2,0,1,1]));
test('PDF range validation catches empty, descending and missing pages',()=>{for(const s of ['', '0','2-1','1,,2','1-5','1.5','x'])assert.throws(()=>parsePageRanges(s,4));});
test('watermark coordinates stay at selected anchor',()=>{assert.deepEqual(watermarkPosition(100,80,30,10,'bottom-right',5),{x:65,y:65});assert.deepEqual(watermarkPosition(100,80,30,10,'center',5),{x:35,y:35});});
