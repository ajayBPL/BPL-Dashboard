import React from 'react';
import { DepartmentAvatar, AvatarFallback } from './ui/DepartmentAvatar';
import { getAllDepartmentsWithColors, isLeadershipRole } from '../utils/departmentColors';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function DepartmentColorDemo() {
  const departments = getAllDepartmentsWithColors();

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Department Color Scheme</CardTitle>
        <CardDescription>
          Each department has a unique color for easy visual identification across the application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Regular Department Colors */}
          <div>
            <h4 className="font-medium mb-3">Department Colors</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {departments.map((dept) => (
                <div key={dept.name} className="flex flex-col items-center space-y-2 p-3 border rounded-lg">
                  <DepartmentAvatar 
                    className="h-12 w-12" 
                    department={dept.name}
                  >
                    <AvatarFallback>
                      {dept.name.charAt(0)}
                    </AvatarFallback>
                  </DepartmentAvatar>
                  <div className="text-center">
                    <p className="text-sm font-medium">{dept.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {dept.colors.background.replace('bg-', '').replace('-500', '')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leadership Role Enhancements */}
          <div>
            <h4 className="font-medium mb-3">Leadership Role Enhancements</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { role: 'admin', name: 'Admin', dept: 'IT' },
                { role: 'program_manager', name: 'Program Manager', dept: 'Operations' },
                { role: 'rd_manager', name: 'R&D Manager', dept: 'R&D' },
                { role: 'manager', name: 'Manager', dept: 'Development' }
              ].map((leader) => (
                <div key={leader.role} className="flex flex-col items-center space-y-2 p-3 border rounded-lg">
                  <DepartmentAvatar 
                    className="h-12 w-12" 
                    department={leader.dept}
                    role={leader.role}
                  >
                    <AvatarFallback>
                      {leader.name.charAt(0)}
                    </AvatarFallback>
                  </DepartmentAvatar>
                  <div className="text-center">
                    <p className="text-sm font-medium">{leader.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {leader.dept} + Ring
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Color Features:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Distinct Colors:</strong> Each department has a unique, visually distinct color</li>
            <li>• <strong>Professional Palette:</strong> Colors are selected for professional appearance</li>
            <li>• <strong>Accessibility:</strong> High contrast white text on colored backgrounds</li>
            <li>• <strong>Consistent:</strong> Same color used across all components (avatars, badges, etc.)</li>
            <li>• <strong>Scalable:</strong> Automatic color assignment for new departments</li>
            <li>• <strong>Status Indicators:</strong> Border colors for workload status (overloaded employees)</li>
            <li>• <strong>Leadership Enhancement:</strong> Admin, Program Manager, R&D Manager, and Manager roles get special ring borders</li>
            <li>• <strong>Role Recognition:</strong> Easy visual identification of leadership hierarchy</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
