import { handler } from '../../lib/server.mjs';

export default async function adminContentHandler(req,res){
  try{return await handler(req,res)}
  catch(err){
    console.error('Nexora admin API request failed',err);
    res.statusCode=500;
    res.setHeader('content-type','application/json; charset=utf-8');
    res.end(JSON.stringify({error:'Something went wrong. Please try again.'}));
  }
}
