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
  { id: 'dps', name: 'DPS' }
]

export const Jobs: Job[] = [
  { id: 'drk', name: 'Dark Knight', role: 'tank' },
  { id: 'gnb', name: 'Gunbreaker', role: 'tank' },
  { id: 'pld', name: 'Paladin', role: 'tank' },
  { id: 'war', name: 'Warrior', role: 'tank' },
  { id: 'ast', name: 'Astrologian', role: 'heal' },
  { id: 'sge', name: 'Sage', role: 'heal' },
  { id: 'sch', name: 'Scholar', role: 'heal' },
  { id: 'whm', name: 'White Mage', role: 'heal' },
  { id: 'brd', name: 'Bard', role: 'dps' },
  { id: 'blm', name: 'Black Mage', role: 'dps' },
  { id: 'dnc', name: 'Dancer', role: 'dps' },
  { id: 'drg', name: 'Dragoon', role: 'dps' },
  { id: 'mch', name: 'Machinist', role: 'dps' },
  { id: 'mnk', name: 'Monk', role: 'dps' },
  { id: 'nin', name: 'Ninja', role: 'dps' },
  { id: 'rpr', name: 'Reaper', role: 'dps' },
  { id: 'rdm', name: 'Red Mage', role: 'dps' },
  { id: 'sam', name: 'Samurai', role: 'dps' },
  { id: 'smn', name: 'Summoner', role: 'dps' },
]

export const JobsByRole: RoleWithJobs[] = Roles.reduce((list, role) => {
  list.push({
    ...role,
    jobs: Jobs.filter(j => j.role === role.id)
  })
  return list
}, [] as RoleWithJobs[])
