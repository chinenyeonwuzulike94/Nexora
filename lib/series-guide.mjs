export function groupSeriesGuideRows(rows){
  const bySeries=new Map();
  for(const row of rows||[]){
    const seriesId=String(row.seriesId||"");
    if(!seriesId||!row.id)continue;
    if(!bySeries.has(seriesId))bySeries.set(seriesId,new Map());
    const seasons=bySeries.get(seriesId);
    if(!seasons.has(row.id))seasons.set(row.id,{id:row.id,seasonNumber:row.seasonNumber,title:row.title||"",synopsis:row.synopsis||"",episodes:[]});
    if(row.episodeId)seasons.get(row.id).episodes.push({id:row.episodeId,episodeNumber:row.episodeNumber,title:row.episodeTitle,synopsis:row.episodeSynopsis||"",runtimeSeconds:row.runtimeSeconds||null});
  }
  return new Map([...bySeries].map(([seriesId,seasons])=>[seriesId,[...seasons.values()]]));
}
