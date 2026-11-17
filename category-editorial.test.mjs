import assert from 'node:assert/strict';
import { buildCategoryIntro, buildCategoryFaq } from './category-editorial.mjs';

const priorityCategories = [
  { name: 'Pest Control & Fumigation', slug: 'pest-control-fumigation', items: [{name:'Termidor 96 SC'},{name:'Bedlam 200SL'}] },
  { name: 'Bed Bug Killers', slug: 'bed-bug-killers', items: [{name:'Bedlam 200SL'},{name:'Promax 20 EC'}] },
  { name: 'Termite Control', slug: 'termite-control', items: [{name:'Premise 200 SC'},{name:'Termidor 96 SC'}] },
  { name: 'Insect Light Traps & UV Lamps', slug: 'insect-light-traps-uv-lamps', items: [{name:'Catchmaster Vector UV Fly Light Trap'}] },
  { name: 'Rodent Control', slug: 'rodent-control', items: [{name:'Bayer Baraki Pellets'}] }
];

for (const category of priorityCategories) {
  const intro = buildCategoryIntro(category, 'Compare products for Kenyan homes and businesses.');
  const words = intro.split(/\s+/).filter(Boolean);
  assert.ok(words.length >= 150 && words.length <= 165, category.name + ' introduction should be 150–165 words');
  if (category.slug === 'insect-light-traps-uv-lamps') assert.match(intro, /food-safety|glueboard/i, category.name + ' introduction should include hotel and food-premises guidance');
  else assert.match(intro, /PCPB registration|PCPB/i, category.name + ' introduction should include Kenyan label guidance');
  const faq = buildCategoryFaq(category, []);
  assert.equal(faq.length, 4, category.name + ' must expose exactly four FAQs');
  assert.ok(faq.every(([q,a]) => q && a), category.name + ' FAQs must be complete');
}
console.log('Priority Kenyan category introductions and FAQ tests passed.');
