// Authored action vocabulary with seeded variation; each row carries rewards separately.
export function reachableLanes(rows, initialLane = 1) {
  let reachable = new Set([initialLane]);
  for (const row of rows) {
    if (row.kind !== 'group') continue;
    const next = new Set();
    for (let lane=0; lane<3; lane++) {
      const obstacle = row.obstacles.find(o=>o.lane===lane);
      if (obstacle?.kind === 'cone' || row.obstacles.some(o=>o.kind==='motorcycle' && lane!==o.safeLane)) continue;
      if ([...reachable].some(from=>Math.abs(from-lane)<=1)) next.add(lane);
    }
    reachable = next;
    if (!reachable.size) return [];
  }
  return [...reachable];
}
export class SpawnPlanner {
  constructor(random = Math.random) { this.random = random; this.reset(); }
  delay(min,max) { return min + this.random()*(max-min); }
  reset() { this.safeLane=1; this.lastPattern=''; this.motorcycleAt=this.delay(14,18); this.powerupAt=this.delay(45,55); }
  adjacent(lane) {
    const choices=[0,1,2].filter(n=>Math.abs(n-lane)===1);
    return choices[Math.min(choices.length-1,Math.floor(this.random()*choices.length))];
  }
  group(elapsed) {
    if (elapsed >= this.powerupAt) {
      this.powerupAt=elapsed+this.delay(45,55);
      const bottleLane=this.safeLane;
      const guards=[0,1,2].map(lane=>({lane,kind:lane===bottleLane?'rock':(lane===1?'cone':'rock'),large:false}));
      return [{kind:'group',pattern:'bottle-challenge',safeLane:bottleLane,obstacles:guards,rewards:[],bottleLane}, ...this.patternRows(6, true)];
    }
    if (elapsed >= this.motorcycleAt) {
      if(this.safeLane===1) this.safeLane=this.random()<.5?0:2;
      this.motorcycleAt=elapsed+this.delay(14,18);
      return [{kind:'group',pattern:'vehicle-hop',safeLane:this.safeLane,vehicle:true,
        obstacles:[{kind:'motorcycle',safeLane:this.safeLane},{kind:'rock',lane:this.safeLane,large:false}],
        rewards:[{lane:this.safeLane,shape:'arc',count:3}]}];
    }
    return this.patternRows();
  }
  patternRows(count = 4, powerRun = false) {
    const options=['slalom','jump-dodge','risk-reward'].filter(p=>p!==this.lastPattern);
    const pattern=options[Math.min(options.length-1,Math.floor(this.random()*options.length))];
    this.lastPattern=pattern;
    const start=this.safeLane, rows=[];
    let rewardExit = null;
    for(let i=0;i<count;i++) {
      this.safeLane=rewardExit ?? this.adjacent(this.safeLane);
      rewardExit=null;
      const lane=this.safeLane;
      const jump=pattern==='jump-dodge' && i%2===0;
      const risk=pattern==='risk-reward' && i%2===0;
      const other=[0,1,2].filter(n=>n!==lane);
      const obstacles=other.map(n=>({lane:n,kind:'cone'}));
      const rewards=[];
      if(jump) {
        obstacles.push({lane,kind:'rock',large:false});
        rewards.push({lane,shape:'arc',count:5});
      } else if(risk) {
        const rockLane=other.find(n=>Math.abs(n-lane)===1);
        Object.assign(obstacles.find(o=>o.lane===rockLane), {kind:'rock',large:this.random()<.35});
        rewardExit=rockLane;
        rewards.push({lane:rockLane,shape:'arc',count:5});
        rewards.push({lane,shape:'flat',count:1});
      } else if (i%2===0) rewards.push({lane,shape:'flat',count:2});
      // Mix jumpable rocks into walls: multiple viable choices, not just a corridor.
      for (const obstacle of obstacles) {
        if (obstacle.kind === 'cone' && !(jump && i === 0) && this.random() < .7) {
          obstacle.kind='rock'; obstacle.large=this.random()<.35;
        }
      }
      // A one-obstacle row offers two genuinely clear lanes, not only two jumps.
      if (i % 4 === 3 && !jump) {
        const keep=obstacles.find(o=>o.lane!==lane);
        obstacles.splice(0,obstacles.length,keep);
        keep.kind='rock';
      }
      if (powerRun) {
        // Ground rewards in the obstacle lane let protection buy a direct route.
        rewards.splice(0,rewards.length,{lane,shape:'arc',count:5});
        if (!obstacles.some(o=>o.lane===lane)) obstacles.push({lane,kind:'rock',large:false});
      }
      rows.push({kind:'group',pattern,safeLane:lane,obstacles,rewards,powerRun,action:jump?'jump':'dodge'});
    }
    if(!reachableLanes(rows,start).includes(this.safeLane)) throw new Error('Unreachable runner pattern');
    return rows;
  }
}
