'use strict';

// Each example is specified independently of its solver.
const input = (key,label,value,min=0,integer=false) => ({key,label,value,min,integer});
const output = (key,label,unit='') => ({key,label,unit});

module.exports = [
  {
    slug:'queue-recovery', title:'Queue Recovery Calculator', category:'Service operations',
    summary:'Estimate when a worker pool will clear its backlog while new jobs continue to arrive.',
    assumption:'Assumes steady arrival and processing rates. With no spare processing capacity, a nonempty backlog has no finite drain time.',
    inputs:[input('backlog','Queued jobs',18000,0,true),input('incoming','New jobs per second',40),input('workers','Active workers',6,1,true),input('rate','Jobs per worker per second',10,0.000001),input('target','Target drain time (minutes)',10,0.000001)],
    outputs:[output('minutes','Time to clear','min'),output('spare','Net processing capacity','jobs/s'),output('needed','Workers for target','workers')],
    solve:({backlog,incoming,workers,rate,target})=>{
      const spare=workers*rate-incoming;
      return {minutes:backlog===0?0:(spare>0?backlog/spare/60:null),spare,needed:Math.ceil((incoming+backlog/(target*60))/rate)};
    },
    cases:[{values:{},expect:{minutes:15,spare:20,needed:7}},{values:{workers:4},expect:{minutes:null,spare:0,needed:7}},{values:{workers:3,backlog:0},expect:{minutes:0,spare:-10,needed:4}}]
  },
  {
    slug:'oracle-session-budget',title:'Oracle Session Budget',category:'Oracle Database',
    summary:'Size an application pool against a database session budget, including replicas that overlap during rollout.',
    assumption:'Supply the usable session limit for this service after accounting for other workloads. Each live application replica can open its entire pool.',
    inputs:[input('limit','Session budget',480,1,true),input('reserve','Sessions reserved elsewhere',80,0,true),input('replicas','Steady replicas',8,1,true),input('surge','Extra rollout replicas',2,0,true),input('pool','Current pool maximum per replica',45,1,true)],
    outputs:[output('maximum','Suggested maximum per replica','sessions'),output('peak','Peak pool demand','sessions'),output('headroom','Remaining session budget','sessions')],
    solve:({limit,reserve,replicas,surge,pool})=>{const count=replicas+surge; const peak=count*pool; return {maximum:Math.max(0,Math.floor((limit-reserve)/count)),peak,headroom:limit-reserve-peak};},
    cases:[{values:{},expect:{maximum:40,peak:450,headroom:-50}},{values:{surge:0,pool:32},expect:{maximum:50,peak:256,headroom:144}}]
  },
  {
    slug:'context-packing',title:'RAG Context Budget',category:'AI engineering',
    summary:'Find how many equal-sized retrieval chunks fit after reserving room for the prompt, history and answer.',
    assumption:'Use token counts from the target model tokenizer. Each chunk incurs the same citation and formatting overhead.',
    inputs:[input('window','Model context (tokens)',8192,1,true),input('prompt','Prompt and history (tokens)',1200,0,true),input('answer','Answer reserve (tokens)',1500,0,true),input('chunk','Text tokens per chunk',600,1,true),input('overhead','Metadata tokens per chunk',40,0,true)],
    outputs:[output('chunks','Whole chunks','chunks'),output('left','Unused context after packing','tokens'),output('over','Fixed budget overflow','tokens')],
    solve:({window,prompt,answer,chunk,overhead})=>{const budget=window-prompt-answer;const chunks=Math.max(0,Math.floor(budget/(chunk+overhead)));return {chunks,left:Math.max(0,budget-chunks*(chunk+overhead)),over:Math.max(0,-budget)};},
    cases:[{values:{},expect:{chunks:8,left:372,over:0}},{values:{window:2000},expect:{chunks:0,left:0,over:700}}]
  },
  {
    slug:'archive-runway',title:'Archive Storage Runway',category:'Database operations',
    summary:'Estimate when archive storage will reach its reserve threshold using observed generation and reclamation rates.',
    assumption:'Both rates use GiB per day and must refer to the same destination. Results assume steady rates and the capacity you entered.',
    inputs:[input('free','Free capacity (GiB)',980),input('reserve','Reserve to preserve (GiB)',140),input('generated','Archive generation (GiB/day)',96),input('reclaimed','Archive reclamation (GiB/day)',36)],
    outputs:[output('days','Time to reserve','days'),output('net','Net growth','GiB/day'),output('usable','Capacity above reserve','GiB')],
    solve:({free,reserve,generated,reclaimed})=>{const usable=Math.max(0,free-reserve),net=generated-reclaimed;return {days:usable===0?0:(net>0?usable/net:null),net,usable};},
    cases:[{values:{},expect:{days:14,net:60,usable:840}},{values:{generated:30},expect:{days:null,net:-6,usable:840}},{values:{free:100},expect:{days:0,net:60,usable:0}}]
  },
  {
    slug:'retry-deadline',title:'Retry Deadline Planner',category:'API engineering',
    summary:'Add up attempt timeouts and capped exponential backoff to check whether a retry policy fits its deadline.',
    assumption:'The first request has no backoff. Every attempt takes its full timeout, including the last. Random jitter and Retry-After are excluded.',
    inputs:[input('attempts','Total attempts (1 to 30)',4,1,true),input('timeout','Timeout per attempt (ms)',800,1),input('initial','First backoff (ms)',200),input('cap','Backoff cap (ms)',1000),input('deadline','Caller deadline (ms)',5000,1)],
    outputs:[output('total','Worst-case duration','ms'),output('wait','Total backoff','ms'),output('slack','Deadline margin','ms')],
    solve:({attempts,timeout,initial,cap,deadline})=>{if(attempts>30)throw Error('Use at most 30 attempts.');let wait=0;for(let i=0;i<attempts-1;i++)wait+=Math.min(initial*2**i,cap);const total=attempts*timeout+wait;return {total,wait,slack:deadline-total};},
    cases:[{values:{},expect:{total:4600,wait:1400,slack:400}},{values:{attempts:1},expect:{total:800,wait:0,slack:4200}},{values:{attempts:5,cap:300},expect:{total:5100,wait:1100,slack:-100}}]
  },
  {
    slug:'request-error-budget',title:'Request Error Budget',category:'Reliability',
    summary:'Calculate how many failed requests an observed traffic window can absorb at a chosen success target.',
    assumption:'Counts are for one closed measurement window. The success target is entered in basis points, so 9990 means 99.90 percent.',
    inputs:[input('total','Requests in window',150000,1,true),input('errors','Failed requests',80,0,true),input('target','Success target (basis points)',9990,0,true)],
    outputs:[output('allow','Allowed failures','requests'),output('remaining','Budget remaining','requests'),output('success','Observed success','%')],
    solve:({total,errors,target})=>{if(target>10000||errors>total)throw Error('Use at most 10000 basis points and no more failures than requests.');const allow=Math.floor(total*(10000-target)/10000);return {allow,remaining:allow-errors,success:100*(total-errors)/total};},
    cases:[{values:{},expect:{allow:150,remaining:70,success:99.9466666667}},{values:{total:1000,target:9999,errors:1},expect:{allow:0,remaining:-1,success:99.9}}]
  }
];
