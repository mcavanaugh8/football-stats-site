const express=require('express');
const {loadDataset}=require('./dataService');
const {createOddsService}=require('./oddsService');
const {createMongoOddsStore}=require('./oddsStore');
function createApi(getDb) {
    const oddsService=createOddsService({store:createMongoOddsStore(getDb)});
    const router=express.Router();
    router.get('/data',async(req,res,next)=>{
        try { res.set('Cache-Control','no-store'); res.json(await loadDataset(getDb(),Number(req.query.season||2026),req.query.seasonType||'REG')); }
        catch(error){next(error);}
    });
    router.get('/odds/events',async(req,res,next)=>{try{res.set('Cache-Control','no-store');res.json(await oddsService.events());}catch(e){next(e);}});
    router.get('/odds/event',async(req,res,next)=>{try{res.set('Cache-Control','no-store');res.json(await oddsService.odds(req.query.eventId,req.query.market));}catch(e){next(e);}});
    return router;
}
module.exports={createApi};
