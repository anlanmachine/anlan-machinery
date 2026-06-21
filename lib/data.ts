export const WHATSAPP='8618715467045';
export const COMPANY_EMAIL='Anlanmachinery@gmail.com';
export const COMPANY_EMAIL_LINK=`mailto:${COMPANY_EMAIL}`;
export const DEFAULT_MESSAGE='Hi, I want to get quotation for machinery. Please send price, specs, and shipping details.';
export const wa=(message=DEFAULT_MESSAGE)=>`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;

export const categories=['Excavators','Wheel Excavators','Loaders','Rollers / Compaction','Motor Graders','Self Loading Concrete Mixers'];
export const posts=[
 {slug:'import-excavators-from-china',title:'How to Import Excavators from China: 2026 Buyer Guide',excerpt:'A practical checklist covering inspection, documents, freight and customs.',date:'June 12, 2026',category:'Buying Guides'},
 {slug:'best-machines-for-africa',title:'Best Construction Machines for African Job Sites',excerpt:'How climate, service access and fuel quality affect machine selection.',date:'May 28, 2026',category:'Market Insights'},
 {slug:'shipping-heavy-equipment',title:'Shipping Heavy Equipment: RoRo vs Container',excerpt:'Compare cost, lead time and protection for your next shipment.',date:'May 09, 2026',category:'Shipping'}
];
