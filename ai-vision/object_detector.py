"""
RoadSoS X — Object Detector (Member 1: AI & Computer Vision Lead)
Uses YOLOv8 to detect road objects and calculate collision risk.

Detects:
- Cars, Bikes, Trucks, Buses (vehicles)
- Pedestrians, Animals (road users)
- Roadblocks, Obstacles (static objects)

Outputs:
- Detected object counts
- Proximity-based collision risk score
- Closest obstacle distance estimation
"""

import cv2
import numpy as np
from ultralytics import YOLO

# YOLO class IDs for COCO dataset (YOLOv8 default)
VEHICLE_CLASSES = {
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck",
}

VULNERABLE_CLASSES = {
    0: "person",
    15: "cat",
    16: "dog",
    17: "horse",
}

OBSTACLE_CLASSES = {
    9: "traffic light",
    11: "stop sign",
}

RISK_WEIGHTS = {
    "car": 1.0,
    "motorcycle": 0.8,
    "bus": 1.5,
    "truck": 1.8,
    "person": 2.0,   # Pedestrians are highest risk
}


class ObjectDetector:
    def __init__(self, model_path: str = "yolov8n.pt", conf_threshold: float = 0.45):
        """
        Initialize the YOLOv8 object detector.
        model_path: 'yolov8n.pt' (nano, fast), 'yolov8s.pt' (small), 'yolov8m.pt' (medium)
        """
        print("[ObjectDetector] Loading YOLOv8 model...")
        self.model = YOLO(model_path)
        self.conf_threshold = conf_threshold
        print(f"[ObjectDetector] Model loaded: {model_path}")

    def detect(self, frame: np.ndarray) -> dict:
        """
        Run object detection on a single frame.
        Returns a structured dict with objects and risk assessment.
        """
        results = self.model(frame, conf=self.conf_threshold, verbose=False)[0]
        
        detected_objects = {
            "car": 0,
            "motorcycle": 0,
            "bus": 0,
            "truck": 0,
            "person": 0,
            "animal": 0,
            "obstacle": 0,
        }

        boxes_data = []
        frame_height, frame_width = frame.shape[:2]
        frame_area = frame_height * frame_width

        risk_score = 0.0
        closest_object = None
        closest_box_area = 0.0

        for box in results.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            box_area = (x2 - x1) * (y2 - y1)
            box_area_ratio = box_area / frame_area

            label = None

            if cls_id in VEHICLE_CLASSES:
                label = VEHICLE_CLASSES[cls_id]
                if label == "car":
                    detected_objects["car"] += 1
                elif label in ("motorcycle",):
                    detected_objects["motorcycle"] += 1
                elif label == "bus":
                    detected_objects["bus"] += 1
                elif label == "truck":
                    detected_objects["truck"] += 1

            elif cls_id in VULNERABLE_CLASSES:
                label = VULNERABLE_CLASSES[cls_id]
                if label == "person":
                    detected_objects["person"] += 1
                else:
                    detected_objects["animal"] += 1

            elif cls_id in OBSTACLE_CLASSES:
                label = OBSTACLE_CLASSES[cls_id]
                detected_objects["obstacle"] += 1

            if label:
                # Proximity risk: larger bounding box = closer = higher risk
                weight = RISK_WEIGHTS.get(label, 0.5)
                risk_score += box_area_ratio * weight * 100

                if box_area > closest_box_area:
                    closest_box_area = box_area
                    closest_object = {
                        "label": label,
                        "proximity_ratio": round(box_area_ratio, 4),
                        "bbox": [x1, y1, x2, y2],
                    }

                boxes_data.append({
                    "label": label,
                    "conf": round(conf, 2),
                    "bbox": [x1, y1, x2, y2],
                    "proximity_ratio": round(box_area_ratio, 4),
                })

        # Normalize risk score to 0-100 range
        risk_score = min(100.0, risk_score)

        # Risk classification
        if risk_score >= 70:
            collision_risk = "CRITICAL"
        elif risk_score >= 45:
            collision_risk = "HIGH"
        elif risk_score >= 20:
            collision_risk = "MEDIUM"
        else:
            collision_risk = "LOW"

        return {
            "detected_objects": detected_objects,
            "collision_risk": collision_risk,
            "risk_score": round(risk_score, 2),
            "closest_object": closest_object,
            "detections": boxes_data,
        }

    def annotate_frame(self, frame: np.ndarray, detection_result: dict) -> np.ndarray:
        """Draw bounding boxes and risk overlay on the frame."""
        annotated = frame.copy()

        risk_colors = {
            "LOW": (0, 200, 0),
            "MEDIUM": (0, 165, 255),
            "HIGH": (0, 60, 255),
            "CRITICAL": (0, 0, 200),
        }

        for obj in detection_result["detections"]:
            x1, y1, x2, y2 = obj["bbox"]
            label = obj["label"]
            conf = obj["conf"]
            risk = detection_result["collision_risk"]
            color = risk_colors.get(risk, (128, 128, 128))

            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
            cv2.putText(
                annotated,
                f"{label} {conf:.2f}",
                (x1, y1 - 8),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5, color, 2
            )

        # Risk banner
        risk = detection_result["collision_risk"]
        banner_color = risk_colors.get(risk, (128, 128, 128))
        cv2.rectangle(annotated, (0, 0), (300, 36), banner_color, -1)
        cv2.putText(
            annotated,
            f"RISK: {risk} ({detection_result['risk_score']:.0f}%)",
            (8, 24),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7, (255, 255, 255), 2
        )

        return annotated
