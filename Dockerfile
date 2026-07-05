# 1. Base image
FROM node:20-alpine
# Añade esta línea para instalar la compatibilidad que Prisma necesita
# RUN apk add --no-cache libc6-compat openssl1.1-compat
# RUN apk add --no-cache libc6-compat openssl
# 2. Set working directory
WORKDIR /app

# 3. Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# 4. Copy source code
COPY . .

# Generar el cliente de Prisma para que los tipos estén disponibles
RUN npx prisma generate

# 5. Build Next.js
RUN npm run build

# 6. Expose port
EXPOSE 3000

# 7. Run app
CMD ["npm", "start"]
