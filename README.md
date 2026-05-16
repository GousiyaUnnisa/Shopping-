# Online Shopping Portal (Full Stack)

- Backend: Express (Fake Store API proxy + checkout simulation)
- Frontend: React + Vite
- Demo checkout: `POST /api/checkout`

## Run

### 1) Install dependencies

From project root:

```bash
npm install
npm --prefix server install
npm --prefix client install
```

### 2) Start (dev)

```bash
npm start
```

- Client: http://localhost:5173
- Server: http://localhost:5000

## Production / Deployment Notes

### 1) Backend (Express)
This project has an Express backend that serves endpoints under `/api/*`.

### 2) Frontend API base URL
The React app calls the backend using `VITE_API_BASE`:

- Default (dev): `http://localhost:5000`
- In production, set `VITE_API_BASE` to your deployed backend URL, for example:
  - `https://your-backend.onrender.com`

### 3) Recommended full-stack hosting
GitHub Actions builds the client, but the runtime must be hosted on a platform that supports Node/Express (e.g. Render / Fly / Heroku).

## Notes
- Products/categories are fetched from https://fakestoreapi.com/
- Cart is client-side; checkout is simulated on the server.


