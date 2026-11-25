export const HOME_SECTION_KEYS=Object.freeze([
  'featured-scifi','action','thrillers','continue-watching','top-rated',
  'recently-added','african-cinema','nollywood','tv-series','recommended',
  'horror','romance','comedy','documentaries','animation','family'
]);
export function isValidHomeSectionOrder(order,allowed=HOME_SECTION_KEYS){
  return Array.isArray(order)
    && order.length===allowed.length
    && new Set(order).size===allowed.length
    && order.every(key=>typeof key==='string'&&allowed.includes(key));
}
