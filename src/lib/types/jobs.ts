export type Job = {
  id: string
  name: string
  role: string
  hasTemplates?: boolean
}

type Role = {
  id: string
  name: string
  colorClass: string
}

interface RoleWithJobs extends Role {
  jobs: Job[]
}

export const Roles: Role[] = [
  { id: 'tank', name: 'Tank', colorClass: 'bg-blue-600 bg-opacity-10' },
  { id: 'heal', name: 'Heal', colorClass: 'bg-green-600 bg-opacity-10' },
  { id: 'melee', name: 'Melee DPS', colorClass: 'bg-red-600 bg-opacity-10' },
  { id: 'rangedMagic', name: 'Magical Ranged DPS', colorClass: 'bg-red-600 bg-opacity-10' },
  { id: 'rangedPhysical', name: 'Physical Ranged DPS', colorClass: 'bg-red-600 bg-opacity-10' },
]

export const Jobs: Job[] = [
  { id: 'ast', name: 'Astrologian', role: 'heal', hasTemplates: true },
  { id: 'blm', name: 'Black Mage', role: 'rangedMagic', hasTemplates: true },
  { id: 'brd', name: 'Bard', role: 'rangedPhysical', hasTemplates: true },
  { id: 'dnc', name: 'Dancer', role: 'rangedPhysical', hasTemplates: true },
  { id: 'drg', name: 'Dragoon', role: 'melee', hasTemplates: true },
  { id: 'drk', name: 'Dark Knight', role: 'tank', hasTemplates: true },
  { id: 'gnb', name: 'Gunbreaker', role: 'tank', hasTemplates: true },
  { id: 'mch', name: 'Machinist', role: 'rangedPhysical', hasTemplates: true },
  { id: 'mnk', name: 'Monk', role: 'melee', hasTemplates: true },
  { id: 'nin', name: 'Ninja', role: 'melee', hasTemplates: true },
  { id: 'pct', name: 'Pictomancer', role: 'rangedMagic', hasTemplates: true },
  { id: 'pld', name: 'Paladin', role: 'tank', hasTemplates: true },
  { id: 'rdm', name: 'Red Mage', role: 'rangedMagic', hasTemplates: true },
  { id: 'rpr', name: 'Reaper', role: 'melee', hasTemplates: true },
  { id: 'sam', name: 'Samurai', role: 'melee', hasTemplates: true },
  { id: 'sch', name: 'Scholar', role: 'heal', hasTemplates: true },
  { id: 'sge', name: 'Sage', role: 'heal', hasTemplates: true },
  { id: 'smn', name: 'Summoner', role: 'rangedMagic', hasTemplates: true },
  { id: 'vpr', name: 'Viper', role: 'melee', hasTemplates: true },
  { id: 'war', name: 'Warrior', role: 'tank', hasTemplates: true },
  { id: 'whm', name: 'White Mage', role: 'heal', hasTemplates: true }
]

export const JobsByRole: RoleWithJobs[] = Roles.reduce((list, role) => {
  list.push({
    ...role,
    jobs: Jobs.filter(j => j.role === role.id)
  })
  return list
}, [] as RoleWithJobs[])
