import 'dotenv/config'; import bcrypt from 'bcryptjs'; import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
const depts = [['Civil Engineering','CVE'],['Computer Science','CSE'],['Electronics & Communication','ECE'],['Electrical & Electronics','EEE'],['Mechanical','MCE']]
for (const [name, shortName] of depts) await p.department.upsert({ where:{shortName}, update:{}, create:{name,shortName} })
for (const name of ['Football','Volleyball','Basketball','Tug of War','Cricket','Chess','Table Tennis','Carrom']) await p.sport.upsert({ where:{name}, update:{}, create:{name} })
if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === 'change-me-now') { console.error('Set a real ADMIN_PASSWORD in .env first'); process.exit(1) }
const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12)
await p.admin.upsert({ where:{email:process.env.ADMIN_EMAIL}, update:{password:hash}, create:{ email:process.env.ADMIN_EMAIL, password:hash } })
console.log('Seeded'); await p.$disconnect()
