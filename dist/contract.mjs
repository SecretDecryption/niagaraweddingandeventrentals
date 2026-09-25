export const CONTRACT_VERSION='hotel-room-setup-2026-09-24';
export const HOTEL_IDS=['deluxe-package-9r5ts','bridalhotelsetup'];
export const SIGNATURE_CONSENT='I have read and agree to the Hotel Room Setup Contract. By typing my full legal name and submitting this request, I intend to sign this agreement electronically.';
export function requiresContract(data){return ['Romantic hotel setup','Bridal hotel setup'].includes(data.service)||(data.items||[]).some(id=>HOTEL_IDS.includes(id));}
export async function signedContract({PDFLib,fontkit,original,fontBytes,data,timestamp,reference,digest,received=false}){
 const doc=await PDFLib.PDFDocument.load(original);doc.registerFontkit(fontkit);
 const font=await doc.embedFont(fontBytes,{subset:true});const page=doc.getPages()[5];const ink=PDFLib.rgb(.16,.2,.14);
 const name=data.signature.trim();
 const fit=(text,max,size=11)=>Math.min(size,max/font.widthOfTextAtSize(text,1));
 page.drawText(name,{x:143,y:556,size:fit(name,166),font,color:ink});
 page.drawText(name,{x:133,y:515,size:fit(name,167,13),font,color:ink});
 page.drawText(timestamp.slice(0,10),{x:107,y:474,size:11,font,color:ink});
 let record=doc.addPage([612,792]);let y=735;
 const line=(text,size=10)=>{if(y<65){record=doc.addPage([612,792]);y=735;}record.drawText(text,{x:54,y,size,font,color:ink});y-=size+9;};
 const paragraph=(text)=>{let row='';for(const word of text.split(/\s+/).flatMap(w=>font.widthOfTextAtSize(w,10)>490?w.match(/.{1,55}/gu):[w])){if(font.widthOfTextAtSize((row+' '+word).trim(),10)>500){line(row);row=word;}else row=(row+' '+word).trim();}if(row)line(row);y-=9;};
 line('Hotel Room Setup - Electronic Signature Record',17);y-=15;
 paragraph('This record accompanies the original six-page agreement. The company representative signature remains pending.');
 paragraph('Client legal name: '+name);paragraph('Contact email: '+data.email);paragraph('Service: '+data.service);paragraph('Event date: '+data.date);paragraph('Venue: '+data.venue);paragraph('Customer-selected rentals: '+((data.itemNames||[]).join(', ')||'None selected'));
 paragraph('Signature method: typed full legal name and explicit agreement checkbox.');paragraph('Consent: '+SIGNATURE_CONSENT);
 paragraph((received?'Server received at (UTC): ':'Prepared on customer device (UTC): ')+timestamp);
 paragraph('Reference: '+reference);paragraph('Contract version: '+CONTRACT_VERSION);paragraph('Original contract SHA-256: '+digest);
 paragraph(received?'Receipt records submission, not verification of signer identity. Booking remains subject to company confirmation and the required deposit.':'This copy has been prepared on the customer device. It is not proof that the company has received the inquiry. Send the signed contract to the company for review.');
 doc.setTitle('Hotel Room Setup Contract - '+name);doc.setSubject('Customer-signed agreement; company countersignature pending');doc.setCreator('Niagara Wedding and Event Rentals');
 return doc.save();
}
