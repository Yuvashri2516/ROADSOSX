"""
RoadSoS X — Risk Engine (Member 1: AI & Computer Vision Lead)
Fuses outputs from ObjectDetector, LaneDetector, and DriverMonitor
to calculate a unified RoadSoS X risk assessment payload.

Output Risk Levels: LOW | MEDIUM | HIGH | CRITICAL

Produces the exact AI JSON payload expected by the React Dashboard
and the FastAPI Backend.
"""

import time


class RiskEngine:
    def __init__(self):
        self.frames_processed = 0
        self.start_time       = time.time()
        print("[RiskEngine] Ready.")

    def assess(
        self,
        detection_result: dict,
        lane_result: dict,
        driver_result: dict,
        processing_time_ms: float,
    ) -> dict:
        """
        Fuse all module outputs into a single risk payload.
        
        Returns the exact AIStatus JSON structure used by the Dashboard.
        """
        self.frames_processed += 1

        # --- Collision Risk ---
        # Determined primarily by ObjectDetector risk score
        collision_risk = detection_result.get("collision_risk", "LOW")

        # Override to CRITICAL if both high object risk + driver drowsy
        driver_status = driver_result.get("driver_status", "ALERT")
        if collision_risk == "HIGH" and driver_status in ("DROWSY", "SLEEPING"):
            collision_risk = "CRITICAL"

        # --- Alert Logic ---
        alert_required = (
            collision_risk in ("HIGH", "CRITICAL")
            or lane_result.get("alert_required", False)
            or driver_result.get("alert_required", False)
        )

        # --- Build Payload (matches React Dashboard AIStatus type) ---
        payload = {
            "collision_risk":   collision_risk,
            "lane_status":      lane_result.get("lane_status", "LANE STABLE"),
            "driver_status":    driver_status,
            "alert_required":   alert_required,
            "processed_frames": self.frames_processed,
            "processing_time":  round(processing_time_ms, 2),
            "risk_score":       detection_result.get("risk_score", 0.0),
            "deviation_px":     lane_result.get("deviation_px", 0),
            "ear_score":        driver_result.get("ear_score"),
            "detected_objects": detection_result.get("detected_objects", {}),
            "closest_object":   detection_result.get("closest_object"),
            "timestamp":        time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

        return payload

    def get_alert_message(self, payload: dict) -> str | None:
        """Generate a human-readable alert message from the risk payload."""
        risk = payload.get("collision_risk", "LOW")
        lane = payload.get("lane_status", "LANE STABLE")
        driver = payload.get("driver_status", "ALERT")

        if driver in ("SLEEPING", "DROWSY"):
            return f"⚠️ Driver Drowsiness Detected — {driver.title()}! Please pull over safely."

        if risk == "CRITICAL":
            return "🚨 CRITICAL: Imminent Collision Risk — Brake Immediately!"

        if risk == "HIGH":
            closest = payload.get("closest_object")
            if closest:
                return f"⚠️ HIGH Risk: {closest['label'].title()} too close. Reduce Speed."
            return "⚠️ HIGH Collision Risk Detected — Maintain Safe Distance."

        if lane in ("LANE DEPARTED", "LANE DRIFTING"):
            return f"⚠️ {lane.replace('_', ' ').title()} — Correct Steering Now."

        return None
