import test from 'node:test';
import assert from 'node:assert/strict';
import { HOME_SECTION_KEYS, isValidHomeSectionOrder } from '../lib/home-sections.mjs';

test('accepts a complete reordered list of homepage sections',()=>{
  const reversed=[...HOME_SECTION_KEYS].reverse();
  assert.equal(isValidHomeSectionOrder(reversed),true);
});

test('rejects missing, duplicate and unknown homepage sections',()=>{
  assert.equal(isValidHomeSectionOrder(HOME_SECTION_KEYS.slice(1)),false);
  assert.equal(isValidHomeSectionOrder([...HOME_SECTION_KEYS.slice(1),'family']),false);
  assert.equal(isValidHomeSectionOrder([...HOME_SECTION_KEYS.slice(1),'unknown']),false);
  assert.equal(isValidHomeSectionOrder(null),false);
});
