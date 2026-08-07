FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY . .

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || '5000') + '/api/health').then(() => process.exit(0)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
