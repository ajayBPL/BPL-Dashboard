import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.projectAssignment.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.initiative.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // Create admin users only
  console.log('👥 Creating admin users...');
  
  // Current admin credentials
  const currentAdminPassword = await bcrypt.hash('password123', 12);
  const currentAdmin = await prisma.user.create({
    data: {
      email: 'admin@bpl.com',
      password: currentAdminPassword,
      name: 'System Administrator',
      role: 'ADMIN',
      designation: 'System Admin',
      department: 'IT',
      skills: ['System Administration', 'Database Management', 'Security'],
      workloadCap: 100,
      overBeyondCap: 20,
      notificationSettings: {
        email: true,
        inApp: true,
        projectUpdates: true,
        deadlineReminders: true,
        weeklyReports: true
      }
    }
  });

  // New admin credentials
  const newAdminPassword = await bcrypt.hash('AdminBpl@2025', 12);
  const newAdmin = await prisma.user.create({
    data: {
      email: 'admin@bpl.in',
      password: newAdminPassword,
      name: 'Administrator',
      role: 'ADMIN',
      designation: 'System Admin',
      department: 'IT',
      skills: ['System Administration', 'Database Management', 'Security'],
      workloadCap: 100,
      overBeyondCap: 20,
      notificationSettings: {
        email: true,
        inApp: true,
        projectUpdates: true,
        deadlineReminders: true,
        weeklyReports: true
      }
    }
  });

  console.log(`✅ Created ${2} admin users`);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`👥 Admin Users: 2`);
  console.log(`📊 Projects: 0`);
  console.log(`🔗 Assignments: 0`);
  console.log(`🎯 Milestones: 0`);
  console.log(`💡 Initiatives: 0`);
  console.log(`💬 Comments: 0`);
  console.log(`🔔 Notifications: 0`);
  console.log(`📋 Activity Logs: 0`);
  
  console.log('\n🔐 Admin Login Credentials:');
  console.log('Admin 1: admin@bpl.com / password123');
  console.log('Admin 2: admin@bpl.in / AdminBpl@2025');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });









