import { User } from '../../../shared/types';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

// File-based mock database for data persistence across systems
class FileBasedMockDatabase {
  private dataDir = path.join(__dirname, '../../data');
  private usersFile = path.join(this.dataDir, 'users.json');
  private projectsFile = path.join(this.dataDir, 'projects.json');
  private initiativesFile = path.join(this.dataDir, 'initiatives.json');
  private notificationsFile = path.join(this.dataDir, 'notifications.json');
  private activityLogsFile = path.join(this.dataDir, 'activityLogs.json');
  private customRolesFile = path.join(this.dataDir, 'customRoles.json');
  private customDepartmentsFile = path.join(this.dataDir, 'customDepartments.json');

  constructor() {
    this.ensureDataDirectory();
    this.initializeDefaultData();
    this.startDataSync();
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

  async findUserByEmployeeId(employeeId: string): Promise<User | null> {
    const users = this.readFromFile(this.usersFile);
    const user = users.find(u => u.employeeId === employeeId);
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
    const projects = this.readFromFile(this.projectsFile);
    const users = this.readFromFile(this.usersFile);
    
    // Ensure compatibility by adding assignments array if it doesn't exist
    return projects.map(project => {
      const assignments = (project.assignedEmployees || project.assignments || []).map((assignment: any) => ({
        ...assignment,
        employee: users.find((u: any) => u.id === assignment.employeeId)
      }));

      return {
        ...project,
        assignments,
        assignedEmployees: assignments
      };
    });
  }

  async getProjectById(id: string): Promise<any> {
    const projects = this.readFromFile(this.projectsFile);
    const project = projects.find(p => p.id === id);
    
    if (!project) {
      return null;
    }

    // Get all users to populate employee information
    const users = this.readFromFile(this.usersFile);
    
    // Ensure compatibility and populate employee data
    const assignments = (project.assignedEmployees || project.assignments || []).map((assignment: any) => ({
      ...assignment,
      employee: users.find((u: any) => u.id === assignment.employeeId)
    }));

    return {
      ...project,
      assignments,
      assignedEmployees: assignments
    };
  }

  async assignEmployeeToProject(projectId: string, assignmentData: any, managerId: string): Promise<any> {
    const projects = this.readFromFile(this.projectsFile);
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      throw new Error('Project not found');
    }

    // Check if employee exists
    const users = this.readFromFile(this.usersFile);
    const employee = users.find(u => u.id === assignmentData.employeeId);
    
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check if already assigned - if so, update instead of error
    const existingAssignmentIndex = project.assignedEmployees?.findIndex(
      (assignment: any) => assignment.employeeId === assignmentData.employeeId
    );

    let assignment: any;

    if (existingAssignmentIndex !== -1 && existingAssignmentIndex !== undefined) {
      // Update existing assignment
      assignment = {
        ...project.assignedEmployees[existingAssignmentIndex],
        involvementPercentage: assignmentData.involvementPercentage,
        role: assignmentData.role,
        startDate: assignmentData.startDate,
        endDate: assignmentData.endDate,
        updatedAt: new Date().toISOString()
      };
      project.assignedEmployees[existingAssignmentIndex] = assignment;
    } else {
      // Create new assignment
      assignment = {
        id: `assignment-${Date.now()}`,
        projectId: projectId,
        employeeId: assignmentData.employeeId,
        involvementPercentage: assignmentData.involvementPercentage,
        role: assignmentData.role,
        startDate: assignmentData.startDate,
        endDate: assignmentData.endDate,
        assignedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (!project.assignedEmployees) {
        project.assignedEmployees = [];
      }
      project.assignedEmployees.push(assignment);
    }

    // Also add to assignments array for compatibility
    if (!project.assignments) {
      project.assignments = [];
    }
    const assignmentIndex = project.assignments.findIndex((a: any) => a.employeeId === assignmentData.employeeId);
    if (assignmentIndex !== -1) {
      project.assignments[assignmentIndex] = assignment;
    } else {
      project.assignments.push(assignment);
    }

    // Check workload capacity (only for new assignments)
    if (existingAssignmentIndex === -1 || existingAssignmentIndex === undefined) {
      const currentWorkload = this.calculateEmployeeWorkload(assignmentData.employeeId);
      if (currentWorkload + assignmentData.involvementPercentage > employee.workloadCap) {
        throw new Error(`Assignment would exceed employee's workload capacity (${employee.workloadCap}%)`);
      }
    }
    project.updatedAt = new Date().toISOString();

    // Update project in file
    const projectIndex = projects.findIndex(p => p.id === projectId);
    projects[projectIndex] = project;
    this.writeToFile(this.projectsFile, projects);

    // Log activity
    await this.createActivityLog({
      userId: managerId,
      action: 'USER_ASSIGNED',
      entityType: 'PROJECT',
      entityId: projectId,
      projectId: projectId,
      details: `Assigned ${employee.name} to project with ${assignmentData.involvementPercentage}% involvement`
    });

    return assignment;
  }

  private calculateEmployeeWorkload(employeeId: string): number {
    const projects = this.readFromFile(this.projectsFile);
    const initiatives = this.readFromFile(this.initiativesFile);
    
    // Calculate project workload
    const projectWorkload = projects
      .filter(p => p.status === 'active' || p.status === 'ACTIVE')
      .reduce((total, project) => {
        const assignment = project.assignedEmployees?.find((emp: any) => emp.employeeId === employeeId);
        return total + (assignment?.involvementPercentage || 0);
      }, 0);

    // Calculate initiative workload
    const initiativeWorkload = initiatives
      .filter(i => i.assignedTo === employeeId && (i.status === 'active' || i.status === 'ACTIVE'))
      .reduce((total, initiative) => total + (initiative.workloadPercentage || 0), 0);

    return projectWorkload + initiativeWorkload;
  }

  async unassignEmployeeFromProject(projectId: string, employeeId: string, managerId: string): Promise<any> {
    const projects = this.readFromFile(this.projectsFile);
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      throw new Error('Project not found');
    }

    // Check if assignment exists
    const assignmentIndex = project.assignedEmployees?.findIndex(
      (assignment: any) => assignment.employeeId === employeeId
    );

    if (assignmentIndex === -1 || assignmentIndex === undefined) {
      throw new Error('Assignment not found');
    }

    // Get employee name for logging
    const users = this.readFromFile(this.usersFile);
    const employee = users.find(u => u.id === employeeId);

    // Remove assignment from both arrays
    project.assignedEmployees.splice(assignmentIndex, 1);
    
    // Also remove from assignments array if it exists
    if (project.assignments) {
      const assignmentsIndex = project.assignments.findIndex(
        (assignment: any) => assignment.employeeId === employeeId
      );
      if (assignmentsIndex !== -1) {
        project.assignments.splice(assignmentsIndex, 1);
      }
    }
    
    project.updatedAt = new Date().toISOString();

    // Update project in file
    const projectIndex = projects.findIndex(p => p.id === projectId);
    projects[projectIndex] = project;
    this.writeToFile(this.projectsFile, projects);

    // Log activity
    await this.createActivityLog({
      userId: managerId,
      action: 'USER_UNASSIGNED',
      entityType: 'PROJECT',
      entityId: projectId,
      projectId: projectId,
      details: `Unassigned ${employee?.name || 'Unknown Employee'} from project`
    });

    return { success: true };
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

  // Data synchronization methods
  private startDataSync() {
    // Sync data every 30 seconds
    setInterval(() => {
      this.syncDataFromOtherSystems().catch(console.error);
    }, 30000);
  }

  private async syncDataFromOtherSystems() {
    try {
      // List of known system IPs (you can configure this)
      const systemIPs = [
        '192.168.10.205',
        '192.168.8.8',
        '192.168.8.10',
        'localhost'
      ];

      for (const ip of systemIPs) {
        if (ip === 'localhost') continue; // Skip self
        
        try {
          await this.syncFromSystem(`http://${ip}:3001/api/sync/data`);
        } catch (error) {
          // System might be offline, continue with others
          console.log(`Could not sync from ${ip}:`, error instanceof Error ? error.message : String(error));
        }
      }
    } catch (error) {
      console.error('Data sync error:', error);
    }
  }

  private async syncFromSystem(url: string) {
    return new Promise((resolve, reject) => {
      const request = http.get(url, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          try {
            const syncData = JSON.parse(data);
            if (syncData.success) {
              this.mergeData(syncData.data);
              console.log(`Successfully synced data from ${url}`);
            }
            resolve(syncData);
          } catch (error) {
            reject(error);
          }
        });
      });
      
      request.on('error', (error) => {
        reject(error);
      });
      
      request.setTimeout(5000, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  private mergeData(remoteData: any) {
    // Merge users data
    if (remoteData.users) {
      const localUsers = this.readFromFile(this.usersFile);
      const mergedUsers = this.mergeUsers(localUsers, remoteData.users);
      this.writeToFile(this.usersFile, mergedUsers);
    }

    // Merge projects data
    if (remoteData.projects) {
      const localProjects = this.readFromFile(this.projectsFile);
      const mergedProjects = this.mergeProjects(localProjects, remoteData.projects);
      this.writeToFile(this.projectsFile, mergedProjects);
    }

    // Merge initiatives data
    if (remoteData.initiatives) {
      const localInitiatives = this.readFromFile(this.initiativesFile);
      const mergedInitiatives = this.mergeInitiatives(localInitiatives, remoteData.initiatives);
      this.writeToFile(this.initiativesFile, mergedInitiatives);
    }
  }

  private mergeUsers(localUsers: any[], remoteUsers: any[]): any[] {
    const userMap = new Map();
    
    // Add local users
    localUsers.forEach(user => userMap.set(user.id, user));
    
    // Add/update with remote users
    remoteUsers.forEach(user => {
      const existing = userMap.get(user.id);
      if (!existing || new Date(user.updatedAt) > new Date(existing.updatedAt)) {
        userMap.set(user.id, user);
      }
    });
    
    return Array.from(userMap.values());
  }

  private mergeProjects(localProjects: any[], remoteProjects: any[]): any[] {
    const projectMap = new Map();
    
    // Add local projects
    localProjects.forEach(project => projectMap.set(project.id, project));
    
    // Add/update with remote projects
    remoteProjects.forEach(project => {
      const existing = projectMap.get(project.id);
      if (!existing || new Date(project.updatedAt) > new Date(existing.updatedAt)) {
        projectMap.set(project.id, project);
      }
    });
    
    return Array.from(projectMap.values());
  }

  private mergeInitiatives(localInitiatives: any[], remoteInitiatives: any[]): any[] {
    const initiativeMap = new Map();
    
    // Add local initiatives
    localInitiatives.forEach(initiative => initiativeMap.set(initiative.id, initiative));
    
    // Add/update with remote initiatives
    remoteInitiatives.forEach(initiative => {
      const existing = initiativeMap.get(initiative.id);
      if (!existing || new Date(initiative.updatedAt) > new Date(existing.updatedAt)) {
        initiativeMap.set(initiative.id, initiative);
      }
    });
    
    return Array.from(initiativeMap.values());
  }

  // Public method to get all data for synchronization
  async getAllDataForSync() {
    return {
      users: this.readFromFile(this.usersFile),
      projects: this.readFromFile(this.projectsFile),
      initiatives: this.readFromFile(this.initiativesFile),
      notifications: this.readFromFile(this.notificationsFile),
      activityLogs: this.readFromFile(this.activityLogsFile),
      customRoles: this.readFromFile(this.customRolesFile),
      customDepartments: this.readFromFile(this.customDepartmentsFile)
    };
  }

  // Custom Roles Methods
  async getCustomRoles() {
    return this.readFromFile(this.customRolesFile);
  }

  async createCustomRole(roleData: { name: string; description: string; permissions: string[] }) {
    const roles = this.readFromFile(this.customRolesFile);
    const newRole = {
      id: `role-${Date.now()}`,
      name: roleData.name,
      description: roleData.description,
      permissions: roleData.permissions,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    roles.push(newRole);
    this.writeToFile(this.customRolesFile, roles);
    return newRole;
  }

  // Custom Departments Methods
  async getCustomDepartments() {
    return this.readFromFile(this.customDepartmentsFile);
  }

  async createCustomDepartment(departmentData: { name: string; description: string; headId: string | null }) {
    const departments = this.readFromFile(this.customDepartmentsFile);
    const newDepartment = {
      id: `dept-${Date.now()}`,
      name: departmentData.name,
      description: departmentData.description,
      headId: departmentData.headId,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    departments.push(newDepartment);
    this.writeToFile(this.customDepartmentsFile, departments);
    return newDepartment;
  }
}

export const fileBasedMockDb = new FileBasedMockDatabase();

