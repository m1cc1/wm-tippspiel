// All 48 WC2026 teams with flags
export const WC2026_TEAMS = [
  // Group A
  { name:'Mexico',              flag:'🇲🇽', group:'A' },
  { name:'South Africa',        flag:'🇿🇦', group:'A' },
  { name:'South Korea',         flag:'🇰🇷', group:'A' },
  { name:'Czechia',             flag:'🇨🇿', group:'A' },
  // Group B
  { name:'Canada',              flag:'🇨🇦', group:'B' },
  { name:'Bosnia & Herz.',      flag:'🇧🇦', group:'B' },
  { name:'Portugal',            flag:'🇵🇹', group:'B' },
  { name:'DR Congo',            flag:'🇨🇩', group:'B' },
  // Group C
  { name:'Brazil',              flag:'🇧🇷', group:'C' },
  { name:'Scotland',            flag:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', group:'C' },
  { name:'Morocco',             flag:'🇲🇦', group:'C' },
  { name:'Haiti',               flag:'🇭🇹', group:'C' },
  // Group D
  { name:'USA',                 flag:'🇺🇸', group:'D' },
  { name:'Paraguay',            flag:'🇵🇾', group:'D' },
  { name:'Türkiye',             flag:'🇹🇷', group:'D' },
  { name:'Australia',           flag:'🇦🇺', group:'D' },
  // Group E
  { name:'Spain',               flag:'🇪🇸', group:'E' },
  { name:'Egypt',               flag:'🇪🇬', group:'E' },
  { name:'Austria',             flag:'🇦🇹', group:'E' },
  { name:'Jordan',              flag:'🇯🇴', group:'E' },
  // Group F
  { name:'Japan',               flag:'🇯🇵', group:'F' },
  { name:'Tunisia',             flag:'🇹🇳', group:'F' },
  { name:'Colombia',            flag:'🇨🇴', group:'F' },
  { name:'Ivory Coast',         flag:'🇨🇮', group:'F' },
  // Group G
  { name:'Germany',             flag:'🇩🇪', group:'G' },
  { name:'Saudi Arabia',        flag:'🇸🇦', group:'G' },
  { name:'Sweden',              flag:'🇸🇪', group:'G' },
  { name:'New Zealand',         flag:'🇳🇿', group:'G' },
  // Group H
  { name:'Netherlands',         flag:'🇳🇱', group:'H' },
  { name:'Senegal',             flag:'🇸🇳', group:'H' },
  { name:'Iran',                flag:'🇮🇷', group:'H' },
  { name:'Ecuador',             flag:'🇪🇨', group:'H' },
  // Group I
  { name:'France',              flag:'🇫🇷', group:'I' },
  { name:'Norway',              flag:'🇳🇴', group:'I' },
  { name:'Iraq',                flag:'🇮🇶', group:'I' },
  { name:'Algeria',             flag:'🇩🇿', group:'I' },
  // Group J
  { name:'Argentina',           flag:'🇦🇷', group:'J' },
  { name:'Qatar',               flag:'🇶🇦', group:'J' },
  { name:'Ghana',               flag:'🇬🇭', group:'J' },
  { name:'Uzbekistan',          flag:'🇺🇿', group:'J' },
  // Group K
  { name:'England',             flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', group:'K' },
  { name:'Croatia',             flag:'🇭🇷', group:'K' },
  { name:'Panama',              flag:'🇵🇦', group:'K' },
  { name:'Belgium',             flag:'🇧🇪', group:'K' },
  // Group L
  { name:'Uruguay',             flag:'🇺🇾', group:'L' },
  { name:'Cape Verde',          flag:'🇨🇻', group:'L' },
  { name:'Curaçao',             flag:'🇨🇼', group:'L' },
  { name:'Switzerland',         flag:'🇨🇭', group:'L' },
]

// Knockout stage structure (TBD teams shown as placeholders)
export const KNOCKOUT_STAGES = [
  { label: 'Round of 32', short: 'R32' },
  { label: 'Round of 16', short: 'R16' },
  { label: 'Quarter-final', short: 'QF' },
  { label: 'Semi-final', short: 'SF' },
  { label: 'Third place', short: '3rd' },
  { label: 'Final', short: 'Final' },
]

// All stages for dropdown filter
export const STAGE_FILTERS = [
  { value: 'all',       label: 'All stages' },
  { value: 'group',     label: 'Group stage' },
  { value: 'knockout',  label: 'Knockout stage' },
  { value: 'Group A',   label: 'Group A' },
  { value: 'Group B',   label: 'Group B' },
  { value: 'Group C',   label: 'Group C' },
  { value: 'Group D',   label: 'Group D' },
  { value: 'Group E',   label: 'Group E' },
  { value: 'Group F',   label: 'Group F' },
  { value: 'Group G',   label: 'Group G' },
  { value: 'Group H',   label: 'Group H' },
  { value: 'Group I',   label: 'Group I' },
  { value: 'Group J',   label: 'Group J' },
  { value: 'Group K',   label: 'Group K' },
  { value: 'Group L',   label: 'Group L' },
  { value: 'Round of 32',  label: 'Round of 32' },
  { value: 'Round of 16',  label: 'Round of 16' },
  { value: 'Quarter-final',label: 'Quarter-finals' },
  { value: 'Semi-final',   label: 'Semi-finals' },
  { value: 'Third place',  label: 'Third place' },
  { value: 'Final',        label: 'Final' },
]

// Knockout stage badge colors
export const KNOCKOUT_BADGE: Record<string, { bg: string; color: string }> = {
  'Round of 32':  { bg: 'rgba(139,92,246,0.1)',  color: '#7c3aed' },
  'Round of 16':  { bg: 'rgba(59,130,246,0.1)',  color: '#1d4ed8' },
  'Quarter-final':{ bg: 'rgba(16,185,129,0.1)',  color: '#065f46' },
  'Semi-final':   { bg: 'rgba(245,158,11,0.1)',  color: '#92400e' },
  'Third place':  { bg: 'rgba(107,114,128,0.1)', color: '#374151' },
  'Final':        { bg: 'rgba(212,193,154,0.2)', color: '#78350f' },
}

export function isKnockout(groupStage: string): boolean {
  return ['Round of 32','Round of 16','Quarter-final','Semi-final','Third place','Final'].includes(groupStage)
}
