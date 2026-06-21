'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {LockKeyhole,LoaderCircle} from 'lucide-react';

export default function AdminLogin(){
  const router=useRouter();
  const [email,setEmail]=useState('Anlanmachinery@gmail.com'),[password,setPassword]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  async function submit(){
    setBusy(true);setMessage('');
    const response=await fetch('/api/admin/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
    const result=await response.json();
    setBusy(false);
    if(!response.ok){setMessage(result.error||'Login failed.');return;}
    router.push('/admin');
    router.refresh();
  }
  return <main className="min-h-screen bg-[#f3f5f2] px-5 pt-32">
    <section className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-xl">
      <div className="grid size-12 place-items-center rounded-2xl bg-lime"><LockKeyhole/></div>
      <h1 className="mt-5 text-3xl font-black">ANLAN Admin Login</h1>
      <p className="mt-2 text-gray-500">Manage products, media, cases, blog posts and inquiries.</p>
      <label className="mt-7 block text-sm font-bold">Email
        <input value={email} onChange={event=>setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-black/15 px-4 py-3 outline-none focus:border-black"/>
      </label>
      <label className="mt-4 block text-sm font-bold">Password
        <input type="password" value={password} onChange={event=>setPassword(event.target.value)} onKeyDown={event=>event.key==='Enter'&&submit()} className="mt-2 w-full rounded-xl border border-black/15 px-4 py-3 outline-none focus:border-black" autoFocus/>
      </label>
      {message&&<p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>}
      <button onClick={submit} disabled={busy||!email||!password} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 font-black text-white disabled:opacity-50">{busy?<LoaderCircle className="animate-spin"/>:<LockKeyhole size={18}/>}Sign in</button>
    </section>
  </main>;
}
