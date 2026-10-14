// Time survived drives pace: collecting a reward never abruptly raises difficulty.
// Linear baseline plus logarithmic opening: acceleration never fades to zero.
export function runnerSpeed(seconds) { return 12 + .35 * Math.max(0, seconds) + 8 * Math.log1p(Math.max(0, seconds) / 25); }
export function beatSeconds(seconds) { return 1.55 + .35 * Math.exp(-seconds / 90); }
export function lookAhead(speed) { return Math.max(99, speed * 4.5); }
// Reserve for acceleration before the row reaches the player (max slope .67/s).
export function rowDistance(speed, seconds) { return (speed + 5) * beatSeconds(seconds) + 4; }
