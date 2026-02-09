#Comandos para automatizar el despliegue en el servidor remoto
rsync -avz --delete ./dist pruebasdesarrollo@172.16.250.230:/tmp/dist_not
echo "¡Despliegue completado!"
