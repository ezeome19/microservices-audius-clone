const fs = require('fs');
const modules = [
    'fastify',
    'path',
    '@fastify/static',
    '@fastify/view',
    'handlebars',
    '@fastify/formbody',
    '@fastify/cookie',
    '@fastify/http-proxy',
    './routes/auth',
    './routes/artists',
    './routes/dashboard',
    './routes/artist',
    './routes/settings'
];

let log = '--- Diagnostic Start ---\n';
for (const m of modules) {
    try {
        require(m);
        log += `✅ ${m} loaded\n`;
    } catch (err) {
        log += `❌ ${m} FAILED: ${err.message}\n${err.stack}\n`;
    }
}
log += '--- Diagnostic End ---\n';
fs.writeFileSync('diag_results.txt', log);
console.log('Diagnostic finished. Check diag_results.txt');
