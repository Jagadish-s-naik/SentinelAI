import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase environment variables missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const LOG_FILE = path.join(__dirname, '../logs/sentinel.log');

console.log('--- SENTINEL AI PRODUCTION INGESTER ---');
console.log(`Monitoring: ${LOG_FILE}`);

let lastSize = 0;
if (fs.existsSync(LOG_FILE)) {
  lastSize = fs.statSync(LOG_FILE).size;
}

async function handleNewLines(text) {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  
  for (const line of lines) {
    console.log(`[INGEST] Processing: ${line}`);
    
    // 1. Parse the log line
    // Format: [TIMESTAMP] IP: {ip} | USER: {user} | ACTION: {action} | {EXTRA}
    const timestampMatch = line.match(/^\[(.*?)\]/);
    const ipMatch = line.match(/IP: ([\d\.]+)/);
    const userMatch = line.match(/USER: ([\w\.]+)/);
    const actionMatch = line.match(/ACTION: (\w+)/);
    
    const normalized = {
      timestamp: timestampMatch ? timestampMatch[1] : new Date().toISOString(),
      src_ip: ipMatch ? ipMatch[1] : '0.0.0.0',
      user: userMatch ? userMatch[1] : 'unknown',
      action: actionMatch ? actionMatch[1] : 'LOG',
      schema_version: '2.1',
      normalized: true
    };

    // Extract additional context based on action
    if (line.includes('FILE:')) {
      const fileMatch = line.match(/FILE: ([\/\w\.]+)/);
      if (fileMatch) normalized.file_path = fileMatch[1];
    }
    if (line.includes('SIZE:')) {
      const sizeMatch = line.match(/SIZE: (\d+)MB/);
      if (sizeMatch) normalized.size_mb = parseInt(sizeMatch[1]);
    }
    if (line.includes('AREA:')) {
      const areaMatch = line.match(/AREA: (\w+)/);
      if (areaMatch) normalized.area = areaMatch[1];
    }
    if (line.includes('TABLE:')) {
      const tableMatch = line.match(/TABLE: "([\w_]+)"/);
      if (tableMatch) normalized.table = tableMatch[1];
    }

    // 2. Push Raw Log to Supabase
    let layer = 'endpoint';
    if (line.includes('IP:')) layer = 'network';
    if (line.includes('DB_QUERY') || line.includes('CONFIG_CHANGE')) layer = 'application';

    const { error: logError } = await supabase.from('raw_logs').insert({
      raw: line,
      source: 'LOCAL_SERVER_01',
      category: line.includes('DATA_EXPORT') ? 'NETWORK' : 'SYSTEM',
      layer,
      normalized
    });
    
    if (logError) console.error('Error uploading log:', logError.message);

    // 3. Detection Logic: Look for data exfiltration
    if (line.includes('DATA_EXPORT') && normalized.size_mb > 3000) { 
        console.warn(`[ALERT] CRITICAL EXFILTRATION DETECTED: ${normalized.size_mb}MB`);
        
        const { error: incidentError } = await supabase.from('incidents').insert({
          type: 'exfiltration',
          explanation: `An automated alert was triggered by the ingestion pipeline. Detected unusual export of ${normalized.size_mb}MB via local server logs.`,
          severity: 'CRITICAL',
          status: 'ACTIVE',
          category: 'EXFILTRATION',
          affected_systems: ['LOCAL_SERVER_01'],
          layer: 'network',
          src_ip: normalized.src_ip,
          target: 'EXTERNAL_S3',
          confidence: 98,
          mitre_tag: 'T1048'
        });
        
        if (incidentError) console.error('Error creating incident:', incidentError.message);
    }
  }
}

const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '');
}

fs.watch(logDir, (eventType, filename) => {
  if (filename === 'sentinel.log') {
    const stats = fs.statSync(LOG_FILE);
    const newSize = stats.size;
    
    if (newSize > lastSize) {
      const stream = fs.createReadStream(LOG_FILE, {
        start: lastSize,
        end: newSize
      });
      
      let data = '';
      stream.on('data', chunk => data += chunk);
      stream.on('end', () => {
        handleNewLines(data);
        lastSize = newSize;
      });
    }
  }
});
