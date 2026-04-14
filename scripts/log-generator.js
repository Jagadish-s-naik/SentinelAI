import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_FILE = path.join(__dirname, '../logs/sentinel.log');
const LOG_DIR = path.dirname(LOG_FILE);

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const templates = [
  'IP: 192.168.1.{id} | USER: {user} | ACTION: LOGIN_SUCCESS | AREA: AUTH_SRV',
  'IP: 10.0.42.{id} | USER: system | ACTION: FILE_MODIFIED | FILE: /etc/shadow',
  'IP: 172.16.0.{id} | USER: {user} | ACTION: DATA_EXPORT | SIZE: {size}MB',
  'IP: 192.168.1.{id} | USER: admin | ACTION: CONFIG_CHANGE | DETAIL: FIREWALL_RULE_UPDATED',
  'IP: 10.2.1.{id} | USER: {user} | ACTION: DB_QUERY | TABLE: "CLIENT_PII" | STATUS: UNUSUAL_VOLUME'
];

const users = ['j.smith', 'a.jones', 'root', 'k.chen', 'service_account'];

function generateLog() {
  const id = Math.floor(Math.random() * 254) + 1;
  const user = users[Math.floor(Math.random() * users.length)];
  const size = Math.floor(Math.random() * 5000) + 100;
  
  let log = templates[Math.floor(Math.random() * templates.length)]
    .replace('{id}', id)
    .replace('{user}', user)
    .replace('{size}', size);
    
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${log}\n`;
  
  fs.appendFileSync(LOG_FILE, entry);
  console.log(`Generated Log: ${entry.trim()}`);
}

console.log(`SentinelAI Log Generator Started...`);
console.log(`Writing to: ${LOG_FILE}`);

setInterval(generateLog, 3000);
