import fs from 'fs';
import path from 'path';

const fileConfigs = [
  { path: 'frontend/src/features/admin/AdminDashboard.tsx' },
  { path: 'frontend/src/features/staff/StaffDashboard.tsx' },
  { path: 'frontend/src/features/staff/StaffLogin.tsx' },
  { path: 'frontend/src/features/customer/CustomerPortal.tsx' },
  { path: 'frontend/src/features/customer/CustomerLogin.tsx' },
  { path: 'frontend/src/components/InvoiceDesign.tsx' }
];

fileConfigs.forEach(item => {
  const fullPath = path.resolve(item.path);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace all http://localhost:5000 occurrences (including backticks and quotes)
  content = content.replace(/http:\/\/localhost:5000/g, '${API_BASE_URL}');
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Successfully updated all API URLs in:', item.path);
});
