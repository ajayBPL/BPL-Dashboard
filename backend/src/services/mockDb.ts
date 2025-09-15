import { User } from '../../../shared/types';

// Mock database service for demo purposes
class MockDatabase {
  private users: User[] = [
    {
      id: 'admin-001',
      email: 'admin@bpl.com',
      name: 'System Administrator',
      password: '$2b$12$hPdsJXm4EVdJ3.goh6m14uR6zII8kGBhh8FPCYHftfcR00zz6PjiW', // password123
      role: 'admin',
      designation: 'System Administrator',
      department: 'IT',
      skills: ['System Administration', 'Security', 'Database Management'],
      workloadCap: 100,
      overBeyondCap: 20,
      preferredCurrency: 'USD',
      notificationSettings: {
        email: true,
        inApp: true,
        projectUpdates: true,
        deadlineReminders: true,
        weeklyReports: true
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    },
    {
      id: 'pm-001',
      email: 'sarah.wilson@bpl.com',
      name: 'Sarah Wilson',
      password: '$2b$12$hPdsJXm4EVdJ3.goh6m14uR6zII8kGBhh8FPCYHftfcR00zz6PjiW', // password123
      role: 'program_manager',
      designation: 'Senior Program Manager',
      department: 'Program Management',
      skills: ['Program Management', 'Strategic Planning', 'Stakeholder Management'],
      workloadCap: 100,
      overBeyondCap: 20,
      preferredCurrency: 'USD',
      notificationSettings: {
        email: true,
        inApp: true,
        projectUpdates: true,
        deadlineReminders: true,
        weeklyReports: true
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    },
    {
      id: 'rdm-001',
      email: 'mike.chen@bpl.com',
      name: 'Mike Chen',
      password: '$2b$12$hPdsJXm4EVdJ3.goh6m14uR6zII8kGBhh8FPCYHftfcR00zz6PjiW', // password123
      role: 'rd_manager',
      designation: 'R&D Manager',
      department: 'Research & Development',
      skills: ['Research', 'Innovation', 'Technical Leadership'],
      workloadCap: 100,
      overBeyondCap: 20,
      preferredCurrency: 'USD',
      notificationSettings: {
        email: true,
        inApp: true,
        projectUpdates: true,
        deadlineReminders: true,
        weeklyReports: true
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    },
    {
      id: 'mgr-001',
      email: 'lisa.garcia@bpl.com',
      name: 'Lisa Garcia',
      password: '$2b$12$hPdsJXm4EVdJ3.goh6m14uR6zII8kGBhh8FPCYHftfcR00zz6PjiW', // password123
      role: 'manager',
      designation: 'Team Manager',
      department: 'Operations',
      skills: ['Team Management', 'Process Improvement', 'Quality Assurance'],
      workloadCap: 100,
      overBeyondCap: 20,
      preferredCurrency: 'USD',
      notificationSettings: {
        email: true,
        inApp: true,
        projectUpdates: true,
        deadlineReminders: true,
        weeklyReports: true
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    },
    {
      id: 'emp-001',
      email: 'john.doe@bpl.com',
      name: 'John Doe',
      password: '$2b$12$hPdsJXm4EVdJ3.goh6m14uR6zII8kGBhh8FPCYHftfcR00zz6PjiW', // password123
      role: 'employee',
      designation: 'Software Developer',
      managerId: 'mgr-001',
      department: 'Engineering',
      skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
      workloadCap: 100,
      overBeyondCap: 20,
      preferredCurrency: 'USD',
      notificationSettings: {
        email: true,
        inApp: true,
        projectUpdates: true,
        deadlineReminders: true,
        weeklyReports: false
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    }
  ];

  async getAllUsers(): Promise<User[]> {
    return Promise.resolve([...this.users]);
  }

  async findUserById(id: string): Promise<User | null> {
    const user = this.users.find(u => u.id === id);
    return Promise.resolve(user || null);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const user = this.users.find(u => u.email === email);
    return Promise.resolve(user || null);
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: userData.email!,
      name: userData.name!,
      password: userData.password!, // Store the hashed password
      role: userData.role!,
      designation: userData.designation!,
      managerId: userData.managerId,
      department: userData.department,
      skills: userData.skills || [],
      workloadCap: userData.workloadCap || 100,
      overBeyondCap: userData.overBeyondCap || 20,
      preferredCurrency: userData.preferredCurrency || 'USD',
      notificationSettings: userData.notificationSettings || {
        email: true,
        inApp: true,
        projectUpdates: true,
        deadlineReminders: true,
        weeklyReports: false
      },
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.users.push(newUser);
    return Promise.resolve(newUser);
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return Promise.resolve(null);
    }

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...userData,
      updatedAt: new Date().toISOString()
    };

    return Promise.resolve(this.users[userIndex]);
  }

  async deleteUser(id: string): Promise<boolean> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return Promise.resolve(false);
    }

    this.users.splice(userIndex, 1);
    return Promise.resolve(true);
  }
}

export const mockDb = new MockDatabase();
