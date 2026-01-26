import { Jobs } from '$lib/jobs';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs'

type JobAction = {
  id: string,
  name: string,
  icon: string
}

export const GET = (({ params }) => {
  const actions: JobAction[] = []
  const job = Jobs.find(j => j.id === params.job)
  if (job) {
    const files = fs.readdirSync('.')
  }
  return json(actions)
}) satisfies RequestHandler;
