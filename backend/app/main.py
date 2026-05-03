from fastapi import FastAPI

app = FastAPI(title="DishSync API")

@app.get("/health")
def health():
    return {"ok": True}
