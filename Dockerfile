FROM node:18

WORKDIR /app/apiinfogate

COPY package*.json ./
COPY Internal_CA.crt /usr/local/share/ca-certificates
RUN update-ca-certificates

RUN npm config set proxy http://aycap-proxy-gold.aycap.bayad.co.th:80
RUN npm config set https-proxy http://aycap-proxy-gold.aycap.bayad.co.th:80

RUN NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt  npm --loglevel info install -g nodemon
RUN NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt  npm --loglevel info install pg
RUN NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt  npm --loglevel info install mongoose
RUN NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt  npm --loglevel info install multer
RUN NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt  npm --loglevel info install moment
RUN NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt  npm --loglevel info install

COPY . .

EXPOSE 5432

CMD ["npm", "start"]
