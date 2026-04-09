from flask import Flask, request, jsonify
from sklearn.ensemble import IsolationForest
import numpy as np
import joblib
import os

app = Flask(__name__)

# Mock database of models
MODEL_DIR = "models/"
os.makedirs(MODEL_DIR, exist_ok=True)

def extract_features(telemetry):
    # Vectorize inputs
    return np.array([[
        telemetry.get('typingSpeedWpm', telemetry.get('typing_speed_wpm', 0)),
        telemetry.get('mouseMovementAvgSpeed', telemetry.get('mouse_movement_avg_speed', 0)),
        telemetry.get('scrollFrequency', telemetry.get('scroll_frequency', 0))
    ]])

@app.route('/api/v1/auth/predict', methods=['POST'])
def predict_risk():
    data = request.json
    user_id = data.get('userId') or data.get('user_id')
    telemetry = data.get('telemetry', {})
    
    if not user_id:
        return jsonify({"error": "userId is required"}), 400

    model_path = os.path.join(MODEL_DIR, f"{user_id}_model.pkl")
    
    # If no model exists, assume training phase (Low Risk)
    if not os.path.exists(model_path):
        return jsonify({"userId": user_id, "riskLevel": "LOW", "score": 0.0, "message": "Baseline not established"})
    
    try:
        model = joblib.load(model_path)
        features = extract_features(telemetry)
        
        # Isolation forest returns 1 for inliers, -1 for outliers
        prediction = model.predict(features)[0]
        anomaly_score = model.decision_function(features)[0] # negative is more anomalous
        
        # Map score to HIGH, MEDIUM, LOW
        if prediction == -1:
            if anomaly_score < -0.10: # Highly anomalous
                risk_level = "HIGH"
            else:
                risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
            
        return jsonify({
            "userId": user_id,
            "riskLevel": risk_level,
            "score": float(anomaly_score)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/v1/auth/train', methods=['POST'])
def train_user_model():
    data = request.json
    user_id = data.get('userId') or data.get('user_id')
    
    if not user_id:
        return jsonify({"error": "userId is required"}), 400
    
    # MOCK: Fetch historical telemetry data for this user from DB.
    # In a real system, you would query Postgres/MongoDB for their past telemetry events.
    # We simulate an array of past feature vectors (e.g., normal behavior)
    np.random.seed(42)  # For reproducible example
    historical_data = np.random.normal(loc=[60, 100, 3], scale=[5, 20, 1], size=(100, 3))
    
    # Train Isolation Forest
    model = IsolationForest(contamination=0.05, random_state=42)
    model.fit(historical_data)
    
    # Save the model
    model_path = os.path.join(MODEL_DIR, f"{user_id}_model.pkl")
    joblib.dump(model, model_path)
    
    return jsonify({"status": "success", "message": f"Model trained for {user_id}"})

if __name__ == '__main__':
    # Run the continuous authentication microservice
    app.run(host='0.0.0.0', port=5000, debug=True)
