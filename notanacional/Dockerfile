FROM nginx:1.25-alpine

# Remove arquivos padrão do nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia os arquivos estáticos do site
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js
COPY img /usr/share/nginx/html/img
COPY video /usr/share/nginx/html/video
COPY docs /usr/share/nginx/html/docs
COPY index.html /usr/share/nginx/html/index.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
