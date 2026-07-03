import { Router } from 'express'
import { getTrends } from '../controllers/trendsController'

const router = Router()
router.get('/', getTrends)

export default router
