import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: [] // Desativa todos os logs do Prisma
})

export default prisma
