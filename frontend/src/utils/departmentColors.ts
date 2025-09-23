// Department color mapping utility
export interface DepartmentColorScheme {
  background: string;
  text: string;
  border: string;
  badge: string;
}

// Define distinct colors for different departments
const departmentColorsMap: { [key: string]: DepartmentColorScheme } = {
  'IT': { 
    background: '#93C5FD', // Light Blue
    text: '#1E40AF', 
    border: '#3B82F6', 
    badge: '#DBEAFE' 
  },
  'Operations': { 
    background: '#6EE7B7', // Light Emerald
    text: '#047857', 
    border: '#10B981', 
    badge: '#D1FAE5' 
  },
  'R&D': { 
    background: '#E5E7EB', // Light Gray
    text: '#374151', 
    border: '#9CA3AF', 
    badge: '#F9FAFB' 
  },
  'Development': { 
    background: '#FCD34D', // Light Amber
    text: '#92400E', 
    border: '#F59E0B', 
    badge: '#FEF3C7' 
  },
  'Program Management': { 
    background: '#F9A8D4', // Light Pink
    text: '#BE185D', 
    border: '#EC4899', 
    badge: '#FCE7F3' 
  },
  'Testing': { 
    background: '#FCA5A5', // Light Red
    text: '#DC2626', 
    border: '#EF4444', 
    badge: '#FEE2E2' 
  },
  'Quality Assurance': { 
    background: '#67E8F9', // Light Cyan
    text: '#0891B2', 
    border: '#06B6D4', 
    badge: '#CFFAFE' 
  },
  'Marketing': { 
    background: '#A5B4FC', // Light Indigo
    text: '#4F46E5', 
    border: '#6366F1', 
    badge: '#E0E7FF' 
  },
  'Sales': { 
    background: '#BEF264', // Light Lime
    text: '#65A30D', 
    border: '#84CC16', 
    badge: '#ECFCCB' 
  },
  'Finance': { 
    background: '#CBD5E1', // Light Slate
    text: '#475569', 
    border: '#64748B', 
    badge: '#F1F5F9' 
  },
  'HR': { 
    background: '#FDBA74', // Light Orange
    text: '#EA580C', 
    border: '#F97316', 
    badge: '#FED7AA' 
  },
  'Manufacturing': { 
    background: '#5EEAD4', // Light Teal
    text: '#0F766E', 
    border: '#14B8A6', 
    badge: '#CCFBF1' 
  },
  'Support': { 
    background: '#DDD6FE', // Light Violet
    text: '#7C3AED', 
    border: '#A855F7', 
    badge: '#F3E8FF' 
  },
  'Admin': { 
    background: '#FECACA', // Soft Rose
    text: '#DC2626', 
    border: '#F87171', 
    badge: '#FEE2E2' 
  },
  'Management': { 
    background: '#E9D5FF', // Soft Lavender
    text: '#7C3AED', 
    border: '#A855F7', 
    badge: '#F3E8FF' 
  }
};

// Fallback colors for departments not explicitly defined
const fallbackColors: DepartmentColorScheme[] = [
  { background: '#6B7280', text: '#FFFFFF', border: '#4B5563', badge: '#F3F4F6' }, // Gray
  { background: '#F59E0B', text: '#FFFFFF', border: '#D97706', badge: '#FEF3C7' }, // Amber
  { background: '#EC4899', text: '#FFFFFF', border: '#BE185D', badge: '#FCE7F3' }, // Pink
  { background: '#10B981', text: '#FFFFFF', border: '#047857', badge: '#D1FAE5' }, // Emerald
  { background: '#3B82F6', text: '#FFFFFF', border: '#1E40AF', badge: '#DBEAFE' }, // Blue
];

// Function to generate a consistent hash for a string
function stringToHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get color scheme for a department
 * @param department - Department name
 * @returns DepartmentColorScheme with background, text, border, and badge colors
 */
export function getDepartmentColors(department: string | null | undefined): DepartmentColorScheme {
  const deptName = department?.trim();
  
  if (deptName && departmentColorsMap[deptName]) {
    return departmentColorsMap[deptName];
  }

  // Use a hash-based fallback for consistent but undefined departments
  if (deptName) {
    const hash = stringToHash(deptName);
    const colorIndex = hash % fallbackColors.length;
    return fallbackColors[colorIndex];
  }

  // Default fallback if department is null, undefined, or empty
  return { 
    background: '#7FFFD4', // Aquamarine (current default)
    text: '#006400', 
    border: '#40E0D0', 
    badge: '#E0F2F1' 
  };
}

/**
 * Get all available departments with their colors
 * @returns Array of department objects with name and color scheme
 */
export function getAllDepartmentsWithColors() {
  return Object.entries(departmentColorsMap).map(([name, colors]) => ({
    name,
    colors
  }));
}

/**
 * Check if a role is a leadership role
 * @param role - User role
 * @returns True if the role is a leadership role
 */
export function isLeadershipRole(role: string): boolean {
  const leadershipRoles = [
    'admin',
    'program_manager',
    'PROGRAM_MANAGER',
    'rd_manager',
    'RD_MANAGER',
    'manager',
    'MANAGER'
  ];

  return leadershipRoles.includes(role.toLowerCase());
}

/**
 * Get enhanced color scheme for leadership roles
 * @param baseColors - Base department colors
 * @param role - User role
 * @returns Enhanced color scheme with leadership styling
 */
export function getEnhancedColors(baseColors: DepartmentColorScheme, role: string): DepartmentColorScheme {
  if (isLeadershipRole(role)) {
    return {
      ...baseColors,
      border: '#FFFFFF', // White border for leadership
      badge: '#FFFFFF' // White badge background for leadership
    };
  }
  return baseColors;
}
