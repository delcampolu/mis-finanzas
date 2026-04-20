import { useState, useMemo, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from "recharts";

/* ─── UTILS ─── */
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const uid = () => Math.random().toString(36).slice(2,9);
const mk  = (y,m) => `${y}-${String(m+1).padStart(2,"0")}`;
const fmt = n => new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(n||0);
const num = v => parseFloat(v)||0;
const today = new Date(); const CY=today.getFullYear(); const CM=today.getMonth();

function load(k,fb){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):fb; }catch{ return fb; }}
function save(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch{}}

/* ─── DEFAULTS ─── */
const INIT_USERS = [
  {id:"lucia", name:"Lucía",  pin:"1234", color:"#6366f1", initials:"Lu"},
  {id:"tomas", name:"Tomás",  pin:"5678", color:"#ec4899", initials:"To"},
];
const INIT_CARDS = [
  {id:"c1",name:"Francés MC",      color:"#18181b", owner:"lucia"},
  {id:"c2",name:"Supervielle MC",  color:"#6366f1", owner:"lucia"},
  {id:"c3",name:"Supervielle Visa",color:"#0ea5e9", owner:"lucia"},
  {id:"c4",name:"BNA MC",          color:"#10b981", owner:"lucia"},
];
const INIT_PAYMENT = [
  {id:"p1",name:"Efectivo",   icon:"💵", type:"cash"},
  {id:"p2",name:"Transferencia",icon:"📲",type:"transfer"},
];
const INIT_CATS = [
  {id:"cat1",name:"Supermercado",icon:"🛒"},
  {id:"cat2",name:"Verdulería",  icon:"🥦"},
  {id:"cat3",name:"Comida / salida",icon:"🍽"},
  {id:"cat4",name:"Salud",       icon:"💊"},
  {id:"cat5",name:"Mascotas",    icon:"🐾"},
  {id:"cat6",name:"Monotributo", icon:"📋"},
  {id:"cat7",name:"Obra Social", icon:"🏥"},
  {id:"cat8",name:"Celular",     icon:"📱"},
  {id:"cat9",name:"Gym",         icon:"💪"},
  {id:"cat10",name:"Nafta",      icon:"⛽"},
  {id:"cat11",name:"Ropa",       icon:"👕"},
  {id:"cat12",name:"Servicios",  icon:"🔌"},
];
const INIT_CLIENTS_LUCIA = [
  {id:"cl1",name:"Cachipum", amount:684980, active:true},
  {id:"cl2",name:"OBIS",     amount:396550, active:true},
  {id:"cl3",name:"CODER",    amount:0,      active:true},
];
const INIT_CLIENTS_TOMAS = [
  {id:"cl4",name:"Trabajo",  amount:500000, active:true},
];


const INIT_RECURRING_L = [
  {id:"r1",name:"Obra Social",  amount:433000, active:true, userId:"lucia"},
  {id:"r2",name:"Monotributo",  amount:17000,  active:true, userId:"lucia"},
  {id:"r3",name:"Celular",      amount:20000,  active:true, userId:"lucia"},
  {id:"r4",name:"Seguro",       amount:81274,  active:true, userId:"lucia"},
  {id:"r5",name:"Gym",          amount:15000,  active:true, userId:"lucia"},
];
const INIT_RECURRING_T = [
  {id:"r6",name:"Expensas",     amount:22000,  active:true, userId:"tomas"},
];

const buildMonth = (y,m) => ({
  key:mk(y,m), expenses:[], clients_lucia:[], clients_tomas:[], fciMovements:[],
});

/* ─── GOOGLE SHEETS SYNC via Apps Script ─── */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwAiXwf3sEGKPHChTLJbbtOFOucFsafOV7Wd6iU0oh44hRNQ5lGB3JOmcxe_VZTNWnM/exec";

async function syncGasto(exp, userName, MONTHS) {
  try {
    await fetch(APPS_SCRIPT_URL, {
      method:"POST", mode:"no-cors",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        type:"gasto",
        fecha: exp.date,
        mes: exp.month,
        año: exp.year,
        usuario: userName,
        owner: exp.owner,
        categoria: exp.categoryName,
        desc: exp.desc||exp.categoryName,
        medioPago: exp.payMethodName,
        monto: exp.amount,
        cuotas: exp.cuotas,
        cuotaNum: exp.cuotaNum,
      })
    });
  } catch(e) { console.log("Sheets sync error:", e); }
}

async function syncIngreso(cliente, userName, mes, año) {
  try {
    await fetch(APPS_SCRIPT_URL, {
      method:"POST", mode:"no-cors",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        type:"ingreso",
        fecha: new Date().toISOString().slice(0,10),
        mes, año, usuario: userName,
        cliente: cliente.name,
        monto: cliente.amount,
      })
    });
  } catch(e) { console.log("Sheets sync error:", e); }
}

async function syncFci(mov, saldoTotal) {
  try {
    await fetch(APPS_SCRIPT_URL, {
      method:"POST", mode:"no-cors",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        type:"fci",
        fecha: mov.date,
        movTipo: mov.type,
        desc: mov.desc||mov.type,
        monto: mov.amount,
        saldoTotal,
      })
    });
  } catch(e) { console.log("Sheets sync error:", e); }
}

