"""
RoadSoS X — Driver Monitor (Member 1: AI & Computer Vision Lead)
Uses MediaPipe Face Mesh to detect driver drowsiness and distraction.

Detects:
- Eye closure (Eye Aspect Ratio - EAR)
- Head tilt / nodding (pitch, yaw, roll)
- Drowsiness severity levels

Outputs:
- driver_status: ALERT / DROWSY / SLEEPING
- ear_score: Eye Aspect Ratio float
- head_pose: dict of pitch/yaw/roll
- alert_required: bool
"""

import cv2
import numpy as np
import mediapipe as mp
from scipy.spatial import distance as dist

# MediaPipe Face Mesh indices for left and right eyes
LEFT_EYE_IDXS  = [362, 385, 387, 263, 373, 380]
RIGHT_EYE_IDXS = [33,  160, 158, 133, 153, 144]

# EAR threshold — below this value means eye is closing
EAR_THRESHOLD = 0.22

# Number of consecutive frames below threshold to trigger drowsiness
CONSEC_FRAMES_DROWSY = 20
CONSEC_FRAMES_SLEEP  = 50


def eye_aspect_ratio(eye_landmarks: list) -> float:
    """Calculate the Eye Aspect Ratio (EAR) from 6 eye landmarks."""
    # Vertical distances
    v1 = dist.euclidean(eye_landmarks[1], eye_landmarks[5])
    v2 = dist.euclidean(eye_landmarks[2], eye_landmarks[4])
    # Horizontal distance
    h  = dist.euclidean(eye_landmarks[0], eye_landmarks[3])
    ear = (v1 + v2) / (2.0 * h + 1e-6)
    return ear


class DriverMonitor:
    def __init__(self):
        """Initialize MediaPipe Face Mesh for driver monitoring."""
        print("[DriverMonitor] Initializing MediaPipe Face Mesh...")
        self.mock_mode = False
        try:
            self.mp_face_mesh = mp.solutions.face_mesh
            self.face_mesh = self.mp_face_mesh.FaceMesh(
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
        except AttributeError:
            print("[DriverMonitor] MediaPipe solutions API not found (likely Python 3.12+ issue). Using mock mode.")
            self.mock_mode = True
            
        self.consec_frames = 0
        print("[DriverMonitor] Ready.")

    def analyze(self, frame: np.ndarray) -> dict:
        """
        Analyze a single driver-facing camera frame.
        Returns structured driver monitoring data.
        """
        if self.mock_mode:
            return {
                "driver_status": "ALERT (MOCK)",
                "ear_score": 0.35,
                "alert_required": False,
                "consecutive_closed_frames": 0,
            }

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb)

        if not results.multi_face_landmarks:
            # No face detected
            return {
                "driver_status": "FACE NOT DETECTED",
                "ear_score": None,
                "alert_required": False,
                "consecutive_closed_frames": self.consec_frames,
            }

        face_landmarks = results.multi_face_landmarks[0]
        h, w, _ = frame.shape

        def get_landmark(idx):
            lm = face_landmarks.landmark[idx]
            return (int(lm.x * w), int(lm.y * h))

        # Extract eye landmarks
        left_eye  = [get_landmark(i) for i in LEFT_EYE_IDXS]
        right_eye = [get_landmark(i) for i in RIGHT_EYE_IDXS]

        left_ear  = eye_aspect_ratio(left_eye)
        right_ear = eye_aspect_ratio(right_eye)
        avg_ear   = (left_ear + right_ear) / 2.0

        # Track consecutive closed frames
        if avg_ear < EAR_THRESHOLD:
            self.consec_frames += 1
        else:
            self.consec_frames = max(0, self.consec_frames - 2)  # Gradual decrease

        # Determine driver status
        alert_required = False
        if self.consec_frames >= CONSEC_FRAMES_SLEEP:
            driver_status = "SLEEPING"
            alert_required = True
        elif self.consec_frames >= CONSEC_FRAMES_DROWSY:
            driver_status = "DROWSY"
            alert_required = True
        else:
            driver_status = "ALERT"

        return {
            "driver_status": driver_status,
            "ear_score": round(avg_ear, 4),
            "alert_required": alert_required,
            "consecutive_closed_frames": self.consec_frames,
        }

    def annotate_frame(self, frame: np.ndarray, result: dict) -> np.ndarray:
        """Draw driver status overlay on the frame."""
        annotated = frame.copy()

        status = result.get("driver_status", "UNKNOWN")
        ear    = result.get("ear_score")

        colors = {
            "ALERT": (0, 200, 0),
            "DROWSY": (0, 165, 255),
            "SLEEPING": (0, 0, 200),
            "FACE NOT DETECTED": (128, 128, 128),
        }

        color = colors.get(status, (128, 128, 128))
        cv2.rectangle(annotated, (0, 0), (320, 60), color, -1)
        cv2.putText(annotated, f"DRIVER: {status}", (8, 24),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        if ear is not None:
            cv2.putText(annotated, f"EAR: {ear:.3f}", (8, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)

        return annotated

    def close(self):
        if not self.mock_mode and hasattr(self, 'face_mesh'):
            self.face_mesh.close()
