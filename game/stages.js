export const STAGES = [
  {name:'Tierra', score:0},
  {name:'Cantera', score:500},
  {name:'Cristal', score:1200},
  {name:'Hielo', score:2200},
  {name:'Volcán', score:3500},
];
export function stageForScore(score) {
  let index = 0;
  for (let i = 1; i < STAGES.length; i++) if (score >= STAGES[i].score) index = i;
  return {...STAGES[index], index};
}
export function hitsRock(player, baseY, rock, previousZ, dimensions, unsaltable = false) {
  return Math.abs(player.x - rock.x) < dimensions.width / 2 + 0.3 &&
    player.z >= Math.min(previousZ, rock.z) - dimensions.depth / 2 - 0.3 &&
    player.z <= Math.max(previousZ, rock.z) + dimensions.depth / 2 + 0.3 &&
    (unsaltable || player.y - baseY < dimensions.height);
}
