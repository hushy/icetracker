export const DEFAULT_HORN = 'industrial';
export const HORN_VOLUME = 70;
export const industrialHorn = { label: 'Industrial air horn', source: 'https://freesound.org/people/mcpable/sounds/131930/', credit: 'mcpable' };
// Existing saved choices intentionally migrate to the fixed operator horn.
export const normalizeHorn = () => DEFAULT_HORN;
