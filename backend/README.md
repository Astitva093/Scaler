# Airbnb India Clone — FastAPI service

This folder contains the assignment's standalone Python backend. It mirrors the API used by the Next.js interface and persists data in `backend/airbnb.db` using SQLite.

```bash
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/docs` for the interactive OpenAPI documentation. The database and India-specific demo records are created automatically on first start. All monetary values are stored and returned in INR.
