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
  {id:"r1",name:"Obra Social",  amount:433000, active:true, userId:"lucia", owner:"Personal"},
  {id:"r2",name:"Monotributo",  amount:17000,  active:true, userId:"lucia", owner:"Personal"},
  {id:"r3",name:"Celular",      amount:20000,  active:true, userId:"lucia", owner:"Personal"},
  {id:"r4",name:"Seguro",       amount:81274,  active:true, userId:"lucia", owner:"Personal"},
  {id:"r5",name:"Gym",          amount:15000,  active:true, userId:"lucia", owner:"Personal"},
];
const INIT_RECURRING_T = [
  {id:"r6",name:"Expensas",     amount:22000,  active:true, userId:"tomas", owner:"Casa"},
];

const HISTORICAL_DATA = {
  "2025-06": [{"id": "hubvssj", "groupId": "l409pai", "userId": "lucia", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 556000.0, "totalAmount": 556000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Construccion", "date": "2025-06-01", "month": "Junio", "year": 2025}, {"id": "bimxri1", "groupId": "3vgulu0", "userId": "lucia", "owner": "Casa", "category": "Otros", "categoryName": "Otros", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 7469.0, "totalAmount": 7469.0, "cuotas": 1, "cuotaNum": 1, "desc": "otros", "date": "2025-06-01", "month": "Junio", "year": 2025}, {"id": "wy4b1ao", "groupId": "vmu07jg", "userId": "lucia", "owner": "Casa", "category": "Salud", "categoryName": "Salud", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 251301.63, "totalAmount": 251301.63, "cuotas": 1, "cuotaNum": 1, "desc": "Omint", "date": "2025-06-01", "month": "Junio", "year": 2025}, {"id": "san26ii", "groupId": "56fusfy", "userId": "lucia", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 83807.0, "totalAmount": 83807.0, "cuotas": 1, "cuotaNum": 1, "desc": "Super", "date": "2025-06-01", "month": "Junio", "year": 2025}, {"id": "e4t6vu5", "groupId": "ng6ll4d", "userId": "lucia", "owner": "Casa", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 32410.0, "totalAmount": 32410.0, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2025-06-01", "month": "Junio", "year": 2025}, {"id": "pbsqstr", "groupId": "1hh71rf", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 150000.0, "totalAmount": 150000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Carniceria", "date": "2025-06-01", "month": "Junio", "year": 2025}, {"id": "3fpjfwn", "groupId": "bf0frki", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 3000.0, "totalAmount": 3000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Comida", "date": "2025-06-01", "month": "Junio", "year": 2025}, {"id": "7ostjds", "groupId": "x2yx575", "userId": "tomas", "owner": "Casa", "category": "Mascotas", "categoryName": "Mascotas", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 35000.0, "totalAmount": 35000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Comida tango", "date": "2025-06-01", "month": "Junio", "year": 2025}, {"id": "4z7hmmt", "groupId": "wzuj4m1", "userId": "tomas", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 800000.0, "totalAmount": 800000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Construccion", "date": "2025-06-01", "month": "Junio", "year": 2025}, {"id": "19fxvns", "groupId": "jbllny2", "userId": "tomas", "owner": "Casa", "category": "Salud", "categoryName": "Salud", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 10000.0, "totalAmount": 10000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Eztala", "date": "2025-06-01", "month": "Junio", "year": 2025}, {"id": "qfd2nkh", "groupId": "sfot1ok", "userId": "tomas", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 54000.0, "totalAmount": 54000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Super", "date": "2025-06-01", "month": "Junio", "year": 2025}],
  "2025-07": [{"id": "vxeqemf", "groupId": "0zyfd6d", "userId": "lucia", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 40923.0, "totalAmount": 40923.0, "cuotas": 1, "cuotaNum": 1, "desc": "Carniceria", "date": "2025-07-01", "month": "Julio", "year": 2025}, {"id": "z91l5s3", "groupId": "7s5ja9i", "userId": "lucia", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 11608.0, "totalAmount": 11608.0, "cuotas": 1, "cuotaNum": 1, "desc": "Comida", "date": "2025-07-01", "month": "Julio", "year": 2025}, {"id": "a21nl7j", "groupId": "t0z53kg", "userId": "lucia", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 1462052.33, "totalAmount": 1462052.33, "cuotas": 1, "cuotaNum": 1, "desc": "construccion", "date": "2025-07-01", "month": "Julio", "year": 2025}, {"id": "seaw4of", "groupId": "05kycut", "userId": "lucia", "owner": "Casa", "category": "Otros", "categoryName": "Otros", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 2000.0, "totalAmount": 2000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Otros", "date": "2025-07-01", "month": "Julio", "year": 2025}, {"id": "ke54jmp", "groupId": "i0q75ho", "userId": "lucia", "owner": "Casa", "category": "Salud", "categoryName": "Salud", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 290900.06, "totalAmount": 290900.06, "cuotas": 1, "cuotaNum": 1, "desc": "Salud", "date": "2025-07-01", "month": "Julio", "year": 2025}, {"id": "c7zdbh1", "groupId": "79qnhvu", "userId": "lucia", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 58410.0, "totalAmount": 58410.0, "cuotas": 1, "cuotaNum": 1, "desc": "Supermercado", "date": "2025-07-01", "month": "Julio", "year": 2025}, {"id": "6og4pqv", "groupId": "ux70hmb", "userId": "lucia", "owner": "Casa", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 1200.0, "totalAmount": 1200.0, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2025-07-01", "month": "Julio", "year": 2025}, {"id": "6cvzdtf", "groupId": "fnuviuj", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 150000.0, "totalAmount": 150000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Carniceria", "date": "2025-07-01", "month": "Julio", "year": 2025}, {"id": "bc6uu06", "groupId": "r131kwq", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 10800.0, "totalAmount": 10800.0, "cuotas": 1, "cuotaNum": 1, "desc": "Comida", "date": "2025-07-01", "month": "Julio", "year": 2025}, {"id": "k9eus8a", "groupId": "blewh4j", "userId": "tomas", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 710900.0, "totalAmount": 710900.0, "cuotas": 1, "cuotaNum": 1, "desc": "Construccion", "date": "2025-07-01", "month": "Julio", "year": 2025}, {"id": "dlwm7v0", "groupId": "j7gx4rp", "userId": "tomas", "owner": "Casa", "category": "Otros", "categoryName": "Otros", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 20000.0, "totalAmount": 20000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Otros", "date": "2025-07-01", "month": "Julio", "year": 2025}, {"id": "u6q43kv", "groupId": "fkkxbjh", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 25600.0, "totalAmount": 25600.0, "cuotas": 1, "cuotaNum": 1, "desc": "Salida", "date": "2025-07-01", "month": "Julio", "year": 2025}, {"id": "flhg8si", "groupId": "88lgglh", "userId": "tomas", "owner": "Casa", "category": "Salud", "categoryName": "Salud", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 24547.51, "totalAmount": 24547.51, "cuotas": 1, "cuotaNum": 1, "desc": "Remedios", "date": "2025-07-01", "month": "Julio", "year": 2025}, {"id": "edq4qrp", "groupId": "mrz96w9", "userId": "tomas", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 43190.0, "totalAmount": 43190.0, "cuotas": 1, "cuotaNum": 1, "desc": "Supermercado", "date": "2025-07-01", "month": "Julio", "year": 2025}, {"id": "89xvoeh", "groupId": "34yw6pm", "userId": "tomas", "owner": "Casa", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 14600.0, "totalAmount": 14600.0, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2025-07-01", "month": "Julio", "year": 2025}],
  "2025-08": [{"id": "ijiv9eu", "groupId": "x3w07o2", "userId": "lucia", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 811100.0, "totalAmount": 811100.0, "cuotas": 1, "cuotaNum": 1, "desc": "Construccion", "date": "2025-08-01", "month": "Agosto", "year": 2025}, {"id": "hrjt2fv", "groupId": "45zvo7r", "userId": "lucia", "owner": "Casa", "category": "Cosas para la casa", "categoryName": "Cosas para la casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 35900.0, "totalAmount": 35900.0, "cuotas": 1, "cuotaNum": 1, "desc": "Mobiliario", "date": "2025-08-01", "month": "Agosto", "year": 2025}, {"id": "oh0xiuo", "groupId": "humkura", "userId": "lucia", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 54600.0, "totalAmount": 54600.0, "cuotas": 1, "cuotaNum": 1, "desc": "Salida", "date": "2025-08-01", "month": "Agosto", "year": 2025}, {"id": "np4wcln", "groupId": "3qx1p3q", "userId": "lucia", "owner": "Casa", "category": "Salud", "categoryName": "Salud", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 271000.0, "totalAmount": 271000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Omint", "date": "2025-08-01", "month": "Agosto", "year": 2025}, {"id": "ry747q6", "groupId": "p84nhzp", "userId": "lucia", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 188718.5, "totalAmount": 188718.5, "cuotas": 1, "cuotaNum": 1, "desc": "Super", "date": "2025-08-01", "month": "Agosto", "year": 2025}, {"id": "tpob8hj", "groupId": "t3bgysd", "userId": "lucia", "owner": "Casa", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 32448.0, "totalAmount": 32448.0, "cuotas": 1, "cuotaNum": 1, "desc": "Verdu", "date": "2025-08-01", "month": "Agosto", "year": 2025}, {"id": "rx7qb4e", "groupId": "5yw2l62", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 172870.0, "totalAmount": 172870.0, "cuotas": 1, "cuotaNum": 1, "desc": "Carniceria", "date": "2025-08-01", "month": "Agosto", "year": 2025}, {"id": "hxf360a", "groupId": "2xs8c6p", "userId": "tomas", "owner": "Casa", "category": "Mascotas", "categoryName": "Mascotas", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 82300.0, "totalAmount": 82300.0, "cuotas": 1, "cuotaNum": 1, "desc": "Mascotas", "date": "2025-08-01", "month": "Agosto", "year": 2025}, {"id": "682e7og", "groupId": "lh7fawo", "userId": "tomas", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 1199660.0, "totalAmount": 1199660.0, "cuotas": 1, "cuotaNum": 1, "desc": "Construccion", "date": "2025-08-01", "month": "Agosto", "year": 2025}, {"id": "emwr2op", "groupId": "ikm8fsc", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 97500.0, "totalAmount": 97500.0, "cuotas": 1, "cuotaNum": 1, "desc": "Salida", "date": "2025-08-01", "month": "Agosto", "year": 2025}, {"id": "djnk0so", "groupId": "fwwgyry", "userId": "tomas", "owner": "Casa", "category": "Salud", "categoryName": "Salud", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 16000.0, "totalAmount": 16000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Salud", "date": "2025-08-01", "month": "Agosto", "year": 2025}, {"id": "hkp3wrr", "groupId": "kna6x31", "userId": "tomas", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 17300.0, "totalAmount": 17300.0, "cuotas": 1, "cuotaNum": 1, "desc": "Supermercado", "date": "2025-08-01", "month": "Agosto", "year": 2025}, {"id": "88v8zp4", "groupId": "utyc9nq", "userId": "tomas", "owner": "Casa", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 30000.0, "totalAmount": 30000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2025-08-01", "month": "Agosto", "year": 2025}],
  "2025-09": [{"id": "3cjbdbd", "groupId": "sui27cx", "userId": "lucia", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 90000.0, "totalAmount": 90000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Arreglos casa", "date": "2025-09-01", "month": "Septiembre", "year": 2025}, {"id": "h3o630i", "groupId": "k3otics", "userId": "lucia", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 32200.0, "totalAmount": 32200.0, "cuotas": 1, "cuotaNum": 1, "desc": "Carniceria", "date": "2025-09-01", "month": "Septiembre", "year": 2025}, {"id": "y0j28h7", "groupId": "qo9dkow", "userId": "lucia", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 15000.0, "totalAmount": 15000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Comida / salida", "date": "2025-09-01", "month": "Septiembre", "year": 2025}, {"id": "kik0tzl", "groupId": "afn2brs", "userId": "lucia", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 30000.0, "totalAmount": 30000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Arreglos casa", "date": "2025-09-01", "month": "Septiembre", "year": 2025}, {"id": "rf0wsu9", "groupId": "32pu0yb", "userId": "lucia", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 1115507.41, "totalAmount": 1115507.41, "cuotas": 1, "cuotaNum": 1, "desc": "Construccion", "date": "2025-09-01", "month": "Septiembre", "year": 2025}, {"id": "362b6y1", "groupId": "41rw2l0", "userId": "lucia", "owner": "Casa", "category": "Otros", "categoryName": "Otros", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 20000.0, "totalAmount": 20000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Otros", "date": "2025-09-01", "month": "Septiembre", "year": 2025}, {"id": "c4gj570", "groupId": "5yhu9hc", "userId": "lucia", "owner": "Casa", "category": "Salud", "categoryName": "Salud", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 293000.0, "totalAmount": 293000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Salud", "date": "2025-09-01", "month": "Septiembre", "year": 2025}, {"id": "wuhmgdo", "groupId": "yq37mgh", "userId": "lucia", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 99030.0, "totalAmount": 99030.0, "cuotas": 1, "cuotaNum": 1, "desc": "Supermercado", "date": "2025-09-01", "month": "Septiembre", "year": 2025}, {"id": "ijot68i", "groupId": "4nxwipf", "userId": "lucia", "owner": "Casa", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 24600.0, "totalAmount": 24600.0, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2025-09-01", "month": "Septiembre", "year": 2025}, {"id": "95no3ys", "groupId": "k6fqvqu", "userId": "tomas", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 10000.0, "totalAmount": 10000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Auto", "date": "2025-09-01", "month": "Septiembre", "year": 2025}, {"id": "048mai0", "groupId": "cd0uuxr", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 250000.0, "totalAmount": 250000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Carniceria", "date": "2025-09-01", "month": "Septiembre", "year": 2025}, {"id": "9qn95x5", "groupId": "w9uzqj6", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 21000.0, "totalAmount": 21000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Comida", "date": "2025-09-01", "month": "Septiembre", "year": 2025}, {"id": "sjzzo1j", "groupId": "5p4bni2", "userId": "tomas", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 2186086.0, "totalAmount": 2186086.0, "cuotas": 1, "cuotaNum": 1, "desc": "Construccion", "date": "2025-09-01", "month": "Septiembre", "year": 2025}, {"id": "x5ye7jo", "groupId": "sxzhgnd", "userId": "tomas", "owner": "Casa", "category": "Salud", "categoryName": "Salud", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 20000.0, "totalAmount": 20000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Salud", "date": "2025-09-01", "month": "Septiembre", "year": 2025}, {"id": "aq4exfe", "groupId": "i839xvw", "userId": "tomas", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 45827.0, "totalAmount": 45827.0, "cuotas": 1, "cuotaNum": 1, "desc": "Supermercado", "date": "2025-09-01", "month": "Septiembre", "year": 2025}, {"id": "12g4yxq", "groupId": "liz85pb", "userId": "tomas", "owner": "Casa", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 25500.0, "totalAmount": 25500.0, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2025-09-01", "month": "Septiembre", "year": 2025}],
  "2025-10": [{"id": "g5us5jd", "groupId": "g1mhnn8", "userId": "lucia", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 4500.0, "totalAmount": 4500.0, "cuotas": 1, "cuotaNum": 1, "desc": "Carniceria", "date": "2025-10-01", "month": "Octubre", "year": 2025}, {"id": "fzdp2h1", "groupId": "hmk4e5t", "userId": "lucia", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 50600.0, "totalAmount": 50600.0, "cuotas": 1, "cuotaNum": 1, "desc": "Comida / salida", "date": "2025-10-01", "month": "Octubre", "year": 2025}, {"id": "ru2cd0z", "groupId": "r2mfnr5", "userId": "lucia", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 634987.56, "totalAmount": 634987.56, "cuotas": 1, "cuotaNum": 1, "desc": "Construccion", "date": "2025-10-01", "month": "Octubre", "year": 2025}, {"id": "nq6rx8m", "groupId": "k6u2em1", "userId": "lucia", "owner": "Casa", "category": "Cosas para la casa", "categoryName": "Cosas para la casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 40500.0, "totalAmount": 40500.0, "cuotas": 1, "cuotaNum": 1, "desc": "Cosas para la casa", "date": "2025-10-01", "month": "Octubre", "year": 2025}, {"id": "afzuycb", "groupId": "ty0coos", "userId": "lucia", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 12000.0, "totalAmount": 12000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Comida / salida", "date": "2025-10-01", "month": "Octubre", "year": 2025}, {"id": "n5eu1ek", "groupId": "2kbc3rd", "userId": "lucia", "owner": "Casa", "category": "Salud", "categoryName": "Salud", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 298761.67, "totalAmount": 298761.67, "cuotas": 1, "cuotaNum": 1, "desc": "Salud", "date": "2025-10-01", "month": "Octubre", "year": 2025}, {"id": "0gofkem", "groupId": "vtkf39f", "userId": "lucia", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 88000.0, "totalAmount": 88000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Supermercado", "date": "2025-10-01", "month": "Octubre", "year": 2025}, {"id": "97fymcq", "groupId": "kzixlqj", "userId": "lucia", "owner": "Casa", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 39250.0, "totalAmount": 39250.0, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2025-10-01", "month": "Octubre", "year": 2025}, {"id": "9q1mchk", "groupId": "24znjq4", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 331000.0, "totalAmount": 331000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Carniceria", "date": "2025-10-01", "month": "Octubre", "year": 2025}, {"id": "s4nz8sa", "groupId": "xhtzp9y", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 12100.0, "totalAmount": 12100.0, "cuotas": 1, "cuotaNum": 1, "desc": "Comida / salida", "date": "2025-10-01", "month": "Octubre", "year": 2025}, {"id": "3qkrbe1", "groupId": "7687ji5", "userId": "tomas", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 740052.0, "totalAmount": 740052.0, "cuotas": 1, "cuotaNum": 1, "desc": "Construccion", "date": "2025-10-01", "month": "Octubre", "year": 2025}, {"id": "eva2awh", "groupId": "oy03huq", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 61480.0, "totalAmount": 61480.0, "cuotas": 1, "cuotaNum": 1, "desc": "Salida", "date": "2025-10-01", "month": "Octubre", "year": 2025}, {"id": "oodz77z", "groupId": "f94paro", "userId": "tomas", "owner": "Casa", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 17500.0, "totalAmount": 17500.0, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2025-10-01", "month": "Octubre", "year": 2025}],
  "2025-11": [{"id": "675zlu8", "groupId": "5g06za4", "userId": "lucia", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 750330.0, "totalAmount": 750330.0, "cuotas": 1, "cuotaNum": 1, "desc": "Construccion", "date": "2025-10-01", "month": "Noviembre", "year": 2025}, {"id": "i9olrvc", "groupId": "49axxgs", "userId": "lucia", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": -750330.0, "totalAmount": -750330.0, "cuotas": 1, "cuotaNum": 1, "desc": "Arreglos casa", "date": "2025-10-01", "month": "Noviembre", "year": 2025}, {"id": "znsrnn9", "groupId": "jjqhau0", "userId": "lucia", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 750330.0, "totalAmount": 750330.0, "cuotas": 1, "cuotaNum": 1, "desc": "Construccion", "date": "2025-10-01", "month": "Noviembre", "year": 2025}, {"id": "5wldpdr", "groupId": "uxlbgfs", "userId": "lucia", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 90000.0, "totalAmount": 90000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Internet", "date": "2025-10-01", "month": "Noviembre", "year": 2025}, {"id": "5aqlp4g", "groupId": "z9juylg", "userId": "lucia", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 90000.0, "totalAmount": 90000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Mecedora", "date": "2025-10-01", "month": "Noviembre", "year": 2025}, {"id": "mhbfpgh", "groupId": "pkqt6tv", "userId": "lucia", "owner": "Casa", "category": "Salud", "categoryName": "Salud", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 292700.0, "totalAmount": 292700.0, "cuotas": 1, "cuotaNum": 1, "desc": "omint", "date": "2025-10-01", "month": "Noviembre", "year": 2025}, {"id": "y7twcsm", "groupId": "yvg73ec", "userId": "lucia", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 180336.5, "totalAmount": 180336.5, "cuotas": 1, "cuotaNum": 1, "desc": "Supermercado", "date": "2025-10-01", "month": "Noviembre", "year": 2025}, {"id": "nia6jg0", "groupId": "foab88v", "userId": "lucia", "owner": "Casa", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 3800.0, "totalAmount": 3800.0, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2025-10-01", "month": "Noviembre", "year": 2025}, {"id": "gxosych", "groupId": "v9p6gjk", "userId": "tomas", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 514810.0, "totalAmount": 514810.0, "cuotas": 1, "cuotaNum": 1, "desc": "Construccion", "date": "2025-10-01", "month": "Noviembre", "year": 2025}, {"id": "g7msnyn", "groupId": "wfol297", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 45000.0, "totalAmount": 45000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Salida", "date": "2025-10-01", "month": "Noviembre", "year": 2025}, {"id": "hpf2js0", "groupId": "fn3mjm4", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 68000.0, "totalAmount": 68000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Salida", "date": "2025-11-01", "month": "Noviembre", "year": 2025}, {"id": "kg7ark8", "groupId": "gyky0vp", "userId": "tomas", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 50900.0, "totalAmount": 50900.0, "cuotas": 1, "cuotaNum": 1, "desc": "Supermercado", "date": "2025-11-01", "month": "Noviembre", "year": 2025}, {"id": "y7aqigz", "groupId": "gorlj9x", "userId": "tomas", "owner": "Casa", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 28000.0, "totalAmount": 28000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2025-11-01", "month": "Noviembre", "year": 2025}],
  "2025-12": [{"id": "jepyu4w", "groupId": "nyhojim", "userId": "lucia", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 59000.0, "totalAmount": 59000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Comida / salida", "date": "2025-12-01", "month": "Diciembre", "year": 2025}, {"id": "yx61124", "groupId": "y0nodrk", "userId": "lucia", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 20000.0, "totalAmount": 20000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Construccion", "date": "2025-12-01", "month": "Diciembre", "year": 2025}, {"id": "y2a3tep", "groupId": "aeie8hh", "userId": "lucia", "owner": "Casa", "category": "Otros", "categoryName": "Otros", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 84510.0, "totalAmount": 84510.0, "cuotas": 1, "cuotaNum": 1, "desc": "Otros", "date": "2025-12-01", "month": "Diciembre", "year": 2025}, {"id": "cvjylkh", "groupId": "sraylx5", "userId": "lucia", "owner": "Casa", "category": "Regalos", "categoryName": "Regalos", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 30000.0, "totalAmount": 30000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Regalos", "date": "2025-12-01", "month": "Diciembre", "year": 2025}, {"id": "cvrdcdx", "groupId": "qazx353", "userId": "lucia", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 27200.0, "totalAmount": 27200.0, "cuotas": 1, "cuotaNum": 1, "desc": "salida", "date": "2025-12-01", "month": "Diciembre", "year": 2025}, {"id": "9tad3yd", "groupId": "7jj6wrt", "userId": "lucia", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 126760.0, "totalAmount": 126760.0, "cuotas": 1, "cuotaNum": 1, "desc": "Supermercado", "date": "2025-12-01", "month": "Diciembre", "year": 2025}, {"id": "vpuwc51", "groupId": "s7rb4wk", "userId": "lucia", "owner": "Casa", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 32900.0, "totalAmount": 32900.0, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2025-12-01", "month": "Diciembre", "year": 2025}, {"id": "ok0waok", "groupId": "9s47x5n", "userId": "lucia", "owner": "Casa", "category": "Salud", "categoryName": "Salud", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 553000.0, "totalAmount": 553000.0, "cuotas": 1, "cuotaNum": 1, "desc": "omint", "date": "2025-12-01", "month": "Diciembre", "year": 2025}, {"id": "ppiigtg", "groupId": "b1stqvo", "userId": "tomas", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 100000.0, "totalAmount": 100000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Arreglos casa", "date": "2025-12-01", "month": "Diciembre", "year": 2025}, {"id": "tkqma8u", "groupId": "f1dgff8", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 330970.0, "totalAmount": 330970.0, "cuotas": 1, "cuotaNum": 1, "desc": "Carniceria", "date": "2025-12-01", "month": "Diciembre", "year": 2025}, {"id": "6ll5lk4", "groupId": "2uhlr65", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 13000.0, "totalAmount": 13000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Comida / salida", "date": "2025-12-01", "month": "Diciembre", "year": 2025}, {"id": "7rat5m9", "groupId": "d3ewbsj", "userId": "tomas", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 18000.0, "totalAmount": 18000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Construccion", "date": "2025-12-01", "month": "Diciembre", "year": 2025}, {"id": "fy4rxlo", "groupId": "ajyvxi7", "userId": "tomas", "owner": "Casa", "category": "Regalos", "categoryName": "Regalos", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 97000.0, "totalAmount": 97000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Regalos", "date": "2025-12-01", "month": "Diciembre", "year": 2025}, {"id": "8g4dwzk", "groupId": "lblqi03", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 36000.0, "totalAmount": 36000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Salida", "date": "2025-12-01", "month": "Diciembre", "year": 2025}, {"id": "cw0rsad", "groupId": "cli23n6", "userId": "tomas", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 20000.0, "totalAmount": 20000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Salud", "date": "2025-12-01", "month": "Diciembre", "year": 2025}, {"id": "83bmxyr", "groupId": "m7d5lqk", "userId": "tomas", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 72200.0, "totalAmount": 72200.0, "cuotas": 1, "cuotaNum": 1, "desc": "Supermercado", "date": "2025-12-01", "month": "Diciembre", "year": 2025}, {"id": "7arbran", "groupId": "t7cwj0v", "userId": "tomas", "owner": "Casa", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 12100.0, "totalAmount": 12100.0, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2025-12-01", "month": "Diciembre", "year": 2025}],
  "2026-01": [{"id": "96dei7i", "groupId": "s2sch3q", "userId": "lucia", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 9300.0, "totalAmount": 9300.0, "cuotas": 1, "cuotaNum": 1, "desc": "Comida / salida", "date": "2026-01-01", "month": "Enero", "year": 2026}, {"id": "1hpaypt", "groupId": "gd886ot", "userId": "lucia", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 143000.0, "totalAmount": 143000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Arreglos casa", "date": "2026-01-01", "month": "Enero", "year": 2026}, {"id": "vzhu8sa", "groupId": "u3ki2qi", "userId": "lucia", "owner": "Casa", "category": "Salud", "categoryName": "Salud", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 622000.0, "totalAmount": 622000.0, "cuotas": 1, "cuotaNum": 1, "desc": "obra social mas seguro", "date": "2026-01-01", "month": "Enero", "year": 2026}, {"id": "7ylq0je", "groupId": "c5tc3hl", "userId": "lucia", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 4712.0, "totalAmount": 4712.0, "cuotas": 1, "cuotaNum": 1, "desc": "Supermercado", "date": "2026-01-01", "month": "Enero", "year": 2026}, {"id": "6w7d889", "groupId": "ezq7j3o", "userId": "lucia", "owner": "Casa", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 23100.0, "totalAmount": 23100.0, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2026-01-01", "month": "Enero", "year": 2026}, {"id": "4gbzrum", "groupId": "ce7hn8c", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 177000.0, "totalAmount": 177000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Carniceria", "date": "2026-01-01", "month": "Enero", "year": 2026}, {"id": "vnc9tq5", "groupId": "421qjb9", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 17500.0, "totalAmount": 17500.0, "cuotas": 1, "cuotaNum": 1, "desc": "Comida / salida", "date": "2026-01-01", "month": "Enero", "year": 2026}, {"id": "enjcte8", "groupId": "666yuv9", "userId": "tomas", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 8000.0, "totalAmount": 8000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Arreglos casa", "date": "2026-01-01", "month": "Enero", "year": 2026}, {"id": "uzr82i6", "groupId": "wewcggz", "userId": "tomas", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 394000.0, "totalAmount": 394000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Arreglos casa", "date": "2026-01-01", "month": "Enero", "year": 2026}, {"id": "7f6e0w3", "groupId": "vybiyjn", "userId": "tomas", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 53345.0, "totalAmount": 53345.0, "cuotas": 1, "cuotaNum": 1, "desc": "Supermercado", "date": "2026-01-01", "month": "Enero", "year": 2026}, {"id": "yxgd5uz", "groupId": "8l3co51", "userId": "tomas", "owner": "Casa", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 40850.0, "totalAmount": 40850.0, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2026-01-01", "month": "Enero", "year": 2026}],
  "2026-02": [{"id": "nbhk4uj", "groupId": "9t8um5z", "userId": "lucia", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 75000.0, "totalAmount": 75000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Arreglos casa", "date": "2026-02-01", "month": "Febrero", "year": 2026}, {"id": "nvgsme1", "groupId": "b8bbldj", "userId": "lucia", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 23000.0, "totalAmount": 23000.0, "cuotas": 1, "cuotaNum": 1, "desc": "carniceria", "date": "2026-02-01", "month": "Febrero", "year": 2026}, {"id": "qxj176v", "groupId": "zlypaah", "userId": "lucia", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 44000.0, "totalAmount": 44000.0, "cuotas": 1, "cuotaNum": 1, "desc": "jardineria", "date": "2026-02-01", "month": "Febrero", "year": 2026}, {"id": "o1ychd8", "groupId": "jpeamb4", "userId": "lucia", "owner": "Casa", "category": "Mascotas", "categoryName": "Mascotas", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 30000.0, "totalAmount": 30000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Mascotas", "date": "2026-02-01", "month": "Febrero", "year": 2026}, {"id": "xcfkoww", "groupId": "fazfhg5", "userId": "lucia", "owner": "Casa", "category": "Cosas para la casa", "categoryName": "Cosas para la casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 850345.0, "totalAmount": 850345.0, "cuotas": 1, "cuotaNum": 1, "desc": "mobiliario", "date": "2026-02-01", "month": "Febrero", "year": 2026}, {"id": "5enswj5", "groupId": "hp7jyp7", "userId": "lucia", "owner": "Casa", "category": "Otros", "categoryName": "Otros", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 187000.0, "totalAmount": 187000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Otros", "date": "2026-02-01", "month": "Febrero", "year": 2026}, {"id": "e9c7n20", "groupId": "3478zqa", "userId": "lucia", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 80300.0, "totalAmount": 80300.0, "cuotas": 1, "cuotaNum": 1, "desc": "Salida", "date": "2026-02-01", "month": "Febrero", "year": 2026}, {"id": "ngh4pue", "groupId": "2u3yuzf", "userId": "lucia", "owner": "Casa", "category": "Salud", "categoryName": "Salud", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 407520.0, "totalAmount": 407520.0, "cuotas": 1, "cuotaNum": 1, "desc": "omint", "date": "2026-02-01", "month": "Febrero", "year": 2026}, {"id": "vu6a7nh", "groupId": "z3xw72c", "userId": "lucia", "owner": "Casa", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 44200.0, "totalAmount": 44200.0, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2026-02-01", "month": "Febrero", "year": 2026}, {"id": "bwrbnff", "groupId": "njv48dy", "userId": "lucia", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 158350.0, "totalAmount": 158350.0, "cuotas": 1, "cuotaNum": 1, "desc": "Supermercado", "date": "2026-02-01", "month": "Febrero", "year": 2026}, {"id": "pka1zn0", "groupId": "rxipekm", "userId": "tomas", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 178000.0, "totalAmount": 178000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Arreglos casa", "date": "2026-02-01", "month": "Febrero", "year": 2026}, {"id": "dyne2lg", "groupId": "iunb0s1", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 249000.0, "totalAmount": 249000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Carniceria", "date": "2026-02-01", "month": "Febrero", "year": 2026}, {"id": "r1hokeb", "groupId": "fi66xk6", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 66100.0, "totalAmount": 66100.0, "cuotas": 1, "cuotaNum": 1, "desc": "Comida / salida", "date": "2026-02-01", "month": "Febrero", "year": 2026}, {"id": "6f6kck2", "groupId": "u3jzwrc", "userId": "tomas", "owner": "Casa", "category": "Mascotas", "categoryName": "Mascotas", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 34000.0, "totalAmount": 34000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Mascotas", "date": "2026-02-01", "month": "Febrero", "year": 2026}, {"id": "tvrpx4f", "groupId": "o3zwwyg", "userId": "tomas", "owner": "Casa", "category": "Cosas para la casa", "categoryName": "Cosas para la casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 25000.0, "totalAmount": 25000.0, "cuotas": 1, "cuotaNum": 1, "desc": "mobiliario", "date": "2026-02-01", "month": "Febrero", "year": 2026}, {"id": "0oj6ntg", "groupId": "gwunhqe", "userId": "tomas", "owner": "Casa", "category": "Otros", "categoryName": "Otros", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 110000.0, "totalAmount": 110000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Otros", "date": "2026-02-01", "month": "Febrero", "year": 2026}, {"id": "cm2ixup", "groupId": "eysa6gq", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 34000.0, "totalAmount": 34000.0, "cuotas": 1, "cuotaNum": 1, "desc": "salida", "date": "2026-02-01", "month": "Febrero", "year": 2026}, {"id": "cajayec", "groupId": "hzi69kh", "userId": "tomas", "owner": "Casa", "category": "Delfi", "categoryName": "Delfi", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 96700.0, "totalAmount": 96700.0, "cuotas": 1, "cuotaNum": 1, "desc": "Vacuna", "date": "2026-02-01", "month": "Febrero", "year": 2026}, {"id": "jd7ujj4", "groupId": "0u7xhaq", "userId": "tomas", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 90760.0, "totalAmount": 90760.0, "cuotas": 1, "cuotaNum": 1, "desc": "Supermercado", "date": "2026-02-01", "month": "Febrero", "year": 2026}, {"id": "5p94j7c", "groupId": "47hzv9k", "userId": "tomas", "owner": "Casa", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 55700.0, "totalAmount": 55700.0, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2026-02-01", "month": "Febrero", "year": 2026}],
  "2026-03": [{"id": "0jssb9p", "groupId": "mqc617x", "userId": "lucia", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 12000.0, "totalAmount": 12000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Arreglos casa", "date": "2026-03-01", "month": "Marzo", "year": 2026}, {"id": "p0mjbp2", "groupId": "o2uvu2w", "userId": "lucia", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 87000.0, "totalAmount": 87000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Comida / salida", "date": "2026-03-01", "month": "Marzo", "year": 2026}, {"id": "v70vaxt", "groupId": "tr5hc4k", "userId": "lucia", "owner": "Casa", "category": "Cosas para la casa", "categoryName": "Cosas para la casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 165000.0, "totalAmount": 165000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Cosas para la casa", "date": "2026-03-01", "month": "Marzo", "year": 2026}, {"id": "abu5n5o", "groupId": "z1z81q3", "userId": "lucia", "owner": "Casa", "category": "Otros", "categoryName": "Otros", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 43000.0, "totalAmount": 43000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Otros", "date": "2026-03-01", "month": "Marzo", "year": 2026}, {"id": "gdvw0gq", "groupId": "b59apr1", "userId": "lucia", "owner": "Casa", "category": "Salud", "categoryName": "Salud", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 429335.0, "totalAmount": 429335.0, "cuotas": 1, "cuotaNum": 1, "desc": "Salud", "date": "2026-03-01", "month": "Marzo", "year": 2026}, {"id": "4hlis8g", "groupId": "fvi377z", "userId": "lucia", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 114813.5, "totalAmount": 114813.5, "cuotas": 1, "cuotaNum": 1, "desc": "Supermercado", "date": "2026-03-01", "month": "Marzo", "year": 2026}, {"id": "fvfgco3", "groupId": "oupsurn", "userId": "lucia", "owner": "Casa", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 57000.0, "totalAmount": 57000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2026-03-01", "month": "Marzo", "year": 2026}, {"id": "vmyx1d3", "groupId": "k9f5f8g", "userId": "tomas", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 39500.0, "totalAmount": 39500.0, "cuotas": 1, "cuotaNum": 1, "desc": "Arreglos casa", "date": "2026-03-01", "month": "Marzo", "year": 2026}, {"id": "3c87eua", "groupId": "61aolj4", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 220000.0, "totalAmount": 220000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Carniceria", "date": "2026-03-01", "month": "Marzo", "year": 2026}, {"id": "i8zyf6x", "groupId": "zuxnoom", "userId": "tomas", "owner": "Casa", "category": "Cosas para la casa", "categoryName": "Cosas para la casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 54000.0, "totalAmount": 54000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Gym", "date": "2026-03-01", "month": "Marzo", "year": 2026}, {"id": "ainy9ip", "groupId": "7yvnrpg", "userId": "tomas", "owner": "Casa", "category": "Otros", "categoryName": "Otros", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 33000.0, "totalAmount": 33000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Otros", "date": "2026-03-01", "month": "Marzo", "year": 2026}, {"id": "iu8qtxh", "groupId": "r40wwba", "userId": "tomas", "owner": "Casa", "category": "Otros", "categoryName": "Otros", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 40000.0, "totalAmount": 40000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Otros", "date": "2026-03-01", "month": "Marzo", "year": 2026}, {"id": "hcrli3x", "groupId": "boyp25l", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 35000.0, "totalAmount": 35000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Salida", "date": "2026-03-01", "month": "Marzo", "year": 2026}, {"id": "o0n98f1", "groupId": "i8ycbsb", "userId": "tomas", "owner": "Casa", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 85350.0, "totalAmount": 85350.0, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2026-03-01", "month": "Marzo", "year": 2026}],
  "2026-04": [{"id": "e5fa9m2", "groupId": "7bzhw3p", "userId": "lucia", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 44500.0, "totalAmount": 44500.0, "cuotas": 1, "cuotaNum": 1, "desc": "Comida / salida", "date": "2026-04-01", "month": "Abril", "year": 2026}, {"id": "46smpw6", "groupId": "u50ge5q", "userId": "lucia", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 66000.0, "totalAmount": 66000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Salida", "date": "2026-04-01", "month": "Abril", "year": 2026}, {"id": "vj87ysk", "groupId": "l7ph3uh", "userId": "lucia", "owner": "Casa", "category": "Salud", "categoryName": "Salud", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 433600.0, "totalAmount": 433600.0, "cuotas": 1, "cuotaNum": 1, "desc": "Salud", "date": "2026-04-01", "month": "Abril", "year": 2026}, {"id": "hobjdwc", "groupId": "6nuprg8", "userId": "lucia", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 67200.0, "totalAmount": 67200.0, "cuotas": 1, "cuotaNum": 1, "desc": "Supermercado", "date": "2026-04-01", "month": "Abril", "year": 2026}, {"id": "oi2hcpk", "groupId": "1unmnk2", "userId": "lucia", "owner": "Casa", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 14200.0, "totalAmount": 14200.0, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2026-04-01", "month": "Abril", "year": 2026}, {"id": "xwl20y0", "groupId": "qobwhxj", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 88000.0, "totalAmount": 88000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Comida / salida", "date": "2026-04-01", "month": "Abril", "year": 2026}, {"id": "2ofhs03", "groupId": "siwhpbz", "userId": "tomas", "owner": "Casa", "category": "Mascotas", "categoryName": "Mascotas", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 35500.0, "totalAmount": 35500.0, "cuotas": 1, "cuotaNum": 1, "desc": "Mascotas", "date": "2026-04-01", "month": "Abril", "year": 2026}, {"id": "mytkmrv", "groupId": "1m6z1a2", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 65000.0, "totalAmount": 65000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Salidas", "date": "2026-04-01", "month": "Abril", "year": 2026}, {"id": "uo5bya5", "groupId": "3x02j7w", "userId": "tomas", "owner": "Casa", "category": "Salud", "categoryName": "Salud", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 97200.0, "totalAmount": 97200.0, "cuotas": 1, "cuotaNum": 1, "desc": "Vacuna delfi", "date": "2026-04-01", "month": "Abril", "year": 2026}, {"id": "dmw6x2d", "groupId": "miunklo", "userId": "tomas", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 137100.0, "totalAmount": 137100.0, "cuotas": 1, "cuotaNum": 1, "desc": "Supermercado", "date": "2026-04-01", "month": "Abril", "year": 2026}, {"id": "8tmmoqb", "groupId": "j576lg5", "userId": "tomas", "owner": "Casa", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 63500.0, "totalAmount": 63500.0, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2026-04-01", "month": "Abril", "year": 2026}, {"id": "lmhwv0u", "groupId": "jsm9hjr", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 220000.0, "totalAmount": 220000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Carniceria", "date": "2026-04-01", "month": "Abril", "year": 2026}],
  "2026-05": [{"id": "oy38xvv", "groupId": "zs089af", "userId": "lucia", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 44080.0, "totalAmount": 44080.0, "cuotas": 1, "cuotaNum": 1, "desc": "Comida / salida", "date": "2026-05-01", "month": "Mayo", "year": 2026}, {"id": "wbv2zra", "groupId": "perhoz5", "userId": "lucia", "owner": "Casa", "category": "Salud", "categoryName": "Salud", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 450000.0, "totalAmount": 450000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Salud", "date": "2026-05-01", "month": "Mayo", "year": 2026}, {"id": "lodbt1i", "groupId": "j518he4", "userId": "lucia", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 106850.0, "totalAmount": 106850.0, "cuotas": 1, "cuotaNum": 1, "desc": "Supermercado", "date": "2026-05-01", "month": "Mayo", "year": 2026}, {"id": "chz8wxr", "groupId": "dwafaa9", "userId": "lucia", "owner": "Casa", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 9800.0, "totalAmount": 9800.0, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2026-05-01", "month": "Mayo", "year": 2026}, {"id": "pk00bo2", "groupId": "tyhmcag", "userId": "lucia", "owner": "Casa", "category": "Regalos", "categoryName": "Regalos", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 30000.0, "totalAmount": 30000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Regalos", "date": "2026-05-01", "month": "Mayo", "year": 2026}, {"id": "txoj5bs", "groupId": "5vttyzo", "userId": "tomas", "owner": "Casa", "category": "Arreglos casa", "categoryName": "Arreglos casa", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 70000.0, "totalAmount": 70000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Arreglos casa", "date": "2026-05-01", "month": "Mayo", "year": 2026}, {"id": "2cb4opv", "groupId": "b1lrbis", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 245500.0, "totalAmount": 245500.0, "cuotas": 1, "cuotaNum": 1, "desc": "Carnicería", "date": "2026-05-01", "month": "Mayo", "year": 2026}, {"id": "fxdgpt9", "groupId": "yih3zan", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 123200.0, "totalAmount": 123200.0, "cuotas": 1, "cuotaNum": 1, "desc": "Comida", "date": "2026-05-01", "month": "Mayo", "year": 2026}, {"id": "ausua70", "groupId": "5eotmdn", "userId": "tomas", "owner": "Casa", "category": "Otros", "categoryName": "Otros", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 80000.0, "totalAmount": 80000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Otros", "date": "2026-05-01", "month": "Mayo", "year": 2026}, {"id": "heb4nop", "groupId": "zdbcfb6", "userId": "tomas", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 60000.0, "totalAmount": 60000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Salidas", "date": "2026-05-01", "month": "Mayo", "year": 2026}, {"id": "pgoa3kw", "groupId": "c5oigja", "userId": "tomas", "owner": "Casa", "category": "Salud", "categoryName": "Salud", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 10000.0, "totalAmount": 10000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Salud", "date": "2026-05-01", "month": "Mayo", "year": 2026}, {"id": "douafua", "groupId": "80tg434", "userId": "tomas", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 37500.0, "totalAmount": 37500.0, "cuotas": 1, "cuotaNum": 1, "desc": "Supermercado", "date": "2026-05-01", "month": "Mayo", "year": 2026}, {"id": "1hq7m7m", "groupId": "v2tdgm1", "userId": "tomas", "owner": "Casa", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 66050.0, "totalAmount": 66050.0, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2026-05-01", "month": "Mayo", "year": 2026}],
  "2026-06": [{"id": "cldiqs1", "groupId": "ll8sh8a", "userId": "tomas", "owner": "Casa", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 15000.0, "totalAmount": 15000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "baw699r", "groupId": "ckthuy4", "userId": "lucia", "owner": "Casa", "category": "Comida / salida", "categoryName": "Comida / salida", "payMethodId": "", "payMethodName": "Efectivo", "payType": "transfer", "amount": 14000.0, "totalAmount": 14000.0, "cuotas": 1, "cuotaNum": 1, "desc": "Comida / salida", "date": "2026-06-01", "month": "Junio", "year": 2026}],
};

const CARD_EXPENSES_DATA = {
  "2026-06": [{"id": "tihi818", "groupId": "9azsmyi", "userId": "lucia", "owner": "Personal", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "c1", "payMethodName": "Francés MC", "payType": "card", "amount": 2549, "totalAmount": 2549, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "hslat6s", "groupId": "bupm47w", "userId": "lucia", "owner": "Personal", "category": "Riñonera Miska", "categoryName": "Riñonera Miska", "payMethodId": "c1", "payMethodName": "Francés MC", "payType": "card", "amount": 19000, "totalAmount": 19000, "cuotas": 1, "cuotaNum": 1, "desc": "Riñonera Miska", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "cfvf9ub", "groupId": "rl3a0u2", "userId": "lucia", "owner": "Personal", "category": "Regalo Clarita", "categoryName": "Regalo Clarita", "payMethodId": "c1", "payMethodName": "Francés MC", "payType": "card", "amount": 10000, "totalAmount": 10000, "cuotas": 1, "cuotaNum": 1, "desc": "Regalo Clarita", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "fc2svp3", "groupId": "dwkw2js", "userId": "lucia", "owner": "Personal", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "c1", "payMethodName": "Francés MC", "payType": "card", "amount": 5230, "totalAmount": 5230, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "7kt5u9u", "groupId": "o0w5tu2", "userId": "lucia", "owner": "Personal", "category": "Seguro", "categoryName": "Seguro", "payMethodId": "c2", "payMethodName": "Supervielle MC", "payType": "card", "amount": 80505, "totalAmount": 80505, "cuotas": 1, "cuotaNum": 1, "desc": "Seguro", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "exz526s", "groupId": "z7gsdry", "userId": "lucia", "owner": "Mamá", "category": "Tela romboideal", "categoryName": "Tela romboideal", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 8692.06, "totalAmount": 8692.06, "cuotas": 1, "cuotaNum": 1, "desc": "Tela romboideal", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "hi4g8gc", "groupId": "onrevye", "userId": "lucia", "owner": "Mamá", "category": "Ventilador y nido", "categoryName": "Ventilador y nido", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 21456.3, "totalAmount": 21456.3, "cuotas": 1, "cuotaNum": 1, "desc": "Ventilador y nido", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "86mclp1", "groupId": "tzpbo84", "userId": "lucia", "owner": "Mamá", "category": "Ventilador Delfi", "categoryName": "Ventilador Delfi", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 16796.88, "totalAmount": 16796.88, "cuotas": 1, "cuotaNum": 1, "desc": "Ventilador Delfi", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "mzzq2tm", "groupId": "497l4v9", "userId": "lucia", "owner": "Mamá", "category": "Lavarropas", "categoryName": "Lavarropas", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 54166.58, "totalAmount": 54166.58, "cuotas": 1, "cuotaNum": 1, "desc": "Lavarropas", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "16pn1wz", "groupId": "p7ojn4d", "userId": "lucia", "owner": "Mamá", "category": "Remedio", "categoryName": "Remedio", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 9825, "totalAmount": 9825, "cuotas": 1, "cuotaNum": 1, "desc": "Remedio", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "0j75csv", "groupId": "gnf81ar", "userId": "lucia", "owner": "Personal", "category": "Verdulería", "categoryName": "Verdulería", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 9080, "totalAmount": 9080, "cuotas": 1, "cuotaNum": 1, "desc": "Verdulería", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "fqhrpex", "groupId": "yu7jlwh", "userId": "lucia", "owner": "Personal", "category": "Farmaonline", "categoryName": "Farmaonline", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 24225.01, "totalAmount": 24225.01, "cuotas": 1, "cuotaNum": 1, "desc": "Farmaonline", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "ek3awgw", "groupId": "lfe2nfm", "userId": "lucia", "owner": "Casa", "category": "Hiperceramico", "categoryName": "Hiperceramico", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 6092.44, "totalAmount": 6092.44, "cuotas": 1, "cuotaNum": 1, "desc": "Hiperceramico", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "axxtw49", "groupId": "kejyze1", "userId": "lucia", "owner": "Personal", "category": "Jebbs", "categoryName": "Jebbs", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 6600, "totalAmount": 6600, "cuotas": 1, "cuotaNum": 1, "desc": "Jebbs", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "bugahd0", "groupId": "u0c992r", "userId": "lucia", "owner": "Casa", "category": "Mantel", "categoryName": "Mantel", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 2999.17, "totalAmount": 2999.17, "cuotas": 1, "cuotaNum": 1, "desc": "Mantel", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "05ap0vf", "groupId": "7hfo4v8", "userId": "lucia", "owner": "Personal", "category": "Salida", "categoryName": "Salida", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 24700, "totalAmount": 24700, "cuotas": 1, "cuotaNum": 1, "desc": "Salida", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "wt94drq", "groupId": "w2m7op6", "userId": "lucia", "owner": "Personal", "category": "Dandi", "categoryName": "Dandi", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 13350, "totalAmount": 13350, "cuotas": 1, "cuotaNum": 1, "desc": "Dandi", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "hs1mig1", "groupId": "amv3ym3", "userId": "lucia", "owner": "Personal", "category": "Peluquería", "categoryName": "Peluquería", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 10009.67, "totalAmount": 10009.67, "cuotas": 1, "cuotaNum": 1, "desc": "Peluquería", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "bab077d", "groupId": "pqdlxbj", "userId": "lucia", "owner": "Personal", "category": "Mochila Delfi", "categoryName": "Mochila Delfi", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 8099.83, "totalAmount": 8099.83, "cuotas": 1, "cuotaNum": 1, "desc": "Mochila Delfi", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "nf6xl8x", "groupId": "0fv687n", "userId": "lucia", "owner": "Casa", "category": "Tapón bacha baño Delfi", "categoryName": "Tapón bacha baño Delfi", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 2233.63, "totalAmount": 2233.63, "cuotas": 1, "cuotaNum": 1, "desc": "Tapón bacha baño Delfi", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "f758nue", "groupId": "ca9o6yq", "userId": "lucia", "owner": "Personal", "category": "Lima Delfina", "categoryName": "Lima Delfina", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 1478.31, "totalAmount": 1478.31, "cuotas": 1, "cuotaNum": 1, "desc": "Lima Delfina", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "y9yyejq", "groupId": "9x7d8be", "userId": "lucia", "owner": "Personal", "category": "Comida", "categoryName": "Comida", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 10351.5, "totalAmount": 10351.5, "cuotas": 1, "cuotaNum": 1, "desc": "Comida", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "sgj8uso", "groupId": "32n83n4", "userId": "lucia", "owner": "Personal", "category": "Afeitadora", "categoryName": "Afeitadora", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 4626.31, "totalAmount": 4626.31, "cuotas": 1, "cuotaNum": 1, "desc": "Afeitadora", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "7g4jrse", "groupId": "gkd8z1p", "userId": "lucia", "owner": "Personal", "category": "Comida", "categoryName": "Comida", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 5460, "totalAmount": 5460, "cuotas": 1, "cuotaNum": 1, "desc": "Comida", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "0bn94tr", "groupId": "xq2nhz4", "userId": "lucia", "owner": "Personal", "category": "Comida", "categoryName": "Comida", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 20939, "totalAmount": 20939, "cuotas": 1, "cuotaNum": 1, "desc": "Comida", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "hezhbnk", "groupId": "00xdjbz", "userId": "lucia", "owner": "Casa", "category": "Termotanque Novogar", "categoryName": "Termotanque Novogar", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 92413.17, "totalAmount": 92413.17, "cuotas": 1, "cuotaNum": 1, "desc": "Termotanque Novogar", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "fo6kli7", "groupId": "jdadlji", "userId": "lucia", "owner": "Casa", "category": "Ventilador", "categoryName": "Ventilador", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 18276.3, "totalAmount": 18276.3, "cuotas": 1, "cuotaNum": 1, "desc": "Ventilador", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "mk6lj59", "groupId": "mha90nj", "userId": "lucia", "owner": "Personal", "category": "Seguro viaje", "categoryName": "Seguro viaje", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 18922.58, "totalAmount": 18922.58, "cuotas": 1, "cuotaNum": 1, "desc": "Seguro viaje", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "34gg969", "groupId": "jzmwme3", "userId": "lucia", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "c4", "payMethodName": "BNA MC", "payType": "card", "amount": 40000, "totalAmount": 40000, "cuotas": 1, "cuotaNum": 1, "desc": "Supermercado", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "vbulpg9", "groupId": "odjqamm", "userId": "lucia", "owner": "Personal", "category": "Dandi", "categoryName": "Dandi", "payMethodId": "c4", "payMethodName": "BNA MC", "payType": "card", "amount": 48719.25, "totalAmount": 48719.25, "cuotas": 1, "cuotaNum": 1, "desc": "Dandi", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "hi9w6vk", "groupId": "qx0x7hg", "userId": "lucia", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "c4", "payMethodName": "BNA MC", "payType": "card", "amount": 2490, "totalAmount": 2490, "cuotas": 1, "cuotaNum": 1, "desc": "Supermercado", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "6djfbxp", "groupId": "mr41z12", "userId": "lucia", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "c4", "payMethodName": "BNA MC", "payType": "card", "amount": 21025, "totalAmount": 21025, "cuotas": 1, "cuotaNum": 1, "desc": "Supermercado", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "aw6wi1m", "groupId": "ck4lgtd", "userId": "lucia", "owner": "Casa", "category": "Supermercado", "categoryName": "Supermercado", "payMethodId": "c4", "payMethodName": "BNA MC", "payType": "card", "amount": 16150, "totalAmount": 16150, "cuotas": 1, "cuotaNum": 1, "desc": "Supermercado", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "9i1rv0h", "groupId": "w88rnw6", "userId": "lucia", "owner": "Casa", "category": "Super A", "categoryName": "Super A", "payMethodId": "c4", "payMethodName": "BNA MC", "payType": "card", "amount": 17348, "totalAmount": 17348, "cuotas": 1, "cuotaNum": 1, "desc": "Super A", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "ppyygdy", "groupId": "xcr91jw", "userId": "lucia", "owner": "Personal", "category": "Farmacia", "categoryName": "Farmacia", "payMethodId": "c4", "payMethodName": "BNA MC", "payType": "card", "amount": 5641.67, "totalAmount": 5641.67, "cuotas": 1, "cuotaNum": 1, "desc": "Farmacia", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "phw9icl", "groupId": "4uutpx7", "userId": "lucia", "owner": "Personal", "category": "Regalo Pe", "categoryName": "Regalo Pe", "payMethodId": "c4", "payMethodName": "BNA MC", "payType": "card", "amount": 7499.83, "totalAmount": 7499.83, "cuotas": 1, "cuotaNum": 1, "desc": "Regalo Pe", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "161ur9g", "groupId": "i42ulea", "userId": "lucia", "owner": "Personal", "category": "Nafta", "categoryName": "Nafta", "payMethodId": "c4", "payMethodName": "BNA MC", "payType": "card", "amount": 30000, "totalAmount": 30000, "cuotas": 1, "cuotaNum": 1, "desc": "Nafta", "date": "2026-06-01", "month": "Junio", "year": 2026}, {"id": "w2h6joz", "groupId": "sf64f50", "userId": "lucia", "owner": "Casa", "category": "Baño y accesorio/construccion", "categoryName": "Baño y accesorio/construccion", "payMethodId": "c4", "payMethodName": "BNA MC", "payType": "card", "amount": 21666.67, "totalAmount": 21666.67, "cuotas": 1, "cuotaNum": 1, "desc": "Baño y accesorio/construccion", "date": "2026-06-01", "month": "Junio", "year": 2026}],
  "2026-07": [{"id": "0k2c0u0", "groupId": "uyt4r66", "userId": "lucia", "owner": "Personal", "category": "Riñonera Miska", "categoryName": "Riñonera Miska", "payMethodId": "c1", "payMethodName": "Francés MC", "payType": "card", "amount": 19000, "totalAmount": 19000, "cuotas": 1, "cuotaNum": 1, "desc": "Riñonera Miska", "date": "2026-07-01", "month": "Julio", "year": 2026}, {"id": "mf5ok3t", "groupId": "z8kbjea", "userId": "lucia", "owner": "Personal", "category": "Regalo Clarita", "categoryName": "Regalo Clarita", "payMethodId": "c1", "payMethodName": "Francés MC", "payType": "card", "amount": 10000, "totalAmount": 10000, "cuotas": 1, "cuotaNum": 1, "desc": "Regalo Clarita", "date": "2026-07-01", "month": "Julio", "year": 2026}, {"id": "unmhh45", "groupId": "o7x2dzr", "userId": "lucia", "owner": "Personal", "category": "Seguro", "categoryName": "Seguro", "payMethodId": "c2", "payMethodName": "Supervielle MC", "payType": "card", "amount": 80505, "totalAmount": 80505, "cuotas": 1, "cuotaNum": 1, "desc": "Seguro", "date": "2026-07-01", "month": "Julio", "year": 2026}, {"id": "auuh6bs", "groupId": "4zw7yr4", "userId": "lucia", "owner": "Mamá", "category": "Ventilador y nido", "categoryName": "Ventilador y nido", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 21456.3, "totalAmount": 21456.3, "cuotas": 1, "cuotaNum": 1, "desc": "Ventilador y nido", "date": "2026-07-01", "month": "Julio", "year": 2026}, {"id": "hn2z5nv", "groupId": "qg3dknn", "userId": "lucia", "owner": "Mamá", "category": "Ventilador Delfi", "categoryName": "Ventilador Delfi", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 16796.88, "totalAmount": 16796.88, "cuotas": 1, "cuotaNum": 1, "desc": "Ventilador Delfi", "date": "2026-07-01", "month": "Julio", "year": 2026}, {"id": "zi8szwv", "groupId": "zks1d0y", "userId": "lucia", "owner": "Mamá", "category": "Remedio", "categoryName": "Remedio", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 9825, "totalAmount": 9825, "cuotas": 1, "cuotaNum": 1, "desc": "Remedio", "date": "2026-07-01", "month": "Julio", "year": 2026}, {"id": "9n823ya", "groupId": "zlvncc7", "userId": "lucia", "owner": "Personal", "category": "Farmaonline", "categoryName": "Farmaonline", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 24225.01, "totalAmount": 24225.01, "cuotas": 1, "cuotaNum": 1, "desc": "Farmaonline", "date": "2026-07-01", "month": "Julio", "year": 2026}, {"id": "hefw8px", "groupId": "5rbxw01", "userId": "lucia", "owner": "Casa", "category": "Mantel", "categoryName": "Mantel", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 2999.17, "totalAmount": 2999.17, "cuotas": 1, "cuotaNum": 1, "desc": "Mantel", "date": "2026-07-01", "month": "Julio", "year": 2026}, {"id": "krm4ofr", "groupId": "kqz6g7w", "userId": "lucia", "owner": "Personal", "category": "Peluquería", "categoryName": "Peluquería", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 10009.67, "totalAmount": 10009.67, "cuotas": 1, "cuotaNum": 1, "desc": "Peluquería", "date": "2026-07-01", "month": "Julio", "year": 2026}, {"id": "7aqonod", "groupId": "4wu3sty", "userId": "lucia", "owner": "Personal", "category": "Mochila Delfi", "categoryName": "Mochila Delfi", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 8099.83, "totalAmount": 8099.83, "cuotas": 1, "cuotaNum": 1, "desc": "Mochila Delfi", "date": "2026-07-01", "month": "Julio", "year": 2026}, {"id": "mas0sur", "groupId": "67cidw3", "userId": "lucia", "owner": "Casa", "category": "Tapón bacha baño Delfi", "categoryName": "Tapón bacha baño Delfi", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 2233.63, "totalAmount": 2233.63, "cuotas": 1, "cuotaNum": 1, "desc": "Tapón bacha baño Delfi", "date": "2026-07-01", "month": "Julio", "year": 2026}, {"id": "39liml2", "groupId": "j7r53q3", "userId": "lucia", "owner": "Personal", "category": "Lima Delfina", "categoryName": "Lima Delfina", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 1478.31, "totalAmount": 1478.31, "cuotas": 1, "cuotaNum": 1, "desc": "Lima Delfina", "date": "2026-07-01", "month": "Julio", "year": 2026}, {"id": "q5lxa5i", "groupId": "n2lixk1", "userId": "lucia", "owner": "Personal", "category": "Afeitadora", "categoryName": "Afeitadora", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 4626.31, "totalAmount": 4626.31, "cuotas": 1, "cuotaNum": 1, "desc": "Afeitadora", "date": "2026-07-01", "month": "Julio", "year": 2026}, {"id": "2vljgin", "groupId": "48w9ol0", "userId": "lucia", "owner": "Personal", "category": "Comida", "categoryName": "Comida", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 7283.12, "totalAmount": 7283.12, "cuotas": 1, "cuotaNum": 1, "desc": "Comida", "date": "2026-07-01", "month": "Julio", "year": 2026}, {"id": "m1otfbz", "groupId": "6j2kkzi", "userId": "lucia", "owner": "Casa", "category": "Termotanque Novogar", "categoryName": "Termotanque Novogar", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 92413.17, "totalAmount": 92413.17, "cuotas": 1, "cuotaNum": 1, "desc": "Termotanque Novogar", "date": "2026-07-01", "month": "Julio", "year": 2026}, {"id": "4xexkwn", "groupId": "ap58dim", "userId": "lucia", "owner": "Casa", "category": "Ventilador", "categoryName": "Ventilador", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 18276.3, "totalAmount": 18276.3, "cuotas": 1, "cuotaNum": 1, "desc": "Ventilador", "date": "2026-07-01", "month": "Julio", "year": 2026}, {"id": "jb4fnmk", "groupId": "49ofiqs", "userId": "lucia", "owner": "Personal", "category": "Seguro viaje", "categoryName": "Seguro viaje", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 18922.58, "totalAmount": 18922.58, "cuotas": 1, "cuotaNum": 1, "desc": "Seguro viaje", "date": "2026-07-01", "month": "Julio", "year": 2026}, {"id": "lhhbb2u", "groupId": "o5bjog9", "userId": "lucia", "owner": "Personal", "category": "Farmacia", "categoryName": "Farmacia", "payMethodId": "c4", "payMethodName": "BNA MC", "payType": "card", "amount": 5641.67, "totalAmount": 5641.67, "cuotas": 1, "cuotaNum": 1, "desc": "Farmacia", "date": "2026-07-01", "month": "Julio", "year": 2026}, {"id": "0h5j35k", "groupId": "zgrq0ed", "userId": "lucia", "owner": "Casa", "category": "Baño y accesorio/construccion", "categoryName": "Baño y accesorio/construccion", "payMethodId": "c4", "payMethodName": "BNA MC", "payType": "card", "amount": 21666.67, "totalAmount": 21666.67, "cuotas": 1, "cuotaNum": 1, "desc": "Baño y accesorio/construccion", "date": "2026-07-01", "month": "Julio", "year": 2026}],
  "2026-08": [{"id": "xxmxhg5", "groupId": "z3f5dn0", "userId": "lucia", "owner": "Personal", "category": "Seguro", "categoryName": "Seguro", "payMethodId": "c2", "payMethodName": "Supervielle MC", "payType": "card", "amount": 80505, "totalAmount": 80505, "cuotas": 1, "cuotaNum": 1, "desc": "Seguro", "date": "2026-08-01", "month": "Agosto", "year": 2026}, {"id": "hepou6f", "groupId": "hgu68qz", "userId": "lucia", "owner": "Mamá", "category": "Ventilador y nido", "categoryName": "Ventilador y nido", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 21456.3, "totalAmount": 21456.3, "cuotas": 1, "cuotaNum": 1, "desc": "Ventilador y nido", "date": "2026-08-01", "month": "Agosto", "year": 2026}, {"id": "k82edhk", "groupId": "b9pieo2", "userId": "lucia", "owner": "Mamá", "category": "Ventilador Delfi", "categoryName": "Ventilador Delfi", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 16796.88, "totalAmount": 16796.88, "cuotas": 1, "cuotaNum": 1, "desc": "Ventilador Delfi", "date": "2026-08-01", "month": "Agosto", "year": 2026}, {"id": "1cq7pvz", "groupId": "ixv425s", "userId": "lucia", "owner": "Mamá", "category": "Remedio", "categoryName": "Remedio", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 9825, "totalAmount": 9825, "cuotas": 1, "cuotaNum": 1, "desc": "Remedio", "date": "2026-08-01", "month": "Agosto", "year": 2026}, {"id": "wj4oy8i", "groupId": "lezp27s", "userId": "lucia", "owner": "Personal", "category": "Farmaonline", "categoryName": "Farmaonline", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 24225.01, "totalAmount": 24225.01, "cuotas": 1, "cuotaNum": 1, "desc": "Farmaonline", "date": "2026-08-01", "month": "Agosto", "year": 2026}, {"id": "2dyp7qn", "groupId": "6stlfho", "userId": "lucia", "owner": "Casa", "category": "Mantel", "categoryName": "Mantel", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 2999.17, "totalAmount": 2999.17, "cuotas": 1, "cuotaNum": 1, "desc": "Mantel", "date": "2026-08-01", "month": "Agosto", "year": 2026}, {"id": "d3p04rg", "groupId": "cit4ha8", "userId": "lucia", "owner": "Personal", "category": "Peluquería", "categoryName": "Peluquería", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 10009.67, "totalAmount": 10009.67, "cuotas": 1, "cuotaNum": 1, "desc": "Peluquería", "date": "2026-08-01", "month": "Agosto", "year": 2026}, {"id": "fxm02fo", "groupId": "huygto5", "userId": "lucia", "owner": "Casa", "category": "Tapón bacha baño Delfi", "categoryName": "Tapón bacha baño Delfi", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 2233.63, "totalAmount": 2233.63, "cuotas": 1, "cuotaNum": 1, "desc": "Tapón bacha baño Delfi", "date": "2026-08-01", "month": "Agosto", "year": 2026}, {"id": "2bwulh0", "groupId": "qah3rg3", "userId": "lucia", "owner": "Personal", "category": "Afeitadora", "categoryName": "Afeitadora", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 4626.31, "totalAmount": 4626.31, "cuotas": 1, "cuotaNum": 1, "desc": "Afeitadora", "date": "2026-08-01", "month": "Agosto", "year": 2026}, {"id": "bb5vmje", "groupId": "wyr4n6o", "userId": "lucia", "owner": "Casa", "category": "Termotanque Novogar", "categoryName": "Termotanque Novogar", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 92413.17, "totalAmount": 92413.17, "cuotas": 1, "cuotaNum": 1, "desc": "Termotanque Novogar", "date": "2026-08-01", "month": "Agosto", "year": 2026}, {"id": "nm0nx0w", "groupId": "4pyu11i", "userId": "lucia", "owner": "Casa", "category": "Ventilador", "categoryName": "Ventilador", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 18276.3, "totalAmount": 18276.3, "cuotas": 1, "cuotaNum": 1, "desc": "Ventilador", "date": "2026-08-01", "month": "Agosto", "year": 2026}, {"id": "blzah31", "groupId": "7d7a75b", "userId": "lucia", "owner": "Personal", "category": "Seguro viaje", "categoryName": "Seguro viaje", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 18922.58, "totalAmount": 18922.58, "cuotas": 1, "cuotaNum": 1, "desc": "Seguro viaje", "date": "2026-08-01", "month": "Agosto", "year": 2026}, {"id": "kcyzdss", "groupId": "q06sb9i", "userId": "lucia", "owner": "Personal", "category": "Farmacia", "categoryName": "Farmacia", "payMethodId": "c4", "payMethodName": "BNA MC", "payType": "card", "amount": 5641.67, "totalAmount": 5641.67, "cuotas": 1, "cuotaNum": 1, "desc": "Farmacia", "date": "2026-08-01", "month": "Agosto", "year": 2026}],
  "2026-09": [{"id": "9zay5jk", "groupId": "g2hoqho", "userId": "lucia", "owner": "Personal", "category": "Seguro", "categoryName": "Seguro", "payMethodId": "c2", "payMethodName": "Supervielle MC", "payType": "card", "amount": 80505, "totalAmount": 80505, "cuotas": 1, "cuotaNum": 1, "desc": "Seguro", "date": "2026-09-01", "month": "Septiembre", "year": 2026}, {"id": "k9mgbqh", "groupId": "j91um8x", "userId": "lucia", "owner": "Mamá", "category": "Ventilador y nido", "categoryName": "Ventilador y nido", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 21456.3, "totalAmount": 21456.3, "cuotas": 1, "cuotaNum": 1, "desc": "Ventilador y nido", "date": "2026-09-01", "month": "Septiembre", "year": 2026}, {"id": "zoj31d7", "groupId": "cohb76a", "userId": "lucia", "owner": "Mamá", "category": "Remedio", "categoryName": "Remedio", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 9825, "totalAmount": 9825, "cuotas": 1, "cuotaNum": 1, "desc": "Remedio", "date": "2026-09-01", "month": "Septiembre", "year": 2026}, {"id": "mvz266p", "groupId": "0rezpup", "userId": "lucia", "owner": "Personal", "category": "Afeitadora", "categoryName": "Afeitadora", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 4626.31, "totalAmount": 4626.31, "cuotas": 1, "cuotaNum": 1, "desc": "Afeitadora", "date": "2026-09-01", "month": "Septiembre", "year": 2026}, {"id": "k84yfsb", "groupId": "a4lse1c", "userId": "lucia", "owner": "Casa", "category": "Ventilador", "categoryName": "Ventilador", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 18276.3, "totalAmount": 18276.3, "cuotas": 1, "cuotaNum": 1, "desc": "Ventilador", "date": "2026-09-01", "month": "Septiembre", "year": 2026}, {"id": "bzcey3l", "groupId": "6ckwxiq", "userId": "lucia", "owner": "Personal", "category": "Seguro viaje", "categoryName": "Seguro viaje", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 18922.58, "totalAmount": 18922.58, "cuotas": 1, "cuotaNum": 1, "desc": "Seguro viaje", "date": "2026-09-01", "month": "Septiembre", "year": 2026}, {"id": "34s18sg", "groupId": "nt003z4", "userId": "lucia", "owner": "Personal", "category": "Farmacia", "categoryName": "Farmacia", "payMethodId": "c4", "payMethodName": "BNA MC", "payType": "card", "amount": 5641.67, "totalAmount": 5641.67, "cuotas": 1, "cuotaNum": 1, "desc": "Farmacia", "date": "2026-09-01", "month": "Septiembre", "year": 2026}],
  "2026-10": [{"id": "09n0me0", "groupId": "ece8w7o", "userId": "lucia", "owner": "Personal", "category": "Seguro", "categoryName": "Seguro", "payMethodId": "c2", "payMethodName": "Supervielle MC", "payType": "card", "amount": 80505, "totalAmount": 80505, "cuotas": 1, "cuotaNum": 1, "desc": "Seguro", "date": "2026-10-01", "month": "Octubre", "year": 2026}, {"id": "f9vol16", "groupId": "kf02kxi", "userId": "lucia", "owner": "Mamá", "category": "Ventilador y nido", "categoryName": "Ventilador y nido", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 21456.3, "totalAmount": 21456.3, "cuotas": 1, "cuotaNum": 1, "desc": "Ventilador y nido", "date": "2026-10-01", "month": "Octubre", "year": 2026}, {"id": "dfgjk4a", "groupId": "przc5bs", "userId": "lucia", "owner": "Mamá", "category": "Remedio", "categoryName": "Remedio", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 9825, "totalAmount": 9825, "cuotas": 1, "cuotaNum": 1, "desc": "Remedio", "date": "2026-10-01", "month": "Octubre", "year": 2026}, {"id": "64k9bhk", "groupId": "l6ii51f", "userId": "lucia", "owner": "Personal", "category": "Afeitadora", "categoryName": "Afeitadora", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 4626.31, "totalAmount": 4626.31, "cuotas": 1, "cuotaNum": 1, "desc": "Afeitadora", "date": "2026-10-01", "month": "Octubre", "year": 2026}, {"id": "yi09v08", "groupId": "uq7qskt", "userId": "lucia", "owner": "Casa", "category": "Ventilador", "categoryName": "Ventilador", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 18276.3, "totalAmount": 18276.3, "cuotas": 1, "cuotaNum": 1, "desc": "Ventilador", "date": "2026-10-01", "month": "Octubre", "year": 2026}, {"id": "7idgbdc", "groupId": "rtoga4w", "userId": "lucia", "owner": "Personal", "category": "Seguro viaje", "categoryName": "Seguro viaje", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 18922.58, "totalAmount": 18922.58, "cuotas": 1, "cuotaNum": 1, "desc": "Seguro viaje", "date": "2026-10-01", "month": "Octubre", "year": 2026}, {"id": "a35zi5w", "groupId": "12rojho", "userId": "lucia", "owner": "Personal", "category": "Farmacia", "categoryName": "Farmacia", "payMethodId": "c4", "payMethodName": "BNA MC", "payType": "card", "amount": 5641.67, "totalAmount": 5641.67, "cuotas": 1, "cuotaNum": 1, "desc": "Farmacia", "date": "2026-10-01", "month": "Octubre", "year": 2026}],
  "2026-11": [{"id": "o154yrh", "groupId": "ktus6bo", "userId": "lucia", "owner": "Personal", "category": "Seguro", "categoryName": "Seguro", "payMethodId": "c2", "payMethodName": "Supervielle MC", "payType": "card", "amount": 80505, "totalAmount": 80505, "cuotas": 1, "cuotaNum": 1, "desc": "Seguro", "date": "2026-11-01", "month": "Noviembre", "year": 2026}, {"id": "k36ul8m", "groupId": "ul5yypv", "userId": "lucia", "owner": "Mamá", "category": "Ventilador y nido", "categoryName": "Ventilador y nido", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 21456.3, "totalAmount": 21456.3, "cuotas": 1, "cuotaNum": 1, "desc": "Ventilador y nido", "date": "2026-11-01", "month": "Noviembre", "year": 2026}, {"id": "9ven7ot", "groupId": "ky611zh", "userId": "lucia", "owner": "Mamá", "category": "Remedio", "categoryName": "Remedio", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 9825, "totalAmount": 9825, "cuotas": 1, "cuotaNum": 1, "desc": "Remedio", "date": "2026-11-01", "month": "Noviembre", "year": 2026}, {"id": "jqxi521", "groupId": "81gju3q", "userId": "lucia", "owner": "Personal", "category": "Afeitadora", "categoryName": "Afeitadora", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 4626.31, "totalAmount": 4626.31, "cuotas": 1, "cuotaNum": 1, "desc": "Afeitadora", "date": "2026-11-01", "month": "Noviembre", "year": 2026}, {"id": "zljell4", "groupId": "rch00gs", "userId": "lucia", "owner": "Casa", "category": "Ventilador", "categoryName": "Ventilador", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 18276.3, "totalAmount": 18276.3, "cuotas": 1, "cuotaNum": 1, "desc": "Ventilador", "date": "2026-11-01", "month": "Noviembre", "year": 2026}, {"id": "spcz185", "groupId": "wdm1hsw", "userId": "lucia", "owner": "Personal", "category": "Seguro viaje", "categoryName": "Seguro viaje", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 18922.58, "totalAmount": 18922.58, "cuotas": 1, "cuotaNum": 1, "desc": "Seguro viaje", "date": "2026-11-01", "month": "Noviembre", "year": 2026}, {"id": "womwm6b", "groupId": "s19b8s6", "userId": "lucia", "owner": "Personal", "category": "Farmacia", "categoryName": "Farmacia", "payMethodId": "c4", "payMethodName": "BNA MC", "payType": "card", "amount": 5641.67, "totalAmount": 5641.67, "cuotas": 1, "cuotaNum": 1, "desc": "Farmacia", "date": "2026-11-01", "month": "Noviembre", "year": 2026}],
  "2026-12": [{"id": "bfj5if5", "groupId": "ds8pxy1", "userId": "lucia", "owner": "Personal", "category": "Seguro", "categoryName": "Seguro", "payMethodId": "c2", "payMethodName": "Supervielle MC", "payType": "card", "amount": 80505, "totalAmount": 80505, "cuotas": 1, "cuotaNum": 1, "desc": "Seguro", "date": "2026-12-01", "month": "Diciembre", "year": 2026}, {"id": "lxp4z1s", "groupId": "sxnqlmt", "userId": "lucia", "owner": "Mamá", "category": "Ventilador y nido", "categoryName": "Ventilador y nido", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 21456.3, "totalAmount": 21456.3, "cuotas": 1, "cuotaNum": 1, "desc": "Ventilador y nido", "date": "2026-12-01", "month": "Diciembre", "year": 2026}, {"id": "6m5k53j", "groupId": "2atdqm9", "userId": "lucia", "owner": "Mamá", "category": "Remedio", "categoryName": "Remedio", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 9825, "totalAmount": 9825, "cuotas": 1, "cuotaNum": 1, "desc": "Remedio", "date": "2026-12-01", "month": "Diciembre", "year": 2026}, {"id": "zdqipfu", "groupId": "jx0c1sf", "userId": "lucia", "owner": "Casa", "category": "Ventilador", "categoryName": "Ventilador", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 18276.3, "totalAmount": 18276.3, "cuotas": 1, "cuotaNum": 1, "desc": "Ventilador", "date": "2026-12-01", "month": "Diciembre", "year": 2026}, {"id": "foyspjf", "groupId": "bofw0sx", "userId": "lucia", "owner": "Personal", "category": "Seguro viaje", "categoryName": "Seguro viaje", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 18922.58, "totalAmount": 18922.58, "cuotas": 1, "cuotaNum": 1, "desc": "Seguro viaje", "date": "2026-12-01", "month": "Diciembre", "year": 2026}],
  "2027-01": [{"id": "1k33jnt", "groupId": "41mlv7t", "userId": "lucia", "owner": "Personal", "category": "Seguro", "categoryName": "Seguro", "payMethodId": "c2", "payMethodName": "Supervielle MC", "payType": "card", "amount": 80505, "totalAmount": 80505, "cuotas": 1, "cuotaNum": 1, "desc": "Seguro", "date": "2027-01-01", "month": "Enero", "year": 2027}, {"id": "01tu45z", "groupId": "aoczmfn", "userId": "lucia", "owner": "Mamá", "category": "Remedio", "categoryName": "Remedio", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 9825, "totalAmount": 9825, "cuotas": 1, "cuotaNum": 1, "desc": "Remedio", "date": "2027-01-01", "month": "Enero", "year": 2027}, {"id": "izbmn79", "groupId": "nshbsqq", "userId": "lucia", "owner": "Personal", "category": "Seguro viaje", "categoryName": "Seguro viaje", "payMethodId": "c3", "payMethodName": "Supervielle Visa", "payType": "card", "amount": 18922.58, "totalAmount": 18922.58, "cuotas": 1, "cuotaNum": 1, "desc": "Seguro viaje", "date": "2027-01-01", "month": "Enero", "year": 2027}],
};

const buildMonth = (y,m,cL,cT) => ({
  key:mk(y,m),
  expenses:[],
  clients_lucia: (cL||[]).filter(c=>c.active).map(c=>({...c,id:uid(),paid:false,amount:c.amount})),
  clients_tomas: (cT||[]).filter(c=>c.active).map(c=>({...c,id:uid(),paid:false,amount:c.amount})),
  fciMovements:[],
});

/* ─── GOOGLE SHEETS SYNC via Apps Script ─── */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzyRQ376LnBS15sGrOpzWHDByB_Ww9RLVnf6BhLjGVXaY7vm_UcseW_1fDm9I0JK6Wh/exec";

async function postToSheets(payload) {
  try {
    // Use text/plain to avoid CORS preflight with Apps Script
    await fetch(APPS_SCRIPT_URL, {
      method:"POST",
      mode:"no-cors",
      headers:{"Content-Type":"text/plain"},
      body: JSON.stringify(payload)
    });
  } catch(e) { console.log("Sheets sync error:", e); }
}

async function syncGasto(exp, userName, MONTHS) {
  postToSheets({
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
  });
}

async function syncIngreso(cliente, userName, mes, año) {
  postToSheets({
    type:"ingreso",
    fecha: new Date().toISOString().slice(0,10),
    mes, año, usuario: userName,
    cliente: cliente.name,
    monto: cliente.amount,
  });
}

async function syncFci(mov, saldoTotal) {
  postToSheets({
    type:"fci",
    fecha: mov.date,
    movTipo: mov.type,
    desc: mov.desc||mov.type,
    monto: mov.amount,
    saldoTotal,
  });
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
  const [undoStack,   setUndoStack]   = useState([]);
  const [redoStack,   setRedoStack]   = useState([]);

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
  // Load historical data once on first load
  useEffect(()=>{
    setMonths(prev=>{
      const updated = {...prev};
      let changed = false;
      // Load historical cash expenses
      Object.entries(HISTORICAL_DATA).forEach(([hKey, hExps])=>{
        if(!updated[hKey]){
          updated[hKey] = buildMonth(
            parseInt(hKey.split('-')[0]),
            parseInt(hKey.split('-')[1])-1,
            clientsL, clientsT
          );
          changed = true;
        }
        const existing = updated[hKey].expenses || [];
        const existingDescs = new Set(existing.map(e=>e.desc+e.amount+e.userId));
        const newExps = hExps.filter(e=>!existingDescs.has(e.desc+e.amount+e.userId));
        if(newExps.length > 0){
          updated[hKey] = {...updated[hKey], expenses:[...existing, ...newExps]};
          changed = true;
        }
      });
      // Load card expenses
      Object.entries(CARD_EXPENSES_DATA).forEach(([hKey, hExps])=>{
        if(!updated[hKey]){
          updated[hKey] = buildMonth(
            parseInt(hKey.split('-')[0]),
            parseInt(hKey.split('-')[1])-1,
            clientsL, clientsT
          );
          changed = true;
        }
        const existing = updated[hKey].expenses || [];
        const existingDescs = new Set(existing.map(e=>e.desc+e.amount+e.payMethodId));
        const newExps = hExps.filter(e=>!existingDescs.has(e.desc+e.amount+e.payMethodId));
        if(newExps.length > 0){
          updated[hKey] = {...updated[hKey], expenses:[...existing, ...newExps]};
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  },[]);

  useEffect(()=>{
    setMonths(prev=>{
      if(prev[key]) return prev;
      return {...prev,[key]:buildMonth(sY,sM,clientsL,clientsT)};
    });
  },[key]);
  const md  = months[key] || buildMonth(sY,sM,clientsL,clientsT);
  const upd = fn => {
    setUndoStack(prev=>[...prev.slice(-19), months]);
    setRedoStack([]);
    setMonths(prev=>({...prev,[key]:fn(prev[key]||buildMonth(sY,sM,clientsL,clientsT))}));
  };
  const undo = () => {
    if(undoStack.length===0) return;
    setRedoStack(prev=>[...prev, months]);
    const snap = undoStack[undoStack.length-1];
    setUndoStack(p=>p.slice(0,-1));
    setMonths(snap);
  };
  const redo = () => {
    if(redoStack.length===0) return;
    setUndoStack(prev=>[...prev, months]);
    const snap = redoStack[redoStack.length-1];
    setRedoStack(p=>p.slice(0,-1));
    setMonths(snap);
  };

  /* ── expense wizard ── */
  const [wizard, setWizard] = useState(null);
  // wizard = { step:1|2|3|4, owner, ownerCustom, category, payMethod, payMethodObj }

  const openWizard = () => setWizard({step:1});
  const closeWizard = () => setWizard(null);

  /* ── computed ── */
  const expenses = md.expenses || [];
  const myExp    = expenses.filter(e=>e.userId===currentUser?.id);
  const allCards = cards.filter(c=>c.owner===currentUser?.id);

  // Card totals split: mine vs Mamá
  const cardTotals = useMemo(()=>{
    const map={};
    myExp.filter(e=>e.payType==="card"&&e.owner!=="Mamá").forEach(e=>{ map[e.payMethodId]=(map[e.payMethodId]||0)+num(e.amount); });
    return map;
  },[myExp]);

  const cardTotalsMama = useMemo(()=>{
    const map={};
    myExp.filter(e=>e.payType==="card"&&e.owner==="Mamá").forEach(e=>{ map[e.payMethodId]=(map[e.payMethodId]||0)+num(e.amount); });
    return map;
  },[myExp]);

  const transferExp = myExp.filter(e=>e.payType!=="card");

  const myClients = currentUser?.id==="lucia"
    ? (md.clients_lucia||[])
    : (md.clients_tomas||[]);
  const setMyClients = (fn) => upd(d=>{
    const field = currentUser?.id==="lucia" ? "clients_lucia" : "clients_tomas";
    return {...d,[field]: typeof fn==='function' ? fn(d[field]||[]) : fn};
  });
  const totalIncome = myClients.reduce((s,c)=>s+num(c.amount),0);
  const totalCards  = Object.values(cardTotals).reduce((s,v)=>s+v,0);
  const totalMama   = Object.values(cardTotalsMama).reduce((s,v)=>s+v,0);
  const totalTransfer = transferExp.reduce((s,e)=>s+num(e.amount),0);
  const totalOut    = totalCards + totalTransfer;
  const resultado   = totalIncome - totalOut;

  /* ── joint view ── */
  const allExp = expenses;
  const casaExp = allExp.filter(e=>e.owner==="Casa");
  const luciaPersonal = allExp.filter(e=>e.userId==="lucia"&&e.owner==="Personal");
  const tomasPersonal = allExp.filter(e=>e.userId==="tomas"&&e.owner==="Personal");
  const otrosExp = allExp.filter(e=>e.owner!=="Casa"&&e.owner!=="Personal");
  const luciaIncome = (md.clients_lucia||clientsL).reduce((s,c)=>s+num(c.amount),0);
  const tomasIncome = (md.clients_tomas||clientsT).reduce((s,c)=>s+num(c.amount),0);
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
      const base=newMonths[mkey]||buildMonth(yr,mo,clientsL,clientsT);
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
    <LoginScreen users={users} onLogin={(u)=>{setCurrentUser(u);}}/>
  );

  const TABS=[
    {id:"resumen",   icon:"◎", label:"Mi resumen"},
    {id:"tarjetas",  icon:"▭", label:"Tarjetas"},
    {id:"dashboard", icon:"▦", label:"Dashboard"},
    {id:"conjunto",  icon:"⊞", label:"En conjunto"},
    {id:"fci",       icon:"◈", label:"Fondo inversión"},
    {id:"config",    icon:"⚙", label:"Configuración"},
  ];

  return (
    <div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif",minHeight:"100vh",background:"#f8f8f6",color:"#18181b"}}>
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
          .layout{display:flex;min-height:100vh}
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
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <button onClick={undo} disabled={undoStack.length===0} title="Deshacer"
            style={{background:"none",border:"1px solid #e4e4e7",borderRadius:8,padding:"5px 9px",cursor:undoStack.length===0?"not-allowed":"pointer",color:undoStack.length===0?"#d4d4d8":"#18181b",fontSize:14}}>↩</button>
          <button onClick={redo} disabled={redoStack.length===0} title="Rehacer"
            style={{background:"none",border:"1px solid #e4e4e7",borderRadius:8,padding:"5px 9px",cursor:redoStack.length===0?"not-allowed":"pointer",color:redoStack.length===0?"#d4d4d8":"#18181b",fontSize:14}}>↪</button>
          <div style={{width:28,height:28,borderRadius:"50%",background:currentUser.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:"#fff"}}>{currentUser.initials}</div>
          <button className="btn btn-ghost" style={{padding:"5px 10px",fontSize:12}} onClick={()=>{setCurrentUser(null);}}>Salir</button>
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
            <div style={{display:"flex",gap:8,marginBottom:8}}>
            <button onClick={undo} disabled={undoStack.length===0} title="Deshacer"
              style={{flex:1,background:"none",border:"1px solid #e4e4e7",borderRadius:8,padding:"7px",cursor:undoStack.length===0?"not-allowed":"pointer",color:undoStack.length===0?"#d4d4d8":"#18181b",fontSize:13}}>↩ Deshacer</button>
            <button onClick={redo} disabled={redoStack.length===0} title="Rehacer"
              style={{flex:1,background:"none",border:"1px solid #e4e4e7",borderRadius:8,padding:"7px",cursor:redoStack.length===0?"not-allowed":"pointer",color:redoStack.length===0?"#d4d4d8":"#18181b",fontSize:13}}>↪ Rehacer</button>
          </div>
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
              cardTotals={cardTotals} cardTotalsMama={cardTotalsMama}
              transferExp={transferExp}
              totalIncome={totalIncome} totalCards={totalCards} totalMama={totalMama}
              totalTransfer={totalTransfer} totalOut={totalOut} resultado={resultado}
              fciTotal={fciTotal} setFciTotal={setFciTotal}
              efectivo={efectivo} setEfectivo={setEfectivo}
              recurring={currentUser.id==="lucia"?recurringL:recurringT}
              setRecurring={currentUser.id==="lucia"?setRecurringL:setRecurringT}
              upd={upd} md={md} fmt={fmt} num={num} uid={uid}
              openWizard={openWizard} months={months} mk={mk} CY={CY}
              clientsL={clientsL} clientsT={clientsT}
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

          {/* ══ HISTORIAL ══ */}
          {tab==="historial" && (
            <HistorialTab
              currentUser={currentUser} MONTHS={MONTHS} CY={CY}
              categories={categories} cards={cards} payMethods={payMethods}
              fmt={fmt} num={num} uid={uid}
              syncGasto={syncGasto} syncIngreso={syncIngreso}
              months={months} setMonths={setMonths} mk={mk}
              clientsL={clientsL} clientsT={clientsT}
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
              setMonths={setMonths} months={months}
              setRecurringL={setRecurringL} setRecurringT={setRecurringT}
              recurringL={recurringL} recurringT={recurringT}
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
function LoginScreen({users,onLogin}){
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f8f8f6",fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
      <div style={{width:"100%",maxWidth:360,padding:"0 24px"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:28,fontWeight:600}}>Mis finanzas</div>
          <div style={{fontSize:14,color:"#71717a",marginTop:6}}>¿Quién sos?</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {users.map(u=>(
            <button key={u.id} onClick={()=>onLogin(u)} style={{background:"#fff",border:"1px solid #e4e4e7",borderRadius:16,padding:"18px 22px",display:"flex",alignItems:"center",gap:16,cursor:"pointer",fontFamily:"inherit",transition:"all .15s",textAlign:"left"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=u.color;e.currentTarget.style.background=u.color+"10";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#e4e4e7";e.currentTarget.style.background="#fff";}}>
              <div style={{width:48,height:48,borderRadius:"50%",background:u.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:600,color:"#fff",flexShrink:0}}>{u.initials}</div>
              <span style={{fontSize:17,fontWeight:500,color:"#18181b"}}>{u.name}</span>
            </button>
          ))}
        </div>
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
    <div className="wizard-overlay">
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
function ResumenTab({currentUser,MONTHS,sM,sY,myClients,setMyClients,myExp,cards,cardTotals,cardTotalsMama,transferExp,totalIncome,totalCards,totalMama,totalTransfer,totalOut,resultado,fciTotal,setFciTotal,efectivo,setEfectivo,recurring,setRecurring,upd,md,fmt,num,uid,openWizard,months,mk,CY,clientsL,clientsT}){
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
  const nextMonthClients = currentUser.id==="lucia"
    ? (months[nextKey]?.clients_lucia || clientsL)
    : (months[nextKey]?.clients_tomas || clientsT);
  const nextIncome=nextMonthClients.filter(c=>c.active!==false).reduce((s,c)=>s+num(c.amount),0);
  const nextResult=nextIncome-nextTotalOut;

  const totalRecurring=recurring.filter(r=>r.active).reduce((s,r)=>s+num(r.amount),0);
  const totalWithEfectivo=totalIncome+num(efectivo)+fciTotal;
  const pendCards=cards.filter(c=>c.owner===currentUser.id).reduce((s,c)=>s+num(md.cardPayments?.[c.id]??cardTotals[c.id]??0),0);
  const pendFixed=recurring.filter(r=>r.active).reduce((s,r)=>s+num(md.fixedPayments?.[r.id]??r.amount),0);
  const resultadoFull=totalWithEfectivo-pendCards-totalTransfer-pendFixed;

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
            {cards.filter(c=>c.owner===currentUser.id&&(cardTotals[c.id]||0)>0).map(c=>{
              const pend=md.cardPayments?.[c.id]!==undefined?md.cardPayments[c.id]:cardTotals[c.id];
              const pagado=num(pend)===0;
              return (
                <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,marginBottom:4}}>
                  <span style={{color:pagado?"#a1a1aa":"#dc2626",display:"flex",alignItems:"center",gap:4,textDecoration:pagado?"line-through":"none"}}>
                    <span style={{width:6,height:6,borderRadius:2,background:c.color,display:"inline-block"}}/>
                    {c.name}
                  </span>
                  <input className="mono" type="number" value={pend}
                    onChange={e=>upd(d=>({...d,cardPayments:{...(d.cardPayments||{}),[c.id]:+e.target.value}}))}
                    style={{width:90,textAlign:"right",fontSize:12,border:"none",background:"transparent",color:pagado?"#a1a1aa":"#dc2626",fontFamily:"'DM Mono',monospace",textDecoration:pagado?"line-through":"none"}}/>
                </div>
              );
            })}
            {totalTransfer>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{color:"#dc2626"}}>Transf/Efect</span><span className="mono" style={{color:"#dc2626"}}>−{fmt(totalTransfer)}</span></div>}
            {totalRecurring>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{color:"#dc2626"}}>Gastos fijos</span><span className="mono" style={{color:"#dc2626"}}>−{fmt(totalRecurring)}</span></div>}
            <div style={{borderTop:"1px solid #fecaca",marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between",fontWeight:600,fontSize:13}}>
              <span style={{color:"#dc2626"}}>Total gastos</span>
              <span className="mono" style={{color:"#dc2626"}}>−{fmt(
                cards.filter(c=>c.owner===currentUser.id).reduce((s,c)=>s+num(md.cardPayments?.[c.id]??cardTotals[c.id]??0),0)
                +totalTransfer+totalRecurring
              )}</span>
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
          <span className="mono" style={{fontSize:12,color:"#dc2626"}}>
            {fmt(recurring.filter(r=>r.active).reduce((s,r)=>s+num(md.fixedPayments?.[r.id]??r.amount),0))}
          </span>
        </div>
        <p style={{fontSize:11,color:"#a1a1aa",marginBottom:10}}>Se replican automáticamente cada mes. Editá el monto cuando cambie o poné 0 cuando pagás.</p>
        {recurring.map(r=>(
          <div key={r.id} className="row">
            <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
              <input type="checkbox" className="check" checked={r.active}
                onChange={()=>setRecurring(p=>p.map(x=>x.id===r.id?{...x,active:!x.active}:x))}/>
              <input className="inp" value={r.name}
                onChange={e=>setRecurring(p=>p.map(x=>x.id===r.id?{...x,name:e.target.value}:x))}
                style={{border:"none",background:"transparent",fontWeight:500,fontSize:13,padding:"2px 0",color:r.active?"#18181b":"#a1a1aa"}}/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <input className="inp mono" type="number"
                value={md.fixedPayments?.[r.id]??r.amount}
                onChange={e=>{
                  setRecurring(p=>p.map(x=>x.id===r.id?{...x,amount:+e.target.value}:x));
                  upd(d=>({...d,fixedPayments:{...(d.fixedPayments||{}),[r.id]:+e.target.value}}));
                }}
                onBlur={e=>{
                  syncGasto({date:new Date().toISOString().slice(0,10),month:MONTHS[sM],year:sY,
                    owner:r.owner||"Personal",categoryName:r.name,desc:r.name,
                    payMethodName:"Recurrente",amount:+e.target.value,cuotas:1,cuotaNum:1},
                    currentUser.name,MONTHS);
                }}
                style={{width:105,textAlign:"right",fontSize:13,color:r.active?"#18181b":"#a1a1aa"}}/>
              <button className="btn btn-red" style={{padding:"5px 7px",fontSize:11}}
                onClick={()=>setRecurring(p=>p.filter(x=>x.id!==r.id))}>✕</button>
            </div>
          </div>
        ))}
        <button className="btn btn-ghost" style={{marginTop:10,fontSize:12,width:"100%"}}
          onClick={()=>setRecurring(p=>[...p,{id:uid(),name:"Nuevo fijo",amount:0,active:true,userId:currentUser.id}])}>
          + Agregar fijo
        </button>
      </div>

      {/* PAGOS CARGADOS con +gasto */}
      {transferExp.length>0&&(
        <div className="card" style={{padding:18,marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
            <span className="sec">Pagos cargados (transf/efect)</span>
            <span className="mono" style={{fontSize:12,color:"#dc2626"}}>{fmt(transferExp.reduce((s,e)=>s+num(md.transferPayments?.[e.id]??e.amount),0))}</span>
          </div>
          {transferExp.map(e=>{
            const pendiente=md.transferPayments?.[e.id]!==undefined?md.transferPayments[e.id]:e.amount;
            const pagado=num(pendiente)===0;
            return (
              <div key={e.id} className="row">
                <div style={{display:"flex",alignItems:"center",gap:9,flex:1}}>
                  <input type="checkbox" className="check" checked={pagado}
                    onChange={()=>upd(d=>({...d,transferPayments:{...(d.transferPayments||{}),[e.id]:pagado?e.amount:0}}))}/>
                  <div>
                    <div style={{fontSize:13,fontWeight:500,color:pagado?"#a1a1aa":"#18181b",textDecoration:pagado?"line-through":"none"}}>{e.desc||e.categoryName}</div>
                    <div style={{fontSize:11,color:"#a1a1aa"}}>{e.payMethodName} · {e.categoryName}</div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                  <input className="inp mono" type="number" value={pendiente}
                    onChange={ev=>upd(d=>({...d,transferPayments:{...(d.transferPayments||{}),[e.id]:+ev.target.value}}))}
                    style={{width:110,textAlign:"right",fontSize:13,color:pagado?"#a1a1aa":"#dc2626"}}/>
                  <button className="btn btn-red" style={{padding:"4px 7px",fontSize:11}}
                    onClick={()=>upd(d=>({...d,expenses:d.expenses.filter(x=>x.id!==e.id)}))}>✕</button>
                </div>
              </div>
            );
          })}
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
function ConfigTab({users,setUsers,cards,setCards,payMethods,setPayMethods,categories,setCategories,clientsL,setClientsL,clientsT,setClientsT,sheetsConfig,setSheetsConfig,currentUser,uid,setMonths,months,setRecurringL,setRecurringT,recurringL,recurringT}){
  const [newCard,    setNewCard]   =useState({name:"",color:"#6366f1",owner:currentUser.id});
  const [newPay,     setNewPay]    =useState({name:"",icon:"💳"});
  const [newCat,     setNewCat]    =useState({name:"",icon:"📦"});
  const [newClientT, setNewClientT]=useState({name:"",amount:""});
  const [newFixedT,  setNewFixedT] =useState({name:"",amount:"",owner:"Personal"});
  const [showNC,setShowNC]=useState(false);
  const [showNP,setShowNP]=useState(false);
  const [showNCA,setShowNCA]=useState(false);
  const [showNCT,setShowNCT]=useState(false);
  const [showNFT,setShowNFT]=useState(false);
  const [sheetsHelp,setSheetsHelp]=useState(false);

  const myClientTpls = currentUser.id==="lucia" ? clientsL : clientsT;
  const setMyClientTpls = currentUser.id==="lucia" ? setClientsL : setClientsT;

  const addClientTemplate = () => {
    if(!newClientT.name) return;
    const newC={id:uid(),name:newClientT.name,amount:parseFloat(newClientT.amount)||0,active:true,paid:false};
    setMyClientTpls(p=>[...p,newC]);
    // Propagate to current and future months
    const field = currentUser.id==="lucia" ? "clients_lucia" : "clients_tomas";
    const now = new Date();
    setMonths(prev=>{
      const upd={...prev};
      Object.keys(upd).forEach(k=>{
        const [y,m]=k.split("-").map(Number);
        if(new Date(y,m-1,1)>=new Date(now.getFullYear(),now.getMonth(),1)){
          upd[k]={...upd[k],[field]:[...(upd[k][field]||[]),{...newC,id:uid()}]};
        }
      });
      return upd;
    });
    setNewClientT({name:"",amount:""});setShowNCT(false);
  };

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

        {/* CLIENTES TEMPLATE */}
        <div className="card" style={{padding:18}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span className="sec">Clientes / ingresos recurrentes</span>
            <button className="btn btn-dark" style={{fontSize:12,padding:"6px 11px"}} onClick={()=>setShowNCT(f=>!f)}>+ Nuevo</button>
          </div>
          <p style={{fontSize:11,color:"#a1a1aa",marginBottom:10}}>Se pre-cargan en cada mes nuevo. Al agregar uno nuevo se suma a los meses actuales y futuros.</p>
          {myClientTpls.map(c=>(
            <div key={c.id} className="row">
              <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
                <input type="checkbox" className="check" checked={c.active!==false}
                  onChange={()=>setMyClientTpls(p=>p.map(x=>x.id===c.id?{...x,active:!x.active}:x))}/>
                <input className="inp" value={c.name}
                  onChange={e=>setMyClientTpls(p=>p.map(x=>x.id===c.id?{...x,name:e.target.value}:x))}
                  style={{border:"none",background:"transparent",fontWeight:500,fontSize:13,padding:"2px 0"}}/>
              </div>
              <div style={{display:"flex",gap:6}}>
                <input className="inp mono" type="number" value={c.amount}
                  onChange={e=>setMyClientTpls(p=>p.map(x=>x.id===c.id?{...x,amount:+e.target.value}:x))}
                  style={{width:105,textAlign:"right",fontSize:13}}/>
                <button className="btn btn-red" style={{padding:"4px 7px",fontSize:11}}
                  onClick={()=>setMyClientTpls(p=>p.filter(x=>x.id!==c.id))}>✕</button>
              </div>
            </div>
          ))}
          {showNCT&&(
            <div style={{marginTop:10,display:"flex",gap:7}}>
              <input className="inp" placeholder="Nombre cliente" value={newClientT.name}
                onChange={e=>setNewClientT(p=>({...p,name:e.target.value}))}/>
              <input className="inp mono" type="number" placeholder="Monto" value={newClientT.amount}
                onChange={e=>setNewClientT(p=>({...p,amount:e.target.value}))} style={{width:100}}/>
              <button className="btn btn-dark" style={{padding:"8px 12px"}} onClick={addClientTemplate}>+</button>
            </div>
          )}
        </div>

        {/* GASTOS FIJOS TEMPLATE */}
        <div className="card" style={{padding:18}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span className="sec">Gastos fijos recurrentes</span>
            <button className="btn btn-dark" style={{fontSize:12,padding:"6px 11px"}} onClick={()=>setShowNFT(f=>!f)}>+ Nuevo</button>
          </div>
          <p style={{fontSize:11,color:"#a1a1aa",marginBottom:10}}>Obra social, monotributo, gym, etc. Se pre-cargan cada mes y podés editar el monto desde Mi resumen.</p>
          {(currentUser.id==="lucia" ? recurringL : recurringT).map(r=>(
            <div key={r.id} className="row">
              <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
                <input type="checkbox" className="check" checked={r.active!==false}
                  onChange={()=>{
                    if(currentUser.id==="lucia") setRecurringL(p=>p.map(x=>x.id===r.id?{...x,active:!x.active}:x));
                    else setRecurringT(p=>p.map(x=>x.id===r.id?{...x,active:!x.active}:x));
                  }}/>
                <div style={{flex:1,minWidth:0}}>
                  <input className="inp" value={r.name}
                    onChange={e=>{
                      if(currentUser.id==="lucia") setRecurringL(p=>p.map(x=>x.id===r.id?{...x,name:e.target.value}:x));
                      else setRecurringT(p=>p.map(x=>x.id===r.id?{...x,name:e.target.value}:x));
                    }}
                    style={{border:"none",background:"transparent",fontWeight:500,fontSize:13,padding:"2px 0",width:"100%"}}/>
                  <select className="inp" value={r.owner||"Personal"}
                    onChange={e=>{
                      if(currentUser.id==="lucia") setRecurringL(p=>p.map(x=>x.id===r.id?{...x,owner:e.target.value}:x));
                      else setRecurringT(p=>p.map(x=>x.id===r.id?{...x,owner:e.target.value}:x));
                    }}
                    style={{fontSize:11,padding:"3px 7px",marginTop:2,width:"auto"}}>
                    <option>Personal</option>
                    <option>Casa</option>
                    <option>Otro</option>
                  </select>
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <input className="inp mono" type="number" value={r.amount}
                  onChange={e=>{
                    if(currentUser.id==="lucia") setRecurringL(p=>p.map(x=>x.id===r.id?{...x,amount:+e.target.value}:x));
                    else setRecurringT(p=>p.map(x=>x.id===r.id?{...x,amount:+e.target.value}:x));
                  }}
                  style={{width:105,textAlign:"right",fontSize:13}}/>
                <button className="btn btn-red" style={{padding:"4px 7px",fontSize:11}}
                  onClick={()=>{
                    if(currentUser.id==="lucia") setRecurringL(p=>p.filter(x=>x.id!==r.id));
                    else setRecurringT(p=>p.filter(x=>x.id!==r.id));
                  }}>✕</button>
              </div>
            </div>
          ))}
          {showNFT&&(
            <div style={{marginTop:10,display:"flex",gap:7,flexWrap:"wrap"}}>
              <input className="inp" placeholder="Nombre (ej: Obra Social)" value={newFixedT.name}
                onChange={e=>setNewFixedT(p=>({...p,name:e.target.value}))} style={{flex:2,minWidth:130}}/>
              <select className="inp" value={newFixedT.owner||"Personal"}
                onChange={e=>setNewFixedT(p=>({...p,owner:e.target.value}))} style={{flex:1,minWidth:90}}>
                <option>Personal</option>
                <option>Casa</option>
                <option>Otro</option>
              </select>
              <input className="inp mono" type="number" placeholder="Monto" value={newFixedT.amount}
                onChange={e=>setNewFixedT(p=>({...p,amount:e.target.value}))} style={{width:100}}/>
              <button className="btn btn-dark" style={{padding:"8px 12px"}} onClick={()=>{
                if(!newFixedT.name) return;
                const newR={id:uid(),name:newFixedT.name,amount:parseFloat(newFixedT.amount)||0,active:true,userId:currentUser.id,owner:newFixedT.owner||"Personal"};
                if(currentUser.id==="lucia") setRecurringL(p=>[...p,newR]);
                else setRecurringT(p=>[...p,newR]);
                setNewFixedT({name:"",amount:"",owner:"Personal"});setShowNFT(false);
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

  // Build ALL months with data (not just last 12)
  const today=new Date();
  const curM=today.getMonth(); const curY=today.getFullYear();

  // Get all month keys sorted
  const allMonthKeys = Object.keys(months).sort();
  const monthRows = allMonthKeys.map(key=>{
    const [yr,mo_1]=key.split("-").map(Number);
    const mo=mo_1-1;
    const d=months[key];
    const exps=d?.expenses||[];
    const luciaExp=exps.filter(e=>e.userId==="lucia").reduce((s,e)=>s+num(e.amount),0);
    const tomasExp=exps.filter(e=>e.userId==="tomas").reduce((s,e)=>s+num(e.amount),0);
    if(luciaExp===0&&tomasExp===0) return null;
    const byCat={};
    exps.forEach(e=>{ byCat[e.categoryName]=(byCat[e.categoryName]||0)+num(e.amount); });
    return { label:`${MONTHS[mo].slice(0,3)} ${yr}`, mo, yr, luciaExp, tomasExp, total:luciaExp+tomasExp, byCat };
  }).filter(Boolean);

  // Acumulados solo gastos
  const totalLuciaExp=monthRows.reduce((s,r)=>s+r.luciaExp,0);
  const totalTomasExp=monthRows.reduce((s,r)=>s+r.tomasExp,0);

  const COLORS=["#18181b","#6366f1","#0ea5e9","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899"];

  return (
    <div>
      <h1 style={{fontSize:20,fontWeight:600,marginBottom:6}}>Dashboard de gastos</h1>
      <p style={{fontSize:13,color:"#71717a",marginBottom:20}}>Historial completo — todos los meses cargados</p>

      {/* Totales acumulados solo gastos */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
        {[
          {l:`Gastos ${lu?.name}`,  v:totalLuciaExp, c:"#6366f1"},
          {l:`Gastos ${to?.name}`,  v:totalTomasExp, c:"#ec4899"},
          {l:"Total conjunto",      v:totalLuciaExp+totalTomasExp, c:"#dc2626"},
        ].map(s=>(
          <div key={s.l} className="card" style={{padding:14,borderLeft:`3px solid ${s.c}`}}>
            <div style={{fontSize:11,color:"#71717a",marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em"}}>{s.l}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:500,color:s.c}}>{fmt(s.v)}</div>
          </div>
        ))}
      </div>

      {/* Gráfica solo gastos */}
      <div className="card" style={{padding:20,marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:600,marginBottom:14}}>Gastos por mes — {lu?.name} y {to?.name}</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthRows} margin={{left:0}}>
            <XAxis dataKey="label" tick={{fontSize:10}} interval={0} angle={-35} textAnchor="end" height={45}/>
            <YAxis tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} tick={{fontSize:10}}/>
            <Tooltip formatter={v=>fmt(v)}/>
            <Bar dataKey="luciaExp" name={`${lu?.name}`} fill="#6366f1" stackId="a"/>
            <Bar dataKey="tomasExp" name={`${to?.name}`} fill="#ec4899" stackId="a"/>
          </BarChart>
        </ResponsiveContainer>
        <div style={{display:"flex",gap:14,flexWrap:"wrap",marginTop:8}}>
          {[{l:lu?.name,c:"#6366f1"},{l:to?.name,c:"#ec4899"}].map(s=>(
            <div key={s.l} style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}>
              <div style={{width:10,height:10,borderRadius:3,background:s.c}}/>{s.l}
            </div>
          ))}
        </div>
      </div>

      {/* Tabla por mes — solo gastos */}
      <div className="card" style={{padding:0,overflow:"hidden",marginBottom:16}}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid #f4f4f5",fontWeight:600,fontSize:14}}>Tabla mensual detallada</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:"#fafafa"}}>
                <th style={{padding:"10px 14px",textAlign:"left",fontWeight:600,color:"#52525b",borderBottom:"1px solid #e4e4e7",whiteSpace:"nowrap"}}>Mes</th>
                <th style={{padding:"10px 14px",textAlign:"right",fontWeight:600,color:"#6366f1",borderBottom:"1px solid #e4e4e7",whiteSpace:"nowrap"}}>{lu?.name}</th>
                <th style={{padding:"10px 14px",textAlign:"right",fontWeight:600,color:"#ec4899",borderBottom:"1px solid #e4e4e7",whiteSpace:"nowrap"}}>{to?.name}</th>
                <th style={{padding:"10px 14px",textAlign:"right",fontWeight:600,color:"#dc2626",borderBottom:"1px solid #e4e4e7",whiteSpace:"nowrap"}}>Total</th>
              </tr>
            </thead>
            <tbody>
              {monthRows.map((r,i)=>(
                <tr key={r.label} style={{borderBottom:"1px solid #f4f4f5",background:i%2===0?"#fff":"#fafafa"}}>
                  <td style={{padding:"9px 14px",fontWeight:500,whiteSpace:"nowrap"}}>{r.label}</td>
                  <td style={{padding:"9px 14px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:"#6366f1"}}>{r.luciaExp>0?fmt(r.luciaExp):"—"}</td>
                  <td style={{padding:"9px 14px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:"#ec4899"}}>{r.tomasExp>0?fmt(r.tomasExp):"—"}</td>
                  <td style={{padding:"9px 14px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:"#dc2626",fontWeight:600}}>{r.total>0?fmt(r.total):"—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{background:"#f4f4f5",fontWeight:700}}>
                <td style={{padding:"10px 14px"}}>TOTAL</td>
                <td style={{padding:"10px 14px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:"#6366f1"}}>{fmt(totalLuciaExp)}</td>
                <td style={{padding:"10px 14px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:"#ec4899"}}>{fmt(totalTomasExp)}</td>
                <td style={{padding:"10px 14px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:"#dc2626"}}>{fmt(totalLuciaExp+totalTomasExp)}</td>
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


/* ══════════════════════════════════════════════
   HISTORIAL TAB — carga de datos históricos
══════════════════════════════════════════════ */
function HistorialTab({currentUser,MONTHS,CY,categories,cards,payMethods,fmt,num,uid,syncGasto,syncIngreso,months,setMonths,mk,clientsL,clientsT}){
  const today = new Date();
  const [form, setForm] = useState({
    year: String(CY),
    month: String(today.getMonth()),
    type: "gasto",
    owner: "Personal",
    category: "",
    categoryCustom: "",
    payMethodId: "",
    desc: "",
    amount: "",
    usuario: currentUser.id,
  });
  const [saved, setSaved] = useState([]);
  const [showOk, setShowOk] = useState(false);

  const allPay = [...cards.filter(c=>c.owner===currentUser.id), ...payMethods];
  const allCats = [...categories.map(c=>c.name), "Ingreso cliente", "Otro"];

  const save = () => {
    if(!form.amount) return;
    const mo = parseInt(form.month);
    const yr = parseInt(form.year);
    const mkey = mk(yr, mo);
    const payObj = allPay.find(p=>p.id===form.payMethodId);
    const isCard = cards.some(c=>c.id===form.payMethodId);
    const catName = form.category==="Otro" ? form.categoryCustom : form.category;

    if(form.type==="gasto"){
      const exp = {
        id:uid(), groupId:uid(), userId:form.usuario,
        owner:form.owner, category:form.category, categoryName:catName,
        payMethodId:form.payMethodId||"", payMethodName:payObj?.name||"Efectivo",
        payType: isCard?"card":"transfer",
        amount:num(form.amount), totalAmount:num(form.amount),
        cuotas:1, cuotaNum:1, desc:form.desc||catName,
        date:`${yr}-${String(mo+1).padStart(2,"0")}-01`,
        month:MONTHS[mo], year:yr,
      };
      setMonths(prev=>{
        const base = prev[mkey] || {key:mkey,expenses:[],clients_lucia:[],clients_tomas:[],fciMovements:[]};
        return {...prev, [mkey]:{...base, expenses:[...(base.expenses||[]),exp]}};
      });
      syncGasto(exp, currentUser.name, MONTHS);
    } else {
      // ingreso
      const cliente = {id:uid(), name:form.desc||"Ingreso histórico", amount:num(form.amount), active:true, paid:true};
      const field = form.usuario==="lucia" ? "clients_lucia" : "clients_tomas";
      setMonths(prev=>{
        const base = prev[mkey] || {key:mkey,expenses:[],clients_lucia:[],clients_tomas:[],fciMovements:[]};
        return {...prev, [mkey]:{...base, [field]:[...(base[field]||[]),cliente]}};
      });
      syncIngreso(cliente, form.usuario==="lucia"?"Lucía":"Tomás", MONTHS[mo], yr);
    }

    setSaved(p=>[...p,{...form,catName,payName:payObj?.name||"Efectivo",mes:MONTHS[mo],yr}]);
    setShowOk(true);
    setTimeout(()=>setShowOk(false),2000);
    setForm(p=>({...p,amount:"",desc:""}));
  };

  return (
    <div>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:20,fontWeight:600}}>Carga de historial</h1>
        <p style={{fontSize:13,color:"#71717a"}}>Cargá datos de meses anteriores sin borrar lo que ya tenés</p>
      </div>

      <div className="card" style={{padding:22,marginBottom:16}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div>
            <div className="sec" style={{marginBottom:6}}>Mes</div>
            <select className="inp" value={form.month} onChange={e=>setForm(p=>({...p,month:e.target.value}))}>
              {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
            </select>
          </div>
          <div>
            <div className="sec" style={{marginBottom:6}}>Año</div>
            <select className="inp" value={form.year} onChange={e=>setForm(p=>({...p,year:e.target.value}))}>
              {[CY-3,CY-2,CY-1,CY].map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <div className="sec" style={{marginBottom:6}}>Tipo</div>
            <select className="inp" value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
              <option value="gasto">Gasto</option>
              <option value="ingreso">Ingreso</option>
            </select>
          </div>
          <div>
            <div className="sec" style={{marginBottom:6}}>Usuario</div>
            <select className="inp" value={form.usuario} onChange={e=>setForm(p=>({...p,usuario:e.target.value}))}>
              <option value="lucia">Lucía</option>
              <option value="tomas">Tomás</option>
            </select>
          </div>
        </div>

        {form.type==="gasto" && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <div>
              <div className="sec" style={{marginBottom:6}}>Para quién</div>
              <select className="inp" value={form.owner} onChange={e=>setForm(p=>({...p,owner:e.target.value}))}>
                <option>Personal</option>
                <option>Casa</option>
                <option>Otro</option>
              </select>
            </div>
            <div>
              <div className="sec" style={{marginBottom:6}}>Categoría</div>
              <select className="inp" value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
                <option value="">— Elegir —</option>
                {categories.map(c=><option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                <option value="Otro">Otro</option>
              </select>
            </div>
            {form.category==="Otro" && (
              <div style={{gridColumn:"1/-1"}}>
                <div className="sec" style={{marginBottom:6}}>Nombre categoría</div>
                <input className="inp" placeholder="Ej: Vacaciones" value={form.categoryCustom}
                  onChange={e=>setForm(p=>({...p,categoryCustom:e.target.value}))}/>
              </div>
            )}
            <div>
              <div className="sec" style={{marginBottom:6}}>Medio de pago</div>
              <select className="inp" value={form.payMethodId} onChange={e=>setForm(p=>({...p,payMethodId:e.target.value}))}>
                <option value="">Efectivo</option>
                {cards.filter(c=>c.owner===form.usuario).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                {payMethods.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <div className="sec" style={{marginBottom:6}}>Descripción (opcional)</div>
              <input className="inp" placeholder="Ej: Supermercado DIA" value={form.desc}
                onChange={e=>setForm(p=>({...p,desc:e.target.value}))}/>
            </div>
          </div>
        )}

        {form.type==="ingreso" && (
          <div style={{marginBottom:12}}>
            <div className="sec" style={{marginBottom:6}}>Cliente / descripción</div>
            <input className="inp" placeholder="Ej: Cachipum" value={form.desc}
              onChange={e=>setForm(p=>({...p,desc:e.target.value}))}/>
          </div>
        )}

        <div style={{marginBottom:16}}>
          <div className="sec" style={{marginBottom:6}}>Monto</div>
          <input className="inp mono" type="number" placeholder="$ 0" value={form.amount}
            onChange={e=>setForm(p=>({...p,amount:e.target.value}))}
            style={{fontSize:18,fontWeight:500}}/>
        </div>

        <button className="btn btn-dark" style={{width:"100%"}} onClick={save}
          disabled={!form.amount}>
          {showOk ? "✓ Guardado" : "Guardar en historial"}
        </button>
      </div>

      {/* Lo que se fue cargando en esta sesión */}
      {saved.length>0 && (
        <div className="card" style={{padding:18}}>
          <div className="sec" style={{marginBottom:12}}>Cargado en esta sesión</div>
          {saved.slice().reverse().map((s,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"6px 0",borderBottom:"1px solid #f4f4f5"}}>
              <div>
                <span style={{fontWeight:500}}>{s.desc||s.catName||s.category}</span>
                <span style={{fontSize:11,color:"#a1a1aa",marginLeft:8}}>{s.mes} {s.yr} · {s.owner} · {s.payName}</span>
              </div>
              <span className="mono" style={{color:s.type==="ingreso"?"#15803d":"#dc2626"}}>
                {s.type==="ingreso"?"+":"-"}{fmt(num(s.amount))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
