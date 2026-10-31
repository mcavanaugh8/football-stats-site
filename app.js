const express=require('express');
const path=require('node:path');
const mongoose=require('mongoose');
require('dotenv').config();
const {createApi}=require('./server/api');
function createApp(getDb=()=>mongoose.connection.db) {
    const app=express();
    app.use('/api',createApi(getDb));
    app.use('/api',(req,res)=>res.status(404).json({error:'Unknown endpoint'}));
    app.use(express.static(path.join(__dirname,'dist')));
    app.get(['/', '/players','/matchup-data','/betting-lines','/bet-builder','/odds'],(req,res)=>res.sendFile(path.join(__dirname,'dist','index.html')));
    app.use((req,res)=>res.status(404).send('Not found'));
    app.use((error,req,res,next)=>{res.status(error.status||500).json({error:error.status?error.message:'Unable to load football data'});});
    return app;
}
async function start() {
    if(process.env.MONGODB_DNS_SERVERS)require('node:dns').setServers(process.env.MONGODB_DNS_SERVERS.split(',').map(s=>s.trim()).filter(Boolean));
    const template=process.env.MONGODB_URL || `mongodb+srv://${encodeURIComponent(process.env.MONGODB_USERNAME||'')}:<db_password>@football-stats-data.vdolk.mongodb.net/football_data?retryWrites=true&w=majority`;
    if(template.includes('<db_password>')&&!process.env.MONGODB_PASSWORD)throw new Error('Set MONGODB_PASSWORD in .env');
    await mongoose.connect(template.replace('<db_password>',()=>encodeURIComponent(process.env.MONGODB_PASSWORD)),{dbName:'football_data'});
    return createApp().listen(process.env.PORT||3000,()=>console.log('Football Stats running on port '+(process.env.PORT||3000)));
}
if(require.main===module)start().catch(error=>{console.error('Startup failed:',error.message);process.exitCode=1;});
module.exports={createApp,start};
