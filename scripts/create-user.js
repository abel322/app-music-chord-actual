const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcrypt')

const prisma = new PrismaClient()

async function createUser() {
  const email = 'admin@test.com'
  const password = 'password123'
  const name = 'Admin User'

  try {
    // Verificar si ya existe
    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      console.log('❌ El usuario ya existe')
      console.log('📧 Email:', email)
      console.log('🔑 Contraseña:', password)
      return
    }

    // Crear usuario
    const hashedPassword = await hash(password, 12)
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      }
    })

    console.log('✅ Usuario creado exitosamente!')
    console.log('📧 Email:', email)
    console.log('🔑 Contraseña:', password)
    console.log('👤 ID:', user.id)
    console.log('\n🚀 Ahora puedes hacer login en: http://localhost:3000/login')
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createUser()
