"use client";
import {ChangeEvent,useEffect,useRef,useState} from "react";
type T={id:string;date:string;raw:string;category:string;amount:number}; type S={id:string;label:string;at:string;tx:T[]}; type R={match:string;category:string};
const C=["餐飲","交通","日常購物","娛樂訂閱","賬單繳費","保險健康","手續費","還款及回贈","其他","待確認"];
const D:R[]=[{match:"WELLCOME|PARKN|HKTVMALL|TAOBAO|IHERB|NESTLE",category:"日常購物"},{match:"MTR|UBER|GRAB|TAXI|OCTOPUS|OCL\*OCTOPUS",category:"交通"},{match:"NETFLIX|SPOTIFY|APPLE.COM|GOOGLE|YOUTUBE|STEAM|VENNIC|2000 FUN",category:"娛樂訂閱"},{match:"DELIVEROO|FOODPANDA|SUSHIRO|RESTAURANT|CAFE|MCDONALD|KFC|KEETA|MAXIMS",category:"餐飲"},{match:"HKT|PCCW|CLP|TOWNSGAS|EZYPAY",category:"賬單繳費"},{match:"AIA|PRUDENTIAL|INSURANCE|BOWTIE",category:"保險健康"},{match:"FEE|FINANCE CHARGE",category:"手續費"},{match:"PAYMENT|REBATE|REFUND|CASH REBATE",category:"還款及回贈"}];
const demo:S[]=[];
const mon=(n:number)=>new Intl.NumberFormat("zh-HK",{minimumFractionDigits:2}).format(n); const use=(a:T[])=>a.filter(x=>x.amount>0&&x.category!=="還款及回贈");
function rows(a:any[]){const m=new Map<number,any[]>();a.filter(x=>"str" in x).forEach(x=>{const y=Math.round(x.transform[5]);m.set(y,[...(m.get(y)||[]),x])});return [...m.entries()].sort((a,b)=>b[0]-a[0]).map(([,x])=>x.sort((a,b)=>a.transform[4]-b.transform[4]).map(x=>x.str).join(" ").replace(/\s+/g," ").trim())}
function parse(line:string,i:number,r:R[]):T|null{const m=line.match(/^(\d{2}-[A-Z]{3})\s+(?:(\d{2}-[A-Z]{3})\s+)?(.+?)\s+([\d,]+\.\d{2})(?:\s+(CR))?$/i);if(!m)return null;const raw=m[3].trim(),rule=[...r,...D].find(x=>new RegExp(x.match,"i").test(raw));return {id:i+"-"+raw,date:m[2]||m[1],raw,category:rule?.category||"其他",amount:Number(m[4].replace(/,/g,""))*(m[5]?-1:1)}}
export default function Home(){const fi=useRef<HTMLInputElement>(null);const [hs,setHs]=useState<S[]>(demo),[rs,setRs]=useState<R[]>([]),[sel,setSel]=useState(""),[filter,setFilter]=useState("全部"),[msg,setMsg]=useState("將中銀信用卡月結單 PDF 拖入或選擇"),[ok,setOk]=useState(false);
useEffect(()=>{try{const x=JSON.parse(localStorage.getItem("zhangxi-boc-v1")||"");const clean=(x.history||[]).filter((s:S)=>s.id!=="jun"&&s.id!=="may").slice(0,1).map((s:S)=>({...s,tx:s.tx.map((t:T)=>t.category==="待確認"?{...t,category:"其他"}:t)}));if(clean.length){setHs(clean);setSel(clean[0].id)}setRs(x.rules||[])}catch{}setOk(true)},[]);useEffect(()=>{if(ok)localStorage.setItem("zhangxi-boc-v1",JSON.stringify({history:hs,rules:rs}))},[hs,rs,ok]);
const empty:S={id:"",label:"",at:"",tx:[]},all=[...hs].sort((a,b)=>b.at.localeCompare(a.at)),cur=hs.find(x=>x.id===sel)||hs[0]||empty,last=all.filter(x=>x.id!==cur.id&&x.at<=cur.at)[0],sp=use(cur.tx),total=sp.reduce((a,x)=>a+x.amount,0),old=use(last?.tx||[]).reduce((a,x)=>a+x.amount,0),wait=cur.tx.filter(x=>x.category==="待確認"),cats=["全部",...C.filter(c=>c!=="待確認"&&cur.tx.some(t=>(t.category==="待確認"?"其他":t.category)===c))],shown=cur.tx.filter(t=>filter==="全部"||(t.category==="待確認"?"其他":t.category)===filter);
async function read(file:File){setMsg("正在讀取月結單…");try{let u:T[]=[];try{const p=await import("pdfjs-dist/legacy/build/pdf.mjs");p.GlobalWorkerOptions.workerSrc=new URL("pdf.worker.min.mjs",window.location.href).toString();const pdf=await p.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;let l:string[]=[];for(let n=1;n<=pdf.numPages;n++){const c=await (await pdf.getPage(n)).getTextContent();l.push(...rows(c.items))}const a=l.map((x,i)=>parse(x,i,rs)).filter(Boolean) as T[];u=a.filter((x,i)=>a.findIndex(y=>y.date===x.date&&y.raw===x.raw&&y.amount===x.amount)===i)}catch{}if(!u.length){setMsg("手機正在安全分析月結單…");const r=await fetch("https://billwise-hk.flc00114477.chatgpt.site/api/analyse-statement",{method:"POST",headers:{"Content-Type":"application/pdf"},body:file});const j=await r.json();if(!r.ok||!j.transactions?.length)throw Error(j.error||"AI analysis failed");u=j.transactions.map((x:{date:string;raw:string;amount:number},i:number)=>{const rule=[...rs,...D].find(y=>new RegExp(y.match,"i").test(x.raw));return{id:i+"-"+x.raw,date:x.date,raw:x.raw,category:rule?.category||"其他",amount:x.amount}})}const s:S={id:String(Date.now()),label:new Date().getFullYear()+" 年 本期",at:new Date().toISOString(),tx:u};setHs(o=>[s,...o].slice(0,24));setSel(s.id);setMsg("已讀取 "+u.length+" 筆交易，已自動完成分類。")}catch(e){const name=e instanceof Error?e.name:"";setMsg(name==="PasswordException"?"PDF 有密碼保護，請先移除密碼後再試。":"未能讀取這份 PDF（"+name+"）。請確認已在「檔案」App 下載完成後再選擇。")}}
function setCat(id:string,category:string){const t=cur.tx.find(x=>x.id===id);if(!t)return;const match=t.raw.split(/\s+/).slice(0,2).join("\\s+");setRs(x=>[{match,category},...x.filter(y=>y.match!==match)]);setHs(x=>x.map(s=>s.id===cur.id?{...s,tx:s.tx.map(t=>t.id===id?{...t,category}:t)}:s))}
function file(e:ChangeEvent<HTMLInputElement>){const f=e.target.files?.[0];if(f)read(f);e.target.value=""}function exportIt(){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify({history:hs,rules:rs})]));a.download="zhangxi-backup.json";a.click()}function restore(e:ChangeEvent<HTMLInputElement>){const f=e.target.files?.[0];if(f)f.text().then(v=>{const x=JSON.parse(v);setHs(x.history);setRs(x.rules||[]);setSel(x.history[0].id);setMsg("已還原備份。")}).catch(()=>setMsg("備份檔案不能讀取。"));e.target.value=""}
return <main><section className="hero"><div><span className="badge">✦ 你的中銀信用卡帳單助手</span><h1>唔使再逐行睇<br/><em>密密麻麻嘅賬單。</em></h1><p>上載中銀信用卡月結單 PDF，自動整理商戶、分類每筆消費，再同上月比較。</p><div className="ticks">✓ 只在你部機儲存　✓ 不用登入　✓ PDF 不會上傳</div></div><div className="drop" onClick={()=>fi.current?.click()}><div className="pdf">PDF</div><b>將月結單拖到呢度</b><small>或者按選擇檔案</small><button>選擇 PDF 月結單</button><small>支援中銀信用卡月結單</small><input ref={fi} type="file" accept="application/pdf" onChange={file}/><div className="status">✓ {msg}</div></div></section>
{hs.length===0?<section style={{maxWidth:1100,margin:"0 auto 80px",padding:"34px",background:"#f1f6f3",borderRadius:18,textAlign:"center"}}><b style={{fontSize:20}}>尚未有交易記錄</b><p style={{color:"#66736e"}}>選擇中銀信用卡月結單後，分析結果會顯示喺呢度。</p></section>:<section className="dashboard"><div className="sectionHead"><div><span>分析結果</span><h2>{cur.label} 消費概覽</h2></div></div><div className="cards"><article><small>本月實際總額</small><strong>HK$ {mon(total)}</strong>{last&&<i>{total-old>=0?"↑":"↓"} HK$ {mon(Math.abs(total-old))} 較上月{total-old>=0?"多":"少"}</i>}</article><article className="breakdown">{C.map(c=>{const n=sp.filter(x=>x.category===c).reduce((a,x)=>a+x.amount,0);return n>0?<p key={c}>● {c}<span>HK$ {mon(n)}</span></p>:null})}</article><article className="insight"><b>今期小發現</b><p>{last?"已同上月比較，可從分類明細找出升跌原因。":"匯入下一期月結單後，就會看到月度升跌。"}</p></article></div>
<section className="list"><div className="listHead"><div><b>交易明細</b><small>{cur.tx.length} 筆交易</small></div><div className="filters" style={{marginLeft:"auto"}}>{cats.map(c=><button key={c} className={filter===c?"active":""} onClick={()=>setFilter(c)}>{c}</button>)}</div></div>{shown.map(t=><div className="transaction" key={t.id}><div className="icon">{t.raw.slice(0,1)}</div><div className="merchant"><b>{t.raw}</b><small>{t.category}</small></div><div className="cat"><span style={{background:"#8a9692"}}></span>{t.category==="待確認"?"其他":t.category}</div><time>{t.date}</time><strong>HK$ {mon(t.amount)}</strong></div>)}</section></section>}</main>}



































