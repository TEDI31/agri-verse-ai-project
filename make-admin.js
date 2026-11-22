// Creates (or resets) the AgriVerse AI administrator account.
// The password is typed here, on your own computer, and only a scrambled version (hash) is saved in db.json.
// It is never written into the website's code, so the code can be shared safely.
//
// 1. STOP the server first (Ctrl + C), otherwise it will overwrite this change.
// 2. Run one of these in the project folder:
//      node make-admin.js <username> "<password>"             create a NEW admin account
//      node make-admin.js <username> "<password>" --convert   turn an EXISTING account into the admin
// 3. Start the server again (npm start) and log in. Pick any account type on the login page.
const fs = require('fs'), path = require('path'), crypto = require('crypto');

const file = path.join(__dirname, 'db.json');
const args = process.argv.slice(2);
const convert = args.includes('--convert');
const [username, password] = args.filter(a => a !== '--convert');
const stop = msg => { console.error('\n' + msg + '\n'); process.exit(1); };

if (!username || !password) stop('Usage: node make-admin.js <username> "<password>" [--convert]');
if (!/^[a-z0-9_]{3,20}$/.test(username)) stop('The username must be 3-20 characters: lowercase letters, numbers or underscores (no spaces).');
if (password.length < 8) stop('Use a password of at least 8 characters.');
if (!fs.existsSync(file)) stop('db.json was not found next to this script. Run it from the project folder.');

const db = JSON.parse(fs.readFileSync(file, 'utf8'));
db.users = db.users || []; db.sessions = db.sessions || {};
const existing = db.users.find(u => u.username === username);
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.scryptSync(password, salt, 32).toString('hex');

if (existing && existing.role !== 'admin') {
  const products = (db.products || []).filter(p => p.username === username).length;
  const orders = (db.orders || []).filter(o => o.farmer === username || o.buyer === username).length;
  if (!convert) {
    stop('"' + username + '" already exists as a ' + existing.role + ' account (' + products + ' listing(s), ' + orders + ' order(s)).\n' +
      'Making it the admin would take away its ' + existing.role + ' screens, and those listings and orders would no longer be manageable from it.\n\n' +
      'Choose one:\n' +
      '  A) Use a different admin username:  node make-admin.js chief_admin "your password"\n' +
      '  B) Convert this account anyway:     node make-admin.js ' + username + ' "your password" --convert');
  }
}
// safety copy of the data before changing it
const backup = file.replace('.json', '.backup-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json');
fs.copyFileSync(file, backup);

if (existing) {
  if (existing.role !== 'admin') console.log('Converting "' + username + '" from a ' + existing.role + ' account to ADMIN.');
  existing.role = 'admin'; existing.salt = salt; existing.hash = hash; delete existing.suspended;
  Object.keys(db.sessions).forEach(t => { if (db.sessions[t] === username) delete db.sessions[t]; }); // log out old sessions
} else {
  db.users.push({ username, name: 'Administrator', role: 'admin', salt, hash, farm: '', location: '', crops: '', status: '', joined: new Date().toISOString().slice(0, 10) });
}
fs.writeFileSync(file, JSON.stringify(db, null, 1));
console.log('\nDone. Admin account "' + username + '" is ready.\nA backup of your data was saved as ' + path.basename(backup) + '.\nNow start the server (npm start) and log in.\n');