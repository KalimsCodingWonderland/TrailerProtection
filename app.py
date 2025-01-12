#app.py

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Simulated database for trailers
trailers = {}

@app.route('/report_trailer', methods=['POST'])
def report_trailer():
    data = request.json
    ID = data.get('ID')
    title = data.get('title')
    report_type = data.get('type')

    if not ID or not title or not report_type:
        return jsonify({"error": "Missing ID, title, or type"}), 400

    # Check if "trailer" exists in the title
    if "trailer" not in title.lower():
        return jsonify({"error": "This video is not a trailer and cannot be reported."}), 403

    if ID not in trailers:
        trailers[ID] = {"amazing": 0, "spoiler": 0, "too_much": 0}

    if report_type in trailers[ID]:
        trailers[ID][report_type] += 1
    else:
        return jsonify({"error": "Invalid report type"}), 400

    return jsonify({"message": f"{report_type.capitalize()} report submitted for trailer!"})

@app.route('/check_trailer', methods=['POST'])
def check_trailer():
    data = request.json
    ID = data.get('ID')
    title = data.get('title')
    if ID:
        trailer_data = trailers.get(ID, {"amazing": 0, "spoiler": 0, "too_much": 0})
        total_reports = sum(trailer_data.values())
        return jsonify({
            "spoiler": trailer_data["spoiler"] > 5,
            "too_much": trailer_data["too_much"] > 5,
            "amazing": trailer_data["amazing"] > 5,
            "counts": trailer_data,
            "total_reports": total_reports
        }), 200
    return jsonify({"error": "ID is required"}), 400

if __name__ == '__main__':
    app.run(debug=True)
