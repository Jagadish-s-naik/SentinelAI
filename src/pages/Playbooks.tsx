import { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Zap, FileText, CheckCircle2, Copy, Download, ActivitySquare } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { useStore } from '../store';
import { format } from 'date-fns';

const RAW_PLAYBOOK_STEPS = {
  brute_force: {
    contain: [
      "Block source IP range at firewall",
      "Force password reset for targeted accounts",
      "Enable MFA for all admin accounts immediately",
      "Rate-limit login endpoint to 5 attempts/minute",
      "Notify identity team and account owners",
      "Capture full packet logs from source IP"
    ],
    eradicate: [
      "Audit all successful logins from flagged IPs",
      "Revoke all active sessions for targeted users",
      "Scan for any persistence mechanisms installed",
      "Review and tighten authentication policies",
      "Check for credential exposure in breach databases",
      "Remove any backdoors or unauthorized accounts"
    ],
    recover: [
      "Restore account access with new credentials",
      "Monitor affected accounts for 72 hours",
      "Update detection rules with new IP signatures",
      "Run vulnerability scan on targeted systems",
      "Document incident timeline for audit report",
      "Brief security team on attack methodology"
    ]
  },
  c2_beacon: {
    contain: [
      "Isolate infected endpoint from the network",
      "Block destination IP/Domain at external firewall",
      "Take full memory dump for forensics testing"
    ],
    eradicate: [
      "Identify and kill malicious processes",
      "Remove persistence mechanisms (Registry/Cron)",
      "Delete identified malware payload files"
    ],
    recover: [
      "Re-image machine if fully compromised",
      "Deploy aggressive endpoint rules temporarily",
      "Submit indicators to threat intelligence"
    ]
  },
  general: {
    contain: ["Isolate affected systems", "Block source IPs", "Suspend compromised accounts"],
    eradicate: ["Remove malicious artifacts", "Review system configurations", "Audit logs for lateral movement"],
    recover: ["Restore from known good backup", "Monitor closely for 24h", "Compile incident report"]
  }
};

const TypewriterText = ({ text, delay, onComplete }: { text: string; delay?: number; onComplete?: () => void }) => {
  const [displayed, setDisplayed] = useState('');
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.substring(0, i));
      i++;
      if (i > text.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 20); // 20ms per char
    return () => clearInterval(interval);
  }, [text, delay]); // eslint-disable-line

  return (
    <div className={`flex items-start gap-3 my-2 ${displayed.length < text.length ? 'typing-cursor' : ''}`}>
      <div 
        onClick={() => { if(displayed.length === text.length) setChecked(!checked) }}
        className={`mt-1 flex-shrink-0 w-4 h-4 border rounded cursor-pointer flex items-center justify-center transition-colors ${
          checked ? 'bg-teal-accent border-teal-accent' : 'border-border-subtle bg-transparent'
        }`}
      >
        {checked && <CheckCircle2 className="w-3 h-3 text-background" />}
      </div>
      <p className={`text-sm ${checked ? 'line-through text-text-muted' : 'text-white'}`}>
        {displayed}
      </p>
    </div>
  );
};

