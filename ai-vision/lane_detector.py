"""
RoadSoS X — Lane Detector (Member 1: AI & Computer Vision Lead)
Uses OpenCV classical computer vision to detect lane markings
and identify lane departure.

Detects:
- Left and right lane markings
- Lane center deviation
- Lane departure warnings

Outputs:
- lane_status: LANE STABLE / LANE DRIFTING / LANE DEPARTED / NO LANE DETECTED
- deviation_px: pixel deviation from lane center
- alert_required: bool
"""

import cv2
import numpy as np
from typing import Optional


class LaneDetector:
    def __init__(self, departure_threshold_px: int = 60):
        """
        Initialize lane detector.
        departure_threshold_px: pixel deviation from center before raising alarm.
        """
        self.departure_threshold = departure_threshold_px
        self.drift_threshold = departure_threshold_px // 2
        print("[LaneDetector] Ready.")

    def _preprocess(self, frame: np.ndarray) -> np.ndarray:
        """Convert frame to edge image for Hough transform."""
        gray   = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blur   = cv2.GaussianBlur(gray, (5, 5), 0)
        edges  = cv2.Canny(blur, 50, 150)

        # Region of interest — bottom 45% of frame (road area)
        h, w = edges.shape
        mask = np.zeros_like(edges)
        roi_vertices = np.array([[
            (0, h),
            (w * 0.1, h * 0.55),
            (w * 0.9, h * 0.55),
            (w, h)
        ]], dtype=np.int32)
        cv2.fillPoly(mask, roi_vertices, 255)
        return cv2.bitwise_and(edges, mask)

    def _detect_lines(self, edge_img: np.ndarray) -> Optional[np.ndarray]:
        """Run Hough Line Transform to find lane lines."""
        lines = cv2.HoughLinesP(
            edge_img,
            rho=1,
            theta=np.pi / 180,
            threshold=40,
            minLineLength=60,
            maxLineGap=150
        )
        return lines

    def _classify_lines(self, lines, width: int):
        """Separate detected lines into left and right lane lines."""
        left_lines  = []
        right_lines = []

        if lines is None:
            return left_lines, right_lines

        for line in lines:
            x1, y1, x2, y2 = line[0]
            if x2 == x1:
                continue
            slope = (y2 - y1) / (x2 - x1)

            # Filter nearly-horizontal lines (noise)
            if abs(slope) < 0.3:
                continue

            if slope < 0 and x1 < width // 2:
                left_lines.append(line[0])
            elif slope > 0 and x1 > width // 2:
                right_lines.append(line[0])

        return left_lines, right_lines

    def _average_line(self, lines: list, height: int):
        """Average multiple detected lines into a single representative line."""
        if not lines:
            return None

        slopes     = []
        intercepts = []

        for x1, y1, x2, y2 in lines:
            if x2 == x1:
                continue
            slope = (y2 - y1) / (x2 - x1)
            intercept = y1 - slope * x1
            slopes.append(slope)
            intercepts.append(intercept)

        avg_slope     = np.mean(slopes)
        avg_intercept = np.mean(intercepts)

        # Compute endpoints
        y_bottom = height
        y_top    = int(height * 0.6)

        if avg_slope == 0:
            return None

        x_bottom = int((y_bottom - avg_intercept) / avg_slope)
        x_top    = int((y_top    - avg_intercept) / avg_slope)

        return (x_bottom, y_bottom, x_top, y_top)

    def detect(self, frame: np.ndarray) -> dict:
        """
        Analyze a single road-facing camera frame for lane detection.
        Returns structured lane status data.
        """
        h, w = frame.shape[:2]

        edge_img    = self._preprocess(frame)
        lines       = self._detect_lines(edge_img)
        left_lines, right_lines = self._classify_lines(lines, w)

        left_avg  = self._average_line(left_lines, h)
        right_avg = self._average_line(right_lines, h)

        lane_center_x  = None
        frame_center_x = w // 2
        deviation_px   = 0

        if left_avg and right_avg:
            left_bottom_x  = left_avg[0]
            right_bottom_x = right_avg[0]
            lane_center_x  = (left_bottom_x + right_bottom_x) // 2
            deviation_px   = frame_center_x - lane_center_x
        elif left_avg:
            deviation_px = -80   # Can't see right lane — drifting right
        elif right_avg:
            deviation_px = 80    # Can't see left lane — drifting left

        # Classify lane status
        abs_dev = abs(deviation_px)
        if not left_avg and not right_avg:
            lane_status    = "NO LANE DETECTED"
            alert_required = False
        elif abs_dev >= self.departure_threshold:
            lane_status    = "LANE DEPARTED"
            alert_required = True
        elif abs_dev >= self.drift_threshold:
            lane_status    = "LANE DRIFTING"
            alert_required = True
        else:
            lane_status    = "LANE STABLE"
            alert_required = False

        return {
            "lane_status":    lane_status,
            "deviation_px":   deviation_px,
            "left_detected":  left_avg is not None,
            "right_detected": right_avg is not None,
            "left_line":      left_avg,
            "right_line":     right_avg,
            "lane_center_x":  lane_center_x,
            "alert_required": alert_required,
        }

    def annotate_frame(self, frame: np.ndarray, result: dict) -> np.ndarray:
        """Draw lane lines and status overlay on the frame."""
        annotated = frame.copy()
        h, w      = frame.shape[:2]

        lane_color = {
            "LANE STABLE":      (0, 220, 0),
            "LANE DRIFTING":    (0, 165, 255),
            "LANE DEPARTED":    (0, 0, 220),
            "NO LANE DETECTED": (128, 128, 128),
        }

        # Draw left lane
        if result["left_line"]:
            x1b, y1b, x1t, y1t = result["left_line"]
            cv2.line(annotated, (x1b, y1b), (x1t, y1t), (255, 100, 0), 4)

        # Draw right lane
        if result["right_line"]:
            x2b, y2b, x2t, y2t = result["right_line"]
            cv2.line(annotated, (x2b, y2b), (x2t, y2t), (255, 100, 0), 4)

        # Draw center reference
        cv2.line(annotated, (w // 2, h), (w // 2, int(h * 0.6)), (255, 255, 0), 2)

        # Status banner
        status = result["lane_status"]
        color  = lane_color.get(status, (128, 128, 128))
        cv2.rectangle(annotated, (0, h - 50), (360, h), color, -1)
        cv2.putText(annotated, f"LANE: {status}  DEV: {result['deviation_px']}px",
                    (8, h - 16), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        return annotated
