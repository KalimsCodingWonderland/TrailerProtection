#app.py

#mongodb+srv://kalimqazi05:281Bb1010@cluster0.h3s7s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

import pymongo
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from pymongo import MongoClient
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# MongoDB Atlas URI
# Replace your username and password
#MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://kalimqazi05:281Bb1010@cluster0.h3s7s.mongodb.net/?retryWrites=true&w=majority")

# Set up MongoDB client and database
uri = "mongodb+srv://kalimqazi05:281Bb1010@cluster0.h3s7s.mongodb.net/?retryWrites=true&w=majority"
client = MongoClient(uri)
# Send a ping to confirm a successful connection
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)
db = client["trailer_protection"]  # Use the database named "trailer_protection"
trailers_collection = db["trailers"]  # Use the collection named "trailers"


@app.route('/report_trailer', methods=['POST'])
def report_trailer():
    try:
        # Parse incoming JSON data
        data = request.json
        ID = data.get('ID')
        title = data.get('title')
        report_type = data.get('type')

        # Validate required fields
        if not ID or not title or not report_type:
            return jsonify({"error": "Missing ID, title, or type"}), 400

        # Check if "trailer" exists in the title
        if "trailer" not in title.lower():
            return jsonify({"error": "This video is not a trailer and cannot be reported."}), 403

        # Debugging logs
        print(f"Received report: ID={ID}, title={title}, type={report_type}")

        # Check if trailer already exists in DB, otherwise create it
        trailer = trailers_collection.find_one({"ID": ID})
        if not trailer:
            insert_result = trailers_collection.insert_one({
                "ID": ID,
                "title": title,
                "amazing": 0,
                "spoiler": 0,
                "too_much": 0
            })
            print(f"Inserted new trailer with ID={ID}, result={insert_result.inserted_id}")

        # Increment the appropriate report count
        update_result = trailers_collection.update_one(
            {"ID": ID},
            {"$inc": {report_type: 1}}
        )
        if update_result.modified_count > 0:
            return jsonify({"message": f"{report_type.capitalize()} report submitted for trailer!"})

        return jsonify({"error": "Failed to update the trailer"}), 500
    except Exception as e:
        print(f"Error in report_trailer: {e}")
        return jsonify({"error": "An error occurred while processing the request"}), 500

@app.route('/check_trailer', methods=['POST'])
def check_trailer():
    data = request.json
    ID = data.get('ID')
    title = data.get('title')
    if ID:
        trailer = trailers_collection.find_one({"ID": ID})
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
