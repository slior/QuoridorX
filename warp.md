# Warp Terminal Setup for Quoridor Project

## Node.js Version Management

This project requires Node.js version 18 to build and test properly. Make sure you're using the correct version before running any commands.

### Setting the Node Version

Use nvm (Node Version Manager) to set and use the correct Node.js version:

```bash
# Switch to Node.js version 18
nvm use 18
```

If you don't have Node.js 18 installed, you can install it first:

```bash
# Install Node.js version 18
nvm install 18

# Use Node.js version 18
nvm use 18
```

### Verifying the Node Version

You can verify that you're using the correct version:

```bash
node --version
# Should output: v18.x.x
```

### Development Workflow

Always ensure you're using Node.js 18 before running project commands:

```bash
# 1. Set the correct Node version
nvm use 18

# 2. Install dependencies (if not already done)
npm install

# 3. Build the project
npm run build

# 4. Run tests
npm test

# 5. Start the game
npm start
```

### Optional: Auto-switch Node Version

To automatically switch to Node.js 18 when entering this project directory, you can create a `.nvmrc` file in the project root:

```bash
echo "18" > .nvmrc
```

Then use:

```bash
nvm use
# Will automatically use the version specified in .nvmrc
```