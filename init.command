#!/bin/bash

cd "$(dirname "$0")"

open "http://localhost:3000/painel"

node server.js
