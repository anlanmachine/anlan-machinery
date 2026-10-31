// Read-only HTTP checks and isolated browser fixtures. Never writes to a live database.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import puppeteer from 'puppeteer';
const origin=process.env.ADMIN_TEST_ORIGIN||'http://localhost:3012';
assert.match(origin,/^http:\/\/(localhost|127\.0\.0\.1):\d+$/,'Only local test servers are allowed');
assert.ok(process.env.ADMIN_PASSWORD,'ADMIN_PASSWORD required in local environment');
const payload='Aolanmachinery@gmail.com:'+String(Date.now()+3600000);
const token=payload+':'+crypto.createHmac('sha256',process.env.ADMIN_PASSWORD).update(payload).digest('hex');
for(const route of ['/admin/dashboard','/admin/products','/admin/tracking','/admin/backups']){
 const r=await fetch(origin+route,{redirect:'manual'});
 assert.equal(r.status,307,route+' must require login');
}
const browser=await puppeteer.launch({headless:true});
try{
 const page=await browser.newPage();
 await page.setCookie({name:'aolan_admin',value:token,url:origin,httpOnly:true,sameSite:'Lax'});
 const runtimeErrors=[];page.on('pageerror',e=>runtimeErrors.push(e.message));
 let products=Array.from({length:41},(_,i)=>({id:'fixture-'+i,model:'TEST-'+i,brand:'XCMG',name:'Test machine '+i,category:'loader',slug:'fixture-'+i,status:'Draft',image:'/uploads/placeholder-machine.svg',images:[],description:'Original description',specifications:{Weight:'1000 kg'},seoTitle:'Preserved SEO',video:'',pdfBrochure:'',updatedAt:'2026-10-31'}));
 let writes=0;
 await page.setRequestInterception(true);
 page.on('request',request=>{
   const url=new URL(request.url());
   if(url.pathname==='/api/admin/products'){
     if(request.method()==='GET')return void request.respond({status:200,contentType:'application/json',body:JSON.stringify(products)});
     if(request.method()==='PUT'){const body=JSON.parse(request.postData());assert.equal(body.seoTitle,'Preserved SEO');assert.equal(body.specifications.Weight,'1000 kg');products=products.map(p=>p.id===body.id?body:p);writes++;return void request.respond({status:200,contentType:'application/json',body:JSON.stringify({success:true,product:body})});}
     return void request.respond({status:409,contentType:'application/json',body:JSON.stringify({error:'Mutation not part of this test'})});
   }
   if(url.pathname==='/api/admin/collections/productCategories')return void request.respond({status:200,contentType:'application/json',body:JSON.stringify([{id:'loader',label:'Loader',subCategory:'wheel-loader'}])});
   // No other database-changing API may be called by this test.
   if(url.pathname.startsWith('/api/admin/')&&request.method()!=='GET')return void request.abort();
   return void request.continue();
 });
 await page.setViewport({width:1440,height:1000});
 await page.goto(origin+'/admin/products',{waitUntil:'networkidle0'});
 assert.ok((await page.$eval('body',el=>el.innerText)).includes('全部商品'));
 assert.equal(await page.$$eval('article',els=>els.length),20,'Pagination limits images/cards to 20');
 await page.type('input[aria-label="搜索型号"]','TEST-40');
 assert.equal(await page.$$eval('article',els=>els.length),1);
 await page.goto(origin+'/admin/products/fixture-0/edit',{waitUntil:'networkidle0'});
 await page.waitForFunction(()=>document.body.innerText.includes('保存修改'));
 await page.evaluate(()=>[...document.querySelectorAll('button')].find(el=>el.textContent==='保存修改').click());
 await page.waitForFunction(()=>document.body.innerText.includes('保存成功'));
 assert.equal(writes,1);assert.equal(products.length,41);
 await page.goto(origin+'/admin/products',{waitUntil:'networkidle0'});
 await page.evaluate(()=>[...document.querySelectorAll('button')].find(el=>el.textContent==='English').click());
 assert.ok((await page.$eval('body',el=>el.innerText)).includes('All products'));
 await page.setViewport({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Mobile has no horizontal overflow');
 await page.click('button[aria-label="Open navigation"]');
 assert.ok(await page.$('a[href="/admin/factory"]'));
 assert.deepEqual(runtimeErrors,[]);
 console.log('PASS: authentication redirects, Chinese/English navigation, 20-item pagination, search, independent edit preserving SEO/specifications, 41-item count, mobile width and drawer.');
 console.log('Fixture API only: production CRUD/upload/backup tests remain blocked by database availability.');
}finally{await browser.close();}
