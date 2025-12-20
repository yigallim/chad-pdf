from flask_pymongo import PyMongo
from redis.asyncio import Redis

mongo = PyMongo()

REDIS_HOST="127.0.0.1"
REDIS_PORT=6379
REDIS_DB=0

redis_client = Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    db=REDIS_DB,
    decode_responses=True
)

