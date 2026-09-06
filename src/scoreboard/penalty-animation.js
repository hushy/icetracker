export const PENALTY_ANIMATION_MS=5000;
const types=new Set(['Penalty added','Penalty started','Penalty served','Penalty ended','Penalty reduced']);
export function observePenaltyEvents(seen,events=[],disabled=false){
 const fresh=seen===null||disabled?[]:events.filter(event=>!seen.has(event.id)&&types.has(event.type));
 return {seen:new Set([...(seen||[]),...events.map(event=>event.id)]),fresh};
}
