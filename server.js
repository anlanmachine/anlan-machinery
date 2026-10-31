const express = require('express');
const cors = require('cors');
const next = require('next');
const dev = process.env.NODE_ENV !== 'production';
const port = Number(process.env.PORT || 3010);
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();
nextApp.prepare().then(()=>{const app=express();app.disable('x-powered-by');app.use(cors({origin:true,methods:['GET','POST','PUT','DELETE','PATCH']}));app.all('*path',(req,res)=>handle(req,res));app.listen(port,()=>console.log(`Aolan server ready at http://localhost:${port}`));});
