import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:8000/api";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const LEAVE_TYPES = ["casual","sick","earned","maternity","unpaid"];
const ATT_STATUSES = ["present","absent","half_day","holiday","weekly_off"];

const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f0f4ff; color: #1e293b; }
  input, select, textarea, button { font-family: inherit; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #f1f5f9; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
  .sb-btn { transition: all 0.15s; }
  .sb-btn:hover { background: #eff6ff !important; color: #2563eb !important; }
  .drawer-overlay { position:fixed;inset:0;background:rgba(15,23,42,0.15);z-index:200;backdrop-filter:blur(2px);animation:fadeIn 0.2s; }
  .drawer { position:fixed;top:0;right:0;height:100vh;width:520px;max-width:96vw;background:#fff;z-index:201;box-shadow:-8px 0 40px rgba(37,99,235,0.13);display:flex;flex-direction:column;animation:slideIn 0.25s cubic-bezier(.4,0,.2,1); }
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
  .inp{width:100%;padding:9px 12px;font-size:13px;border:1.5px solid #e2e8f0;border-radius:9px;background:#fff;color:#1e293b;outline:none;transition:border-color .15s;}
  .inp:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,0.1);}
  select.inp{cursor:pointer;}
  textarea.inp{resize:vertical;}
  .btn-p{background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;border:none;padding:9px 20px;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;transition:opacity .15s,transform .1s;box-shadow:0 2px 8px rgba(37,99,235,0.25);}
  .btn-p:hover{opacity:0.92;transform:translateY(-1px);}
  .btn-g{background:#f8fafc;color:#64748b;border:1px solid #e2e8f0;padding:9px 18px;border-radius:9px;font-size:13px;font-weight:500;cursor:pointer;transition:background .15s;}
  .btn-g:hover{background:#f1f5f9;}
  .btn-e{background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;padding:7px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;transition:background .15s;}
  .btn-e:hover{background:#dbeafe;}
  .btn-d{background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;padding:7px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;}
  .row-card{background:#fff;border-radius:14px;border:1px solid #e8edf5;transition:box-shadow .15s;}
  .row-card:hover{box-shadow:0 4px 20px rgba(37,99,235,0.09);}
  .tab-pill{transition:all .15s;cursor:pointer;}
  .tab-pill:hover{background:#f1f5f9;}
  .stat-mini{background:#f8faff;border:1px solid #e0e7ff;border-radius:10px;padding:10px 14px;}
`;

function injectStyles() {
  if (document.getElementById("hrm-css")) return;
  const s = document.createElement("style");
  s.id = "hrm-css"; s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
}

const SC = {
  present:"#10b981",absent:"#ef4444",half_day:"#f59e0b",holiday:"#8b5cf6",weekly_off:"#94a3b8",
  active:"#10b981",inactive:"#94a3b8",pending:"#f59e0b",approved:"#10b981",rejected:"#ef4444",
  sent:"#10b981",failed:"#ef4444",sending:"#3b82f6",
};
const DEPT_BG  = {IT:"#eff6ff",HR:"#f5f3ff",Finance:"#fffbeb",Operations:"#f0fdf4",Sales:"#fff1f2",Marketing:"#fdf4ff","Human Resources":"#f5f3ff"};
const DEPT_CLR = {IT:"#2563eb",HR:"#7c3aed",Finance:"#d97706",Operations:"#16a34a",Sales:"#dc2626",Marketing:"#9333ea","Human Resources":"#7c3aed"};

const Badge = ({ label, color }) => (
  <span style={{background:color+"18",color,padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700,textTransform:"capitalize"}}>{label}</span>
);

const SectionLabel = ({ text }) => (
  <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:1.2,marginBottom:10,marginTop:4}}>{text}</div>
);

function Field({ label, k, type="text", value, onChange, options, placeholder="" }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      <label style={{fontSize:11,fontWeight:600,color:"#64748b"}}>{label}</label>
      {options ? (
        <select className="inp" value={value||""} onChange={e=>onChange(k,e.target.value)}>
          {options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
        </select>
      ) : (
        <input className="inp" type={type} value={value||""} placeholder={placeholder}
          onChange={e=>onChange(k,e.target.value)} />
      )}
    </div>
  );
}

function Drawer({ title, subtitle, onClose, children, footer }) {
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div style={{padding:"22px 24px 18px",borderBottom:"1px solid #f1f5f9",background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontSize:17,fontWeight:700,color:"#fff"}}>{title}</div>
              {subtitle && <div style={{fontSize:12,color:"rgba(255,255,255,0.75)",marginTop:3}}>{subtitle}</div>}
            </div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",width:32,height:32,borderRadius:8,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>{children}</div>
        {footer && (
          <div style={{padding:"16px 24px",borderTop:"1px solid #f1f5f9",background:"#fafbff",display:"flex",gap:10,justifyContent:"flex-end",flexShrink:0}}>
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

const StatCard = ({ label, value, color="#2563eb", icon, bg="#eff6ff" }) => (
  <div style={{background:bg,borderRadius:14,padding:"16px 18px",border:"1px solid "+color+"22",display:"flex",flexDirection:"column",gap:6}}>
    {icon && <div style={{fontSize:22}}>{icon}</div>}
    <div style={{fontSize:11,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:0.8}}>{label}</div>
    <div style={{fontSize:28,fontWeight:700,color}}>{value}</div>
  </div>
);

/* ══ EMPLOYEE FORM ══ */
const EMPTY_EMP = {emp_id:"",name:"",designation:"",department:"",email:"",phone:"",pan:"",uan:"",pf_account:"",bank_account:"",bank_name:"",joining_date:"",basic:"",hra:"",special_allowance:"",travel_allowance:"",medical_allowance:"",pf_employee:"",professional_tax:"",income_tax:"",status:"active"};

function EmployeeForm({ initial=EMPTY_EMP, onSave, onCancel, isEdit }) {
  const [form, setForm] = useState({...EMPTY_EMP,...initial});
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const submit = async () => {
    const body = {...form};
    ["basic","hra","special_allowance","travel_allowance","medical_allowance","pf_employee","professional_tax","income_tax"].forEach(k=>body[k]=parseFloat(body[k])||0);
    const url = isEdit?`${API}/employees/${form.emp_id}`:`${API}/employees`;
    const res = await fetch(url,{method:isEdit?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    if(res.ok) onSave();
    else { const e=await res.json(); alert(e.detail||"Error"); }
  };

  const gross = ["basic","hra","special_allowance","travel_allowance","medical_allowance"].reduce((s,k)=>s+(parseFloat(form[k])||0),0);
  const ded   = ["pf_employee","professional_tax","income_tax"].reduce((s,k)=>s+(parseFloat(form[k])||0),0);
  const G2={display:"grid",gridTemplateColumns:"1fr 1fr",gap:14};
  const G3={display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14};

  return (
    <Drawer title={isEdit?"Edit Employee":"Add New Employee"} subtitle={isEdit?`Editing: ${form.name}`:"Fill in all employee details"} onClose={onCancel}
      footer={<><button className="btn-g" onClick={onCancel}>Cancel</button><button className="btn-p" onClick={submit}>{isEdit?"💾 Update":"✅ Add Employee"}</button></>}>
      <div style={{display:"flex",flexDirection:"column",gap:18}}>
        <SectionLabel text="Basic Information" />
        <div style={G2}>
          <Field label="Employee ID *" k="emp_id" value={form.emp_id} onChange={set} placeholder="EMP001" />
          <Field label="Full Name *" k="name" value={form.name} onChange={set} placeholder="Rahul Sharma" />
          <Field label="Designation" k="designation" value={form.designation} onChange={set} placeholder="Software Engineer" />
          <Field label="Department" k="department" value={form.department} onChange={set} options={["IT","HR","Finance","Operations","Sales","Marketing"]} />
          <Field label="Email" k="email" type="email" value={form.email} onChange={set} placeholder="rahul@company.com" />
          <Field label="Phone" k="phone" value={form.phone} onChange={set} placeholder="+91 98765 43210" />
          <Field label="Joining Date" k="joining_date" type="date" value={form.joining_date} onChange={set} />
          <Field label="Status" k="status" value={form.status} onChange={set} options={[{value:"active",label:"✅ Active"},{value:"inactive",label:"⛔ Inactive"}]} />
        </div>
        <div style={{height:1,background:"#f1f5f9"}}/>
        <SectionLabel text="Documents & Bank" />
        <div style={G2}>
          <Field label="PAN Number" k="pan" value={form.pan} onChange={set} placeholder="ABCDE1234F" />
          <Field label="UAN Number" k="uan" value={form.uan} onChange={set} placeholder="101234567890" />
          <Field label="PF Account No." k="pf_account" value={form.pf_account} onChange={set} />
          <Field label="Bank Name" k="bank_name" value={form.bank_name} onChange={set} placeholder="State Bank of India" />
          <Field label="Bank Account No." k="bank_account" value={form.bank_account} onChange={set} />
        </div>
        <div style={{height:1,background:"#f1f5f9"}}/>
        <SectionLabel text="Monthly Salary (₹)" />
        <div style={G3}>
          <Field label="Basic" k="basic" type="number" value={form.basic} onChange={set} />
          <Field label="HRA" k="hra" type="number" value={form.hra} onChange={set} />
          <Field label="Special Allowance" k="special_allowance" type="number" value={form.special_allowance} onChange={set} />
          <Field label="Travel Allowance" k="travel_allowance" type="number" value={form.travel_allowance} onChange={set} />
          <Field label="Medical Allowance" k="medical_allowance" type="number" value={form.medical_allowance} onChange={set} />
        </div>
        <div style={{height:1,background:"#f1f5f9"}}/>
        <SectionLabel text="Monthly Deductions (₹)" />
        <div style={G3}>
          <Field label="PF Employee 12%" k="pf_employee" type="number" value={form.pf_employee} onChange={set} />
          <Field label="Professional Tax" k="professional_tax" type="number" value={form.professional_tax} onChange={set} />
          <Field label="Income Tax TDS" k="income_tax" type="number" value={form.income_tax} onChange={set} />
        </div>
        {gross>0 && (
          <div style={{background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",border:"1px solid #86efac",borderRadius:12,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:10,color:"#16a34a",fontWeight:700,textTransform:"uppercase"}}>Monthly Gross</div>
              <div style={{fontSize:24,fontWeight:800,color:"#15803d"}}>₹ {gross.toLocaleString()}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:10,color:"#dc2626",fontWeight:700,textTransform:"uppercase"}}>Deductions</div>
              <div style={{fontSize:20,fontWeight:800,color:"#dc2626"}}>₹ {ded.toLocaleString()}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:10,color:"#2563eb",fontWeight:700,textTransform:"uppercase"}}>Est. Net</div>
              <div style={{fontSize:20,fontWeight:800,color:"#2563eb"}}>₹ {(gross-ded).toLocaleString()}</div></div>
          </div>
        )}
      </div>
    </Drawer>
  );
}

/* ══ EMPLOYEES TAB ══ */
function EmployeesTab() {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async()=>{ const r=await fetch(`${API}/employees`); setEmployees(await r.json()); },[]);
  useEffect(()=>{ load(); },[load]);

  const del = async(id,name)=>{
    if(!window.confirm(`Delete ${name}?`)) return;
    await fetch(`${API}/employees/${id}`,{method:"DELETE"}); load();
  };

  const filtered = employees.filter(e=>[e.name,e.emp_id,e.department,e.designation].some(v=>v?.toLowerCase().includes(search.toLowerCase())));
  const gross = e=>["basic","hra","special_allowance","travel_allowance","medical_allowance"].reduce((s,k)=>s+(parseFloat(e[k])||0),0);
  const initials = n=>n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

  return (
    <div>
      <div style={{display:"flex",gap:12,marginBottom:20,alignItems:"center"}}>
        <div style={{position:"relative",flex:1,maxWidth:320}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#94a3b8",fontSize:15}}>🔍</span>
          <input className="inp" style={{paddingLeft:36}} placeholder="Search employees..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div style={{marginLeft:"auto",fontSize:13,color:"#64748b"}}>{filtered.length} employee{filtered.length!==1?"s":""}</div>
        <button className="btn-p" onClick={()=>{ setEditEmp(null); setShowForm(true); }}>+ Add Employee</button>
      </div>

      {filtered.length===0 ? (
        <div style={{textAlign:"center",padding:"60px",color:"#94a3b8"}}>
          <div style={{fontSize:52,marginBottom:12}}>👤</div>
          <div style={{fontSize:16,fontWeight:600}}>No employees found</div>
          <div style={{fontSize:13,marginTop:4}}>Click "Add Employee" to get started</div>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map(emp=>(
            <div key={emp.emp_id} className="row-card" style={{padding:"16px 20px",display:"flex",alignItems:"center",gap:16}}>
              <div style={{width:46,height:46,borderRadius:12,flexShrink:0,background:DEPT_BG[emp.department]||"#f0f4ff",color:DEPT_CLR[emp.department]||"#3b82f6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700}}>
                {initials(emp.name)}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:15}}>{emp.name}</span>
                  <Badge label={emp.status} color={SC[emp.status]}/>
                  <span style={{fontSize:12,color:"#94a3b8"}}>{emp.emp_id}</span>
                </div>
                <div style={{fontSize:12,color:"#64748b",marginTop:3}}>
                  {emp.designation} · <span style={{color:DEPT_CLR[emp.department]||"#3b82f6",fontWeight:600}}>{emp.department}</span> · {emp.email}
                </div>
              </div>
              <div style={{textAlign:"right",marginRight:8}}>
                <div style={{fontSize:16,fontWeight:700}}>₹ {gross(emp).toLocaleString()}</div>
                <div style={{fontSize:11,color:"#94a3b8"}}>Gross/month</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn-e" onClick={()=>{ setEditEmp(emp); setShowForm(true); }}>✏️ Edit</button>
                <button className="btn-d" onClick={()=>del(emp.emp_id,emp.name)}>🗑 Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showForm && <EmployeeForm initial={editEmp||EMPTY_EMP} isEdit={!!editEmp} onSave={()=>{ setShowForm(false); load(); }} onCancel={()=>setShowForm(false)}/>}
    </div>
  );
}

/* ══ ATTENDANCE TAB ══ */
function AttendanceTab() {
  const [employees, setEmployees] = useState([]);
  const [sel, setSel] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth()+1);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(()=>{ fetch(`${API}/employees`).then(r=>r.json()).then(setEmployees); },[]);

  const loadAtt = useCallback(async()=>{
    if(!sel) return;
    const d = await fetch(`${API}/attendance/${sel}/${year}/${month}`).then(r=>r.json());
    setRecords(d.records||[]); setSummary(d.summary||null);
  },[sel,year,month]);
  useEffect(()=>{ loadAtt(); },[loadAtt]);

  const total=new Date(year,month,0).getDate();
  const firstDay=new Date(year,month-1,1).getDay();
  const getStatus=d=>{ const ds=`${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`; return records.find(r=>r.date===ds)?.status||null; };
  const mark=async(d,status)=>{
    const ds=`${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    await fetch(`${API}/attendance`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({emp_id:sel,date:ds,status})});
    loadAtt();
  };

  const ATT_ICON={present:"✅",absent:"❌",half_day:"🌓",holiday:"🎉",weekly_off:"🏖️"};
  const ATT_BG={present:"#dcfce7",absent:"#fee2e2",half_day:"#fef9c3",holiday:"#ede9fe",weekly_off:"#f1f5f9"};
  const ATT_BD={present:"#86efac",absent:"#fca5a5",half_day:"#fde047",holiday:"#c4b5fd",weekly_off:"#cbd5e1"};
  const selEmp=employees.find(e=>e.emp_id===sel);

  return (
    <div style={{display:"grid",gridTemplateColumns:"230px 1fr",gap:16}}>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        <div style={{display:"flex",gap:6}}>
          <select className="inp" style={{flex:1}} value={month} onChange={e=>setMonth(+e.target.value)}>
            {MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}
          </select>
          <select className="inp" style={{width:78}} value={year} onChange={e=>setYear(+e.target.value)}>
            {[2024,2025,2026].map(y=><option key={y}>{y}</option>)}
          </select>
        </div>
        {employees.filter(e=>e.status==="active").map(emp=>(
          <div key={emp.emp_id} onClick={()=>setSel(emp.emp_id)} style={{
            padding:"12px 14px",borderRadius:12,cursor:"pointer",
            background:sel===emp.emp_id?"linear-gradient(135deg,#3b82f6,#2563eb)":"#fff",
            color:sel===emp.emp_id?"#fff":"#1e293b",
            border:"1.5px solid "+(sel===emp.emp_id?"#3b82f6":"#e8edf5"),
            boxShadow:sel===emp.emp_id?"0 4px 14px rgba(59,130,246,0.3)":"none",
            transition:"all 0.15s",
          }}>
            <div style={{fontWeight:600,fontSize:13}}>{emp.name}</div>
            <div style={{fontSize:11,opacity:0.7,marginTop:2}}>{emp.emp_id} · {emp.department}</div>
          </div>
        ))}
      </div>

      {!sel ? (
        <div style={{background:"#fff",borderRadius:16,border:"1px solid #e8edf5",display:"flex",alignItems:"center",justifyContent:"center",minHeight:400}}>
          <div style={{textAlign:"center",color:"#94a3b8"}}><div style={{fontSize:48,marginBottom:10}}>📅</div><div style={{fontSize:15,fontWeight:600}}>Select an employee</div><div style={{fontSize:13,marginTop:4}}>to mark attendance</div></div>
        </div>
      ) : (
        <div style={{background:"#fff",borderRadius:16,border:"1px solid #e8edf5",padding:20}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,padding:"12px 16px",background:"linear-gradient(135deg,#eff6ff,#dbeafe)",borderRadius:12}}>
            <div style={{width:40,height:40,borderRadius:10,background:"#dbeafe",color:"#2563eb",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14}}>
              {selEmp?.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{fontWeight:700,color:"#1e293b"}}>{selEmp?.name}</div>
              <div style={{fontSize:12,color:"#64748b"}}>{selEmp?.designation} · {MONTHS[month-1]} {year}</div>
            </div>
          </div>

          {summary && (
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
              {[["✅","Present","present",summary.present],["❌","Absent","absent",summary.absent],["🌓","Half Day","half_day",summary.half_day],["📆","Working","null",summary.working_days]].map(([icon,l,k,v])=>(
                <div key={l} className="stat-mini" style={{textAlign:"center"}}>
                  <div style={{fontSize:20}}>{icon}</div>
                  <div style={{fontSize:22,fontWeight:700,color:k!=="null"?SC[k]:"#2563eb",marginTop:2}}>{v}</div>
                  <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase"}}>{l}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:6}}>
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
              <div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:"#94a3b8",padding:"4px 0"}}>{d}</div>
            ))}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
            {Array(firstDay).fill(null).map((_,i)=><div key={"e"+i}/>)}
            {Array(total).fill(null).map((_,i)=>{
              const d=i+1, st=getStatus(d);
              const isToday=new Date().getDate()===d&&new Date().getMonth()+1===month&&new Date().getFullYear()===year;
              return (
                <div key={d} style={{borderRadius:10,border:"2px solid "+(isToday?"#3b82f6":st?ATT_BD[st]:"#e8edf5"),background:st?ATT_BG[st]:"#fafbff",padding:"6px 4px",cursor:"pointer",transition:"all 0.12s"}}>
                  <div style={{textAlign:"center",fontSize:12,fontWeight:isToday?800:500,color:isToday?"#2563eb":"#1e293b"}}>{d}</div>
                  {st && <div style={{textAlign:"center",fontSize:16,marginTop:1}}>{ATT_ICON[st]}</div>}
                  <select value={st||""} onChange={e=>e.target.value&&mark(d,e.target.value)}
                    style={{width:"100%",fontSize:9,marginTop:3,border:"none",background:"transparent",cursor:"pointer",color:"#64748b",outline:"none"}}>
                    <option value="">—</option>
                    {ATT_STATUSES.map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══ LEAVES TAB ══ */
function LeavesTab() {
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [tab, setTab] = useState("pending");
  const [showApply, setShowApply] = useState(false);
  const [form, setForm] = useState({emp_id:"",leave_type:"casual",from_date:"",to_date:"",reason:""});
  const [balance, setBalance] = useState(null);

  const load = useCallback(async()=>{
    const [e,l]=await Promise.all([fetch(`${API}/employees`).then(r=>r.json()),fetch(`${API}/leaves`).then(r=>r.json())]);
    setEmployees(e); setLeaves(l);
  },[]);
  useEffect(()=>{ load(); },[load]);
  useEffect(()=>{ if(form.emp_id) fetch(`${API}/leaves/${form.emp_id}/balance/${new Date().getFullYear()}`).then(r=>r.json()).then(setBalance); },[form.emp_id]);

  const apply=async()=>{ const r=await fetch(`${API}/leaves`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)}); if(r.ok){ setShowApply(false); load(); } };
  const action=async(id,status)=>{ await fetch(`${API}/leaves/${id}/action`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({status,remarks:""})}); load(); };
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const filtered=leaves.filter(l=>l.status===tab);
  const LICON={casual:"🌴",sick:"🤒",earned:"⭐",maternity:"👶",unpaid:"💸"};
  const days=(a,b)=>a&&b?Math.max(0,(new Date(b)-new Date(a))/86400000)+1:0;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div style={{display:"flex",gap:6,background:"#fff",padding:6,borderRadius:12,border:"1px solid #e8edf5"}}>
          {["pending","approved","rejected"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} className="tab-pill" style={{
              padding:"8px 18px",borderRadius:9,fontSize:13,border:"none",
              background:tab===t?(t==="pending"?"#fef3c7":t==="approved"?"#dcfce7":"#fee2e2"):"transparent",
              color:tab===t?SC[t]:"#64748b",fontWeight:tab===t?700:500,
            }}>
              {t==="pending"?"⏳":t==="approved"?"✅":"❌"} {t.charAt(0).toUpperCase()+t.slice(1)} ({leaves.filter(l=>l.status===t).length})
            </button>
          ))}
        </div>
        <button className="btn-p" onClick={()=>setShowApply(true)}>+ Apply Leave</button>
      </div>

      {filtered.length===0 ? (
        <div style={{textAlign:"center",padding:"60px",color:"#94a3b8"}}>
          <div style={{fontSize:48,marginBottom:10}}>🏖️</div>
          <div style={{fontSize:16,fontWeight:600}}>No {tab} leaves</div>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map(l=>{
            const emp=employees.find(e=>e.emp_id===l.emp_id);
            return (
              <div key={l.id} className="row-card" style={{padding:"16px 20px",display:"flex",alignItems:"center",gap:16}}>
                <div style={{fontSize:28}}>{LICON[l.leave_type]||"📋"}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <span style={{fontWeight:700,fontSize:15}}>{emp?.name||l.emp_id}</span>
                    <Badge label={l.leave_type} color="#7c3aed"/>
                    <Badge label={`${l.days} day${l.days>1?"s":""}`} color="#d97706"/>
                  </div>
                  <div style={{fontSize:12,color:"#64748b"}}>📅 {l.from_date} → {l.to_date} · {l.reason}</div>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:3}}>Applied: {l.applied_on}</div>
                </div>
                <Badge label={l.status} color={SC[l.status]}/>
                {l.status==="pending" && (
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>action(l.id,"approved")} style={{background:"#dcfce7",color:"#16a34a",border:"1px solid #86efac",padding:"7px 14px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>✅ Approve</button>
                    <button onClick={()=>action(l.id,"rejected")} style={{background:"#fee2e2",color:"#dc2626",border:"1px solid #fca5a5",padding:"7px 14px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>❌ Reject</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showApply && (
        <Drawer title="Apply for Leave" subtitle="Submit a leave request" onClose={()=>setShowApply(false)}
          footer={<><button className="btn-g" onClick={()=>setShowApply(false)}>Cancel</button><button className="btn-p" onClick={apply}>📤 Submit Leave</button></>}>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <Field label="Employee *" k="emp_id" value={form.emp_id} onChange={set}
              options={[{value:"",label:"Select Employee..."}, ...employees.filter(e=>e.status==="active").map(e=>({value:e.emp_id,label:`${e.name} (${e.emp_id})`}))]} />

            {balance && form.emp_id && (
              <div><SectionLabel text="Leave Balance"/>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                  {Object.entries(balance).map(([type,b])=>(
                    <div key={type} style={{background:b.balance>0?"#f0fdf4":"#fff7ed",border:"1px solid "+(b.balance>0?"#86efac":"#fed7aa"),borderRadius:10,padding:"10px",textAlign:"center"}}>
                      <div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>{type}</div>
                      <div style={{fontSize:20,fontWeight:800,color:b.balance>0?"#16a34a":"#ea580c"}}>{b.balance}</div>
                      <div style={{fontSize:10,color:"#94a3b8"}}>of {b.total}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
              <Field label="Leave Type" k="leave_type" value={form.leave_type} onChange={set}
                options={LEAVE_TYPES.map(t=>({value:t,label:t.charAt(0).toUpperCase()+t.slice(1)}))} />
              <Field label="From Date" k="from_date" type="date" value={form.from_date} onChange={set}/>
              <Field label="To Date" k="to_date" type="date" value={form.to_date} onChange={set}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:11,fontWeight:600,color:"#64748b"}}>Reason</label>
              <textarea className="inp" style={{height:80}} value={form.reason} placeholder="Reason for leave..." onChange={e=>set("reason",e.target.value)}/>
            </div>
            {form.from_date&&form.to_date && (
              <div style={{background:"#eff6ff",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#2563eb",fontWeight:600}}>
                📅 Duration: {days(form.from_date,form.to_date)} day(s)
              </div>
            )}
          </div>
        </Drawer>
      )}
    </div>
  );
}

/* ══ SALARY TAB ══ */
function SalaryTab() {
  const [employees, setEmployees] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth()+1);
  const [sel, setSel] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emailSt, setEmailSt] = useState({});
  const [bulkLoad, setBulkLoad] = useState(false);

  useEffect(()=>{ fetch(`${API}/employees`).then(r=>r.json()).then(e=>setEmployees(e.filter(x=>x.status==="active"))); },[]);

  const calc=async id=>{ setSel(id);setLoading(true);setData(null); const r=await fetch(`${API}/salary/calculate/${id}/${year}/${month}`); setData(await r.json()); setLoading(false); };
  const dlPDF=async id=>{ const r=await fetch(`${API}/salary/generate-pdf/${id}/${year}/${month}`); const blob=await r.blob(); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`Salary_${id}_${MONTHS[month-1]}_${year}.pdf`; a.click(); };
  const sendMail=async id=>{ setEmailSt(s=>({...s,[id]:"sending"})); const r=await fetch(`${API}/salary/send-email/${id}/${year}/${month}`,{method:"POST"}); setEmailSt(s=>({...s,[id]:r.ok?"sent":"failed"})); };
  const sendAll=async()=>{ setBulkLoad(true); const r=await fetch(`${API}/salary/send-all/${year}/${month}`,{method:"POST"}); const res=await r.json(); const ns={}; res.forEach(x=>ns[x.emp_id]=x.status); setEmailSt(ns); setBulkLoad(false); };

  return (
    <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:16}}>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        <div style={{display:"flex",gap:6}}>
          <select className="inp" style={{flex:1}} value={month} onChange={e=>{ setMonth(+e.target.value);setData(null); }}>{MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}</select>
          <select className="inp" style={{width:78}} value={year} onChange={e=>{ setYear(+e.target.value);setData(null); }}>{[2024,2025,2026].map(y=><option key={y}>{y}</option>)}</select>
        </div>
        <button onClick={sendAll} disabled={bulkLoad} className="btn-p"
          style={{background:bulkLoad?"#94a3b8":"linear-gradient(135deg,#10b981,#059669)",boxShadow:"0 2px 8px rgba(16,185,129,0.3)"}}>
          {bulkLoad?"⏳ Sending...":"📧 Send All Salary Slips"}
        </button>
        <div style={{height:1,background:"#f1f5f9",margin:"4px 0"}}/>
        {employees.map(emp=>{ const es=emailSt[emp.emp_id]; return (
          <div key={emp.emp_id} onClick={()=>calc(emp.emp_id)} style={{
            padding:"12px 14px",borderRadius:12,cursor:"pointer",
            background:sel===emp.emp_id?"linear-gradient(135deg,#3b82f6,#2563eb)":"#fff",
            color:sel===emp.emp_id?"#fff":"#1e293b",
            border:"1.5px solid "+(sel===emp.emp_id?"#3b82f6":"#e8edf5"),
            boxShadow:sel===emp.emp_id?"0 4px 14px rgba(59,130,246,0.3)":"none",
            transition:"all 0.15s",
          }}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontWeight:600,fontSize:13}}>{emp.name}</div><div style={{fontSize:11,opacity:0.7,marginTop:2}}>{emp.emp_id}</div></div>
              {es && <Badge label={es} color={SC[es]||"#64748b"}/>}
            </div>
          </div>
        ); })}
      </div>

      {!sel ? (
        <div style={{background:"#fff",borderRadius:16,border:"1px solid #e8edf5",display:"flex",alignItems:"center",justifyContent:"center",minHeight:400}}>
          <div style={{textAlign:"center",color:"#94a3b8"}}><div style={{fontSize:52,marginBottom:10}}>💰</div><div style={{fontSize:15,fontWeight:600}}>Select an employee</div><div style={{fontSize:13,marginTop:4}}>to view salary details</div></div>
        </div>
      ) : loading ? (
        <div style={{background:"#fff",borderRadius:16,border:"1px solid #e8edf5",display:"flex",alignItems:"center",justifyContent:"center",minHeight:400}}>
          <div style={{textAlign:"center",color:"#3b82f6"}}><div style={{fontSize:40,marginBottom:10}}>⏳</div><div style={{fontSize:14,fontWeight:600}}>Calculating...</div></div>
        </div>
      ) : data && (
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6,#0ea5e9)",borderRadius:16,padding:"22px 24px",color:"#fff",boxShadow:"0 8px 32px rgba(37,99,235,0.25)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontSize:20,fontWeight:700}}>{data.employee.name}</div>
                <div style={{fontSize:12,opacity:0.8,marginTop:3}}>{data.employee.emp_id} · {data.employee.designation} · {data.employee.department}</div>
                <div style={{marginTop:10,background:"rgba(255,255,255,0.15)",display:"inline-block",padding:"4px 12px",borderRadius:20,fontSize:13,fontWeight:600}}>{MONTHS[month-1]} {year}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:11,opacity:0.7}}>NET SALARY</div>
                <div style={{fontSize:34,fontWeight:800,letterSpacing:-1}}>₹ {data.net_salary.toLocaleString()}</div>
                <div style={{display:"flex",gap:8,marginTop:10,justifyContent:"flex-end"}}>
                  <button onClick={()=>dlPDF(sel)} style={{background:"rgba(255,255,255,0.2)",color:"#fff",border:"1px solid rgba(255,255,255,0.4)",padding:"8px 16px",borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer"}}>⬇ Download PDF</button>
                  <button onClick={()=>sendMail(sel)} style={{background:"#10b981",color:"#fff",border:"none",padding:"8px 16px",borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer"}}>📧 Email Slip</button>
                </div>
              </div>
            </div>
          </div>

          <div style={{background:"#fff",borderRadius:14,border:"1px solid #e8edf5",padding:"18px 20px"}}>
            <SectionLabel text="Attendance Summary"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10}}>
              {[["Total Days","#3b82f6",data.attendance.total_days,"📆"],["Working Days","#6366f1",data.attendance.working_days,"🗓"],
                ["Present","#10b981",data.attendance.present,"✅"],["Paid Leaves","#f59e0b",data.attendance.paid_leaves,"🌴"],
                ["LOP Days","#ef4444",data.attendance.lop_days,"⚠️"],["Effective","#8b5cf6",data.attendance.effective_days,"⭐"]
              ].map(([l,c,v,icon])=>(
                <div key={l} className="stat-mini" style={{textAlign:"center"}}>
                  <div style={{fontSize:18}}>{icon}</div>
                  <div style={{fontSize:20,fontWeight:700,color:c}}>{v}</div>
                  <div style={{fontSize:10,color:"#94a3b8",fontWeight:600}}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{background:"#fff",borderRadius:14,border:"1px solid #e8edf5",padding:"18px 20px"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#16a34a",textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>
                <span style={{background:"#dcfce7",padding:"3px 10px",borderRadius:20}}>💚 Earnings</span>
              </div>
              {[["Basic Salary",data.earnings.basic],["HRA",data.earnings.hra],["Special Allowance",data.earnings.special_allowance],["Travel Allowance",data.earnings.travel_allowance],["Medical Allowance",data.earnings.medical_allowance]].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f8fafc",fontSize:13}}>
                  <span style={{color:"#64748b"}}>{l}</span><span style={{fontWeight:600}}>₹ {v.toLocaleString()}</span>
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",fontSize:15,fontWeight:800,color:"#16a34a",borderTop:"2px solid #dcfce7",marginTop:4}}>
                <span>Gross Total</span><span>₹ {data.earnings.gross.toLocaleString()}</span>
              </div>
            </div>

            <div style={{background:"#fff",borderRadius:14,border:"1px solid #e8edf5",padding:"18px 20px"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#dc2626",textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>
                <span style={{background:"#fee2e2",padding:"3px 10px",borderRadius:20}}>❤️ Deductions</span>
              </div>
              {[["PF Employee 12%",data.deductions.pf_employee],["Professional Tax",data.deductions.professional_tax],["Income Tax TDS",data.deductions.income_tax],["LOP Deduction",data.deductions.lop_deduction]].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f8fafc",fontSize:13}}>
                  <span style={{color:"#64748b"}}>{l}</span><span style={{fontWeight:600,color:"#ef4444"}}>₹ {v.toLocaleString()}</span>
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",fontSize:15,fontWeight:800,color:"#dc2626",borderTop:"2px solid #fee2e2",marginTop:4}}>
                <span>Total Deductions</span><span>₹ {data.deductions.total.toLocaleString()}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",background:"#f5f3ff",borderRadius:8,padding:"8px 12px",marginTop:6,fontSize:13,color:"#7c3aed",fontWeight:600}}>
                <span>🏢 Employer PF</span><span>₹ {data.employer_pf.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══ SETTINGS TAB ══ */
function SettingsTab() {
  const [cfg, setCfg] = useState({company_name:"",company_address:"",company_phone:"",company_email:"",company_pan:"",sender_email:"",sender_password:""});
  const [saved, setSaved] = useState(false);
  useEffect(()=>{ fetch(`${API}/config`).then(r=>r.json()).then(setCfg).catch(()=>{}); },[]);
  const save=async()=>{ await fetch(`${API}/config`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(cfg)}); setSaved(true); setTimeout(()=>setSaved(false),3000); };
  const set=(k,v)=>setCfg(c=>({...c,[k]:v}));
  return (
    <div style={{maxWidth:660}}>
      <div style={{background:"#fff",borderRadius:16,border:"1px solid #e8edf5",padding:24}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24,padding:"14px 18px",background:"linear-gradient(135deg,#eff6ff,#dbeafe)",borderRadius:12}}>
          <div style={{fontSize:28}}>🏢</div>
          <div><div style={{fontWeight:700,color:"#1d4ed8",fontSize:15}}>Company Settings</div><div style={{fontSize:12,color:"#3b82f6"}}>Configure company & email for salary slips</div></div>
        </div>
        <SectionLabel text="Company Information"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <Field label="Company Name" k="company_name" value={cfg.company_name} onChange={set} placeholder="ABC Pvt. Ltd."/>
          <Field label="Company PAN" k="company_pan" value={cfg.company_pan} onChange={set} placeholder="AABCA1234Z"/>
          <Field label="Phone" k="company_phone" value={cfg.company_phone} onChange={set} placeholder="+91 98765 43210"/>
          <Field label="Company Email" k="company_email" value={cfg.company_email} onChange={set} placeholder="hr@company.com"/>
        </div>
        <Field label="Full Address" k="company_address" value={cfg.company_address} onChange={set} placeholder="Ring Road, Surat - 395002, Gujarat"/>
        <div style={{height:1,background:"#f1f5f9",margin:"20px 0"}}/>
        <SectionLabel text="Gmail Configuration for Auto-Email"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <Field label="Sender Gmail" k="sender_email" type="email" value={cfg.sender_email} onChange={set} placeholder="company@gmail.com"/>
          <Field label="App Password (16-digit)" k="sender_password" type="password" value={cfg.sender_password} onChange={set} placeholder="xxxx xxxx xxxx xxxx"/>
        </div>
        <div style={{background:"linear-gradient(135deg,#fef9c3,#fef3c7)",border:"1px solid #fde68a",borderRadius:10,padding:"12px 16px",fontSize:12,color:"#92400e",marginBottom:20}}>
          <div style={{fontWeight:700,marginBottom:4}}>📌 How to get Gmail App Password:</div>
          Gmail → Settings → Security → 2-Step Verification ON → App Passwords → Generate
        </div>
        <button className="btn-p" onClick={save} style={{background:saved?"linear-gradient(135deg,#10b981,#059669)":"linear-gradient(135deg,#3b82f6,#2563eb)"}}>
          {saved?"✅ Saved!":"💾 Save Settings"}
        </button>
      </div>
    </div>
  );
}

/* ══ DASHBOARD ══ */
function Dashboard({ setTab }) {
  const [stats, setStats] = useState(null);
  useEffect(()=>{ fetch(`${API}/dashboard`).then(r=>r.json()).then(setStats).catch(()=>setStats({total_employees:0,active_employees:0,pending_leaves:0,today_present:0})); },[]);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6,#0ea5e9)",borderRadius:16,padding:"24px 28px",color:"#fff",boxShadow:"0 8px 32px rgba(37,99,235,0.2)"}}>
        <div style={{fontSize:22,fontWeight:800}}>Welcome to HR Manager 👋</div>
        <div style={{fontSize:13,opacity:0.85,marginTop:4}}>Manage employees, attendance, leaves and salary — all in one place.</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        <StatCard label="Total Employees" value={stats?.total_employees??"—"} color="#2563eb" bg="#eff6ff" icon="👥"/>
        <StatCard label="Active Employees" value={stats?.active_employees??"—"} color="#16a34a" bg="#f0fdf4" icon="✅"/>
        <StatCard label="Pending Leaves" value={stats?.pending_leaves??"—"} color="#d97706" bg="#fffbeb" icon="⏳"/>
        <StatCard label="Present Today" value={stats?.today_present??"—"} color="#7c3aed" bg="#f5f3ff" icon="📅"/>
      </div>
      <div style={{background:"#fff",borderRadius:16,border:"1px solid #e8edf5",padding:"20px 24px"}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:14,color:"#1e293b"}}>⚡ Quick Actions</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {[["👤 Add Employee","Employees","#eff6ff","#2563eb"],["📅 Mark Attendance","Attendance","#f0fdf4","#16a34a"],["✅ Approve Leaves","Leaves","#fffbeb","#d97706"],["💰 Generate Salary","Salary","#f5f3ff","#7c3aed"]].map(([label,tab,bg,color])=>(
            <button key={tab} onClick={()=>setTab(tab)} style={{background:bg,color,border:`1.5px solid ${color}33`,padding:"14px 12px",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer",textAlign:"center"}}>{label}</button>
          ))}
        </div>
      </div>
      <div style={{background:"#fff",borderRadius:16,border:"1px solid #e8edf5",padding:"20px 24px"}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>📖 How to use</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
          {[["1️⃣","Add Employees","Add with salary structure"],["2️⃣","Attendance","Mark daily calendar"],["3️⃣","Leaves","Apply & approve"],["4️⃣","Salary","Auto-calculate with LOP"],["5️⃣","Settings","Company & Gmail setup"]].map(([num,title,desc])=>(
            <div key={title} style={{background:"#f8faff",borderRadius:12,padding:14,border:"1px solid #e0e7ff",textAlign:"center"}}>
              <div style={{fontSize:24,marginBottom:6}}>{num}</div>
              <div style={{fontWeight:700,fontSize:13,color:"#1d4ed8",marginBottom:4}}>{title}</div>
              <div style={{fontSize:11,color:"#64748b",lineHeight:1.5}}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══ MAIN APP ══ */
const TABS=["Dashboard","Employees","Attendance","Leaves","Salary","Settings"];
const TICONS={Dashboard:"🏠",Employees:"👥",Attendance:"📅",Leaves:"🌴",Salary:"💰",Settings:"⚙️"};

export default function App() {
  injectStyles();
  const [tab, setTab] = useState("Dashboard");
  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"#f0f4ff"}}>
      <div style={{width:210,background:"#fff",borderRight:"1px solid #e8edf5",display:"flex",flexDirection:"column",flexShrink:0,boxShadow:"2px 0 12px rgba(37,99,235,0.06)"}}>
        <div style={{padding:"20px 18px 16px",background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
          <div style={{fontSize:18,fontWeight:800,color:"#fff"}}>HR Manager</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.75)",marginTop:2}}>Employee CRM System</div>
        </div>
        <div style={{flex:1,padding:"8px 10px",display:"flex",flexDirection:"column",gap:3}}>
          {TABS.map(t=>(
            <button key={t} className="sb-btn" onClick={()=>setTab(t)} style={{
              display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,border:"none",
              background:tab===t?"linear-gradient(135deg,#eff6ff,#dbeafe)":"transparent",
              color:tab===t?"#2563eb":"#64748b",fontWeight:tab===t?700:500,fontSize:13,cursor:"pointer",
              textAlign:"left",width:"100%",borderLeft:tab===t?"3px solid #3b82f6":"3px solid transparent",
            }}>
              <span style={{fontSize:17}}>{TICONS[t]}</span>{t}
            </button>
          ))}
        </div>
        <div style={{padding:"12px 16px",borderTop:"1px solid #f1f5f9",fontSize:10,color:"#94a3b8"}}>
          <div style={{fontWeight:600}}>Backend API</div><div>localhost:8000</div>
        </div>
      </div>

      <div style={{flex:1,overflow:"auto",padding:24}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
          <span style={{fontSize:22}}>{TICONS[tab]}</span>
          <h1 style={{fontSize:22,fontWeight:800,color:"#1e293b"}}>{tab}</h1>
        </div>
        {tab==="Dashboard"&&<Dashboard setTab={setTab}/>}
        {tab==="Employees"&&<EmployeesTab/>}
        {tab==="Attendance"&&<AttendanceTab/>}
        {tab==="Leaves"&&<LeavesTab/>}
        {tab==="Salary"&&<SalaryTab/>}
        {tab==="Settings"&&<SettingsTab/>}
      </div>
    </div>
  );
}