// backend/src/scripts/createAdmin.ts
import { prisma } from '../utils/database';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  try {
    const defaultPassword = process.env.ADMIN_PASSWORD;
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    
    await prisma.user.upsert({
      where: { email: 'admin@pse-system.com' },
      update: {},
      create: {
        email: 'admin@pse-system.com',
        nama: 'System Administrator',
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    
    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@pse-system.com');
    console.log(`🔑 Password: ${defaultPassword}`);
    console.log('⚠️  Please change the password after first login!');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();