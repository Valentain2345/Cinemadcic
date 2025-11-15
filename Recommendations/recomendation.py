# recomentation_min.py
import os
import logging
from datetime import datetime
from flask import Flask, jsonify
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError
from bson import ObjectId, json_util
from uuid import UUID
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# ----------------------------------------------------------------------
# Logging Setup (console + structured)
# ----------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
log = logging.getLogger(__name__)

app = Flask(__name__)

# ----------------------------------------------------------------------
# MongoDB Connection with Logging
# ----------------------------------------------------------------------
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/moviesdb")
log.info(f"Attempting to connect to MongoDB at: {MONGO_URI}")

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    log.info("MongoDB connection SUCCESSFUL")
except ServerSelectionTimeoutError as e:
    log.critical(f"MongoDB connection FAILED: {e}")
    raise

db = client["moviesdb"]
movies = db["movies"]
ratings = db["ratings"]

log.info(f"Collections: movies={movies.count_documents({})}, ratings={ratings.count_documents({})}")

# ----------------------------------------------------------------------
# Safe JSON Serializer (handles ObjectId, datetime, etc.)
# ----------------------------------------------------------------------
def to_json(obj):
    """Convert MongoDB BSON → JSON-serializable Python dict/list."""
    try:
        # json_util.dumps should be used to handle BSON types like ObjectId
        return json_util.dumps(obj)
    except Exception as e:
        log.error(f"JSON serialization failed: {e}")
        raise

# ----------------------------------------------------------------------
# Cache: Top 10 movies (cold start)
# ----------------------------------------------------------------------
_top10 = None
def top10():
    global _top10
    if _top10 is not None:
        log.info("Returning cached top-10 movies")
        return _top10

    log.info("Building cold-start top-10 movies")
    pipeline = [
        {"$match": {"imdb.rating": {"$gt": 0}}},
        {"$sort": {"imdb.rating": -1}},
        {"$limit": 10},
        {"$project": {"_id": 1, "title": 1, "year": 1, "genres": 1, "imdb.rating": 1}}
    ]
    try:
        result = [to_json(m) for m in movies.aggregate(pipeline)]
        _top10 = result
        log.info(f"Cold-start top-10 built: {len(result)} movies")
        return result
    except Exception as e:
        log.error(f"Failed to build top-10: {e}")
        raise

# ----------------------------------------------------------------------
# Helper: Get imdb.id safely
# ----------------------------------------------------------------------
def imdb_id(doc):
    try:
        return int(doc["imdb"]["id"])
    except Exception:
        return None
# ----------------------------------------------------------------------
# ENDPOINT: All rated movies – RAW + FULL FIELDS (no ObjectId error)
# ----------------------------------------------------------------------
@app.get("/rated-movies")
def all_rated_movies():
    log.info("GET /rated-movies – returning full raw movie data")
    try:
        pipeline = [
            {"$lookup": {
                "from": "movies",
                "localField": "movieId",
                "foreignField": "_id",
                "as": "movie"
            }},
            {"$unwind": "$movie"},
            {"$project": {
                # rating doc fields
                "userId": 1,
                "user_rating": "$rating",
                # movie doc fields – keep everything you listed
                "plot": "$movie.plot",
                "genres": "$movie.genres",
                "runtime": "$movie.runtime",
                "cast": "$movie.cast",
                "poster": "$movie.poster",
                "title": "$movie.title",
                "fullplot": "$movie.fullplot",
                "languages": "$movie.languages",
                "released": "$movie.released",
                "directors": "$movie.directors",
                "rated": "$movie.rated",
                "awards": "$movie.awards",
                "lastupdated": "$movie.lastupdated",
                "year": "$movie.year",
                "imdb": "$movie.imdb",
                "countries": "$movie.countries",
                "type": "$movie.type",
                "tomatoes": "$movie.tomatoes",
                "num_mflix_comments": "$movie.num_mflix_comments",
                # convert ObjectId → string
                "movie_id": {"$toString": "$movie._id"}
            }},
            {"$sort": {"user_rating": -1}}
        ]
        docs = list(ratings.aggregate(pipeline))

        # Print the raw data from the database to see the structure (for debugging)
        print("Raw data from the database:", docs)

        # Convert ObjectId to string using str() in the final output
        for doc in docs:
            # Convert the '_id' field from ObjectId to string
            doc["_id"] = str(doc["_id"])
            # Ensure other ObjectId fields (if any) are also converted to string
            if 'movie_id' in doc:
                doc['movie_id'] = str(doc['movie_id'])

        # Now, serialize the result
        safe = [json_util.loads(json_util.dumps(d)) for d in docs]  # Converting to JSON-safe format

        log.info(f"Returning {len(safe)} full rated movies")
        return jsonify({"rated_movies": safe})
    except Exception as e:
        log.error(f"Error in /rated-movies: {e}")
        return jsonify({"error": str(e)}), 500

