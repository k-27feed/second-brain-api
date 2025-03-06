#!/bin/bash

# Fix TypeScript linting issues related to missing types
npm install --save-dev @types/node @types/express @types/cors @types/helmet @types/body-parser @types/jsonwebtoken @types/bcrypt @types/pg

# Update tsconfig.json to include DOM lib for console access
cat << EOF > tsconfig.json
{
  "compilerOptions": {
    "target": "es2018",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "sourceMap": true,
    "declaration": true,
    "lib": ["es2018", "esnext.asynciterable", "dom"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
EOF

echo "Fixed TypeScript linting issues!" 