import{j as t}from"./jsx-runtime-Z5uAzocK.js";import{r as p}from"./index-pP6CS22B.js";import"./_commonjsHelpers-Cpj98o6Y.js";function w(){const[l,a]=p.useState([]),[g,s]=p.useState(new Map),o=p.useCallback((n,r,e)=>new Promise(i=>{const b=Date.now(),j=Math.random().toString(36).substr(2,9),c=n+"-"+b+"-"+j,A={id:c,action:n,data:r,timestamp:b,timeout:e};a(d=>[...d,A]),s(d=>new Map(d).set(c,i)),e&&setTimeout(()=>{s(d=>{const u=new Map(d),h=u.get(c);return h&&(h(!1),u.delete(c)),u}),a(d=>d.filter(u=>u.id!==c))},e)}),[]),y=p.useCallback(n=>{s(r=>{const e=new Map(r),i=e.get(n);return i&&(i(!0),e.delete(n)),e}),a(r=>r.filter(e=>e.id!==n))},[]),k=p.useCallback(n=>{s(r=>{const e=new Map(r),i=e.get(n);return i&&(i(!1),e.delete(n)),e}),a(r=>r.filter(e=>e.id!==n))},[]),R=p.useCallback(n=>{a(r=>r.filter(e=>e.id!==n)),s(r=>{const e=new Map(r);return e.delete(n),e})},[]);return{pendingApprovals:l,requestApproval:o,approve:y,reject:k,clear:R}}const S={title:"Hooks/Examples",parameters:{layout:"centered"}},m={render:()=>{const l=w(),[a,g]=p.useState("");async function s(){g("Requesting approval...");const o=await l.requestApproval("dangerous-action",{action:"Delete Database",details:"This will permanently delete all data"},3e4);g(o?"Action approved!":"Action rejected!")}return t.jsxs("div",{style:{padding:"2rem",maxWidth:"400px"},children:[t.jsx("h2",{children:"Human-in-the-Loop Demo"}),t.jsx("button",{onClick:s,style:{padding:"0.75rem 1.5rem",background:"#ef4444",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontSize:"16px",fontWeight:600},children:"Perform Dangerous Action"}),a&&t.jsx("p",{style:{marginTop:"1rem",padding:"1rem",background:"#f3f4f6",borderRadius:"8px"},children:a}),l.pendingApprovals.map(o=>t.jsxs("div",{style:{marginTop:"1rem",padding:"1rem",border:"2px solid #f59e0b",borderRadius:"8px",background:"#fffbeb"},children:[t.jsx("h3",{style:{margin:"0 0 0.5rem 0"},children:"Approval Required"}),t.jsx("p",{style:{margin:"0.5rem 0"},children:t.jsx("strong",{children:o.data.action})}),t.jsx("p",{style:{margin:"0.5rem 0",color:"#6b7280"},children:o.data.details}),t.jsxs("div",{style:{marginTop:"1rem",display:"flex",gap:"0.5rem"},children:[t.jsx("button",{onClick:()=>l.approve(o.id),style:{padding:"0.5rem 1rem",background:"#10b981",color:"white",border:"none",borderRadius:"6px",cursor:"pointer"},children:"Approve"}),t.jsx("button",{onClick:()=>l.reject(o.id),style:{padding:"0.5rem 1rem",background:"#ef4444",color:"white",border:"none",borderRadius:"6px",cursor:"pointer"},children:"Reject"})]})]},o.id))]})}};var x,f,v;m.parameters={...m.parameters,docs:{...(x=m.parameters)==null?void 0:x.docs,source:{originalSource:`{
  render: () => {
    const hitl = useHumanInTheLoop<{
      action: string;
      details: string;
    }>();
    const [result, setResult] = useState<string>('');
    async function handleAction() {
      setResult('Requesting approval...');
      const approved = await hitl.requestApproval('dangerous-action', {
        action: 'Delete Database',
        details: 'This will permanently delete all data'
      }, 30000);
      setResult(approved ? 'Action approved!' : 'Action rejected!');
    }
    return <div style={{
      padding: '2rem',
      maxWidth: '400px'
    }}>
        <h2>Human-in-the-Loop Demo</h2>
        <button onClick={handleAction} style={{
        padding: '0.75rem 1.5rem',
        background: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 600
      }}>
          Perform Dangerous Action
        </button>

        {result && <p style={{
        marginTop: '1rem',
        padding: '1rem',
        background: '#f3f4f6',
        borderRadius: '8px'
      }}>
            {result}
          </p>}

        {hitl.pendingApprovals.map(approval => <div key={approval.id} style={{
        marginTop: '1rem',
        padding: '1rem',
        border: '2px solid #f59e0b',
        borderRadius: '8px',
        background: '#fffbeb'
      }}>
            <h3 style={{
          margin: '0 0 0.5rem 0'
        }}>Approval Required</h3>
            <p style={{
          margin: '0.5rem 0'
        }}><strong>{approval.data.action}</strong></p>
            <p style={{
          margin: '0.5rem 0',
          color: '#6b7280'
        }}>{approval.data.details}</p>
            <div style={{
          marginTop: '1rem',
          display: 'flex',
          gap: '0.5rem'
        }}>
              <button onClick={() => hitl.approve(approval.id)} style={{
            padding: '0.5rem 1rem',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}>
                Approve
              </button>
              <button onClick={() => hitl.reject(approval.id)} style={{
            padding: '0.5rem 1rem',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}>
                Reject
              </button>
            </div>
          </div>)}
      </div>;
  }
}`,...(v=(f=m.parameters)==null?void 0:f.docs)==null?void 0:v.source}}};const q=["HumanInTheLoopExample"];export{m as HumanInTheLoopExample,q as __namedExportsOrder,S as default};
