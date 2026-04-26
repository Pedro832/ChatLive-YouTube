@echo off
:: Muda o foco para a pasta onde o ficheiro está
cd /d "%~dp0"
title Servidor YouTube Chat
echo Iniciando o servidor Node.js...
:: Abre o painel no navegador automaticamente
start http://localhost:3000/painel
:: Executa o servidor
node server.js
pause