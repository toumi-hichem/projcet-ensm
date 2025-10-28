# backend
```
cd backend
python manage.py seed_states_and_offices

```
## Upload
```

curl -X POST -F "file=@./backend/core/data/filtered_data_with_recptcl.csv" http://localhost:8000/upload/ > curl_logs.txt

```

## kpi calculation

```
 curl -X GET http://localhost:8000/refresh/      -H "Accept: application/json"
```

## histoy

```
python manage.py rebuild_dashboard_history \
  --start 2021-12-11 \
  --end 2025-05-19 \
  --url http://localhost:8000/refresh/

```
