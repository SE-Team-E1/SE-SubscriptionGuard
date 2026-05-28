FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . /app/

EXPOSE 8000

# djangotest = Name deines Projektordners mit wsgi.py
CMD ["sh", "-c", "python manage.py migrate && gunicorn djangotest.wsgi:application --bind 0.0.0.0:8000 --workers 3"]
