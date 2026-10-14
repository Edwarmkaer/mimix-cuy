import test from 'node:test';
import assert from 'node:assert/strict';
import {SpawnPlanner,reachableLanes} from '../game/spawn-planner.js';
import {runnerSpeed,rowDistance,beatSeconds,lookAhead} from '../game/difficulty.js';
import {coinTrail,collectsCoin} from '../game/coin-rules.js';

test('patterns require action, preserve reachable exits and reward routes',()=>{
 let seed=42;
 const planner=new SpawnPlanner(()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296));
 const kinds=new Set(); let start=1,last='';
 for(let t=0;t<10000;t+=2){
  let rows=planner.group(t);
  if(rows[0].bottleLane !== undefined){ start=rows[0].safeLane; rows=rows.slice(1); }
  if(rows[0].vehicle){ assert.ok(reachableLanes(rows,start).length); start=rows[0].safeLane; continue; }
  if(rows[0].kind!=='group'){start=rows[0].safeLane;continue;}
  const pattern=rows[0].pattern;kinds.add(pattern);assert.notEqual(pattern,last);last=pattern;
  assert.ok(reachableLanes(rows,start).length);
  // Staying grounded in any fixed lane cannot solve the whole sequence.
  for(let lane=0;lane<3;lane++) assert.ok(rows.some(r=>r.obstacles.some(o=>o.lane===lane)));
  rows.forEach((row,i)=>{
   assert.ok(row.obstacles.length>=1);
   for(const reward of row.rewards){
    const obstacle=row.obstacles.find(o=>o.lane===reward.lane);
    assert.notEqual(obstacle?.kind,'cone');
    if(reward.shape==='arc') assert.equal(obstacle?.kind,'rock');
    if(i+1<rows.length) assert.ok(Math.abs(reward.lane-rows[i+1].safeLane)<=1);
   }
  });
  start=rows.at(-1).safeLane;
 }
 assert.equal(kinds.size,3);
});
test('time-based pace remains unbounded with usable action intervals',()=>{
 let previous=0;
 for(const t of [0,30,60,120,600,3600,86400]){
  const speed=runnerSpeed(t);assert.ok(speed>previous);previous=speed;
  assert.ok(beatSeconds(t)>=1.55); // jump 1.2s; camera lane cooldown 1s
  assert.ok(rowDistance(speed,t)/(speed+3)>1.55);
  assert.ok(lookAhead(speed)/speed>=4.5);
 }
 assert.ok(runnerSpeed(600)>32);
});
test('aerial coin trails match jump and cannot be collected from ground',()=>{
 const points=coinTrail(0,{shape:'arc',count:5,speed:20});
 assert.ok(points[2].y>3.5);
 const coin={x:0,y:points[2].y,z:2};
 assert.equal(collectsCoin({x:0,y:.02,z:2},coin,0),false);
 assert.equal(collectsCoin({x:0,y:2.8,z:2},coin,0),true);
 assert.equal(collectsCoin({x:2.5,y:2.8,z:2},coin,0),false);
});
test('all-cone walls are rejected by reachability check',()=>{
 assert.deepEqual(reachableLanes([{kind:'group',obstacles:[0,1,2].map(lane=>({lane,kind:'cone'}))}]),[]);
});

test('rocks predominate and both one-route and two-clear-route rows exist',()=>{
 let seed=83;
 const p=new SpawnPlanner(()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296));
 let rocks=0,cones=0,twoClear=0,oneRoute=0;
 for(let n=0;n<500;n++) for(const row of p.patternRows()){
  for(const o of row.obstacles) o.kind==='rock'?rocks++:cones++;
  if(row.obstacles.length===1) twoClear++;
  if(row.obstacles.filter(o=>o.kind==='cone').length===2) oneRoute++;
 }
 assert.ok(rocks>cones*2);assert.ok(twoClear>0);assert.ok(oneRoute>0);
});
test('bottle precedes six playable challenge rows and motorcycles become eligible sooner',()=>{
 const p=new SpawnPlanner(()=>.5);
 assert.equal(p.motorcycleAt,16);
 p.powerupAt=0;
 const rows=p.group(1);
 assert.equal(rows[0].bottleLane,1); assert.ok(rows[0].obstacles.length>=2); assert.equal(rows.length,7);
 const challenges=rows.slice(1);
 assert.ok(challenges.every(r=>r.powerRun && r.obstacles.length>0));
 assert.ok(reachableLanes(challenges,rows[0].safeLane).length);
 assert.ok(challenges.every(r=>r.rewards.some(c=>c.shape==='arc' && r.obstacles.some(o=>o.lane===c.lane))));
});

test('vehicle arrives in a mixed row with a jumpable exit',()=>{
 const p=new SpawnPlanner(()=>.5); p.motorcycleAt=0;
 const rows=p.group(1), row=rows[0];
 assert.equal(row.vehicle,true);
 assert.equal(row.obstacles.find(o=>o.lane===row.safeLane).kind,'rock');
 assert.equal(row.obstacles.filter(o=>o.kind==='motorcycle').length,1);
 assert.deepEqual(reachableLanes(rows,1),[row.safeLane]);
});
test('coins keep physical clearance from small and large rocks',()=>{
 for(const speed of [12,35,80,200]) for(const height of [1.15,2.1]) for(const shape of ['flat','arc']){
  const blockers=[{z:0,height,depth:2.1}];
  const points=coinTrail(0,{shape,count:5,speed,blockers});
  assert.ok(points.length);
  for(const p of points) assert.ok(Math.abs(p.z)>1.05+.55 || p.y>height+.55);
 }
});
test('speed keeps a sustained increase late in a run',()=>{
 assert.ok(runnerSpeed(120)>60);
 assert.ok(runnerSpeed(600)-runnerSpeed(540)>=21);
});
