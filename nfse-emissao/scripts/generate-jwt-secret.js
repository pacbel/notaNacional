// Script para gerar uma chave secreta para JWT
const crypto = require('crypto');

// Gera uma string aleatu00f3ria de 64 caracteres (32 bytes em hex)
const jwtSecret = crypto.randomBytes(32).toString('hex');

console.log('\nAdicione esta chave secreta ao seu arquivo .env:\n');
console.log(`JWT_SECRET=${jwtSecret}\n`);
console.log('Mantenha esta chave em segredo!\n');