# ----------------------------------------------------------------------
# ENDPOINT: User rated movies – FULL RAW FIELDS
# ----------------------------------------------------------------------
@app.get("/rated-movies/<user_id>")
def user_rated_movies(user_id):
    log.info(f"GET /rated-movies/{user_id} – full raw data")
    try:
        # Validate that the user_id is a valid UUID
        UUID(user_id)
        log.info(f"Valid UUID: {user_id}")
    except ValueError:
        log.warning(f"Invalid UUID: {user_id}")
        return jsonify({"error": "Invalid UUID"}), 400

    try:
        pipeline = [
            {"$match": {"userId": user_id}},  # Match ratings for the given userId
            {"$lookup": {
                "from": "movies",  # Lookup related movie documents
                "localField": "movieId",  # The field in ratings referring to movie _id
                "foreignField": "_id",  # The _id field in movies
                "as": "movie"
            }},
            {"$unwind": "$movie"},  # Flatten the resulting movie array
            {"$project": {
                "user_rating": "$rating",
                "plot": "$movie.plot",
                "genres": "$movie.genres",
                "runtime": "$movie.runtime",
                "cast": "$movie.cast",
                "poster": "$movie.poster",
                "title": "$movie.title",
                "fullplot": "$movie.fullplot",
                "languages": "$movie.languages",
                "released": "$movie.released",
                "directors": "$movie.directors",
                "rated": "$movie.rated",
                "awards": "$movie.awards",
                "lastupdated": "$movie.lastupdated",
                "year": "$movie.year",
                "imdb": "$movie.imdb",
                "countries": "$movie.countries",
                "type": "$movie.type",
                "tomatoes": "$movie.tomatoes",
                "num_mflix_comments": "$movie.num_mflix_comments",
                "movie_id": {"$toString": "$movie._id"}  # Convert ObjectId to string
            }},
            {"$sort": {"user_rating": -1}}  # Sort by user rating in descending order
        ]

        # Perform the aggregation query
        docs = list(ratings.aggregate(pipeline))

        # Print the raw data from the database (for debugging)
        print("Raw data from the database:", docs)

        # Convert _id and other ObjectId fields to string for JSON serialization
        for doc in docs:
            doc["_id"] = str(doc["_id"])  # Convert _id to string
            if 'movie_id' in doc:
                doc['movie_id'] = str(doc['movie_id'])  # Convert movie_id to string

        # Serialize the result to a JSON-safe format
        safe = [json_util.loads(json_util.dumps(d)) for d in docs]

        log.info(f"User {user_id} has {len(safe)} rated movies")
        return jsonify({"userId": user_id, "rated_movies": safe})

    except Exception as e:
        log.error(f"Error in /rated-movies/{user_id}: {e}")
        return jsonify({"error": str(e)}), 500

# ----------------------------------------------------------------------
# ENDPOINT: Recommend
# ----------------------------------------------------------------------

