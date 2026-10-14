/**
 * rwandaLocations.js — Intara, Akarere, n'Umurenge (Province > District > Sector).
 *
 * Real provinces and all 30 districts. Kigali's 35 sectors are complete
 * (that's where the listed places are); other districts list their main
 * sectors only — extend them here when places open there.
 */
export const PROVINCES = [
  {
    key: 'kigali',
    label: 'Kigali City',
    districts: [
      { key: 'nyarugenge', label: 'Nyarugenge', sectors: ['Gitega', 'Kanyinya', 'Kigali', 'Kimisagara', 'Mageragere', 'Muhima', 'Nyakabanda', 'Nyamirambo', 'Nyarugenge', 'Rwezamenyo'] },
      { key: 'gasabo', label: 'Gasabo', sectors: ['Bumbogo', 'Gatsata', 'Gikomero', 'Gisozi', 'Jabana', 'Jali', 'Kacyiru', 'Kimihurura', 'Kimironko', 'Kinyinya', 'Ndera', 'Nduba', 'Remera', 'Rusororo', 'Rutunga'] },
      { key: 'kicukiro', label: 'Kicukiro', sectors: ['Gahanga', 'Gatenga', 'Gikondo', 'Kagarama', 'Kanombe', 'Kicukiro', 'Kigarama', 'Masaka', 'Niboye', 'Nyarugunga'] },
    ],
  },
  {
    key: 'northern',
    label: 'Northern Province',
    districts: [
      { key: 'musanze', label: 'Musanze', sectors: ['Muhoza', 'Cyuve', 'Kinigi', 'Busogo'] },
      { key: 'burera', label: 'Burera', sectors: ['Butaro', 'Cyanika', 'Kinoni'] },
      { key: 'gakenke', label: 'Gakenke', sectors: ['Gakenke', 'Janja', 'Ruli'] },
      { key: 'gicumbi', label: 'Gicumbi', sectors: ['Byumba', 'Kageyo', 'Nyamiyaga'] },
      { key: 'rulindo', label: 'Rulindo', sectors: ['Base', 'Buyoga', 'Ngoma'] },
    ],
  },
  {
    key: 'southern',
    label: 'Southern Province',
    districts: [
      { key: 'huye', label: 'Huye', sectors: ['Ngoma', 'Tumba', 'Mukura'] },
      { key: 'nyanza', label: 'Nyanza', sectors: ['Busasamana', 'Kigoma', 'Muyira'] },
      { key: 'gisagara', label: 'Gisagara', sectors: ['Save', 'Mukindo'] },
      { key: 'nyaruguru', label: 'Nyaruguru', sectors: ['Ruramba', 'Ngera'] },
      { key: 'muhanga', label: 'Muhanga', sectors: ['Nyamabuye', 'Kibangu', 'Shyogwe'] },
      { key: 'kamonyi', label: 'Kamonyi', sectors: ['Nyamiyaga', 'Rukoma'] },
      { key: 'ruhango', label: 'Ruhango', sectors: ['Kinazi', 'Byimana'] },
      { key: 'nyamagabe', label: 'Nyamagabe', sectors: ['Kibirizi', 'Gasaka'] },
    ],
  },
  {
    key: 'eastern',
    label: 'Eastern Province',
    districts: [
      { key: 'rwamagana', label: 'Rwamagana', sectors: ['Kigabiro', 'Muhazi', 'Fumbwe'] },
      { key: 'kayonza', label: 'Kayonza', sectors: ['Mukarange', 'Rwinkwavu'] },
      { key: 'kirehe', label: 'Kirehe', sectors: ['Kirehe', 'Nyarubuye'] },
      { key: 'ngoma', label: 'Ngoma', sectors: ['Kibungo', 'Zaza'] },
      { key: 'bugesera', label: 'Bugesera', sectors: ['Nyamata', 'Rilima', 'Ruhuha'] },
      { key: 'nyagatare', label: 'Nyagatare', sectors: ['Nyagatare', 'Rukomo'] },
      { key: 'gatsibo', label: 'Gatsibo', sectors: ['Kiziguro', 'Kabarore'] },
    ],
  },
  {
    key: 'western',
    label: 'Western Province',
    districts: [
      { key: 'rubavu', label: 'Rubavu', sectors: ['Gisenyi', 'Nyamyumba', 'Rugerero'] },
      { key: 'rusizi', label: 'Rusizi', sectors: ['Kamembe', 'Nyakabuye'] },
      { key: 'nyamasheke', label: 'Nyamasheke', sectors: ['Kagano', 'Bushenge'] },
      { key: 'karongi', label: 'Karongi', sectors: ['Rubengera', 'Bwishyura'] },
      { key: 'rutsiro', label: 'Rutsiro', sectors: ['Boneza', 'Kivumu'] },
      { key: 'ngororero', label: 'Ngororero', sectors: ['Ngororero', 'Kavumu'] },
      { key: 'nyabihu', label: 'Nyabihu', sectors: ['Mukamira', 'Jenda'] },
    ],
  },
];

export function getDistricts(provinceKey) {
  return PROVINCES.find((p) => p.key === provinceKey)?.districts || [];
}

export function getSectors(provinceKey, districtKey) {
  return getDistricts(provinceKey).find((d) => d.key === districtKey)?.sectors || [];
}

export function findDistrictLabel(provinceKey, districtKey) {
  return getDistricts(provinceKey).find((d) => d.key === districtKey)?.label || '';
}

export default { PROVINCES, getDistricts, getSectors, findDistrictLabel };
