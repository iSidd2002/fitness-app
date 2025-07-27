import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function makeUserAdmin() {
  const email = "sharmasiddhant2002@gmail.com" // Replace with your email
  
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
      select: { id: true, name: true, email: true, role: true }
    })
    
    console.log("✅ User updated to admin:", user)
  } catch (error) {
    console.error("❌ Error updating user:", error)
  } finally {
    await prisma.$disconnect()
  }
}

makeUserAdmin()
