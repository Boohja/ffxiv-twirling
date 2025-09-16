export type Job = {
  id: string
  name: string
  role: string
}

type Role = {
  id: string
  name: string
}

interface RoleWithJobs extends Role {
  jobs: Job[]
}

export const Roles: Role[] = [
  { id: 'heal', name: 'Heal' },
  { id: 'tank', name: 'Tank' },
  { id: 'melee', name: 'Melee DPS' },
  { id: 'rangedMagic', name: 'Magical Ranged DPS' },
  { id: 'rangedPhysical', name: 'Physical Ranged DPS' },
]

export const Jobs: Job[] = [
  { id: 'ast', name: 'Astrologian', role: 'heal' },
  { id: 'blm', name: 'Black Mage', role: 'rangedMagic' },
  { id: 'brd', name: 'Bard', role: 'rangedPhysical' },
  { id: 'dnc', name: 'Dancer', role: 'rangedPhysical' },
  { id: 'drg', name: 'Dragoon', role: 'melee' },
  { id: 'drk', name: 'Dark Knight', role: 'tank' },
  { id: 'gnb', name: 'Gunbreaker', role: 'tank' },
  { id: 'mch', name: 'Machinist', role: 'rangedPhysical' },
  { id: 'mnk', name: 'Monk', role: 'melee' },
  { id: 'nin', name: 'Ninja', role: 'melee' },
  { id: 'pct', name: 'Pictomancer', role: 'rangedMagic' },
  { id: 'pld', name: 'Paladin', role: 'tank' },
  { id: 'rdm', name: 'Red Mage', role: 'rangedMagic' },
  { id: 'rpr', name: 'Reaper', role: 'melee' },
  { id: 'sam', name: 'Samurai', role: 'melee' },
  { id: 'sch', name: 'Scholar', role: 'heal' },
  { id: 'sge', name: 'Sage', role: 'heal' },
  { id: 'smn', name: 'Summoner', role: 'rangedMagic' },
  { id: 'war', name: 'Warrior', role: 'tank' },
  { id: 'whm', name: 'White Mage', role: 'heal' }
]

export const JobsByRole: RoleWithJobs[] = Roles.reduce((list, role) => {
  list.push({
    ...role,
    jobs: Jobs.filter(j => j.role === role.id)
  })
  return list
}, [] as RoleWithJobs[])
