FROM nginx:alpine

# Copy our custom Nginx server configuration template
COPY default.conf.template /etc/nginx/templates/default.conf.template

# Copy the portal landing page and game folders
COPY index.html /usr/share/nginx/html/
COPY crossword /usr/share/nginx/html/crossword/
COPY gating-crisis /usr/share/nginx/html/gating-crisis/
COPY tokenizer-sandbox /usr/share/nginx/html/tokenizer-sandbox/

# Expose port 8080 (Cloud Run's default port)
ENV PORT 8080
EXPOSE 8080
