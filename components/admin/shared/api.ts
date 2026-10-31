export async function adminRequest<T>(url:string,options:RequestInit={}):Promise<T>{
  const response=await fetch(url,{...options,cache:'no-store'});
  const data=await response.json().catch(()=>null);
  if(!response.ok)throw new Error(response.status===401?'登录已失效，请重新登录 / Session expired':data?.error||'加载失败，请重试 / Request failed');
  if(data===null)throw new Error('服务器返回了无效数据 / Invalid server response');
  return data as T;
}
