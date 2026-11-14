import { handler } from '../server.mjs';

export default async function apiHandler(req,res){
  try{return await handler(req,res)}
  catch(err){
    const status=[400,413].includes(err.statusCode)?err.statusCode:500;
    res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin'});
    res.end(JSON.stringify({error:status===500?'Something went wrong. Please try again.':err.message}));
  }
}
