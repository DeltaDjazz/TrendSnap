import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const uri = process.env.MONGODB_URI || ''
export const client = new MongoClient(uri)

export async function connect(){
  if(!uri) return
  await client.connect()
}
