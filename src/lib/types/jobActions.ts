export const actionLanguages = ['en', 'fr', 'de', 'ja'] as const
export type ActionLanguage = (typeof actionLanguages)[number]

export type JobAction = {
  id: number,
  icon: string
  name: { [lang in ActionLanguage]: string }
}
