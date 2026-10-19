#!/bin/bash
set -e
echo "XOLIX Validator Node Setup"
echo "=========================="
echo ""

# Check Node.js
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js not found. Install Node.js v18+ first."
  exit 1
fi
NODE_VER=$(node -e "console.log(process.version.slice(1).split('.')[0])")
if [ "$NODE_VER" -lt 18 ]; then
  echo "ERROR: Node.js v18+ required. Found: $(node -v)"
  exit 1
fi
echo "✅ Node.js $(node -v)"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install --production

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Generate validator keypair:  node dist/cli/index.js validator:keygen"
echo "  2. Stake 100,000 XOLIX in XolixValidatorRegistry contract"
echo "  3. Set VALIDATOR_ADDRESS and VALIDATOR_PRIVATE_KEY"
echo "  4. Start node: node dist/node/start.js"
