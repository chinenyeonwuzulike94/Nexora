import test from 'node:test';
import assert from 'node:assert/strict';
import { groupSeriesGuideRows } from '../lib/series-guide.mjs';

test('groups seasons and episodes under the correct series',()=>{
  const rows=[
    {seriesId:'series-a',id:'season-a1',seasonNumber:1,title:'First',episodeId:'episode-a2',episodeNumber:2,episodeTitle:'Second'},
    {seriesId:'series-b',id:'season-b1',seasonNumber:1,title:'Pilot season',episodeId:'episode-b1',episodeNumber:1,episodeTitle:'Pilot'},
    {seriesId:'series-a',id:'season-a1',seasonNumber:1,title:'First',episodeId:'episode-a1',episodeNumber:1,episodeTitle:'First'},
  ];
  const grouped=groupSeriesGuideRows(rows);
  assert.deepEqual(grouped.get('series-a')[0].episodes.map(episode=>episode.id),['episode-a2','episode-a1']);
  assert.equal(grouped.get('series-b')[0].episodes[0].title,'Pilot');
});

test('keeps a season even when no episodes are available yet',()=>{
  const grouped=groupSeriesGuideRows([{seriesId:'series-a',id:'season-a1',seasonNumber:1,title:'Season one',episodeId:null}]);
  assert.deepEqual(grouped.get('series-a')[0].episodes,[]);
});

test('ignores rows that cannot be safely associated with a series and season',()=>{
  const grouped=groupSeriesGuideRows([{id:'season-orphan',seasonNumber:1},{seriesId:'series-a',seasonNumber:1}]);
  assert.equal(grouped.size,0);
});