export const PENALTY_ANIMATION_MS=5000;
const types=new Set(['Penalty added','Penalty served','Penalty ended','Penalty reduced']);
export function observePenaltyEvents(seen,events=[]){
 const fresh=seen===null?[]:events.filter(event=>!seen.has(event.id)&&types.has(event.type));
 return {seen:new Set([...(seen||[]),...events.map(event=>event.id)]),fresh};
}
