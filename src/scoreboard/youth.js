// Category labels supported by FFHG's current tournament list. These are free
// match labels, not a claim that each club fields every category this season.
export const youthCategories = ['U7', 'U9', 'U11', 'U13', 'U15', 'U18', 'U20'];
export const normalizeCategory = value => youthCategories.includes(value) ? value : '';
export function teamDisplayName(settings, team, translate = text => text) {
  const name = ['HOME', 'AWAY'].includes(settings[team]) ? translate(settings[team]) : settings[team];
  const category = normalizeCategory(settings[`${team}Category`]);
  return category ? `${name} · ${category}` : name;
}