/* ══════════════════════════════════════════════
   APP
══════════════════════════════════════════════ */
export default function App() {
  /* ── state ── */
  const [currentUser, setCurrentUser] = useState(null);
  const [pinInput,    setPinInput]    = useState("");
  const [pinError,    setPinError]    = useState(false);
  const [tab,         setTab]         = useState("resumen");
  const [sY,          setSY]          = useState(CY);
  const [sM,          setSM]          = useState(CM);
  const [sideOpen,    setSideOpen]    = useState(false);

  const [users,       setUsers]       = useState(()=>load("users",       INIT_USERS));
  const [cards,       setCards]       = useState(()=>load("cards",       INIT_CARDS));
  const [payMethods,  setPayMethods]  = useState(()=>load("payMethods",  INIT_PAYMENT));
  const [categories,  setCategories]  = useState(()=>load("categories",  INIT_CATS));
  const [months,      setMonths]      = useState(()=>load("months",      {}));
  const [fciTotal,    setFciTotal]    = useState(()=>load("fciTotal",    0));
  const [clientsL,    setClientsL]    = useState(()=>load("clientsL",    INIT_CLIENTS_LUCIA));
  const [clientsT,    setClientsT]    = useState(()=>load("clientsT",    INIT_CLIENTS_TOMAS));
  const [sheetsConfig,setSheetsConfig]= useState(()=>load("sheetsConfig",{sheetId:"",apiKey:""})); // kept for compat
  const [recurringL,  setRecurringL]  = useState(()=>load("recurringL",   INIT_RECURRING_L));
  const [recurringT,  setRecurringT]  = useState(()=>load("recurringT",   INIT_RECURRING_T));
  const [efectivo,    setEfectivo]    = useState(()=>load("efectivo",     0));

  useEffect(()=>save("users",       users),       [users]);
  useEffect(()=>save("cards",       cards),       [cards]);
  useEffect(()=>save("payMethods",  payMethods),  [payMethods]);
  useEffect(()=>save("categories",  categories),  [categories]);
  useEffect(()=>save("months",      months),      [months]);
  useEffect(()=>save("fciTotal",    fciTotal),    [fciTotal]);
  useEffect(()=>save("clientsL",    clientsL),    [clientsL]);
  useEffect(()=>save("clientsT",    clientsT),    [clientsT]);
  useEffect(()=>save("sheetsConfig",sheetsConfig),[sheetsConfig]);
  useEffect(()=>save("recurringL",  recurringL),  [recurringL]);
  useEffect(()=>save("recurringT",  recurringT),  [recurringT]);
  useEffect(()=>save("efectivo",    efectivo),    [efectivo]);

  /* ── month data ── */
  const key = mk(sY,sM);
  useEffect(()=>{
    setMonths(prev=>{ if(prev[key]) return prev; return {...prev,[key]:buildMonth(sY,sM)}; });
  },[key]);
  const md  = months[key] || buildMonth(sY,sM);
  const upd = fn => setMonths(prev=>({...prev,[key]:fn(prev[key]||buildMonth(sY,sM))}));

  /* ── expense wizard ── */
  const [wizard, setWizard] = useState(null);
  // wizard = { step:1|2|3|4, owner, ownerCustom, category, payMethod, payMethodObj }

  const openWizard = () => setWizard({step:1});
  const closeWizard = () => setWizard(null);

  /* ── computed ── */
  const expenses = md.expenses || [];
  const myExp    = expenses.filter(e=>e.userId===currentUser?.id);
  const allCards = cards.filter(c=>c.owner===currentUser?.id);

  const cardTotals = useMemo(()=>{
    const map={};
    myExp.filter(e=>e.payType==="card").forEach(e=>{ map[e.payMethodId]=(map[e.payMethodId]||0)+num(e.amount); });
    return map;
  },[myExp]);

  const transferExp = myExp.filter(e=>e.payType!=="card");

  const myClients = currentUser?.id==="lucia" ? clientsL : clientsT;
  const setMyClients = currentUser?.id==="lucia" ? setClientsL : setClientsT;
  const totalIncome = myClients.reduce((s,c)=>s+num(c.amount),0);
  const totalCards  = Object.values(cardTotals).reduce((s,v)=>s+v,0);
  const totalTransfer = transferExp.reduce((s,e)=>s+num(e.amount),0);
  const totalOut    = totalCards + totalTransfer;
  const resultado   = totalIncome - totalOut;

  /* ── joint view ── */
  const allExp = expenses;
  const casaExp = allExp.filter(e=>e.owner==="Casa");
  const luciaPersonal = allExp.filter(e=>e.userId==="lucia"&&e.owner==="Personal");
  const tomasPersonal = allExp.filter(e=>e.userId==="tomas"&&e.owner==="Personal");
  const otrosExp = allExp.filter(e=>e.owner!=="Casa"&&e.owner!=="Personal");
  const luciaIncome = clientsL.reduce((s,c)=>s+num(c.amount),0);
  const tomasIncome = clientsT.reduce((s,c)=>s+num(c.amount),0);
  const luciaOut  = allExp.filter(e=>e.userId==="lucia").reduce((s,e)=>s+num(e.amount),0);
  const tomasOut  = allExp.filter(e=>e.userId==="tomas").reduce((s,e)=>s+num(e.amount),0);
  const casaLucia = casaExp.filter(e=>e.userId==="lucia").reduce((s,e)=>s+num(e.amount),0);
  const casaTomas = casaExp.filter(e=>e.userId==="tomas").reduce((s,e)=>s+num(e.amount),0);

  /* ── save expense ── */
  const saveExpense = async (form) => {
    const payObj = [...cards,...payMethods].find(p=>p.id===form.payMethodId);
    const isCard = cards.some(c=>c.id===form.payMethodId);
    const cuotas = isCard ? (parseInt(form.cuotas)||1) : 1;
    const amtPerCuota = num(form.amount)/cuotas;
    const groupId = uid();
    const startM  = isCard ? (parseInt(form.startMonth)||sM) : sM;
    const startY  = isCard ? (parseInt(form.startYear)||sY)  : sY;

    const newMonths = {...months};
    for(let i=0;i<cuotas;i++){
      let mo=startM+i, yr=startY;
      while(mo>11){mo-=12;yr++;}
      const mkey=mk(yr,mo);
      const base=newMonths[mkey]||buildMonth(yr,mo);
      const exp = {
        id:uid(), groupId, userId:currentUser.id,
        owner: form.owner==="Otro" ? (form.ownerCustom||"Otro") : form.owner,
        category: form.category, categoryName: categories.find(c=>c.id===form.category)?.name||form.category,
        payMethodId:form.payMethodId, payMethodName:payObj?.name||"",
        payType: isCard?"card":"transfer",
        amount:amtPerCuota, totalAmount:num(form.amount),
        cuotas, cuotaNum:i+1, desc:form.desc,
        date:new Date().toISOString().slice(0,10),
        month:MONTHS[mo], year:yr,
      };
      newMonths[mkey]={...base,expenses:[...(base.expenses||[]),exp]};

      // sync to Google Sheets
      syncGasto(exp, currentUser.name, MONTHS);
    }
    setMonths(newMonths);
    closeWizard();
  };

  /* ── LOGIN SCREEN ── */
  if(!currentUser) return (
    <LoginScreen users={users} onLogin={(u,pin)=>{
      if(u.pin===pin){setCurrentUser(u);setPinError(false);setPinInput("");}
      else{setPinError(true);}
    }} pinInput={pinInput} setPinInput={setPinInput} pinError={pinError}/>
  );

  const TABS=[
    {id:"resumen",   icon:"◎", label:"Mi resumen"},
    {id:"gastos",    icon:"↕", label:"Mis gastos"},
    {id:"tarjetas",  icon:"▭", label:"Tarjetas"},
    {id:"dashboard", icon:"▦", label:"Dashboard"},
    {id:"conjunto",  icon:"⊞", label:"En conjunto"},
    {id:"fci",       icon:"◈", label:"Fondo inversión"},
    {id:"config",    icon:"⚙", label:"Configuración"},
  ];

  return (
    <div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif",minHeight:"100dvh",background:"#f8f8f6",color:"#18181b"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#ddd;border-radius:4px}
        .inp{width:100%;padding:9px 12px;border:1px solid #e4e4e7;border-radius:10px;font-size:13px;background:#fff;outline:none;font-family:inherit;color:#18181b;transition:border .15s}
        .inp:focus{border-color:#18181b}
        .card{background:#fff;border-radius:16px;border:1px solid #e4e4e7}
        .btn{border:none;border-radius:10px;padding:9px 16px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;transition:opacity .15s}
        .btn:active{opacity:.7}
        .btn-dark{background:#18181b;color:#fff}
        .btn-ghost{background:#fff;border:1px solid #e4e4e7;color:#18181b}
        .btn-red{background:#fef2f2;color:#dc2626;border:1px solid #fecaca}
        .btn-green{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0}
        .btn-user{border:none;border-radius:12px;padding:9px 14px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;color:#fff}
        .mono{font-family:'DM Mono',monospace}
        .nav{padding:11px 12px;border-radius:12px;display:flex;align-items:center;gap:9px;font-size:13px;font-weight:500;cursor:pointer;border:none;background:none;font-family:inherit;width:100%;text-align:left;color:#18181b;transition:background .12s}
        .nav:hover{background:#f4f4f5}
        .nav.active{background:#18181b;color:#fff}
        .row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f4f4f5}
        .row:last-child{border-bottom:none}
        .tag{display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:500;background:#f4f4f5;color:#52525b}
        .check{width:17px;height:17px;border-radius:5px;accent-color:#18181b;cursor:pointer;flex-shrink:0}
        .sec{font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:.08em}
        .sumrow{display:flex;justify-content:space-between;font-size:14px;padding:6px 0}
        .hr{height:1px;background:#f4f4f5;margin:8px 0}
        .sidebar{position:fixed;top:0;left:0;height:100%;width:210px;background:#fff;border-right:1px solid #e4e4e7;z-index:50;transform:translateX(-100%);transition:transform .25s;padding:22px 10px;display:flex;flex-direction:column;gap:3px;overflow-y:auto}
        .sidebar.open{transform:translateX(0)}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:40;display:none}
        .overlay.open{display:block}
        .hamburger{position:fixed;top:12px;left:12px;z-index:60;background:#18181b;color:#fff;border:none;border-radius:9px;padding:8px 11px;font-size:17px;cursor:pointer;line-height:1}
        .topbar{display:none}
        .g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
        .wizard-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:100;display:flex;align-items:flex-end;justify-content:center}
        .wizard-sheet{background:#fff;border-radius:20px 20px 0 0;width:100%;max-width:600px;padding:24px;max-height:85vh;overflow-y:auto}
        .opt-row{display:flex;align-items:center;gap:12px;padding:12px;border-radius:12px;cursor:pointer;border:1px solid #e4e4e7;margin-bottom:8px;transition:all .15s}
        .opt-row:hover,.opt-row.sel{background:#f4f4f5;border-color:#18181b}
        .opt-row.sel{background:#18181b;border-color:#18181b}
        .opt-row.sel span,.opt-row.sel div{color:#fff!important}
        .opt-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;background:#f4f4f5}
        @media(min-width:768px){
          .sidebar{position:sticky;top:0;height:100vh;transform:none!important}
          .overlay{display:none!important}
          .hamburger{display:none!important}
          .layout{display:flex;min-height:100dvh}
          .main{flex:1;overflow:auto;padding:32px 36px 48px}
          .wizard-sheet{border-radius:16px;margin-bottom:40px}
        }
        @media(max-width:767px){
          .layout{display:block}
          .main{padding:16px 14px 80px}
          .topbar{display:flex;align-items:center;justify-content:space-between;padding:13px 14px 10px 52px;background:#fff;border-bottom:1px solid #e4e4e7;position:sticky;top:0;z-index:30}
          .g2{grid-template-columns:1fr}
          .g3{grid-template-columns:1fr 1fr}
        }
      `}</style>

      {/* WIZARD */}
      {wizard && (
        <ExpenseWizard
          wizard={wizard} setWizard={setWizard}
          categories={categories} cards={cards.filter(c=>c.owner===currentUser.id)} payMethods={payMethods}
          sM={sM} sY={sY} MONTHS={MONTHS} CY={CY}
          onSave={saveExpense} onClose={closeWizard}
          currentUser={currentUser}
        />
      )}

      <div className={`overlay ${sideOpen?"open":""}`} onClick={()=>setSideOpen(false)}/>
      <button className="hamburger" onClick={()=>setSideOpen(o=>!o)}>☰</button>

      <div className="topbar">
        <div style={{fontSize:14,fontWeight:600}}>{MONTHS[sM]} {sY}</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:currentUser.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:"#fff"}}>{currentUser.initials}</div>
          <button className="btn btn-ghost" style={{padding:"5px 10px",fontSize:12}} onClick={()=>{setCurrentUser(null);setPinInput("");}}>Salir</button>
        </div>
      </div>

      <div className="layout">
        {/* SIDEBAR */}
        <div className={`sidebar ${sideOpen?"open":""}`}>
          <div style={{paddingLeft:6,marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:currentUser.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,color:"#fff"}}>{currentUser.initials}</div>
            <div>
              <div style={{fontSize:14,fontWeight:600}}>{currentUser.name}</div>
              <button style={{background:"none",border:"none",fontSize:11,color:"#a1a1aa",cursor:"pointer",padding:0}} onClick={()=>{setCurrentUser(null);setPinInput("");}}>Cerrar sesión</button>
            </div>
          </div>
          {TABS.map(t=>(
            <button key={t.id} className={`nav ${tab===t.id?"active":""}`} onClick={()=>{setTab(t.id);setSideOpen(false);}}>
              <span style={{fontSize:14,opacity:.6}}>{t.icon}</span>{t.label}
            </button>
          ))}
          <div style={{marginTop:"auto",paddingTop:18,display:"flex",flexDirection:"column",gap:7}}>
            <div className="sec" style={{paddingLeft:4}}>Período</div>
            <select className="inp" value={sM} onChange={e=>setSM(+e.target.value)}>
              {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
            </select>
            <select className="inp" value={sY} onChange={e=>setSY(+e.target.value)}>
              {[CY-1,CY,CY+1].map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* MAIN */}
        <div className="main">

          {/* ══ MI RESUMEN ══ */}
          {tab==="resumen" && (
            <ResumenTab
              currentUser={currentUser} MONTHS={MONTHS} sM={sM} sY={sY}
              myClients={myClients} setMyClients={setMyClients}
              myExp={myExp} cards={cards.filter(c=>c.owner===currentUser.id)}
              cardTotals={cardTotals} transferExp={transferExp}
              totalIncome={totalIncome} totalCards={totalCards}
              totalTransfer={totalTransfer} totalOut={totalOut} resultado={resultado}
              fciTotal={fciTotal} setFciTotal={setFciTotal}
              efectivo={efectivo} setEfectivo={setEfectivo}
              recurring={currentUser.id==="lucia"?recurringL:recurringT}
              setRecurring={currentUser.id==="lucia"?setRecurringL:setRecurringT}
              upd={upd} md={md} fmt={fmt} num={num} uid={uid}
              openWizard={openWizard} months={months} mk={mk} CY={CY}
            />
          )}

          {/* ══ MIS GASTOS ══ */}
          {tab==="gastos" && (
            <GastosTab
              currentUser={currentUser} myExp={myExp}
              cards={cards} categories={categories} payMethods={payMethods}
              openWizard={openWizard} upd={upd} fmt={fmt}
              MONTHS={MONTHS} sM={sM} sY={sY}
            />
          )}


          {/* ══ TARJETAS ══ */}
          {tab==="tarjetas" && (
            <TarjetasTab
              currentUser={currentUser} MONTHS={MONTHS} sM={sM} sY={sY}
              cards={cards.filter(c=>c.owner===currentUser.id)}
              myExp={myExp} cardTotals={cardTotals} fmt={fmt} num={num}
              months={months} mk={mk} CY={CY} upd={upd}
            />
          )}

          {/* ══ DASHBOARD ══ */}
          {tab==="dashboard" && (
            <DashboardTab
              users={users} months={months} cards={cards}
              categories={categories} fmt={fmt} num={num}
              MONTHS={MONTHS} CY={CY} mk={mk}
              clientsL={clientsL} clientsT={clientsT}
            />
          )}

          {/* ══ EN CONJUNTO ══ */}
          {tab==="conjunto" && (
            <ConjuntoTab
              users={users} fmt={fmt}
              casaExp={casaExp} luciaPersonal={luciaPersonal}
              tomasPersonal={tomasPersonal} otrosExp={otrosExp}
              luciaIncome={luciaIncome} tomasIncome={tomasIncome}
              luciaOut={luciaOut} tomasOut={tomasOut}
              casaLucia={casaLucia} casaTomas={casaTomas}
              fciTotal={fciTotal} MONTHS={MONTHS} sM={sM} sY={sY}
              cards={cards} cardTotals={cardTotals}
              allExp={allExp} months={months} mk={mk} CY={CY}
            />
          )}

          {/* ══ FCI ══ */}
          {tab==="fci" && (
            <FciTab
              fciTotal={fciTotal} setFciTotal={setFciTotal}
              md={md} upd={upd} months={months} fmt={fmt} uid={uid} num={num}
            />
          )}

          {/* ══ CONFIG ══ */}
          {tab==="config" && (
            <ConfigTab
              users={users} setUsers={setUsers}
              cards={cards} setCards={setCards}
              payMethods={payMethods} setPayMethods={setPayMethods}
              categories={categories} setCategories={setCategories}
              clientsL={clientsL} setClientsL={setClientsL}
              clientsT={clientsT} setClientsT={setClientsT}
              sheetsConfig={sheetsConfig} setSheetsConfig={setSheetsConfig}
              currentUser={currentUser} uid={uid}
            />
          )}

        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   LOGIN
══════════════════════════════════════════════ */
function LoginScreen({users,onLogin,pinInput,setPinInput,pinError}){
  const [selUser,setSelUser]=useState(null);
  return (
    <div style={{minHeight:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f8f8f6",fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
      <div style={{width:"100%",maxWidth:360,padding:"0 24px"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:24,fontWeight:600}}>Mis finanzas</div>
          <div style={{fontSize:14,color:"#71717a",marginTop:4}}>¿Quién sos?</div>
        </div>
        {!selUser ? (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {users.map(u=>(
              <button key={u.id} onClick={()=>setSelUser(u)} style={{background:"#fff",border:"1px solid #e4e4e7",borderRadius:14,padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=u.color}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#e4e4e7"}>
                <div style={{width:44,height:44,borderRadius:"50%",background:u.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:600,color:"#fff"}}>{u.initials}</div>
                <span style={{fontSize:16,fontWeight:500,color:"#18181b"}}>{u.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="card" style={{padding:24}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
              <button onClick={()=>{setSelUser(null);setPinInput("");}} style={{background:"none",border:"none",cursor:"pointer",color:"#a1a1aa",fontSize:18}}>←</button>
              <div style={{width:36,height:36,borderRadius:"50%",background:selUser.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600,color:"#fff"}}>{selUser.initials}</div>
              <span style={{fontSize:15,fontWeight:500}}>{selUser.name}</span>
            </div>
            <div style={{fontSize:13,color:"#71717a",marginBottom:10}}>Ingresá tu PIN</div>
            <input className="inp" type="password" inputMode="numeric" maxLength={6} placeholder="••••" value={pinInput}
              onChange={e=>setPinInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&onLogin(selUser,pinInput)}
              style={{fontSize:20,textAlign:"center",letterSpacing:8,marginBottom:pinError?8:12}}
              autoFocus/>
            {pinError && <div style={{fontSize:12,color:"#dc2626",marginBottom:10,textAlign:"center"}}>PIN incorrecto</div>}
            <button className="btn btn-dark" style={{width:"100%"}} onClick={()=>onLogin(selUser,pinInput)}>Entrar</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   EXPENSE WIZARD
══════════════════════════════════════════════ */
function ExpenseWizard({wizard,setWizard,categories,cards,payMethods,sM,sY,MONTHS,CY,onSave,onClose,currentUser}){
  const [form,setForm]=useState({
    owner:"Personal", ownerCustom:"", category:"", payMethodId:"",
    cuotas:"1", startMonth:String(sM), startYear:String(sY), amount:"", desc:""
  });

  const allPayMethods = [...cards,...payMethods];
  const selPay = allPayMethods.find(p=>p.id===form.payMethodId);
  const isCard = cards.some(c=>c.id===form.payMethodId);
  const owners = ["Personal","Casa","Otro"];

  const step = wizard.step;
  const canGoStep = {
    2: !!form.owner && (form.owner!=="Otro"||form.ownerCustom),
    3: !!form.category,
    4: !!form.payMethodId,
  };

  const next = () => setWizard(w=>({...w,step:w.step+1}));
  const back = () => { if(step>1) setWizard(w=>({...w,step:w.step-1})); else onClose(); };

  return (
    <div className="wizard-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="wizard-sheet">
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <button onClick={back} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#71717a"}}>←</button>
          <div style={{display:"flex",gap:6}}>
            {[1,2,3,4].map(s=>(
              <div key={s} style={{width:s===step?20:6,height:6,borderRadius:3,background:s===step?"#18181b":s<step?"#a1a1aa":"#e4e4e7",transition:"all .2s"}}/>
            ))}
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#71717a"}}>✕</button>
        </div>

        {/* STEP 1: owner */}
        {step===1 && (
          <div>
            <div style={{fontSize:17,fontWeight:600,marginBottom:4}}>¿A quién corresponde?</div>
            <div style={{fontSize:13,color:"#71717a",marginBottom:16}}>Clasificá este gasto</div>
            {owners.map(o=>(
              <div key={o} className={`opt-row ${form.owner===o?"sel":""}`} onClick={()=>setForm(f=>({...f,owner:o}))}>
                <div className="opt-icon">{o==="Personal"?"👤":o==="Casa"?"🏠":"➕"}</div>
                <div>
                  <div style={{fontSize:14,fontWeight:500,color:"#18181b"}}>{o}</div>
                  <div style={{fontSize:12,color:"#71717a"}}>{o==="Personal"?"Solo tuyo":o==="Casa"?"Compartido con Tomás":"Mamá, amigos, etc."}</div>
                </div>
              </div>
            ))}
            {form.owner==="Otro" && (
              <input className="inp" placeholder="¿De quién? (ej: Mamá)" value={form.ownerCustom}
                onChange={e=>setForm(f=>({...f,ownerCustom:e.target.value}))}
                style={{marginTop:4}} autoFocus/>
            )}
            <button className="btn btn-dark" style={{width:"100%",marginTop:16}} onClick={next}
              disabled={!form.owner||(form.owner==="Otro"&&!form.ownerCustom)}>Continuar →</button>
          </div>
        )}

        {/* STEP 2: category */}
        {step===2 && (
          <div>
            <div style={{fontSize:17,fontWeight:600,marginBottom:4}}>¿Qué tipo de gasto?</div>
            <div style={{fontSize:13,color:"#71717a",marginBottom:16}}>Para {form.owner==="Otro"?form.ownerCustom:form.owner}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {categories.map(c=>(
                <div key={c.id} className={`opt-row ${form.category===c.id?"sel":""}`}
                  onClick={()=>{setForm(f=>({...f,category:c.id}));}} style={{padding:"10px 12px"}}>
                  <div style={{fontSize:20}}>{c.icon}</div>
                  <span style={{fontSize:13,fontWeight:500,color:"#18181b"}}>{c.name}</span>
                </div>
              ))}
            </div>
            <button className="btn btn-dark" style={{width:"100%",marginTop:16}} onClick={next}
              disabled={!form.category}>Continuar →</button>
          </div>
        )}

        {/* STEP 3: payment method */}
        {step===3 && (
          <div>
            <div style={{fontSize:17,fontWeight:600,marginBottom:4}}>¿Con qué pagaste?</div>
            <div style={{fontSize:13,color:"#71717a",marginBottom:16}}>
              {categories.find(c=>c.id===form.category)?.name} · {form.owner==="Otro"?form.ownerCustom:form.owner}
            </div>
            {cards.length>0 && <div className="sec" style={{marginBottom:8}}>Tarjetas</div>}
            {cards.map(c=>(
              <div key={c.id} className={`opt-row ${form.payMethodId===c.id?"sel":""}`}
                onClick={()=>setForm(f=>({...f,payMethodId:c.id}))}>
                <div className="opt-icon" style={{background:c.color,color:"#fff",fontSize:12,fontWeight:700}}>
                  {c.name.slice(0,2).toUpperCase()}
                </div>
                <span style={{fontSize:14,fontWeight:500,color:"#18181b"}}>{c.name}</span>
              </div>
            ))}
            <div className="sec" style={{margin:"12px 0 8px"}}>Otros medios</div>
            {payMethods.map(p=>(
              <div key={p.id} className={`opt-row ${form.payMethodId===p.id?"sel":""}`}
                onClick={()=>setForm(f=>({...f,payMethodId:p.id}))}>
                <div className="opt-icon">{p.icon}</div>
                <span style={{fontSize:14,fontWeight:500,color:"#18181b"}}>{p.name}</span>
              </div>
            ))}
            <button className="btn btn-dark" style={{width:"100%",marginTop:16}} onClick={next}
              disabled={!form.payMethodId}>Continuar →</button>
          </div>
        )}

        {/* STEP 4: amount + details */}
        {step===4 && (
          <div>
            <div style={{fontSize:17,fontWeight:600,marginBottom:4}}>Detalle del gasto</div>
            <div style={{fontSize:13,color:"#71717a",marginBottom:16}}>
              {selPay?.name} · {categories.find(c=>c.id===form.category)?.name}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div>
                <div className="sec" style={{marginBottom:6}}>Descripción</div>
                <input className="inp" placeholder="Ej: Supermercado DIA" value={form.desc}
                  onChange={e=>setForm(f=>({...f,desc:e.target.value}))} autoFocus/>
              </div>
              <div>
                <div className="sec" style={{marginBottom:6}}>Monto total</div>
                <input className="inp mono" type="number" placeholder="$ 0" value={form.amount}
                  onChange={e=>setForm(f=>({...f,amount:e.target.value}))}
                  style={{fontSize:18,fontWeight:500}}/>
              </div>
              {isCard && (
                <>
                  <div>
                    <div className="sec" style={{marginBottom:8}}>Cuotas</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {["1","2","3","6","12","18","24"].map(n=>(
                        <button key={n} onClick={()=>setForm(f=>({...f,cuotas:n}))}
                          style={{padding:"7px 16px",borderRadius:20,border:`1px solid ${form.cuotas===n?"#18181b":"#e4e4e7"}`,background:form.cuotas===n?"#18181b":"#fff",color:form.cuotas===n?"#fff":"#18181b",cursor:"pointer",fontSize:13,fontWeight:500}}>
                          {n}
                        </button>
                      ))}
                    </div>
                    {parseInt(form.cuotas)>1 && num(form.amount)>0 && (
                      <div style={{fontSize:12,color:"#6366f1",marginTop:8}}>
                        {fmt(num(form.amount)/parseInt(form.cuotas))} / mes · {parseInt(form.cuotas)} cuotas
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="sec" style={{marginBottom:8}}>Primera cuota en</div>
                    <div style={{display:"flex",gap:8}}>
                      <select className="inp" value={form.startMonth} onChange={e=>setForm(f=>({...f,startMonth:e.target.value}))}>
                        {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
                      </select>
                      <select className="inp" value={form.startYear} onChange={e=>setForm(f=>({...f,startYear:e.target.value}))} style={{width:100}}>
                        {[CY-1,CY,CY+1].map(y=><option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
            <button className="btn btn-dark" style={{width:"100%",marginTop:20}}
              onClick={()=>onSave(form)}
              disabled={!form.amount}>
              Guardar gasto ✓
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   RESUMEN TAB
══════════════════════════════════════════════ */
function ResumenTab({currentUser,MONTHS,sM,sY,myClients,setMyClients,myExp,cards,cardTotals,transferExp,totalIncome,totalCards,totalTransfer,totalOut,resultado,fciTotal,setFciTotal,efectivo,setEfectivo,recurring,setRecurring,upd,md,fmt,num,uid,openWizard,months,mk,CY}){
  const [editEfectivo,setEditEfectivo]=useState(false);
  const [efForm,setEfForm]=useState(String(efectivo));

  // Next month computed
  let nM=sM+1, nY=sY;
  if(nM>11){nM=0;nY++;}
  const nextKey=mk(nY,nM);
  const nextMd=months[nextKey];
  const nextMyExp=(nextMd?.expenses||[]).filter(e=>e.userId===currentUser.id);
  const nextCardTotals={};
  nextMyExp.filter(e=>e.payType==="card").forEach(e=>{nextCardTotals[e.payMethodId]=(nextCardTotals[e.payMethodId]||0)+num(e.amount);});
  const nextTransferExp=nextMyExp.filter(e=>e.payType!=="card");
  const nextTotalCards=Object.values(nextCardTotals).reduce((s,v)=>s+v,0);
  const nextTotalTransfer=nextTransferExp.reduce((s,e)=>s+num(e.amount),0);
  const nextTotalRecurring=recurring.filter(r=>r.active).reduce((s,r)=>s+num(r.amount),0);
  const nextTotalOut=nextTotalCards+nextTotalTransfer+nextTotalRecurring;
  const nextIncome=myClients.reduce((s,c)=>s+num(c.amount),0);
  const nextResult=nextIncome-nextTotalOut;

  const totalRecurring=recurring.filter(r=>r.active).reduce((s,r)=>s+num(r.amount),0);
  const totalWithEfectivo=totalIncome+num(efectivo)+fciTotal;
  const resultadoFull=totalWithEfectivo-totalOut-totalRecurring;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <h1 style={{fontSize:20,fontWeight:600}}>Mi resumen</h1>
          <div style={{fontSize:13,color:"#71717a"}}>{currentUser.name}</div>
        </div>
        <button className="btn btn-dark" onClick={openWizard}>+ Gasto</button>
      </div>

      {/* MES ACTUAL Y SIGUIENTE LADO A LADO */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>

        {/* MES ACTUAL */}
        <div className="card" style={{padding:16,borderTop:"3px solid #6366f1"}}>
          <div style={{fontSize:12,fontWeight:600,color:"#6366f1",marginBottom:10,textTransform:"uppercase",letterSpacing:".06em"}}>{MONTHS[sM]} {sY}</div>

          {/* FCI + Efectivo + Ingresos */}
          <div style={{background:"#f0fdf4",borderRadius:10,padding:"10px 12px",marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
              <span style={{color:"#15803d"}}>Fondo inversión</span>
              <span className="mono" style={{color:"#15803d",fontWeight:600}}>{fmt(fciTotal)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
              <span style={{color:"#15803d"}}>Clientes</span>
              <span className="mono" style={{color:"#15803d"}}>{fmt(totalIncome)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,alignItems:"center"}}>
              <span style={{color:"#15803d"}}>Efectivo</span>
              {editEfectivo
                ? <div style={{display:"flex",gap:5}}>
                    <input className="inp mono" type="number" value={efForm} onChange={e=>setEfForm(e.target.value)} style={{width:90,textAlign:"right",fontSize:12,padding:"3px 7px"}}/>
                    <button className="btn btn-dark" style={{padding:"3px 8px",fontSize:11}} onClick={()=>{setEfectivo(num(efForm));setEditEfectivo(false);}}>✓</button>
                  </div>
                : <span className="mono" style={{color:"#15803d",cursor:"pointer",textDecoration:"underline dotted"}} onClick={()=>{setEfForm(String(efectivo));setEditEfectivo(true);}}>{fmt(efectivo)} ✎</span>
              }
            </div>
            <div style={{borderTop:"1px solid #bbf7d0",marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between",fontWeight:600,fontSize:13}}>
              <span style={{color:"#15803d"}}>Total disponible</span>
              <span className="mono" style={{color:"#15803d"}}>{fmt(totalWithEfectivo)}</span>
            </div>
          </div>

          {/* Gastos */}
          <div style={{background:"#fef2f2",borderRadius:10,padding:"10px 12px",marginBottom:8}}>
            {cards.filter(c=>c.owner===currentUser.id&&(cardTotals[c.id]||0)>0).map(c=>(
              <div key={c.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
                <span style={{color:"#dc2626",display:"flex",alignItems:"center",gap:4}}><span style={{width:6,height:6,borderRadius:2,background:c.color,display:"inline-block"}}/>{c.name}</span>
                <span className="mono" style={{color:"#dc2626"}}>−{fmt(cardTotals[c.id])}</span>
              </div>
            ))}
            {totalTransfer>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{color:"#dc2626"}}>Transf/Efect</span><span className="mono" style={{color:"#dc2626"}}>−{fmt(totalTransfer)}</span></div>}
            {totalRecurring>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{color:"#dc2626"}}>Gastos fijos</span><span className="mono" style={{color:"#dc2626"}}>−{fmt(totalRecurring)}</span></div>}
            <div style={{borderTop:"1px solid #fecaca",marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between",fontWeight:600,fontSize:13}}>
              <span style={{color:"#dc2626"}}>Total gastos</span>
              <span className="mono" style={{color:"#dc2626"}}>−{fmt(totalOut+totalRecurring)}</span>
            </div>
          </div>

          <div style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:resultadoFull>=0?"#eff6ff":"#fef2f2",borderRadius:10,fontWeight:700,fontSize:14}}>
            <span>Resultado</span>
            <span className="mono" style={{color:resultadoFull>=0?"#1d4ed8":"#dc2626"}}>{resultadoFull>=0?"+":""}{fmt(resultadoFull)}</span>
          </div>
        </div>

        {/* MES SIGUIENTE */}
        <div className="card" style={{padding:16,borderTop:"3px solid #a1a1aa"}}>
          <div style={{fontSize:12,fontWeight:600,color:"#71717a",marginBottom:10,textTransform:"uppercase",letterSpacing:".06em"}}>{MONTHS[nM]} {nY} →</div>

          <div style={{background:"#f0fdf4",borderRadius:10,padding:"10px 12px",marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
              <span style={{color:"#15803d"}}>Clientes (est.)</span>
              <span className="mono" style={{color:"#15803d"}}>{fmt(nextIncome)}</span>
            </div>
          </div>

          <div style={{background:"#fef2f2",borderRadius:10,padding:"10px 12px",marginBottom:8}}>
            {cards.filter(c=>c.owner===currentUser.id&&(nextCardTotals[c.id]||0)>0).map(c=>(
              <div key={c.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
                <span style={{color:"#dc2626",display:"flex",alignItems:"center",gap:4}}><span style={{width:6,height:6,borderRadius:2,background:c.color,display:"inline-block"}}/>{c.name}</span>
                <span className="mono" style={{color:"#dc2626"}}>−{fmt(nextCardTotals[c.id])}</span>
              </div>
            ))}
            {nextTotalTransfer>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{color:"#dc2626"}}>Transf/Efect</span><span className="mono" style={{color:"#dc2626"}}>−{fmt(nextTotalTransfer)}</span></div>}
            {nextTotalRecurring>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{color:"#dc2626"}}>Gastos fijos</span><span className="mono" style={{color:"#dc2626"}}>−{fmt(nextTotalRecurring)}</span></div>}
            {nextTotalCards===0&&nextTotalTransfer===0&&nextTotalRecurring===0&&<div style={{fontSize:12,color:"#a1a1aa"}}>Sin cuotas proyectadas</div>}
            {(nextTotalCards+nextTotalTransfer+nextTotalRecurring)>0&&(
              <div style={{borderTop:"1px solid #fecaca",marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between",fontWeight:600,fontSize:13}}>
                <span style={{color:"#dc2626"}}>Total gastos</span>
                <span className="mono" style={{color:"#dc2626"}}>−{fmt(nextTotalOut)}</span>
              </div>
            )}
          </div>

          <div style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:nextResult>=0?"#eff6ff":"#fef2f2",borderRadius:10,fontWeight:700,fontSize:14}}>
            <span>Resultado</span>
            <span className="mono" style={{color:nextResult>=0?"#1d4ed8":"#dc2626"}}>{nextResult>=0?"+":""}{fmt(nextResult)}</span>
          </div>
        </div>
      </div>

      {/* CLIENTES */}
      <div className="card" style={{padding:18,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
          <span className="sec">Ingresos — clientes</span>
          <span className="mono" style={{fontSize:12,color:"#15803d"}}>{fmt(totalIncome)}</span>
        </div>
        {myClients.filter(c=>c.active).map(c=>(
          <div key={c.id} className="row">
            <div style={{display:"flex",alignItems:"center",gap:9,flex:1}}>
              <input type="checkbox" className="check" checked={c.paid||false}
                onChange={()=>{
                  if(!c.paid){
                    const ok=window.confirm(`¿Marcar ${c.name} como cobrado y llevar ${fmt(c.amount)} al fondo de inversión?`);
                    if(ok){ setFciTotal(p=>p+num(c.amount)); }
                  }
                  setMyClients(p=>p.map(x=>x.id===c.id?{...x,paid:!x.paid}:x));
                }}/>
              <input className="inp" value={c.name}
                onChange={e=>setMyClients(p=>p.map(x=>x.id===c.id?{...x,name:e.target.value}:x))}
                style={{border:"none",background:"transparent",fontWeight:500,fontSize:13,padding:"2px 0",textDecoration:c.paid?"line-through":"none",color:c.paid?"#a1a1aa":"#18181b"}}/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <input className="inp mono" type="number" value={c.amount}
                onChange={e=>setMyClients(p=>p.map(x=>x.id===c.id?{...x,amount:+e.target.value}:x))}
                style={{width:105,textAlign:"right",fontSize:13,color:c.paid?"#a1a1aa":"#18181b"}}/>
              <button className="btn btn-red" style={{padding:"4px 7px",fontSize:11}} onClick={()=>setMyClients(p=>p.filter(x=>x.id!==c.id))}>✕</button>
            </div>
          </div>
        ))}
        <button className="btn btn-ghost" style={{marginTop:10,fontSize:12,width:"100%"}}
          onClick={()=>setMyClients(p=>[...p,{id:uid(),name:"Nuevo cliente",amount:0,active:true,paid:false}])}>
          + Cliente
        </button>
      </div>

      {/* GASTOS FIJOS RECURRENTES */}
      <div className="card" style={{padding:18,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
          <span className="sec">Gastos fijos recurrentes</span>
          <span className="mono" style={{fontSize:12,color:"#dc2626"}}>{fmt(totalRecurring)}</span>
        </div>
        <p style={{fontSize:11,color:"#a1a1aa",marginBottom:10}}>Se replican automáticamente cada mes. Editá el monto cuando cambie.</p>
        {recurring.map(r=>(
          <div key={r.id} className="row">
            <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
              <input type="checkbox" className="check" checked={r.active} onChange={()=>setRecurring(p=>p.map(x=>x.id===r.id?{...x,active:!x.active}:x))}/>
              <input className="inp" value={r.name} onChange={e=>setRecurring(p=>p.map(x=>x.id===r.id?{...x,name:e.target.value}:x))}
                style={{border:"none",background:"transparent",fontWeight:500,fontSize:13,padding:"2px 0",color:r.active?"#18181b":"#a1a1aa"}}/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <input className="inp mono" type="number" value={r.amount} onChange={e=>setRecurring(p=>p.map(x=>x.id===r.id?{...x,amount:+e.target.value}:x))}
                style={{width:105,textAlign:"right",fontSize:13,color:r.active?"#18181b":"#a1a1aa"}}/>
              <button className="btn btn-red" style={{padding:"4px 7px",fontSize:11}} onClick={()=>setRecurring(p=>p.filter(x=>x.id!==r.id))}>✕</button>
            </div>
          </div>
        ))}
        <button className="btn btn-ghost" style={{marginTop:10,fontSize:12,width:"100%"}}
          onClick={()=>setRecurring(p=>[...p,{id:uid(),name:"Nuevo fijo",amount:0,active:true,userId:currentUser.id}])}>
          + Agregar fijo
        </button>
      </div>

      {/* TARJETAS RESUMEN */}
      <div className="card" style={{padding:18,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
          <span className="sec">Resumen por tarjeta</span>
          <span className="mono" style={{fontSize:12,color:"#dc2626"}}>{fmt(totalCards)}</span>
        </div>
        <div className="g2">
          {cards.filter(c=>c.owner===currentUser.id).map(c=>{
            const total=cardTotals[c.id]||0;
            if(total===0) return null;
            return (
              <div key={c.id} style={{background:"#fafafa",borderRadius:12,padding:"12px 14px",borderLeft:`3px solid ${c.color}`}}>
                <div style={{fontSize:12,color:"#71717a",marginBottom:4}}>{c.name}</div>
                <div className="mono" style={{fontSize:17,fontWeight:500,color:"#dc2626"}}>{fmt(total)}</div>
              </div>
            );
          })}
          {Object.keys(cardTotals).length===0&&<div style={{fontSize:13,color:"#a1a1aa",gridColumn:"1/-1"}}>Sin gastos con tarjeta este mes</div>}
        </div>
      </div>

      {/* PAGOS FIJOS CARGADOS */}
      {transferExp.length>0&&(
        <div className="card" style={{padding:18,marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
            <span className="sec">Pagos cargados (transf/efect)</span>
            <span className="mono" style={{fontSize:12,color:"#dc2626"}}>{fmt(totalTransfer)}</span>
          </div>
          {transferExp.map(e=>(
            <div key={e.id} className="row">
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500}}>{e.desc||e.categoryName}</div>
                <div style={{fontSize:11,color:"#a1a1aa"}}>{e.payMethodName} · {e.categoryName}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                <span className="mono" style={{fontSize:13}}>{fmt(e.amount)}</span>
                <button className="btn btn-red" style={{padding:"4px 7px",fontSize:11}}
                  onClick={()=>upd(d=>({...d,expenses:d.expenses.filter(x=>x.id!==e.id)}))}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


/* ══════════════════════════════════════════════
   GASTOS TAB
══════════════════════════════════════════════ */
function GastosTab({currentUser,myExp,cards,categories,payMethods,openWizard,upd,fmt,MONTHS,sM,sY}){
  const grouped = {};
  myExp.forEach(e=>{
    const k=e.owner||"Sin clasificar";
    if(!grouped[k]) grouped[k]=[];
    grouped[k].push(e);
  });

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{fontSize:20,fontWeight:600}}>Mis gastos — {MONTHS[sM]} {sY}</h1>
        <button className="btn btn-dark" onClick={openWizard}>+ Gasto</button>
      </div>
      {myExp.length===0 && (
        <div className="card" style={{padding:32,textAlign:"center",color:"#a1a1aa"}}>
          <div style={{fontSize:32,marginBottom:8}}>📭</div>
          <div style={{fontSize:14}}>Sin gastos este mes</div>
          <button className="btn btn-dark" style={{marginTop:14}} onClick={openWizard}>+ Cargar gasto</button>
        </div>
      )}
      {Object.entries(grouped).map(([owner,exps])=>{
        const total=exps.reduce((s,e)=>s+num(e.amount),0);
        return (
          <div key={owner} className="card" style={{marginBottom:14}}>
            <div style={{padding:"12px 18px",borderBottom:"1px solid #f4f4f5",display:"flex",justifyContent:"space-between"}}>
              <span style={{fontWeight:600,fontSize:14}}>{owner}</span>
              <span className="mono" style={{color:"#dc2626",fontWeight:500}}>{fmt(total)}</span>
            </div>
            {exps.map((e,i)=>(
              <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 18px",borderBottom:i<exps.length-1?"1px solid #f9f9f9":"none"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500}}>{e.desc||e.categoryName}</div>
                  <div style={{fontSize:11,color:"#a1a1aa",marginTop:2,display:"flex",gap:6,flexWrap:"wrap"}}>
                    <span>{e.categoryName}</span>
                    <span>·</span>
                    <span>{e.payMethodName}</span>
                    {e.cuotas>1&&<><span>·</span><span style={{color:"#6366f1"}}>{e.cuotaNum}/{e.cuotas}</span></>}
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                  <span className="mono" style={{fontSize:13}}>{fmt(e.amount)}</span>
                  <button className="btn btn-red" style={{padding:"4px 7px",fontSize:11}}
                    onClick={()=>upd(d=>({...d,expenses:d.expenses.filter(x=>x.id!==e.id)}))}>✕</button>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════
   CONJUNTO TAB
══════════════════════════════════════════════ */
function ConjuntoTab({users,fmt,casaExp,luciaPersonal,tomasPersonal,otrosExp,luciaIncome,tomasIncome,luciaOut,tomasOut,casaLucia,casaTomas,fciTotal,MONTHS,sM,sY,cards,allExp,months,mk,CY}){
  const lu=users.find(u=>u.id==="lucia");
  const to=users.find(u=>u.id==="tomas");
  const totalCasa=casaExp.reduce((s,e)=>s+num(e.amount),0);
  const totalJunto=(luciaIncome+tomasIncome)-(luciaOut+tomasOut);

  // Card totals per user for conciliation
  const luCards={};
  cards.filter(c=>c.owner==="lucia").forEach(c=>{
    luCards[c.id]=allExp.filter(e=>e.userId==="lucia"&&e.payMethodId===c.id).reduce((s,e)=>s+num(e.amount),0);
  });
  const toCards={};
  cards.filter(c=>c.owner==="tomas").forEach(c=>{
    toCards[c.id]=allExp.filter(e=>e.userId==="tomas"&&e.payMethodId===c.id).reduce((s,e)=>s+num(e.amount),0);
  });

  const Section=({title,exps,color="#18181b"})=>{
    const total=exps.reduce((s,e)=>s+num(e.amount),0);
    if(exps.length===0) return null;
    return (
      <div className="card" style={{padding:18,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
          <span style={{fontWeight:600,fontSize:14,color}}>{title}</span>
          <span className="mono" style={{color:"#dc2626"}}>{fmt(total)}</span>
        </div>
        {exps.map((e,i)=>(
          <div key={e.id} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"5px 0",borderBottom:i<exps.length-1?"1px solid #f9f9f9":"none"}}>
            <div>
              <span>{e.desc||e.categoryName}</span>
              <span className="tag" style={{marginLeft:6,fontSize:10}}>{e.userId==="lucia"?lu?.name:to?.name}</span>
            </div>
            <span className="mono">{fmt(e.amount)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <h1 style={{fontSize:20,fontWeight:600,marginBottom:4}}>En conjunto</h1>
      <p style={{fontSize:13,color:"#71717a",marginBottom:20}}>{MONTHS[sM]} {sY} · {lu?.name} + {to?.name}</p>

      {/* RESUMEN TARJETAS PARA CONCILIACIÓN */}
      <div style={{fontSize:12,fontWeight:600,color:"#71717a",textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>
        Resumen tarjetas — conciliación
      </div>
      <div className="g2" style={{marginBottom:16}}>
        <div className="card" style={{padding:16,borderTop:`3px solid ${lu?.color}`}}>
          <div style={{fontSize:12,color:"#71717a",marginBottom:8}}>{lu?.name}</div>
          {cards.filter(c=>c.owner==="lucia"&&(luCards[c.id]||0)>0).map(c=>(
            <div key={c.id} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0"}}>
              <span style={{color:"#52525b",display:"flex",alignItems:"center",gap:5}}>
                <span style={{width:7,height:7,borderRadius:2,background:c.color,display:"inline-block"}}/>
                {c.name}
              </span>
              <span className="mono" style={{color:"#dc2626"}}>{fmt(luCards[c.id])}</span>
            </div>
          ))}
          {Object.values(luCards).every(v=>v===0)&&<div style={{fontSize:12,color:"#a1a1aa"}}>Sin tarjetas</div>}
        </div>
        <div className="card" style={{padding:16,borderTop:`3px solid ${to?.color}`}}>
          <div style={{fontSize:12,color:"#71717a",marginBottom:8}}>{to?.name}</div>
          {cards.filter(c=>c.owner==="tomas"&&(toCards[c.id]||0)>0).map(c=>(
            <div key={c.id} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0"}}>
              <span style={{color:"#52525b",display:"flex",alignItems:"center",gap:5}}>
                <span style={{width:7,height:7,borderRadius:2,background:c.color,display:"inline-block"}}/>
                {c.name}
              </span>
              <span className="mono" style={{color:"#dc2626"}}>{fmt(toCards[c.id])}</span>
            </div>
          ))}
          {Object.values(toCards).every(v=>v===0)&&<div style={{fontSize:12,color:"#a1a1aa"}}>Sin tarjetas</div>}
        </div>
      </div>

      {/* RESÚMENES INDIVIDUALES */}
      <div className="g2" style={{marginBottom:16}}>
        {[
          {u:lu,income:luciaIncome,out:luciaOut},
          {u:to,income:tomasIncome,out:tomasOut},
        ].map(({u,income,out})=>u&&(
          <div key={u.id} className="card" style={{padding:16,borderTop:`3px solid ${u.color}`}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>{u.name}</div>
            <div className="sumrow"><span style={{color:"#52525b",fontSize:13}}>Ingresos</span><span className="mono" style={{color:"#15803d",fontSize:13}}>{fmt(income)}</span></div>
            <div className="sumrow"><span style={{color:"#52525b",fontSize:13}}>Gastos</span><span className="mono" style={{color:"#dc2626",fontSize:13}}>−{fmt(out)}</span></div>
            <div style={{height:1,background:"#f4f4f5",margin:"6px 0"}}/>
            <div className="sumrow">
              <span style={{fontWeight:600,fontSize:13}}>Resultado</span>
              <span className="mono" style={{fontWeight:600,fontSize:13,color:(income-out)>=0?"#15803d":"#dc2626"}}>{fmt(income-out)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* GASTOS POR CATEGORÍA */}
      <Section title="🏠 Casa (compartido)" exps={casaExp} color="#0ea5e9"/>
      <Section title={`👤 Personal ${lu?.name}`} exps={luciaPersonal} color={lu?.color}/>
      <Section title={`👤 Personal ${to?.name}`} exps={tomasPersonal} color={to?.color}/>
      <Section title="Otros" exps={otrosExp}/>

      {/* CASA APORTES */}
      {totalCasa>0 && (
        <div className="card" style={{padding:18,marginBottom:12}}>
          <div className="sec" style={{marginBottom:12}}>Aportes a la casa</div>
          {[{name:lu?.name,val:casaLucia,color:lu?.color},{name:to?.name,val:casaTomas,color:to?.color}].map(r=>(
            <div key={r.name} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"5px 0"}}>
              <span style={{color:"#52525b"}}>{r.name}</span>
              <span className="mono">{fmt(r.val)} ({totalCasa>0?Math.round(r.val/totalCasa*100):0}%)</span>
            </div>
          ))}
        </div>
      )}

      {/* RESULTADO CONJUNTO */}
      <div className="card" style={{padding:20}}>
        <div className="sec" style={{marginBottom:12}}>Resultado conjunto</div>
        <div className="sumrow"><span style={{color:"#52525b"}}>Ingresos totales</span><span className="mono" style={{color:"#15803d"}}>{fmt(luciaIncome+tomasIncome)}</span></div>
        <div className="sumrow"><span style={{color:"#52525b"}}>Gastos totales</span><span className="mono" style={{color:"#dc2626"}}>−{fmt(luciaOut+tomasOut)}</span></div>
        <div style={{height:1,background:"#18181b",margin:"10px 0"}}/>
        <div className="sumrow" style={{fontWeight:700,fontSize:15}}>
          <span>Resultado</span>
          <span className="mono" style={{fontSize:20,color:totalJunto>=0?"#15803d":"#dc2626"}}>{totalJunto>=0?"+":""}{fmt(totalJunto)}</span>
        </div>
        <div style={{marginTop:12,background:"#f0fdf4",borderRadius:10,padding:"10px 14px",display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:13,color:"#15803d",fontWeight:500}}>Fondo de inversión</span>
          <span className="mono" style={{color:"#15803d",fontWeight:600}}>{fmt(fciTotal)}</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   FCI TAB
══════════════════════════════════════════════ */
function FciTab({fciTotal,setFciTotal,md,upd,months,fmt,uid,num}){
  const [form,setForm]=useState({type:"deposito",amount:"",desc:""});
  const [show,setShow]=useState(false);

  const add=()=>{
    if(!form.amount)return;
    const delta=form.type==="deposito"?num(form.amount):-num(form.amount);
    const newTotal = fciTotal+delta;
    setFciTotal(p=>p+delta);
    const mov={id:uid(),...form,amount:num(form.amount),date:new Date().toISOString().slice(0,10)};
    upd(d=>({...d,fciMovements:[...(d.fciMovements||[]),mov]}));
    syncFci(mov, newTotal);
    setForm({type:"deposito",amount:"",desc:""});setShow(false);
  };

  const allMov=[];
  Object.values(months).forEach(m=>(m.fciMovements||[]).forEach(mv=>allMov.push(mv)));
  allMov.sort((a,b)=>(b.date||"").localeCompare(a.date||""));

  return (
    <div>
      <h1 style={{fontSize:20,fontWeight:600,marginBottom:20}}>Fondo de inversión</h1>
      <div className="card" style={{padding:24,marginBottom:14,textAlign:"center",borderTop:"3px solid #10b981"}}>
        <div className="sec" style={{marginBottom:8}}>Saldo actual</div>
        <div className="mono" style={{fontSize:36,fontWeight:600,color:"#15803d"}}>{fmt(fciTotal)}</div>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:14}}>
        <button className="btn btn-green" style={{flex:1}} onClick={()=>{setForm({type:"deposito",amount:"",desc:""});setShow(true);}}>+ Depósito</button>
        <button className="btn btn-red"   style={{flex:1}} onClick={()=>{setForm({type:"retiro",amount:"",desc:""});setShow(true);}}>− Retiro</button>
      </div>
      {show&&(
        <div className="card" style={{padding:16,marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:10,color:form.type==="deposito"?"#15803d":"#dc2626"}}>
            {form.type==="deposito"?"Nuevo depósito":"Nuevo retiro"}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr auto",gap:8}}>
            <input className="inp" placeholder="Descripción" value={form.desc} onChange={e=>setForm(p=>({...p,desc:e.target.value}))}/>
            <input className="inp mono" type="number" placeholder="Monto" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))}/>
            <button className="btn btn-dark" onClick={add}>OK</button>
          </div>
        </div>
      )}
      <div className="card">
        <div style={{padding:"12px 18px",borderBottom:"1px solid #f4f4f5",fontWeight:600,fontSize:14}}>Historial</div>
        {allMov.length===0&&<div style={{padding:"20px 18px",color:"#a1a1aa",fontSize:13}}>Sin movimientos</div>}
        {allMov.map((mv,i)=>(
          <div key={mv.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 18px",borderBottom:i<allMov.length-1?"1px solid #f9f9f9":"none"}}>
            <div>
              <div style={{fontSize:13,fontWeight:500}}>{mv.desc||mv.type}</div>
              <div style={{fontSize:11,color:"#a1a1aa",marginTop:2}}>{mv.date}</div>
            </div>
            <span className="mono" style={{color:mv.type==="deposito"?"#15803d":"#dc2626",fontWeight:500}}>
              {mv.type==="deposito"?"+":"−"}{fmt(mv.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   CONFIG TAB
══════════════════════════════════════════════ */
function ConfigTab({users,setUsers,cards,setCards,payMethods,setPayMethods,categories,setCategories,clientsL,setClientsL,clientsT,setClientsT,sheetsConfig,setSheetsConfig,currentUser,uid}){
  const [newCard,    setNewCard]   =useState({name:"",color:"#6366f1",owner:currentUser.id});
  const [newPay,     setNewPay]    =useState({name:"",icon:"💳"});
  const [newCat,     setNewCat]    =useState({name:"",icon:"📦"});
  const [showNC,setShowNC]=useState(false);
  const [showNP,setShowNP]=useState(false);
  const [showNCA,setShowNCA]=useState(false);
  const [sheetsHelp,setSheetsHelp]=useState(false);

  return (
    <div>
      <h1 style={{fontSize:20,fontWeight:600,marginBottom:22}}>Configuración</h1>
      <div className="g2">

        {/* TARJETAS */}
        <div className="card" style={{padding:18}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <span className="sec">Tarjetas</span>
            <button className="btn btn-dark" style={{fontSize:12,padding:"6px 11px"}} onClick={()=>setShowNC(f=>!f)}>+ Nueva</button>
          </div>
          {cards.map(c=>(
            <div key={c.id} className="row">
              <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
                <span style={{width:10,height:10,borderRadius:3,background:c.color,display:"inline-block",flexShrink:0}}/>
                <input className="inp" value={c.name} onChange={e=>setCards(p=>p.map(x=>x.id===c.id?{...x,name:e.target.value}:x))}
                  style={{border:"none",background:"transparent",fontWeight:500,fontSize:13,padding:"2px 0"}}/>
                <span className="tag" style={{fontSize:10}}>{users.find(u=>u.id===c.owner)?.initials}</span>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <input type="color" value={c.color} onChange={e=>setCards(p=>p.map(x=>x.id===c.id?{...x,color:e.target.value}:x))}
                  style={{width:26,height:26,border:"none",cursor:"pointer",background:"none",padding:0}}/>
                <button className="btn btn-red" style={{padding:"4px 7px",fontSize:11}} onClick={()=>setCards(p=>p.filter(x=>x.id!==c.id))}>✕</button>
              </div>
            </div>
          ))}
          {showNC&&(
            <div style={{marginTop:10,display:"flex",gap:7,flexWrap:"wrap"}}>
              <input className="inp" placeholder="Nombre tarjeta" value={newCard.name} onChange={e=>setNewCard(p=>({...p,name:e.target.value}))} style={{flex:2}}/>
              <select className="inp" value={newCard.owner} onChange={e=>setNewCard(p=>({...p,owner:e.target.value}))} style={{flex:1}}>
                {users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <input type="color" value={newCard.color} onChange={e=>setNewCard(p=>({...p,color:e.target.value}))}
                style={{width:38,border:"1px solid #e4e4e7",borderRadius:8,cursor:"pointer",padding:2}}/>
              <button className="btn btn-dark" style={{padding:"8px 12px"}} onClick={()=>{
                if(!newCard.name)return;
                setCards(p=>[...p,{id:uid(),...newCard}]);
                setNewCard({name:"",color:"#6366f1",owner:currentUser.id});setShowNC(false);
              }}>+</button>
            </div>
          )}
        </div>

        {/* MEDIOS DE PAGO */}
        <div className="card" style={{padding:18}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <span className="sec">Otros medios de pago</span>
            <button className="btn btn-dark" style={{fontSize:12,padding:"6px 11px"}} onClick={()=>setShowNP(f=>!f)}>+ Nuevo</button>
          </div>
          {payMethods.map(p=>(
            <div key={p.id} className="row">
              <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
                <span style={{fontSize:16}}>{p.icon}</span>
                <input className="inp" value={p.name} onChange={e=>setPayMethods(pm=>pm.map(x=>x.id===p.id?{...x,name:e.target.value}:x))}
                  style={{border:"none",background:"transparent",fontSize:13,fontWeight:500,padding:"2px 0"}}/>
              </div>
              <button className="btn btn-red" style={{padding:"4px 7px",fontSize:11}} onClick={()=>setPayMethods(pm=>pm.filter(x=>x.id!==p.id))}>✕</button>
            </div>
          ))}
          {showNP&&(
            <div style={{marginTop:10,display:"flex",gap:7}}>
              <input className="inp" placeholder="Emoji" value={newPay.icon} onChange={e=>setNewPay(p=>({...p,icon:e.target.value}))} style={{width:50}}/>
              <input className="inp" placeholder="Nombre" value={newPay.name} onChange={e=>setNewPay(p=>({...p,name:e.target.value}))}/>
              <button className="btn btn-dark" style={{padding:"8px 12px"}} onClick={()=>{
                if(!newPay.name)return;
                setPayMethods(p=>[...p,{id:uid(),...newPay,type:"transfer"}]);
                setNewPay({name:"",icon:"💳"});setShowNP(false);
              }}>+</button>
            </div>
          )}
        </div>

        {/* CATEGORÍAS */}
        <div className="card" style={{padding:18}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <span className="sec">Categorías de gasto</span>
            <button className="btn btn-dark" style={{fontSize:12,padding:"6px 11px"}} onClick={()=>setShowNCA(f=>!f)}>+ Nueva</button>
          </div>
          <div style={{maxHeight:200,overflowY:"auto"}}>
            {categories.map(c=>(
              <div key={c.id} className="row">
                <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
                  <span style={{fontSize:16}}>{c.icon}</span>
                  <input className="inp" value={c.name} onChange={e=>setCategories(p=>p.map(x=>x.id===c.id?{...x,name:e.target.value}:x))}
                    style={{border:"none",background:"transparent",fontSize:13,fontWeight:500,padding:"2px 0"}}/>
                </div>
                <button className="btn btn-red" style={{padding:"4px 7px",fontSize:11}} onClick={()=>setCategories(p=>p.filter(x=>x.id!==c.id))}>✕</button>
              </div>
            ))}
          </div>
          {showNCA&&(
            <div style={{marginTop:10,display:"flex",gap:7}}>
              <input className="inp" placeholder="Emoji" value={newCat.icon} onChange={e=>setNewCat(p=>({...p,icon:e.target.value}))} style={{width:50}}/>
              <input className="inp" placeholder="Nombre categoría" value={newCat.name} onChange={e=>setNewCat(p=>({...p,name:e.target.value}))}/>
              <button className="btn btn-dark" style={{padding:"8px 12px"}} onClick={()=>{
                if(!newCat.name)return;
                setCategories(p=>[...p,{id:uid(),...newCat}]);
                setNewCat({name:"",icon:"📦"});setShowNCA(false);
              }}>+</button>
            </div>
          )}
        </div>

        {/* PINs */}
        <div className="card" style={{padding:18}}>
          <div className="sec" style={{marginBottom:10}}>PINs de acceso</div>
          {users.map(u=>(
            <div key={u.id} className="row">
              <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
                <div style={{width:26,height:26,borderRadius:"50%",background:u.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:"#fff"}}>{u.initials}</div>
                <span style={{fontSize:13,fontWeight:500}}>{u.name}</span>
              </div>
              <input className="inp" type="password" value={u.pin} maxLength={6}
                onChange={e=>setUsers(p=>p.map(x=>x.id===u.id?{...x,pin:e.target.value}:x))}
                style={{width:90,textAlign:"center",fontSize:16,letterSpacing:4}}/>
            </div>
          ))}
        </div>

      </div>

      {/* GOOGLE SHEETS */}
      <div className="card" style={{padding:20,marginTop:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span className="sec">Google Sheets — sincronización</span>
          <button className="btn btn-ghost" style={{fontSize:12,padding:"5px 10px"}} onClick={()=>setSheetsHelp(h=>!h)}>
            {sheetsHelp?"Ocultar ayuda":"Ver instrucciones"}
          </button>
        </div>
        {sheetsHelp&&(
          <div style={{background:"#fafafa",borderRadius:10,padding:14,marginBottom:14,fontSize:12,color:"#52525b",lineHeight:1.7}}>
            <strong style={{color:"#18181b"}}>Cómo configurar:</strong><br/>
            1. Creá una Google Sheet nueva y copiá su ID de la URL (entre /d/ y /edit)<br/>
            2. En Google Cloud Console → APIs → habilitá "Google Sheets API"<br/>
            3. Creá una API Key y pegala abajo<br/>
            4. En tu Sheet, dale permiso de edición a "anyone with the link"<br/>
            5. Creá una hoja llamada <strong>Historial</strong> — los gastos se van a guardar ahí automáticamente<br/>
            <span style={{color:"#6366f1",marginTop:4,display:"block"}}>Cada vez que cargues un gasto se agrega una fila: Fecha · Mes · Año · Persona · Para quién · Categoría · Descripción · Medio de pago · Monto · Cuotas · Nro cuota</span>
          </div>
        )}
        <div style={{background:"#f0fdf4",borderRadius:10,padding:"12px 14px",fontSize:13,color:"#15803d"}}>
          <div style={{fontWeight:600,marginBottom:4}}>📊 Planilla conectada</div>
          <div style={{fontSize:12,color:"#166534"}}>ID: 1McZpMNo1RtVfzvC_p1OLEraYcXlMq8Ux7Ku82KTQCLg</div>
          <div style={{fontSize:11,color:"#166534",marginTop:4}}>Los datos se guardan en hojas: Gastos · Ingresos · FCI</div>
        </div>
        <div style={{marginTop:10,fontSize:12,color:"#15803d",display:"flex",alignItems:"center",gap:6}}>
          <span>✓</span> Conectado a Google Sheets — cada gasto, ingreso y movimiento del FCI se guarda automáticamente
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   TARJETAS TAB
══════════════════════════════════════════════ */
function TarjetasTab({currentUser,MONTHS,sM,sY,cards,myExp,cardTotals,fmt,num,months,mk,CY,upd}){
  const [selCard, setSelCard] = useState(cards[0]?.id||"");
  const [editId,  setEditId]  = useState(null);
  const [editVal, setEditVal] = useState("");
  const selCardObj = cards.find(c=>c.id===selCard);

  const trendData = Array.from({length:6},(_,i)=>{
    let mo=sM-5+i, yr=sY;
    if(mo<0){mo+=12;yr--;}
    const d=months[mk(yr,mo)];
    const row={name:MONTHS[mo].slice(0,3)};
    cards.forEach(c=>{ row[c.name]=(d?.expenses||[]).filter(e=>e.userId===currentUser.id&&e.payMethodId===c.id).reduce((s,e)=>s+num(e.amount),0); });
    return row;
  });

  const cardExp = myExp.filter(e=>e.payMethodId===selCard);
  const cardTotal = cardTotals[selCard]||0;
  const byOwner={};
  cardExp.forEach(e=>{ if(!byOwner[e.owner]) byOwner[e.owner]=[]; byOwner[e.owner].push(e); });

  const saveEdit=(expId)=>{
    upd(d=>({...d,expenses:d.expenses.map(x=>x.id===expId?{...x,amount:num(editVal)}:x)}));
    setEditId(null);
  };

  return (
    <div>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:20,fontWeight:600}}>Resumen tarjetas</h1>
        <p style={{fontSize:13,color:"#71717a"}}>{MONTHS[sM]} {sY} — para conciliar con el banco</p>
      </div>

      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
        {cards.map(c=>(
          <button key={c.id} onClick={()=>setSelCard(c.id)}
            style={{padding:"10px 16px",borderRadius:12,border:`2px solid ${selCard===c.id?c.color:"#e4e4e7"}`,background:selCard===c.id?c.color+"15":"#fff",cursor:"pointer",fontFamily:"inherit",textAlign:"left",transition:"all .15s"}}>
            <div style={{fontSize:11,color:"#71717a",marginBottom:3}}>{c.name}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:17,fontWeight:500,color:selCard===c.id?c.color:"#dc2626"}}>{fmt(cardTotals[c.id]||0)}</div>
          </button>
        ))}
      </div>

      {selCardObj && (
        <div className="card" style={{marginBottom:16}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid #f4f4f5",borderTop:`3px solid ${selCardObj.color}`,borderRadius:"16px 16px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontWeight:600,fontSize:15}}>{selCardObj.name}</span>
            <span style={{fontFamily:"'DM Mono',monospace",color:"#dc2626",fontWeight:500,fontSize:15}}>{fmt(cardTotal)}</span>
          </div>

          {cardExp.length===0 && <div style={{padding:"20px 18px",color:"#a1a1aa",fontSize:13}}>Sin gastos con esta tarjeta este mes</div>}

          {Object.entries(byOwner).map(([owner,exps])=>{
            const ownerTotal=exps.reduce((s,e)=>s+num(e.amount),0);
            return (
              <div key={owner}>
                <div style={{padding:"8px 18px",background:"#fafafa",borderBottom:"1px solid #f4f4f5",display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:12,fontWeight:600,color:"#52525b"}}>{owner}</span>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#52525b"}}>{fmt(ownerTotal)}</span>
                </div>
                {exps.map((e,i)=>(
                  <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 18px",borderBottom:i<exps.length-1?"1px solid #f9f9f9":"1px solid #f4f4f5"}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:500}}>{e.desc||e.categoryName}</div>
                      <div style={{fontSize:11,color:"#a1a1aa",marginTop:2,display:"flex",gap:6}}>
                        <span>{e.categoryName}</span>
                        {e.cuotas>1&&<><span>·</span><span style={{color:"#6366f1"}}>{e.cuotaNum}/{e.cuotas} cuotas</span></>}
                        <span>·</span><span>{e.date}</span>
                      </div>
                    </div>
                    {editId===e.id
                      ? <div style={{display:"flex",gap:6,alignItems:"center"}}>
                          <input className="inp mono" type="number" value={editVal} onChange={ev=>setEditVal(ev.target.value)}
                            style={{width:110,textAlign:"right",fontSize:13}} autoFocus onKeyDown={ev=>ev.key==="Enter"&&saveEdit(e.id)}/>
                          <button className="btn btn-dark" style={{padding:"5px 9px",fontSize:12}} onClick={()=>saveEdit(e.id)}>✓</button>
                          <button className="btn btn-ghost" style={{padding:"5px 9px",fontSize:12}} onClick={()=>setEditId(null)}>✕</button>
                        </div>
                      : <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                          <span style={{fontFamily:"'DM Mono',monospace",fontSize:13}}>{fmt(e.amount)}</span>
                          <button className="btn btn-ghost" style={{padding:"4px 8px",fontSize:11}} onClick={()=>{setEditId(e.id);setEditVal(String(e.amount));}}>✎</button>
                        </div>
                    }
                  </div>
                ))}
              </div>
            );
          })}

          {Object.keys(byOwner).length>1 && (
            <div style={{padding:"12px 18px",background:"#f8f8f6",borderTop:"1px solid #e4e4e7",borderRadius:"0 0 16px 16px"}}>
              <div style={{fontSize:11,fontWeight:600,color:"#71717a",marginBottom:8,textTransform:"uppercase",letterSpacing:".07em"}}>Subtotales</div>
              <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                {Object.entries(byOwner).map(([owner,exps])=>(
                  <div key={owner} style={{fontSize:12}}>
                    <span style={{color:"#52525b"}}>{owner}: </span>
                    <span style={{fontFamily:"'DM Mono',monospace",fontWeight:500}}>{fmt(exps.reduce((s,e)=>s+num(e.amount),0))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card" style={{padding:20}}>
        <div style={{fontSize:13,fontWeight:600,marginBottom:14}}>Evolución últimos 6 meses por tarjeta</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={trendData}>
            <XAxis dataKey="name" tick={{fontSize:11}}/>
            <YAxis tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} tick={{fontSize:11}}/>
            <Tooltip formatter={v=>fmt(v)}/>
            {cards.map(c=><Bar key={c.id} dataKey={c.name} stackId="a" fill={c.color}/>)}
          </BarChart>
        </ResponsiveContainer>
        <div style={{display:"flex",gap:14,flexWrap:"wrap",marginTop:8}}>
          {cards.map(c=>(
            <div key={c.id} style={{display:"flex",alignItems:"center",gap:5,fontSize:12}}>
              <div style={{width:10,height:10,borderRadius:3,background:c.color}}/>{c.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════
   DASHBOARD TAB
══════════════════════════════════════════════ */
function DashboardTab({users,months,cards,categories,fmt,num,MONTHS,CY,mk,clientsL,clientsT}){
  const lu=users.find(u=>u.id==="lucia");
  const to=users.find(u=>u.id==="tomas");

  // Build last 12 months data
  const today=new Date();
  const curM=today.getMonth(); const curY=today.getFullYear();
  const monthRows = Array.from({length:12},(_,i)=>{
    let mo=curM-11+i, yr=curY;
    if(mo<0){mo+=12;yr--;}
    const d=months[mk(yr,mo)];
    const exps=d?.expenses||[];
    const luciaExp=exps.filter(e=>e.userId==="lucia").reduce((s,e)=>s+num(e.amount),0);
    const tomasExp=exps.filter(e=>e.userId==="tomas").reduce((s,e)=>s+num(e.amount),0);
    const luciaInc=(d?.clients_lucia||clientsL).filter(c=>c.active).reduce((s,c)=>s+num(c.amount),0);
    const tomasInc=(d?.clients_tomas||clientsT).filter(c=>c.active).reduce((s,c)=>s+num(c.amount),0);
    // by category
    const byCat={};
    exps.forEach(e=>{ byCat[e.categoryName]=(byCat[e.categoryName]||0)+num(e.amount); });
    return { label:`${MONTHS[mo].slice(0,3)} ${yr}`, mo, yr, luciaExp, tomasExp, luciaInc, tomasInc, total:luciaExp+tomasExp, byCat };
  });

  // All categories seen
  const allCats=[...new Set(monthRows.flatMap(r=>Object.keys(r.byCat)))].slice(0,8);

  // Acumulados
  const totalLuciaExp=monthRows.reduce((s,r)=>s+r.luciaExp,0);
  const totalTomasExp=monthRows.reduce((s,r)=>s+r.tomasExp,0);
  const totalLuciaInc=monthRows.reduce((s,r)=>s+r.luciaInc,0);
  const totalTomasInc=monthRows.reduce((s,r)=>s+r.tomasInc,0);

  const COLORS=["#18181b","#6366f1","#0ea5e9","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899"];

  return (
    <div>
      <h1 style={{fontSize:20,fontWeight:600,marginBottom:6}}>Dashboard anual</h1>
      <p style={{fontSize:13,color:"#71717a",marginBottom:20}}>Últimos 12 meses — acumulado</p>

      {/* Totales acumulados */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:20}}>
        {[
          {l:`Gastos ${lu?.name}`,  v:totalLuciaExp, c:"#dc2626"},
          {l:`Gastos ${to?.name}`,  v:totalTomasExp, c:"#ec4899"},
          {l:`Ingresos ${lu?.name}`,v:totalLuciaInc, c:"#15803d"},
          {l:`Ingresos ${to?.name}`,v:totalTomasInc, c:"#0ea5e9"},
        ].map(s=>(
          <div key={s.l} className="card" style={{padding:14,borderLeft:`3px solid ${s.c}`}}>
            <div style={{fontSize:11,color:"#71717a",marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em"}}>{s.l}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:500,color:s.c}}>{fmt(s.v)}</div>
          </div>
        ))}
      </div>

      {/* Gráfica tendencia */}
      <div className="card" style={{padding:20,marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:600,marginBottom:14}}>Gastos vs ingresos — últimos 12 meses</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthRows} margin={{left:0}}>
            <XAxis dataKey="label" tick={{fontSize:10}} interval={1}/>
            <YAxis tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} tick={{fontSize:10}}/>
            <Tooltip formatter={v=>fmt(v)}/>
            <Bar dataKey="luciaInc"  name={`Ing. ${lu?.name}`}  fill="#10b981" stackId="inc"/>
            <Bar dataKey="tomasInc"  name={`Ing. ${to?.name}`}  fill="#0ea5e9" stackId="inc"/>
            <Bar dataKey="luciaExp"  name={`Gto. ${lu?.name}`}  fill="#6366f1" stackId="exp"/>
            <Bar dataKey="tomasExp"  name={`Gto. ${to?.name}`}  fill="#ec4899" stackId="exp"/>
          </BarChart>
        </ResponsiveContainer>
        <div style={{display:"flex",gap:14,flexWrap:"wrap",marginTop:8}}>
          {[{l:`Ing. ${lu?.name}`,c:"#10b981"},{l:`Ing. ${to?.name}`,c:"#0ea5e9"},{l:`Gto. ${lu?.name}`,c:"#6366f1"},{l:`Gto. ${to?.name}`,c:"#ec4899"}].map(s=>(
            <div key={s.l} style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}>
              <div style={{width:10,height:10,borderRadius:3,background:s.c}}/>{s.l}
            </div>
          ))}
        </div>
      </div>

      {/* Tabla por mes */}
      <div className="card" style={{padding:0,overflow:"hidden",marginBottom:16}}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid #f4f4f5",fontWeight:600,fontSize:14}}>Tabla mensual detallada</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:"#fafafa"}}>
                <th style={{padding:"10px 14px",textAlign:"left",fontWeight:600,color:"#52525b",borderBottom:"1px solid #e4e4e7",whiteSpace:"nowrap"}}>Mes</th>
                <th style={{padding:"10px 14px",textAlign:"right",fontWeight:600,color:"#15803d",borderBottom:"1px solid #e4e4e7",whiteSpace:"nowrap"}}>Ing. {lu?.name}</th>
                <th style={{padding:"10px 14px",textAlign:"right",fontWeight:600,color:"#0ea5e9",borderBottom:"1px solid #e4e4e7",whiteSpace:"nowrap"}}>Ing. {to?.name}</th>
                <th style={{padding:"10px 14px",textAlign:"right",fontWeight:600,color:"#6366f1",borderBottom:"1px solid #e4e4e7",whiteSpace:"nowrap"}}>Gto. {lu?.name}</th>
                <th style={{padding:"10px 14px",textAlign:"right",fontWeight:600,color:"#ec4899",borderBottom:"1px solid #e4e4e7",whiteSpace:"nowrap"}}>Gto. {to?.name}</th>
                <th style={{padding:"10px 14px",textAlign:"right",fontWeight:600,color:"#18181b",borderBottom:"1px solid #e4e4e7",whiteSpace:"nowrap"}}>Total gtos</th>
                <th style={{padding:"10px 14px",textAlign:"right",fontWeight:600,color:"#18181b",borderBottom:"1px solid #e4e4e7",whiteSpace:"nowrap"}}>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {monthRows.map((r,i)=>{
                const res=(r.luciaInc+r.tomasInc)-(r.luciaExp+r.tomasExp);
                return (
                  <tr key={r.label} style={{borderBottom:"1px solid #f4f4f5",background:i%2===0?"#fff":"#fafafa"}}>
                    <td style={{padding:"9px 14px",fontWeight:500,whiteSpace:"nowrap"}}>{r.label}</td>
                    <td style={{padding:"9px 14px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:"#15803d"}}>{r.luciaInc>0?fmt(r.luciaInc):"—"}</td>
                    <td style={{padding:"9px 14px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:"#0ea5e9"}}>{r.tomasInc>0?fmt(r.tomasInc):"—"}</td>
                    <td style={{padding:"9px 14px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:"#6366f1"}}>{r.luciaExp>0?fmt(r.luciaExp):"—"}</td>
                    <td style={{padding:"9px 14px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:"#ec4899"}}>{r.tomasExp>0?fmt(r.tomasExp):"—"}</td>
                    <td style={{padding:"9px 14px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:"#dc2626",fontWeight:500}}>{r.total>0?fmt(r.total):"—"}</td>
                    <td style={{padding:"9px 14px",textAlign:"right",fontFamily:"'DM Mono',monospace",fontWeight:600,color:res>=0?"#15803d":"#dc2626"}}>{(r.luciaInc+r.tomasInc)>0||r.total>0?fmt(res):"—"}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{background:"#f4f4f5",fontWeight:700}}>
                <td style={{padding:"10px 14px"}}>TOTAL</td>
                <td style={{padding:"10px 14px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:"#15803d"}}>{fmt(totalLuciaInc)}</td>
                <td style={{padding:"10px 14px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:"#0ea5e9"}}>{fmt(totalTomasInc)}</td>
                <td style={{padding:"10px 14px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:"#6366f1"}}>{fmt(totalLuciaExp)}</td>
                <td style={{padding:"10px 14px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:"#ec4899"}}>{fmt(totalTomasExp)}</td>
                <td style={{padding:"10px 14px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:"#dc2626"}}>{fmt(totalLuciaExp+totalTomasExp)}</td>
                <td style={{padding:"10px 14px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:(totalLuciaInc+totalTomasInc-totalLuciaExp-totalTomasExp)>=0?"#15803d":"#dc2626"}}>{fmt(totalLuciaInc+totalTomasInc-totalLuciaExp-totalTomasExp)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Por categoría acumulado */}
      <div className="card" style={{padding:20}}>
        <div style={{fontSize:13,fontWeight:600,marginBottom:14}}>Gastos acumulados por categoría</div>
        {(()=>{
          const catMap={};
          Object.values(months).forEach(m=>{
            (m.expenses||[]).forEach(e=>{
              if(!catMap[e.categoryName]) catMap[e.categoryName]={lucia:0,tomas:0};
              if(e.userId==="lucia") catMap[e.categoryName].lucia+=num(e.amount);
              else catMap[e.categoryName].tomas+=num(e.amount);
            });
          });
          const sorted=Object.entries(catMap).sort((a,b)=>(b[1].lucia+b[1].tomas)-(a[1].lucia+a[1].tomas));
          if(sorted.length===0) return <div style={{color:"#a1a1aa",fontSize:13}}>Sin datos aún</div>;
          return (
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:"#fafafa"}}>
                    <th style={{padding:"8px 12px",textAlign:"left",fontWeight:600,color:"#52525b",borderBottom:"1px solid #e4e4e7"}}>Categoría</th>
                    <th style={{padding:"8px 12px",textAlign:"right",fontWeight:600,color:"#6366f1",borderBottom:"1px solid #e4e4e7"}}>{lu?.name}</th>
                    <th style={{padding:"8px 12px",textAlign:"right",fontWeight:600,color:"#ec4899",borderBottom:"1px solid #e4e4e7"}}>{to?.name}</th>
                    <th style={{padding:"8px 12px",textAlign:"right",fontWeight:600,color:"#18181b",borderBottom:"1px solid #e4e4e7"}}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(([cat,vals],i)=>(
                    <tr key={cat} style={{borderBottom:"1px solid #f4f4f5",background:i%2===0?"#fff":"#fafafa"}}>
                      <td style={{padding:"8px 12px",fontWeight:500}}>{cat}</td>
                      <td style={{padding:"8px 12px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:"#6366f1"}}>{vals.lucia>0?fmt(vals.lucia):"—"}</td>
                      <td style={{padding:"8px 12px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:"#ec4899"}}>{vals.tomas>0?fmt(vals.tomas):"—"}</td>
                      <td style={{padding:"8px 12px",textAlign:"right",fontFamily:"'DM Mono',monospace",fontWeight:600}}>{fmt(vals.lucia+vals.tomas)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
