export const DEFAULT_HORN = 'icebreaker';
export const hornOptions = [
  { id: 'icebreaker', label: 'Deep ship horn', description: 'Recorded icebreaker horn · low and powerful', source: 'https://freesound.org/people/trezz77/sounds/546528/', credit: 'trezz77' },
  { id: 'industrial', label: 'Industrial air horn', description: 'Recorded industrial horn · raw and direct', source: 'https://freesound.org/people/mcpable/sounds/131930/', credit: 'mcpable' },
  { id: 'echo', label: 'Short horn with echo', description: 'Designed air-horn effect · short blast with echo', source: 'https://freesound.org/people/guitarguy1985/sounds/68999/', credit: 'guitarguy1985' },
];
// Retired crowd and synthesized sounds migrate to the new default.
export const normalizeHorn = value => hornOptions.some(option => option.id === value) ? value : DEFAULT_HORN;
