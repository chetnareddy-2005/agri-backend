import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from sklearn.ensemble import IsolationForest
import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB setup
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client['continuous_auth']
telemetry_col = db['user_behavior']
profiles_col = db['user_profiles']

# In-memory store for lightweight models (In production, use Pickled models in DB/S3)
models = {}

def get_behavior_features(data):
    """Transform raw movements/keystrokes into feature vector."""
    # For demo, we use: avg typing speed, avg mouse speed, scroll frequency, flight time
    try:
        features = [
            data.get('avg_typing_speed', 0),
            data.get('avg_mouse_speed', 0),
            data.get('scroll_frequency', 0),
            data.get('flight_time', 0)
        ]
        return np.array(features).reshape(1, -1)
    except Exception as e:
        return None

@app.route('/api/collect', methods=['POST'])
def collect_behavior():
    """Endpoint to receive behavioral data from frontend."""
    data = request.json
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({"error": "user_id required"}), 400
    
    # Enrich with device and timestamp
    telemetry_entry = {
        "user_id": user_id,
        "timestamp": datetime.datetime.utcnow(),
        "device": data.get('device', {}),
        "behavior": data.get('behavior', {})
    }
    
    telemetry_col.insert_one(telemetry_entry)
    
    # Potential: Trigger background training if enough data is collected
    return jsonify({"status": "success"}), 201

@app.route('/api/risk', methods=['POST'])
def assess_risk():
    """Endpoint to check the risk level of current session."""
    data = request.json
    user_id = data.get('user_id')
    current_behavior = data.get('behavior', {})
    
    # 1. Device Check (Quick win)
    # Simple rule: If browser/OS/IP changed drastically, flag it
    # (Implementation omitted for brevity, but crucial for Risk Engine)
    
    # 2. ML behavioral check
    feature_vector = get_behavior_features(current_behavior)
    
    # Fetch historical data for this user to train/refine model
    # For a real system, we'd load a pre-trained Isolation Forest for this user
    historical_data = list(telemetry_col.find({"user_id": user_id}).limit(100))
    
    if len(historical_data) < 20:
        return jsonify({"risk_level": "LOW", "score": 0, "message": "Baseline being established"})

    # Prepare historical features
    hist_features = []
    for d in historical_data:
        b = d.get('behavior', {})
        hist_features.append([
            b.get('avg_typing_speed', 0),
            b.get('avg_mouse_speed', 0),
            b.get('scroll_frequency', 0),
            b.get('flight_time', 0)
        ])
    
    # Train Isolation Forest on user's baseline
    clf = IsolationForest(contamination=0.1, random_state=42)
    clf.fit(hist_features)
    
    # Predict (-1 is anomaly, 1 is normal)
    prediction = clf.predict(feature_vector)[0]
    decision_score = clf.decision_function(feature_vector)[0] # Lower is more anomalous
    
    # Risk Mapping (Relaxed Thresholds)
    # IsolationForest decision_score is usually between -0.5 and 0.5
    # Relaxed mapping:
    # score > -0.05 -> LOW (was 0)
    # -0.05 > score > -0.2 -> MEDIUM (was -0.15)
    # score < -0.2 -> HIGH (was -0.15)
    
    risk_level = "LOW"
    if decision_score < -0.2:
        risk_level = "HIGH"
    elif decision_score < -0.05:
        risk_level = "MEDIUM"
        
    return jsonify({
        "user_id": user_id,
        "risk_level": risk_level,
        "score": float(decision_score),
        "action": "ALLOW" if risk_level == "LOW" else ("OTP" if risk_level == "MEDIUM" else "BLOCK")
    })

if __name__ == '__main__':
    app.run(port=5005, debug=True)
