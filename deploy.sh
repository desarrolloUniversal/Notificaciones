#Comandos para automatizar el despliegue en el servidor remoto
rsync -avz --delete ./dist pruebasdesarrollo@172.16.250.230:/var/www/desarrollo.eluniversal.com.mx/notificaciones
echo "¡Despliegue completado!"
