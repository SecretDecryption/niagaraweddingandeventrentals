import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as PDFLib from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {CONTRACT_VERSION,SIGNATURE_CONSENT,requiresContract,signedContract} from '../public/contract.mjs';
const productsPromise=readFile(new URL('../catalogue.json',import.meta.url),'utf8').then(JSON.parse);
const services=['Lawn game rentals','Event extras','Romantic hotel setup','Bridal hotel setup','Other / help me choose'];
const text=(v,max)=>typeof v==='string'&&v.trim().length<=max?v.trim():null;
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed.'})}
 if(!req.headers['content-type']?.includes('application/json'))return res.status(415).json({error:'JSON required.'});
 const origin=req.headers.origin;
 const allowed=[process.env.SITE_URL,process.env.VERCEL_PROJECT_PRODUCTION_URL&&`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,process.env.VERCEL_URL&&`https://${process.env.VERCEL_URL}`].filter(Boolean).map(v=>{try{return new URL(v).origin}catch{return ''}});
 if(origin&&allowed.length&&!allowed.includes(origin))return res.status(403).json({error:'Please submit from the website.'});
 let input=req.body;try{if(typeof input==='string')input=JSON.parse(input)}catch{return res.status(400).json({error:'Invalid request.'})}
 if(!input||Array.isArray(input)||JSON.stringify(input).length>16000)return res.status(400).json({error:'Request too large or invalid.'});
 if(input.website)return res.status(400).json({error:'Unable to submit this inquiry.'});
 const data={};for(const [key,max] of Object.entries({name:100,email:254,phone:40,date:10,type:80,guests:6,venue:250,package:80,service:80,message:4000,signature:120,reference:36})){data[key]=text(input[key]??'',max);if(data[key]===null)return res.status(400).json({error:'Please shorten or check your '+key+'.'})}
 if(!data.name||!data.venue||!data.type||!services.includes(data.service)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)||input.consent!==true||!/^\d{4}-\d{2}-\d{2}$/.test(data.date)||!Number.isFinite(Date.parse(data.date))||new Date(data.date+'T12:00:00Z').toISOString().slice(0,10)!==data.date||!/^[0-9a-f-]{36}$/.test(data.reference))return res.status(400).json({error:'Please check all required event and contact details.'});
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 if(data.date<today)return res.status(400).json({error:'Please choose today or a future event date.'});
 if(data.guests&&(!/^\d+$/.test(data.guests)||Number(data.guests)<1||Number(data.guests)>100000))return res.status(400).json({error:'Please check the guest count.'});
 const products=await productsPromise;
 if(!Array.isArray(input.items)||input.items.length>40||input.items.some(id=>!products.some(p=>p.id===id)))return res.status(400).json({error:'Please refresh your rental shortlist.'});
 data.items=[...new Set(input.items)];data.itemNames=products.filter(p=>data.items.includes(p.id)).map(p=>p.name);
 const needsContract=requiresContract(data);
 if(needsContract&&(input.contractConsent!==true||data.signature.length<2||input.contractVersion!==CONTRACT_VERSION))return res.status(400).json({error:'Please review the current Hotel Room Setup Contract and sign with your full legal name.'});
 if(!process.env.RESEND_API_KEY||!process.env.INQUIRY_FROM)return res.status(503).json({error:'email_not_configured'});
 let signedPdf;
 try{
  if(needsContract){const [original,fontBytes]=await Promise.all([readFile(new URL('../public/contracts/hotel-room-setup.pdf',import.meta.url)),readFile(new URL('../public/assets/font-5.ttf',import.meta.url))]);const digest=createHash('sha256').update(original).digest('hex');signedPdf=Buffer.from(await signedContract({PDFLib,fontkit,original,fontBytes,data,timestamp:new Date().toISOString(),reference:data.reference,digest,received:true})).toString('base64');}
  const message=[`Reference: ${data.reference}`,`Name: ${data.name}`,`Email: ${data.email}`,`Phone: ${data.phone||'Not provided'}`,`Occasion: ${data.type}`,`Service: ${data.service}`,`Date: ${data.date}`,`Guests: ${data.guests||'To confirm'}`,`Venue: ${data.venue}`,`Lawn game package: ${data.package}`,`Rentals: ${data.itemNames.join(', ')||'Help me choose'}`,`Details: ${data.message||'None'}`,needsContract?`Customer signature: ${data.signature}\nConsent: ${SIGNATURE_CONSENT}\nContract version: ${CONTRACT_VERSION}\nCustomer-signed PDF attached. Company countersignature and booking confirmation are still required.`:''].filter(Boolean).join('\n\n');
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`inquiry-${data.reference}`},body:JSON.stringify({from:process.env.INQUIRY_FROM,to:[process.env.INQUIRY_TO||'info@niagaraweddingandeventrentals.com'],reply_to:data.email,subject:`Event inquiry: ${data.date} — ${data.service}`,text:message,...(signedPdf?{attachments:[{filename:'Hotel-Setup-Contract-Signed.pdf',content:signedPdf}]}:{})}),signal:AbortSignal.timeout(15000)});
  if(!response.ok)return res.status(502).json({error:'Email delivery is temporarily unavailable.'});
  return res.status(200).json({ok:true,reference:data.reference,...(signedPdf?{signedPdf}:{})});
 }catch{return res.status(502).json({error:'Unable to deliver your inquiry. Please use the email option.'})}
}
