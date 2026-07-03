import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import trendsRouter from './routes/trends'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static('uploads'))

app.use('/api/trends', trendsRouter)

const port = process.env.PORT || 4000
app.listen(port, ()=> console.log(`Server listening on ${port}`))

export default app
