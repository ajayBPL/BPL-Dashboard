import { User } from '../../../shared/types';
import fs from 'fs';
import path from 'path';

// File-based mock database for data persistence across systems
class FileBasedMockDatabase {
  private dataDir = path.join(__dirname, '../../data');
  private usersFile = path.join(this.dataDir, 'users.json');
  private projectsFile = path.join(this.dataDir, 'projects.json');
  private initiativesFile = path.join(this.dataDir, 'initiatives.json');
  private notificationsFile = path.join(this.dataDir, 'notifications.json');
  private activityLogsFile = path.join(this.dataDir, 'activityLogs.json');

  constructor() {
    this.ensureDataDirectory();
    this.initializeDefaultData();
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private initializeDefaultData() {
    // Initialize users if file doesn't exist
    if (!fs.existsSync(this.usersFile)) {
      const defaultUsers = [
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
        }
      ];
      this.writeToFile(this.usersFile, defaultUsers);
    }

    // Initialize other data files if they don't exist
    if (!fs.existsSync(this.projectsFile)) {
      this.writeToFile(this.projectsFile, []);
    }
    if (!fs.existsSync(this.initiativesFile)) {
      this.writeToFile(this.initiativesFile, []);
    }
    if (!fs.existsSync(this.notificationsFile)) {
      this.writeToFile(this.notificationsFile, []);
    }
    if (!fs.existsSync(this.activityLogsFile)) {
      this.writeToFile(this.activityLogsFile, []);
    }
  }

  private readFromFile(filePath: string): any[] {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return [];
    }
  }

  private writeToFile(filePath: string, data: any[]): void {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
    }
  }

  // User operations
  async findUserByEmail(email: string): Promise<User | null> {
    const users = this.readFromFile(this.usersFile);
    const user = users.find(u => u.email === email);
    return Promise.resolve(user || null);
  }

  async findUserById(id: string): Promise<User | null> {
    const users = this.readFromFile(this.usersFile);
    const user = users.find(u => u.id === id);
    return Promise.resolve(user || null);
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const users = this.readFromFile(this.usersFile);
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

    users.push(newUser);
    this.writeToFile(this.usersFile, users);
    return Promise.resolve(newUser);
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    const users = this.readFromFile(this.usersFile);
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return Promise.resolve(null);
    }

    users[userIndex] = {
      ...users[userIndex],
      ...userData,
      updatedAt: new Date().toISOString()
    };

    this.writeToFile(this.usersFile, users);
    return Promise.resolve(users[userIndex]);
  }

  async deleteUser(id: string): Promise<boolean> {
    const users = this.readFromFile(this.usersFile);
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return Promise.resolve(false);
    }

    users.splice(userIndex, 1);
    this.writeToFile(this.usersFile, users);
    return Promise.resolve(true);
  }

  async getAllUsers(): Promise<User[]> {
    return Promise.resolve(this.readFromFile(this.usersFile));
  }

  // Project operations
  async createProject(projectData: any): Promise<any> {
    const projects = this.readFromFile(this.projectsFile);
    const newProject = {
      id: `project-${Date.now()}`,
      ...projectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    projects.push(newProject);
    this.writeToFile(this.projectsFile, projects);
    return Promise.resolve(newProject);
  }

  async getAllProjects(): Promise<any[]> {
    return Promise.resolve(this.readFromFile(this.projectsFile));
  }

  // Initiative operations
  async createInitiative(initiativeData: any): Promise<any> {
    const initiatives = this.readFromFile(this.initiativesFile);
    const newInitiative = {
      id: `initiative-${Date.now()}`,
      ...initiativeData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    initiatives.push(newInitiative);
    this.writeToFile(this.initiativesFile, initiatives);
    return Promise.resolve(newInitiative);
  }

  async getAllInitiatives(): Promise<any[]> {
    return Promise.resolve(this.readFromFile(this.initiativesFile));
  }

  // Notification operations
  async createNotification(data: any): Promise<any> {
    const notifications = this.readFromFile(this.notificationsFile);
    const newNotification = {
      id: `notification-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString()
    };
    notifications.push(newNotification);
    this.writeToFile(this.notificationsFile, notifications);
    return Promise.resolve(newNotification);
  }

  // Activity log operations
  async createActivityLog(data: any): Promise<any> {
    const activityLogs = this.readFromFile(this.activityLogsFile);
    const newActivityLog = {
      id: `activity-${Date.now()}`,
      ...data,
      timestamp: new Date().toISOString()
    };
    activityLogs.push(newActivityLog);
    this.writeToFile(this.activityLogsFile, activityLogs);
    return Promise.resolve(newActivityLog);
  }
}

export const fileBasedMockDb = new FileBasedMockDatabase();
