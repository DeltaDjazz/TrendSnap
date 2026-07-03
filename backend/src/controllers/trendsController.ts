import { Request, Response } from 'express'

export async function getTrends(req: Request, res: Response){
  // Minimal stub: return empty structure for now
  res.json({ data: {}, meta: { date: new Date().toISOString().slice(0,10) } })
}
