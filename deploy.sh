# El / después de dist es la clave para que copie el CONTENIDO y no la CARPETA
rsync -avz --delete ./dist/ pruebasdesarrollo@172.16.250.230:/var/www/desarrollo.eluniversal.com.mx/notificaciones/dist/

echo "¡Despliegue completado!"