export const Playbooks = () => {
  const { incidents, activePlaybookId, setActivePlaybookId, resolveIncident, escalateIncident } = useStore();
  const selected = incidents.find(i => i.id === activePlaybookId) || null;
  const [status, setStatus] = useState<'PENDING' | 'GENERATING' | 'ACTIVE'>('PENDING');
  const [stepsRevealed, setStepsRevealed] = useState(0);
  const playbookRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = () => {
    if (!playbookRef.current || !selected) return;
    const element = playbookRef.current;
    
    // Create a copy of the element to fix colors for PDF if needed
    const opt = {
      margin: 1,
      filename: `MITIGATION_${selected.id.split('-')[0]}_${selected.type}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        backgroundColor: '#0A0F1E',
        useCORS: true,
        logging: false
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    // @ts-ignore - html2pdf might not have types in this env
    html2pdf().from(element).set(opt).save();
  };

  const handleGenerate = () => {
    setStatus('GENERATING');
    setStepsRevealed(0);
    setTimeout(() => {
      setStatus('ACTIVE');
    }, 2000);
  };

  const pbData = selected 
    ? RAW_PLAYBOOK_STEPS[selected.type as keyof typeof RAW_PLAYBOOK_STEPS] || RAW_PLAYBOOK_STEPS.general
    : null;

  // Derive total steps to know how to sequence them
  const containLen = pbData?.contain.length || 0;
  const eradLen = pbData?.eradicate.length || 0;
  // const recovLen = pbData?.recover.length || 0; // Not explicitly used but good for sum

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      
      {/* Incident Selector */}
      <div className="lg:w-[30%] bg-card border border-border-subtle rounded-lg flex flex-col overflow-hidden shadow-lg">
        <div className="p-4 bg-secondary-card border-b border-border-subtle">
          <h2 className="font-heading font-semibold flex items-center">
            <ActivitySquare className="mr-2 text-teal-accent w-5 h-5" /> Pending Playbooks
          </h2>
        </div>
        <div className="overflow-y-auto flex-1 p-3 space-y-3">
          {incidents.slice(0, 20).map(inc => (
            <div 
              key={inc.id}
              onClick={() => {
                setActivePlaybookId(inc.id);
                setStatus('PENDING');
                setStepsRevealed(0);
              }}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selected?.id === inc.id 
                  ? 'bg-secondary-card border-teal-accent shadow-[0_0_10px_rgba(0,212,184,0.2)]' 
                  : 'bg-background border-border-subtle hover:border-text-muted hover:bg-secondary-card/50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  inc.severity === 'CRITICAL' ? 'bg-red-alert text-white' : 
                  inc.severity === 'HIGH' ? 'bg-orange-warning text-white' : 'bg-blue-accent text-white'
                }`}>
                  {inc.severity}
                </span>
                <span className="text-xs text-text-muted">{format(new Date(inc.timestamp), "HH:mm")}</span>
              </div>
              <p className="font-heading text-sm text-white mb-1">{inc.type.replace('_', ' ').toUpperCase()}</p>
              <div className="flex justify-between items-center text-xs text-text-muted font-mono">
                <span>{inc.src_ip}</span>
                <span className="text-teal-accent font-bold">{inc.confidence}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Playbook Workspace */}
      <div className="lg:w-[70%] bg-card border border-border-subtle rounded-lg shadow-lg flex flex-col overflow-hidden">
        {selected ? (
          <>
            <div className="p-6 border-b border-border-subtle">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-heading font-bold text-white mb-2 flex items-center">
                    {selected.type.replace('_', ' ').toUpperCase()} Mitigation
                  </h2>
                  <p className="text-text-muted text-sm font-mono flex items-center space-x-3">
                    <span>ID: {selected.id.split('-')[0]}</span>
                    <span>MITRE: {selected.mitre_tag}</span>
                    <span>Target: {selected.target}</span>
                  </p>
                </div>
                <div className={`px-3 py-1 rounded text-xs font-bold font-mono tracking-wide ${
                  status === 'ACTIVE' ? 'bg-teal-accent/20 text-teal-accent border border-teal-accent/50' : 
                  status === 'GENERATING' ? 'bg-purple-accent/20 text-purple-accent border border-purple-accent/50 animate-pulse' :
                  'bg-orange-warning/20 text-orange-warning border border-orange-warning/50'
                }`}>
                  PLAYBOOK {status}
                </div>
              </div>
              
              <button 
                onClick={handleGenerate}
                disabled={status === 'GENERATING'}
                className="w-full mt-2 bg-secondary-card hover:bg-[#1f2d59] border border-teal-accent/50 text-teal-accent font-bold py-3 px-4 rounded-lg flex justify-center items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className={`w-5 h-5 mr-2 ${status === 'GENERATING' ? 'animate-bounce' : ''}`} />
                {status === 'ACTIVE' ? 'Regenerate Playbook' : status === 'GENERATING' ? 'Generating AI Response...' : 'Generate AI Playbook'}
              </button>
            </div>

            {/* Playbook Content area */}
            <div ref={playbookRef} className="flex-1 overflow-y-auto p-6 bg-background relative">
              {status === 'PENDING' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted p-6 text-center">
                  <FileText className="w-16 h-16 mb-4 opacity-20" />
                  <p>Select "Generate AI Playbook" to synthesize custom response steps based on event features and context.</p>
                </div>
              )}
              
              {(status === 'GENERATING' || status === 'ACTIVE') && pbData && (
                <div className="space-y-8 pb-10">
                  {/* Phase 1 CONTAIN */}
                  <div className="border-l-4 border-red-alert pl-4 relative">
                    <div className="absolute top-0 -left-[11px] w-5 h-5 rounded-full bg-background border-4 border-red-alert"></div>
                    <h3 className="text-red-alert font-bold tracking-widest text-sm mb-4 uppercase">Phase 1: Contain</h3>
                    {pbData.contain.map((step, idx) => (
                      <div key={idx}>
                        {(stepsRevealed >= idx || status === 'ACTIVE') && (
                          <TypewriterText 
                            text={step} 
                            onComplete={() => { if (status !== 'ACTIVE') setStepsRevealed(r => Math.max(r, idx + 1)) }} 
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Phase 2 ERADICATE */}
                  {(stepsRevealed >= containLen || status === 'ACTIVE') && (
                    <div className="border-l-4 border-orange-warning pl-4 relative">
                      <div className="absolute top-0 -left-[11px] w-5 h-5 rounded-full bg-background border-4 border-orange-warning"></div>
                      <h3 className="text-orange-warning font-bold tracking-widest text-sm mb-4 uppercase">Phase 2: Eradicate</h3>
                      {pbData.eradicate.map((step, idx) => (
                        <div key={idx}>
                          {(stepsRevealed >= containLen + idx || status === 'ACTIVE') && (
                            <TypewriterText 
                              text={step} 
                              onComplete={() => { if (status !== 'ACTIVE') setStepsRevealed(r => Math.max(r, containLen + idx + 1)) }} 
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Phase 3 RECOVER */}
                  {(stepsRevealed >= containLen + eradLen || status === 'ACTIVE') && (
                    <div className="border-l-4 border-green-500 pl-4 relative">
                      <div className="absolute top-0 -left-[11px] w-5 h-5 rounded-full bg-background border-4 border-green-500"></div>
                      <h3 className="text-green-500 font-bold tracking-widest text-sm mb-4 uppercase">Phase 3: Recover</h3>
                      {pbData.recover.map((step, idx) => (
                        <div key={idx}>
                          {(stepsRevealed >= containLen + eradLen + idx || status === 'ACTIVE') && (
                            <TypewriterText 
                              text={step} 
                              onComplete={() => { if (status !== 'ACTIVE') setStepsRevealed(r => Math.max(r, containLen + eradLen + idx + 1)) }} 
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            {status === 'ACTIVE' && (
              <div className="p-4 border-t border-border-subtle bg-secondary-card flex justify-between items-center shrink-0">
                <div className="text-xs text-text-muted font-mono flex gap-2">
                   <button 
                     onClick={handleExportPDF}
                     className="flex items-center px-3 py-1.5 hover:bg-background rounded border border-border-subtle transition-colors"
                   >
                     <Download className="w-3 h-3 mr-1" /> Export PDF
                   </button>
                   <button 
                     onClick={() => {
                       if (!pbData || !selected) return;
                       const markdown = `# ${selected.type.replace('_', ' ').toUpperCase()} Mitigation - ${selected.id}\n\n## Phase 1: Contain\n${pbData.contain.map(s => `- ${s}`).join('\n')}\n\n## Phase 2: Eradicate\n${pbData.eradicate.map(s => `- ${s}`).join('\n')}\n\n## Phase 3: Recover\n${pbData.recover.map(s => `- ${s}`).join('\n')}`;
                       navigator.clipboard.writeText(markdown);
                       alert('Playbook steps copied to clipboard as Markdown!');
                     }}
                     className="flex items-center px-3 py-1.5 hover:bg-background rounded border border-border-subtle transition-colors"
                   >
                     <Copy className="w-3 h-3 mr-1" /> Copy Markdown
                   </button>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      escalateIncident(selected.id);
                      alert('Incident escalated to Tier 2. Severity upgraded to CRITICAL.');
                    }}
                    className="px-4 py-2 border border-orange-warning text-orange-warning rounded text-sm font-bold hover:bg-orange-warning/10 transition-colors"
                  >
                    Escalate to Tier 2
                  </button>
                  <button 
                    onClick={() => {
                      resolveIncident(selected.id);
                      setStatus('PENDING');
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-bold transition-colors shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
            <ShieldAlert className="w-16 h-16 mb-4 opacity-20" />
            <h2 className="text-xl font-heading mb-2">No Incident Selected</h2>
            <p className="text-sm">Select an incident from the queue to generate a response playbook.</p>
          </div>
        )}
      </div>

    </div>
  );
};
