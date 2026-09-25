import {HOTEL_IDS,CONTRACT_VERSION,requiresContract,signedContract} from './contract.mjs';
const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#navigation');
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav?.classList.contains('open')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.focus()}});
const $=s=>document.querySelector(s);let toastTimer;
function toast(message){$('#toast').textContent=message;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').textContent='',4000)}
let selected=[];try{const stored=JSON.parse(localStorage.getItem('niagara-shortlist')||'[]');if(Array.isArray(stored))selected=stored.filter(x=>typeof x==='string').slice(0,40)}catch{}
const products=await fetch('/catalogue.json').then(r=>r.json()).catch(()=>[]);
selected=selected.filter(id=>products.some(p=>p.id===id));
const params=new URLSearchParams(location.search);let chosenCategory=params.get('category')||'All rentals';
function updateFilters(){const query=($('#rental-search')?.value||'').toLowerCase().trim();let count=0;document.querySelectorAll('.catalogue-grid .rental-card').forEach(card=>{const show=(chosenCategory==='All rentals'||card.dataset.category===chosenCategory)&&card.dataset.search.includes(query);card.hidden=!show;if(show)count++});document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===chosenCategory)));if($('#result-count'))$('#result-count').textContent=`${count} thoughtful addition${count===1?'':'s'}`;if($('.no-results'))$('.no-results').hidden=count!==0;}
if(!['All rentals','Lawn games','Event extras','Wow factor'].includes(chosenCategory))chosenCategory='All rentals';
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{chosenCategory=b.dataset.filter;updateFilters()}));$('#rental-search')?.addEventListener('input',updateFilters);$('#reset-filters')?.addEventListener('click',()=>{chosenCategory='All rentals';$('#rental-search').value='';updateFilters()});if($('#rental-search'))updateFilters();
const form=$('#inquiry-form');
function updateContract(){if(!form)return;const needed=requiresContract({service:form.elements.service.value,items:selected});const box=$('#hotel-contract');box.hidden=!needed;box.querySelectorAll('input').forEach(input=>{input.disabled=!needed;input.required=needed});if(!needed){form.elements.signature.value='';form.elements.contractConsent.checked=false;}const preview=$('#signature-preview');if(preview)preview.textContent=form.elements.signature.value||'Your signature';}
function save(){try{localStorage.setItem('niagara-shortlist',JSON.stringify(selected))}catch{}renderShortlist()}
function renderShortlist(){document.querySelectorAll('[data-shortlist-count]').forEach(el=>el.textContent=String(selected.length));document.querySelectorAll('[data-add]').forEach(b=>{b.disabled=selected.includes(b.dataset.add);b.textContent=b.disabled?'Added to your shortlist ✓':'Add to my shortlist +'});const list=$('#shortlist-items');if(list){list.replaceChildren();if(!selected.length){const p=document.createElement('p');p.className='shortlist-empty';p.textContent='Nothing chosen yet? We can help you find the perfect fit.';list.append(p)}for(const id of selected){const p=products.find(x=>x.id===id);if(!p)continue;const row=document.createElement('div');row.className='shortlist-item';const title=document.createElement('span');title.textContent=p.name;const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label',`Remove ${p.name}`);remove.addEventListener('click',()=>{selected=selected.filter(x=>x!==id);save()});row.append(title,remove);list.append(row)}}updateContract()}
document.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>{if(!selected.includes(b.dataset.add))selected.push(b.dataset.add);save();toast('Added to your event shortlist.')}));
if(form){const requested=params.get('item');if(products.some(p=>p.id===requested)&&!selected.includes(requested))selected.push(requested);const packageName=params.get('package');if([...form.elements.package.options].some(o=>o.value===packageName))form.elements.package.value=packageName;const hotel=selected.find(id=>HOTEL_IDS.includes(id));if(hotel)form.elements.service.value=hotel===HOTEL_IDS[0]?'Romantic hotel setup':'Bridal hotel setup';const today=new Date();form.elements.date.min=new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10);form.elements.service.addEventListener('change',updateContract);form.elements.signature.addEventListener('input',updateContract);}
renderShortlist();
let currentObjectUrl;let lastSubmissionKey;let lastSubmissionId;
async function pdfDownload(data,timestamp,reference){
 if(!window.PDFLib){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/vendor/pdf-lib.min.js';s.onload=resolve;s.onerror=reject;document.head.append(s)})}
 if(!window.fontkit){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/vendor/fontkit.umd.min.js';s.onload=resolve;s.onerror=reject;document.head.append(s)})}
 const [original,fontBytes]=await Promise.all(['/contracts/hotel-room-setup.pdf','/assets/font-5.ttf'].map(u=>fetch(u).then(r=>{if(!r.ok)throw Error('Document unavailable');return r.arrayBuffer()})));
 const hash=await crypto.subtle.digest('SHA-256',original);const digest=Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');
 const bytes=await signedContract({PDFLib:window.PDFLib,fontkit:window.fontkit,original,fontBytes,data,timestamp,reference,digest});
 if(currentObjectUrl)URL.revokeObjectURL(currentObjectUrl);currentObjectUrl=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));return currentObjectUrl;
}
form?.addEventListener('submit',async e=>{
 e.preventDefault();if(!form.reportValidity())return;
 const button=form.querySelector('[type=submit]'),result=$('#form-result');button.disabled=true;button.textContent='Preparing your request…';result.hidden=true;result.replaceChildren();
 const data=Object.fromEntries(new FormData(form));data.items=[...selected];data.itemNames=products.filter(p=>selected.includes(p.id)).map(p=>p.name);data.consent=data.consent==='on';data.contractConsent=data.contractConsent==='on';data.contractVersion=CONTRACT_VERSION;const submissionKey=JSON.stringify(data);if(lastSubmissionKey!==submissionKey){lastSubmissionKey=submissionKey;lastSubmissionId=crypto.randomUUID();}data.reference=lastSubmissionId;const timestamp=new Date().toISOString();
 const needed=requiresContract(data);let pdfUrl;
 try{
  if(needed)pdfUrl=await pdfDownload(data,timestamp,data.reference);
  const res=await fetch('/api/inquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(20000)});
  const payload=await res.json().catch(()=>({}));
  if(!res.ok){if(res.status===400)throw new Error(payload.error||'Please check your details.');if(res.status===429)throw new Error('Please wait a moment before trying again.');throw new Error('EMAIL_UNAVAILABLE')}
  if(payload.signedPdf){const raw=atob(payload.signedPdf);const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));if(currentObjectUrl)URL.revokeObjectURL(currentObjectUrl);currentObjectUrl=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));pdfUrl=currentObjectUrl;}
  const heading=document.createElement('h3');heading.textContent='Your lovely plans are on their way.';const text=document.createElement('p');text.textContent='Your inquiry'+(needed?' and signed contract have':' has')+' been sent to our team. We’ll be in touch about availability and your quote. This does not confirm a booking.';result.append(heading,text);
 }catch(error){
  const heading=document.createElement('h3');heading.textContent='One more step: send your request.';const p=document.createElement('p');p.textContent=needed&&!pdfUrl?'We couldn’t prepare the signed contract. Your details are still here. Please try again or contact us for help.':error.message==='EMAIL_UNAVAILABLE'||error.name==='TimeoutError'||error.name==='TypeError'?'Your inquiry hasn’t been sent. You can send it from your own email app using the draft below.':error.message;result.append(heading,p);
  if(!needed||pdfUrl){const body=[`Name: ${data.name}`,`Email: ${data.email}`,`Phone: ${data.phone||'Not provided'}`,`Event: ${data.type}`,`Service: ${data.service}`,`Date: ${data.date}`,`Guests: ${data.guests||'To confirm'}`,`Venue: ${data.venue}`,`Package: ${data.package}`,`Rentals: ${data.itemNames.join(', ')||'Help me choose'}`,`Details: ${data.message||''}`,needed?'I have signed the Hotel Room Setup Contract. Please find my signed PDF attached.':''].filter(Boolean).join('\n');
   if(needed){const note=document.createElement('p');note.textContent='Download your signed contract below and attach it to your email before sending.';result.append(note)}
   const link=document.createElement('a');link.className='button';link.href=`mailto:info@niagaraweddingandeventrentals.com?subject=${encodeURIComponent('Event inquiry — '+data.date)}&body=${encodeURIComponent(body)}`;link.textContent='Open email draft ↗';result.append(link);
   const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Copy the inquiry for webmail';const textarea=document.createElement('textarea');textarea.readOnly=true;textarea.value=body;textarea.setAttribute('aria-label','Your email draft');details.append(summary,textarea);result.append(details);
  }
 }
 if(pdfUrl){const download=document.createElement('a');download.href=pdfUrl;download.download='Hotel-Setup-Contract-Signed.pdf';download.className='button outline';download.textContent='Download my signed contract ↓';result.append(download)}
 result.hidden=false;result.focus();button.disabled=false;button.textContent='Request my quote ↗';
});
if(document.modelContext?.registerTool){
 const lifecycle=new AbortController();
 const tools=[{name:'read_rental_shortlist',description:'Read the rentals selected on this device. Does not send an inquiry or sign any agreement.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({items:products.filter(p=>selected.includes(p.id)).map(p=>({id:p.id,name:p.name}))})},{name:'stage_rental_shortlist',description:'Add rental IDs to the visible shortlist on this device. Does not submit an inquiry or sign a contract.',inputSchema:{type:'object',properties:{ids:{type:'array',items:{type:'string'},maxItems:29}},required:['ids'],additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>{if(!input||!Array.isArray(input.ids)||input.ids.length>29||input.ids.some(id=>!products.some(p=>p.id===id)))throw Error('Choose valid rental IDs.');selected=[...new Set([...selected,...input.ids])];save();return {selectedCount:selected.length};}}];
 for(const tool of tools){try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{})}catch{}}
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
