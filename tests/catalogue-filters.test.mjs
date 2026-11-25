import test from 'node:test';
import assert from 'node:assert/strict';
import { filterCatalogue, matchesGenre } from '../lib/catalogue-filters.mjs';

const titles=[
  {id:'a',title:'Star Run',genre:'Sci-Fi, Action',type:'Movie',year:2026,rating:'8.1',originalLanguage:'en',country:'NG'},
  {id:'b',title:'Quiet House',genre:'Horror',type:'Movie',year:2024,rating:'8.8',originalLanguage:'ko',country:'KR'},
  {id:'c',title:'Orbit',genre:'Science Fiction',type:'TV Show',year:2025,rating:'9.0',originalLanguage:'en',country:'US'}
];

test('matches multiple genres and the Science Fiction alias',()=>{
  assert.equal(matchesGenre('Sci-Fi, Action','Action'),true);
  assert.equal(matchesGenre('Sci-Fi','Science Fiction'),true);
  assert.equal(matchesGenre('Drama','Horror'),false);
});

test('combines search, genre, type, year, language and country filters',()=>{
  assert.deepEqual(filterCatalogue(titles,{q:'star',genre:'Action',type:'Movie',year:'2026',language:'en',country:'NG'}).map(item=>item.id),['a']);
  assert.deepEqual(filterCatalogue(titles,{genre:'Science Fiction',type:'TV Show'}).map(item=>item.id),['c']);
});

test('sorts by rating, year and actual catalogue-added timestamp',()=>{
  assert.deepEqual(filterCatalogue(titles,{sort:'rating'}).map(item=>item.id),['c','b','a']);
  assert.deepEqual(filterCatalogue(titles,{sort:'year'}).map(item=>item.id),['a','c','b']);
  const added=[{id:'old',createdAt:'2025-01-01'},{id:'new',createdAt:'2026-02-01'}];
  assert.deepEqual(filterCatalogue(added,{sort:'recently-added'}).map(item=>item.id),['new','old']);
});
