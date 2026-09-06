// Descriptive reasons only. Duration and sanction type remain operator decisions.
export const penaltyReasons = [
 ['tripping','Tripping'],['hooking','Hooking'],['holding','Holding'],
 ['interference','Interference'],['slashing','Slashing'],['high-sticking','High-sticking'],
 ['cross-checking','Cross-checking'],['elbowing','Elbowing'],['roughing','Roughing'],
 ['boarding','Boarding'],['charging','Charging'],['checking-from-behind','Checking from behind'],
 ['head-contact','Illegal check to the head or neck'],['delay','Delay of game'],
 ['too-many-players','Too many players'],['unsportsmanlike','Unsportsmanlike conduct'],['other','Other reason'],
].map(([id,label])=>({id,label}));
export const penaltyReasonLabel=id=>penaltyReasons.find(reason=>reason.id===id)?.label||'';
