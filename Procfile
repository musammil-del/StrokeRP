web: python backend/manage.py migrate && python backend/manage.py collectstatic --noinput && gunicorn backend.wsgi:application --chdir backend --bind 0.0.0.0:$PORT
