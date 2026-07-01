FROM nginx:alpine

# Copy our custom Nginx server configuration template
COPY default.conf.template /etc/nginx/templates/default.conf.template

# Copy the static crossword puzzle files into the Nginx public directory
COPY index.html style.css app.js /usr/share/nginx/html/

# Expose port 8080 (Cloud Run's default port)
ENV PORT 8080
EXPOSE 8080
