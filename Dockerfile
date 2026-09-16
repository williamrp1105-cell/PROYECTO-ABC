FROM php:8.2-apache
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv default-mysql-client
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY python/requirements.txt /tmp/requirements.txt
RUN pip3 install --no-cache-dir -r /tmp/requirements.txt
RUN docker-php-ext-install pdo pdo_mysql mysqli
COPY . /var/www/html/
RUN chown -R www-data:www-data /var/www/html/