def normalize_movie(doc):
    """Convert MongoDB movie document into JSON-safe format."""
    if not doc:
        return None

    # Convert ObjectId → string
    doc["_id"] = str(doc["_id"])

    # Convert datetime → string
    for field in ["released", "lastupdated"]:
        if field in doc and hasattr(doc[field], "isoformat"):
            doc[field] = doc[field].strftime("%a, %d %b %Y %H:%M:%S GMT")

    if "tomatoes" in doc:
        t = doc["tomatoes"]
        for field in ["lastUpdated", "dvd"]:
            if field in t and hasattr(t[field], "isoformat"):
                t[field] = t[field].strftime("%a, %d %b %Y %H:%M:%S GMT")

    return doc

def cold_start_recommendations():
    movies_list = list(movies.find().sort("imdb.rating", -1).limit(10))
    return [normalize_movie(m) for m in movies_list]


@app.get("/recommend/<user_id>")
def recommend_endpoint(user_id):
    log.info(f"GET /recommend/{user_id}")

    # Validate UUID
    try:
        UUID(user_id)
    except ValueError:
        return jsonify({"error": "Invalid UUID"}), 400

    try:
        # Load ratings
        user_ratings = list(ratings.find({"userId": user_id}))

        # Cold start
        if len(user_ratings) < 3:
            return jsonify({
                "mode": "cold_start",
                "recommendations": cold_start_recommendations()
            })

        # Resolve movies
        rated = []
        for r in user_ratings:
            doc = movies.find_one({"_id": ObjectId(r["movieId"])})
            if doc and imdb_id(doc):
                rated.append((doc, float(r["rating"])))

        if not rated:
            return jsonify({"error": "No valid rated movies"}), 404

        # Candidates
        candidates = list(movies.find().sort("imdb.rating", -1).limit(100))

        # Build TF-IDF text corpus
        corpus = [d for d, _ in rated] + candidates
        texts = [
            f"{d.get('fullplot','') or d.get('plot','')} {' '.join(d.get('genres',[]))}"
            for d in corpus
        ]

        vec = TfidfVectorizer(stop_words="english", max_features=2000)
        tfidf = vec.fit_transform(texts)

        # User profile vector
        weights = np.array([w for _, w in rated])
        user_vec = np.average(tfidf[:len(rated)].toarray(), axis=0, weights=weights)

        # Similarities
        sims = cosine_similarity(user_vec.reshape(1, -1), tfidf[len(rated):]).flatten()

        rated_ids = {str(imdb_id(d)) for d, _ in rated}
        scored = []

        for i, cand in enumerate(candidates):
            cid = str(imdb_id(cand))
            if cid in rated_ids:
                continue

            imdb_rating = cand.get("imdb", {}).get("rating", 0) or 0
            score = 0.7 * sims[i] + 0.3 * (imdb_rating / 10.0)
            scored.append((score, cand))

        # Top 10 normalized movies
        recommendations = [
            normalize_movie(cand)
            for _, cand in sorted(scored, key=lambda x: x[0], reverse=True)[:10]
        ]

        return jsonify({
            "mode": "personalized",
            "recommendations": recommendations
        })

    except Exception as e:
        log.error(f"CRITICAL ERROR in /recommend/{user_id}: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# ----------------------------------------------------------------------
# Utility Endpoints
# ----------------------------------------------------------------------
@app.get("/users")
def list_users():
    users = sorted(str(u) for u in ratings.distinct("userId"))
    log.info(f"Returning {len(users)} users")
    print("Welcome to the Movie Recommender API!")
    return jsonify({"users": users})

@app.get("/")
def home():
    return jsonify({
        "message": "Movie Recommender API – Fully Logged",
        "time": datetime.now().isoformat(),
        "endpoints": {
            "recommend": "/recommend/<uuid>",
            "rated_movies_all": "/rated-movies",
            "rated_movies_user": "/rated-movies/<uuid>",
            "users": "/users"
        }
    })

# ----------------------------------------------------------------------
# Run
# ----------------------------------------------------------------------
if __name__ == "__main__":
    log.info("Starting Flask server on 0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000, debug=False)
