import assert from 'node:assert/strict';
import {readFile,readdir,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import * as PDFLib from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {requiresContract,signedContract,CONTRACT_VERSION} from '../public/contract.mjs';
import handler from '../api/inquiry.js';
const root=path.resolve('dist');
async function walk(p){const out=[];for(const entry of await readdir(p,{withFileTypes:true})){const file=path.join(p,entry.name);out.push(...(entry.isDirectory()?await walk(file):[file]));}return out;}
const htmlFiles=(await walk(root)).filter(f=>f.endsWith('.html'));
for(const file of htmlFiles){const html=await readFile(file,'utf8');assert.equal((html.match(/<h1[ >]/g)||[]).length,1,file+' must have one h1');assert(!html.includes('images.squarespace-cdn.com'));assert(!html.includes('static1.squarespace.com'));for(const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)){let target=path.join(root,match[1]);if(match[1].endsWith('/'))target=path.join(target,'index.html');await stat(target).catch(()=>{throw Error(`Missing local resource ${match[1]} in ${file}`)})}assert.match(html,/<meta property="og:image" content="https?:\/\//);}
const itemHtml=await readFile('dist/rentals/giant-connect-four/index.html','utf8');assert.match(itemHtml,/og:image" content="[^\"]+\/og.png/);
assert(requiresContract({service:'Romantic hotel setup',items:[]}));assert(requiresContract({service:'Lawn game rentals',items:['bridalhotelsetup']}));assert(!requiresContract({service:'Lawn game rentals',items:['giantjenga']}));
const data={name:'QA Test Customer',email:'qa@example.invalid',phone:'',date:'2099-08-15',type:'Wedding',guests:'80',venue:'QA Test Venue - not a real booking',package:'Help me choose',service:'Romantic hotel setup',message:'AUTOMATED TEST - DO NOT SEND',items:['deluxe-package-9r5ts'],signature:'QA Test Customer',consent:true,contractConsent:true,contractVersion:CONTRACT_VERSION,reference:'00000000-0000-4000-8000-000000000001'};
async function invoke(body,method='POST'){let status,result;const req={method,headers:{'content-type':'application/json'},body};const res={setHeader(){},status(s){status=s;return this},json(j){result=j;return this}};await handler(req,res);return {status,result};}
const oldKey=process.env.RESEND_API_KEY;delete process.env.RESEND_API_KEY;
assert.equal((await invoke({...data,signature:'',contractConsent:false})).status,400);
assert.equal((await invoke({...data,service:'Lawn game rentals',signature:'',contractConsent:false})).status,400);
assert.equal((await invoke({...data,items:['unknown']})).status,400);
assert.equal((await invoke({...data,date:'2099-02-31'})).status,400);
assert.equal((await invoke({...data,contractVersion:'old-version'})).status,400);
assert.equal((await invoke(data,'GET')).status,405);
assert.equal((await invoke(data)).status,503);
const original=await readFile('public/contracts/hotel-room-setup.pdf');const fontBytes=await readFile('public/assets/font-5.ttf');const digest=createHash('sha256').update(original).digest('hex');
const signed=await signedContract({PDFLib,fontkit,original,fontBytes,data,timestamp:'2026-09-25T02:00:00.000Z',reference:data.reference,digest,received:false});assert.equal((await PDFLib.PDFDocument.load(signed)).getPageCount(),7);
if(process.env.QA_PDF_OUTPUT)await writeFile(process.env.QA_PDF_OUTPUT,signed);
let requestPayload;const actualFetch=globalThis.fetch;const oldFrom=process.env.INQUIRY_FROM;process.env.RESEND_API_KEY='test-only';process.env.INQUIRY_FROM='Test <test@example.invalid>';
globalThis.fetch=async (url,options)=>{assert.equal(url,'https://api.resend.com/emails');requestPayload=JSON.parse(options.body);return {ok:true}};
try{const response=await invoke(data);assert.equal(response.status,200);assert.equal(requestPayload.attachments.length,1);assert(response.result.signedPdf);assert.equal(requestPayload.reply_to,data.email);assert.equal((await PDFLib.PDFDocument.load(Buffer.from(response.result.signedPdf,'base64'))).getPageCount(),7);}finally{globalThis.fetch=actualFetch;if(oldKey)process.env.RESEND_API_KEY=oldKey;else delete process.env.RESEND_API_KEY;if(oldFrom)process.env.INQUIRY_FROM=oldFrom;else delete process.env.INQUIRY_FROM;}
console.log(`PASS: ${htmlFiles.length} pages, local links/assets, sharing metadata, contract enforcement, signed PDF, and mocked email attachment. No email sent.`);
