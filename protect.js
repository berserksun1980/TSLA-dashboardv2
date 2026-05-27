#!/usr/bin/env node
/**
 * protect.js — Wraps index.html in a password-protected vault page.
 * Output: index_protected.html  (upload this to GitHub)
 *
 * Usage:  node protect.js
 */

const CryptoJS = require('./node_modules/crypto-js');
const fs       = require('fs');
const path     = require('path');
const readline = require('readline');

const INPUT  = path.join(__dirname, 'index_b.html');
const OUTPUT = path.join(__dirname, 'index.html');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Enter password: ', (password) => {
    rl.close();
    if (!password) { console.error('Password cannot be empty.'); process.exit(1); }

    const raw       = fs.readFileSync(INPUT, 'utf8');
    const encrypted = CryptoJS.AES.encrypt(raw, password).toString();

    const vault = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TSLA Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; background: #0f172a; }
        .vault-card { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
        .input-glow:focus { box-shadow: 0 0 15px rgba(59,130,246,0.5); }
    </style>
</head>
<body class="flex items-center justify-center h-screen relative overflow-hidden">
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
    <div class="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
    <div class="absolute bottom-1/4 left-1/2 w-96 h-96 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
    <div class="vault-card p-8 rounded-2xl shadow-2xl w-96 text-center z-10 relative">
        <div class="w-16 h-16 mx-auto mb-6 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
            <svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
        </div>
        <h2 class="text-2xl font-bold mb-2 text-white">TSLA Dashboard</h2>
        <p class="text-sm text-slate-400 mb-8">Enter password to continue</p>
        <input type="password" id="pwd" class="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-lg mb-6 focus:outline-none focus:border-blue-500 input-glow transition-all" placeholder="Password" onkeypress="if(event.key==='Enter') unlock()">
        <button onclick="unlock()" class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-lg hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg">Unlock</button>
        <p id="err" class="text-red-400 text-sm mt-4 hidden">Incorrect password.</p>
    </div>
    <script>
        const ciphertext = "${encrypted}";
        function unlock() {
            const pwd = document.getElementById('pwd').value;
            try {
                const bytes = CryptoJS.AES.decrypt(ciphertext, pwd);
                const html  = bytes.toString(CryptoJS.enc.Utf8);
                if (html) {
                    const blob = new Blob([html], { type: 'text/html' });
                    location.replace(URL.createObjectURL(blob));
                } else {
                    document.getElementById('err').classList.remove('hidden');
                }
            } catch(e) {
                document.getElementById('err').classList.remove('hidden');
            }
        }
    </script>
</body>
</html>`;

    fs.writeFileSync(OUTPUT, vault);
    console.log(`Done → ${OUTPUT}`);
    console.log('Upload index_protected.html to GitHub as index.html');
});
