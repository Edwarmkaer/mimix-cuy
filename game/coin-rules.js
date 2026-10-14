import {jumpHeight} from './rules.js';
import {collectsBottle} from './powerup-rules.js';
export function coinTrail(z, {shape='flat',count=5,speed=12,blockers=[]} = {}) {
  return Array.from({length:count},(_,i)=>{
    const t=count===1?.5:.2 + .6*i/(count-1);
    return shape==='arc' ? {z:z + (.5-t)*1.2*speed,y:1+jumpHeight(t,0)} : {z:z+8-i*2.2,y:1};
  }).filter(point => blockers.every(obstacle =>
    Math.abs(point.z-obstacle.z) > obstacle.depth/2 + .55 || point.y > obstacle.height + .55));
}
export function collectsCoin(player, coin, previousZ) {
  return Math.abs(player.y + 1 - coin.y) < .8 && collectsBottle(player.x,player.z,coin.x,previousZ,coin.z);
}
