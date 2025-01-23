# app.py
# Encryption

import os
import pymongo
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import bcrypt
import jwt
import datetime
from functools import wraps

# Load environment variables from .env (only in development)
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Retrieve secrets from environment variables
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
if not app.config['SECRET_KEY']:
    raise ValueError("No SECRET_KEY set for Flask application")

# MongoDB Setup
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise ValueError("No MONGO_URI set for Flask application")

client = MongoClient(MONGO_URI)
db = client["trailer_protection"]
trailers_collection = db["trailers"]
users_collection = db["users"]  # Collection for user data


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # JWT is expected to be passed in the Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            parts = auth_header.split()
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]

        if not token:
            app.logger.warning("Token is missing in the request headers.")
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = users_collection.find_one({"_id": pymongo.ObjectId(data['user_id'])})
            if not current_user:
                app.logger.warning(f"User not found for user_id: {data['user_id']}")
                raise Exception('User not found')
            app.logger.info(f"Token successfully validated for user_id: {data['user_id']}")
        except jwt.ExpiredSignatureError:
            app.logger.warning("Token has expired.")
            return jsonify({'message': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            app.logger.warning("Invalid token.")
            return jsonify({'message': 'Token is invalid!'}), 401
        except Exception as e:
            app.logger.error(f"Token verification failed: {e}")
            return jsonify({'message': 'Token is invalid!'}), 401

        return f(current_user, *args, **kwargs)

    return decorated


@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'error': 'Please provide username, email, and password'}), 400

    # Check if user already exists
    if users_collection.find_one({"email": email}):
        return jsonify({'error': 'User already exists'}), 409

    # Hash the password
    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    # Create user document
    user = {
        "username": username,
        "email": email,
        "password": hashed_pw,
        "reports": {}  # Stores report counts per trailer
    }

    users_collection.insert_one(user)
    return jsonify({'message': 'User registered successfully'}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Please provide email and password'}), 400

    user = users_collection.find_one({"email": email})
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401

    if not bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = jwt.encode({
        'user_id': str(user['_id']),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm="HS256")

    # Ensure token is a string
    if isinstance(token, bytes):
        token = token.decode('utf-8')

    return jsonify({'token': token}), 200


@app.route('/report_trailer', methods=['POST'])
@token_required
def report_trailer(current_user):
    try:
        data = request.json
        trailer_id = data.get('ID')
        title = data.get('title')
        report_type = data.get('type')

        if not trailer_id or not title or not report_type:
            return jsonify({"error": "Missing ID, title, or type"}), 400

        if "trailer" not in title.lower():
            return jsonify({"error": "This video is not a trailer and cannot be reported."}), 403

        # Initialize user's report count for this trailer if not present
        user_reports = current_user.get('reports', {})
        user_trailer_reports = user_reports.get(trailer_id, 0)

        if user_trailer_reports >= 10:
            return jsonify({"error": "Report limit reached for this trailer."}), 403

        # Check if trailer exists, else create
        trailer = trailers_collection.find_one({"ID": trailer_id})
        if not trailer:
            trailers_collection.insert_one({
                "ID": trailer_id,
                "title": title,
                "amazing": 0,
                "spoiler": 0,
                "too_much": 0
            })

        # Increment the appropriate report count
        trailers_collection.update_one(
            {"ID": trailer_id},
            {"$inc": {report_type: 1}}
        )

        # Update user's report count for this trailer
        users_collection.update_one(
            {"_id": current_user["_id"]},
            {"$inc": {f"reports.{trailer_id}": 1}}
        )

        return jsonify({"message": f"{report_type.capitalize()} report submitted for trailer!"}), 200

    except Exception as e:
        app.logger.error(f"Error in report_trailer: {e}")
        return jsonify({"error": "An error occurred while processing the request"}), 500


@app.route('/check_trailer', methods=['POST'])
def check_trailer():
    data = request.json
    trailer_id = data.get('ID')
    title = data.get('title')
    if trailer_id:
        trailer = trailers_collection.find_one({"ID": trailer_id})
        if trailer:
            total_reports = sum(trailer[key] for key in ["amazing", "spoiler", "too_much"])
            return jsonify({
                "spoiler": trailer["spoiler"] > 5,
                "too_much": trailer["too_much"] > 5,
                "amazing": trailer["amazing"] > 5,
                "counts": {
                    "amazing": trailer["amazing"],
                    "spoiler": trailer["spoiler"],
                    "too_much": trailer["too_much"]
                },
                "total_reports": total_reports
            }), 200
        return jsonify({"error": "Trailer not found"}), 404
    return jsonify({"error": "ID is required"}), 400


if __name__ == '__main__':
    app.run(debug=True)
