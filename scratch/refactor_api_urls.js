import fs from 'fs';
import path from 'path';

const fileConfigs = [
  { path: 'frontend/src/features/admin/AdminDashboard.tsx', importPath: '../../lib/apiConfig' },
  { path: 'frontend/src/features/staff/StaffDashboard.tsx', importPath: '../../lib/apiConfig' },
  { path: 'frontend/src/features/staff/StaffLogin.tsx', importPath: '../../lib/apiConfig' },
  { path: 'frontend/src/features/customer/CustomerPortal.tsx', importPath: '../../lib/apiConfig' },
  { path: 'frontend/src/features/customer/CustomerLogin.tsx', importPath: '../../lib/apiConfig' },
  { path: 'frontend/src/components/InvoiceDesign.tsx', importPath: '../lib/apiConfig' }
];

fileConfigs.forEach(item => {
  const fullPath = path.resolve(item.path);
  let content = fs.readFileSync(fullPath, 'utf8');

  if (!content.includes('API_BASE_URL')) {
    content = `import { API_BASE_URL } from "${item.importPath}";\n` + content;
  }

  // Replace "http://localhost:5000/..." with `${API_BASE_URL}/...`
  content = content.replace(/"http:\/\/localhost:5000([^"]*)"/g, '`${API_BASE_URL}$1`');
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Successfully updated:', item.path);
});
