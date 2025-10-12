const users = require('./data/users.json');
console.log('=== BPL COMMANDER USER CREDENTIALS ===\n');
users.forEach((user, index) => {
  console.log(`${index + 1}. ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Password: ${user.password}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Department: ${user.department || 'Not assigned'}`);
  console.log(`   Status: ${user.isActive ? 'Active' : 'Inactive'}`);
  console.log('   ' + '='.repeat(50));
});
