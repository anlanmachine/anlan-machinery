const express = require('express');
const cors = require('cors');
const next = require('next');
const path = require('path');
const fs = require('fs/promises');
const dev = process.env.NODE_ENV !== 'production';
const port = Number(process.env.PORT || 3010);
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();
const dataFile = path.join(__dirname, 'data', 'products.json');
async function readProducts(){try{return JSON.parse(await fs.readFile(dataFile,'utf8'));}catch(error){if(error.code==='ENOENT')return[];throw error;}}
nextApp.prepare().then(()=>{const app=express();app.disable('x-powered-by');app.use(cors({origin:true,methods:['GET','POST','PUT','DELETE']}));app.get('/api/products',async(_req,res)=>{try{res.set('Cache-Control','no-store');res.json(await readProducts());}catch(error){res.status(500).json({success:false,error:error.message});}});app.all('*path',(req,res)=>handle(req,res));app.listen(port,()=>console.log(`Anlan server ready at http://localhost:${port}`));});
