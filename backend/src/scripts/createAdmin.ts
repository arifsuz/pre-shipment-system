import { prisma } from '../utils/database';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  try {
    const username_admin = process.env.ADMIN_USERNAME;
    const name_admin = process.env.ADMIN_NAME;
    const email_admin = process.env.ADMIN_EMAIL;
    const defaultPassword = process.env.ADMIN_PASSWORD;

    if (!username_admin || !name_admin || !email_admin || !defaultPassword) {
      throw new Error('Missing required ADMIN_* environment variables');
    }

    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    
    await prisma.user.upsert({
      where: { email: email_admin },
      update: {},
      create: {
        email: email_admin,
        nama: name_admin,
        username: username_admin,
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