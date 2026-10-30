const express=require('express');
const {loadDataset}=require('./dataService');
function createApi(getDb) {
    const router=express.Router();
    router.get('/data',async(req,res,next)=>{
        try { res.set('Cache-Control','no-store'); res.json(await loadDataset(getDb(),Number(req.query.season||2026),req.query.seasonType||'REG')); }
        catch(error){next(error);}
    });
    return router;
}
module.exports={createApi};
