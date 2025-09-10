import { PrismaClient } from '@prisma/client';
import { mockDb } from './mockDb';

// Database service that can fallback to mock data
class DatabaseService {
  private prisma: PrismaClient;
  private useMock: boolean = false;

  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  // Test database connection
  async testConnection(): Promise<boolean> {
    try {
      await this.prisma.$connect();
      await this.prisma.$disconnect();
      return true;
    } catch (error) {
      console.log('Database connection failed, falling back to mock data');
      this.useMock = true;
      return false;
    }
  }

  // User operations
  async findUserByEmail(email: string) {
    if (this.useMock) {
      return await mockDb.findUserByEmail(email);
    }
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        designation: true,
        managerId: true,
        department: true,
        skills: true,
        workloadCap: true,
        overBeyondCap: true,
        avatar: true,
        phoneNumber: true,
        timezone: true,
        preferredCurrency: true,
        notificationSettings: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true
      }
    });
    
    if (user) {
      return {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() || null
      };
    }
    return user;
  }

  async findUserById(id: string) {
    if (this.useMock) {
      return await mockDb.findUserById(id);
    }
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        designation: true,
        managerId: true,
        department: true,
        skills: true,
        workloadCap: true,
        overBeyondCap: true,
        avatar: true,
        phoneNumber: true,
        timezone: true,
        preferredCurrency: true,
        notificationSettings: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true
      }
    });
    
    if (user) {
      return {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() || null
      };
    }
    return user;
  }

  async createUser(userData: any) {
    if (this.useMock) {
      return await mockDb.createUser(userData);
    }
    const user = await this.prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        designation: true,
        managerId: true,
        department: true,
        skills: true,
        workloadCap: true,
        overBeyondCap: true,
        avatar: true,
        phoneNumber: true,
        timezone: true,
        preferredCurrency: true,
        notificationSettings: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true
      }
    });
    
    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() || null
    };
  }

  async updateUser(id: string, userData: any) {
    if (this.useMock) {
      return await mockDb.updateUser(id, userData);
    }
    const user = await this.prisma.user.update({
      where: { id },
      data: userData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        designation: true,
        managerId: true,
        department: true,
        skills: true,
        workloadCap: true,
        overBeyondCap: true,
        avatar: true,
        phoneNumber: true,
        timezone: true,
        preferredCurrency: true,
        notificationSettings: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true
      }
    });
    
    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() || null
    };
  }

  async getAllUsers() {
    if (this.useMock) {
      return await mockDb.getAllUsers();
    }
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        designation: true,
        managerId: true,
        department: true,
        skills: true,
        workloadCap: true,
        overBeyondCap: true,
        avatar: true,
        phoneNumber: true,
        timezone: true,
        preferredCurrency: true,
        notificationSettings: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true
      }
    });
    
    return users.map(user => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() || null
    }));
  }

  // Initialize database connection
  async initialize() {
    await this.testConnection();
  }

  // Get Prisma client for direct access when needed
  getPrisma() {
    return this.prisma;
  }

  // Check if using mock data
  isUsingMock() {
    return this.useMock;
  }

  // Activity log operations
  async createActivityLog(data: any) {
    if (this.useMock) {
      // Mock activity log - just log to console
      console.log('Activity Log:', data);
      return { id: `log-${Date.now()}`, ...data };
    }
    return await this.prisma.activityLog.create({ data });
  }

  // Notification operations
  async createNotification(data: any) {
    if (this.useMock) {
      // Mock notification - just log to console
      console.log('Notification:', data);
      return { id: `notif-${Date.now()}`, ...data };
    }
    return await this.prisma.notification.create({ data });
  }
}

export const db = new DatabaseService();
