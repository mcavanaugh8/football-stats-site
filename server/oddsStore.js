const {randomUUID}=require('node:crypto');
const COLLECTION='oddsCache';
// Unique _id plus a conditional atomic update coordinates all app instances.
function createMongoOddsStore(getDb){
 const collection=()=>getDb().collection(COLLECTION);
 return {
  async read(key){const doc=await collection().findOne({_id:'cache:'+key});return doc?.value||null;},
  async write(key,value){await collection().updateOne({_id:'cache:'+key},{$set:{value,updatedAt:new Date()}},{upsert:true});},
  async reserve(scope,intervalMs){
   const c=collection(),id='gate:'+scope,token=randomUUID();
   try{await c.updateOne({_id:id},{$setOnInsert:{nextAllowedAt:new Date(0)}},{upsert:true});}catch(e){if(e.code!==11000)throw e;}
   const result=await c.updateOne({_id:id,$expr:{$lte:['$nextAllowedAt','$$NOW']}},[{$set:{token,nextAllowedAt:{$add:['$$NOW',intervalMs]}}}]);
   const gate=await c.findOne({_id:id});
   return {acquired:result.modifiedCount===1&&gate?.token===token,nextAllowedAt:gate?.nextAllowedAt?.toISOString()};
  }
 };
}
module.exports={createMongoOddsStore};
