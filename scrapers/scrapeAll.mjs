import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JOBS_DIR = path.join(__dirname, 'jobs');
const LOGS_DIR = path.join(__dirname, 'logs');

const SUCCESS_MARKER = 'Fichier sauvegardé avec succès';
const MAINTENANCE_JOB_PATTERN = /^cleanup/i;

function isMaintenanceJob(scriptName) {
    return MAINTENANCE_JOB_PATTERN.test(scriptName);
}

function listJobScripts() {
    return fs
        .readdirSync(JOBS_DIR)
        .filter((name) => /\.(mjs|js)$/i.test(name))
        .sort((a, b) => {
            const aMaintenance = isMaintenanceJob(a);
            const bMaintenance = isMaintenanceJob(b);

            if (aMaintenance !== bMaintenance) {
                return aMaintenance ? -1 : 1;
            }

            return a.localeCompare(b);
        });
}

function timestamp() {
    return new Date().toISOString();
}

function formatDuration(ms) {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m${String(s).padStart(2, '0')}s`;
}

function runJob(scriptName, { requireSnapshot = true } = {}) {
    const scriptPath = path.join(JOBS_DIR, scriptName);

    return new Promise((resolve) => {
        const child = spawn(process.execPath, [scriptPath], {
            cwd: path.resolve(__dirname, '..'),
            env: process.env,
            windowsHide: true,
        });

        let output = '';

        child.stdout.on('data', (chunk) => {
            const text = chunk.toString();
            output += text;
            process.stdout.write(text);
        });

        child.stderr.on('data', (chunk) => {
            const text = chunk.toString();
            output += text;
            process.stderr.write(text);
        });

        child.on('error', (error) => {
            resolve({
                script: scriptName,
                ok: false,
                exitCode: null,
                error: error.message,
                output,
            });
        });

        child.on('close', (exitCode) => {
            const saved = output.includes(SUCCESS_MARKER);
            const ok = exitCode === 0 && (!requireSnapshot || saved);

            resolve({
                script: scriptName,
                ok,
                exitCode,
                saved,
                output,
            });
        });
    });
}

function writeLog(lines) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logPath = path.join(LOGS_DIR, `scrapall-${stamp}.log`);
    const latestPath = path.join(LOGS_DIR, 'scrapall-latest.log');
    const content = lines.join('\n') + '\n';

    fs.writeFileSync(logPath, content, 'utf-8');
    fs.writeFileSync(latestPath, content, 'utf-8');

    return { logPath, latestPath };
}

async function runScrapers() {
    const jobs = listJobScripts();
    const startedAt = Date.now();
    const logLines = [];

    const log = (message) => {
        const line = `[${timestamp()}] ${message}`;
        console.log(line);
        logLines.push(line);
    };

    log('START scrapall');
    log(`Jobs détectés (${jobs.length}) : ${jobs.join(', ') || '(aucun)'}`);

    if (jobs.length === 0) {
        log('Aucun script .mjs/.js dans scrapers/jobs');
        const paths = writeLog(logLines);
        log(`Log écrit : ${paths.logPath}`);
        process.exitCode = 1;
        return;
    }

    const results = [];

    for (const script of jobs) {
        log(`▶ ${script}`);
        const jobStarted = Date.now();
        const maintenance = isMaintenanceJob(script);
        const result = await runJob(script, { requireSnapshot: !maintenance });
        const duration = formatDuration(Date.now() - jobStarted);

        if (result.ok) {
            log(`✅ ${script} — succès (${duration}, exit ${result.exitCode})`);
        } else if (result.error) {
            log(`❌ ${script} — échec au lancement (${duration}) : ${result.error}`);
        } else if (result.exitCode !== 0) {
            log(`❌ ${script} — échec (${duration}, exit ${result.exitCode})`);
        } else if (!maintenance && !result.saved) {
            log(
                `❌ ${script} — échec (${duration}, exit 0 mais snapshot non sauvegardé)`
            );
        } else {
            log(`❌ ${script} — échec (${duration})`);
        }

        // Garde les dernières lignes d'output en cas d'échec pour le diagnostic
        if (!result.ok && result.output?.trim()) {
            const tail = result.output.trim().split(/\r?\n/).slice(-15);
            logLines.push('--- sortie (fin) ---');
            logLines.push(...tail);
            logLines.push('--- fin sortie ---');
        }

        results.push(result);
    }

    const okCount = results.filter((r) => r.ok).length;
    const failCount = results.length - okCount;
    const totalDuration = formatDuration(Date.now() - startedAt);

    log(
        `END scrapall — ${okCount} succès, ${failCount} échec(s), durée totale ${totalDuration}`
    );

    for (const result of results) {
        log(`  - ${result.script}: ${result.ok ? 'OK' : 'KO'}`);
    }

    const paths = writeLog(logLines);
    console.log(`\n📄 Log : ${paths.logPath}`);
    console.log(`📄 Dernier log : ${paths.latestPath}`);

    // Les échecs partiels n'interrompent pas le cron (commit / build / deploy).
    // Le frontend gère les plateformes sans snapshot du jour.
    if (failCount > 0) {
        log(
            `⚠ ${failCount} job(s) en échec — poursuite du pipeline (exit 0).`
        );
    }
}

runScrapers();
