FROM nginx:alpine

# Copy our custom Nginx server configuration template
COPY default.conf.template /etc/nginx/templates/default.conf.template

# Copy the portal landing page and game folders
COPY index.html /usr/share/nginx/html/
COPY llms-are-demented /usr/share/nginx/html/crossword/
COPY gating-crisis /usr/share/nginx/html/gating-crisis/
COPY tokenizer-sandbox /usr/share/nginx/html/tokenizer-sandbox/
COPY gpu-survivors /usr/share/nginx/html/gpu-survivors/
COPY token-factory /usr/share/nginx/html/token-factory/
COPY vector-strike /usr/share/nginx/html/vector-strike/
COPY epoch-duel /usr/share/nginx/html/epoch-duel/
COPY llm-fighter /usr/share/nginx/html/llm-fighter/

# Expose port 8080 (Cloud Run's default port)
ENV PORT 8080
EXPOSE 8080
