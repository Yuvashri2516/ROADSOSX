import os, uuid, time
import cv2
from flask import Flask, render_template, request, jsonify, send_from_directory
from modules.object_detection import ObjectDetector
from modules.lane_detection import LaneDetector
from modules.drowsiness_detection import DrowsinessDetector
from modules.risk_scoring import calculate_object_risk, final_risk

BASE = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE, 'uploads')
OUTPUT_DIR = os.path.join(BASE, 'output')
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_DIR
app.config['OUTPUT_FOLDER'] = OUTPUT_DIR

object_detector = ObjectDetector()
lane_detector = LaneDetector()
drowsiness_detector = DrowsinessDetector()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'video' not in request.files:
        return jsonify({'error': 'No video uploaded'}), 400
    video = request.files['video']
    if not video.filename:
        return jsonify({'error': 'No file selected'}), 400

    in_name = f"{uuid.uuid4().hex}_{video.filename}"
    input_path = os.path.join(UPLOAD_DIR, in_name)
    video.save(input_path)

    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        return jsonify({'error': 'Could not open uploaded video'}), 400

    fps = cap.get(cv2.CAP_PROP_FPS) or 20
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 640)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 480)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)

    out_name = f"result_{uuid.uuid4().hex}.mp4"
    out_path = os.path.join(OUTPUT_DIR, out_name)
    writer = cv2.VideoWriter(out_path, cv2.VideoWriter_fourcc(*'mp4v'), max(8, min(fps, 20)), (width, height))

    # IMPORTANT: skip frames so web request does not run forever on long videos.
    frame_skip = 5
    max_processed = 220
    frame_id = 0
    processed = 0
    objects_seen = {}
    high_count = med_count = 0
    latest_lane = 'LANE STABLE'
    latest_driver = 'DRIVER ACTIVE'
    latest_ear = 0
    start = time.time()

    while True:
        ok, frame = cap.read()
        if not ok:
            break
        frame_id += 1
        if frame_id % frame_skip != 0:
            continue
        processed += 1
        if processed > max_processed:
            break

        detections = object_detector.detect(frame)
        obj_risks = []
        for d in detections:
            objects_seen[d['label']] = objects_seen.get(d['label'], 0) + 1
            risk = calculate_object_risk(d, width)
            obj_risks.append(risk)
            if risk == 'HIGH': high_count += 1
            if risk == 'MEDIUM': med_count += 1

        frame = object_detector.draw(frame, detections, obj_risks)
        frame, latest_lane = lane_detector.detect(frame)
        latest_driver, latest_ear = drowsiness_detector.detect(frame)
        overall = final_risk(obj_risks, latest_lane, latest_driver)

        cv2.putText(frame, f"RoadSoS Risk: {overall}", (20,35), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,0,255) if overall=='HIGH' else (0,255,255) if overall=='MEDIUM' else (0,255,0), 2)
        cv2.putText(frame, latest_lane, (20,70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,0), 2)
        cv2.putText(frame, f"{latest_driver} EAR:{latest_ear}", (20,105), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255,255,255), 2)
        writer.write(frame)

    cap.release()
    writer.release()

    if processed == 0:
        return jsonify({'error': 'No frames processed. Try a normal MP4 video.'}), 400

    overall = 'HIGH' if high_count > 2 else 'MEDIUM' if med_count > 4 else 'LOW'
    alert_required = overall == 'HIGH' or 'DROWSINESS ALERT' in latest_driver

    return jsonify({
        'message': 'Analysis completed successfully',
        'processed_frames': processed,
        'total_frames_in_video': total_frames,
        'detected_objects': objects_seen,
        'collision_risk': overall,
        'lane_status': latest_lane,
        'driver_status': latest_driver,
        'ear_value': latest_ear,
        'alert_required': alert_required,
        'processing_seconds': round(time.time() - start, 2),
        'output_video': f'/output/{out_name}'
    })

@app.route('/output/<filename>')
def output_file(filename):
    return send_from_directory(OUTPUT_DIR, filename)

if __name__ == '__main__':
    app.run(debug=True)
