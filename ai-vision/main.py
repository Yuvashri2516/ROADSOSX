"""
RoadSoS X — AI Vision Engine Master Orchestrator
Member 1: AI & Computer Vision Lead

This is the main entry point for the AI pipeline.
It:
  1. Opens the road-facing and driver-facing camera streams
  2. Runs YOLOv8 object detection on the road frame
  3. Runs MediaPipe driver monitoring on the driver frame
  4. Runs OpenCV lane detection on the road frame
  5. Fuses all outputs through the RiskEngine
  6. Streams live AI payload to the backend via WebSocket
  7. Optionally displays annotated windows for debugging

USAGE:
  python main.py                     # Use laptop webcam (cam 0)
  python main.py --road-cam 0        # Specify road camera index
  python main.py --driver-cam 1      # Specify driver camera index
  python main.py --road-video path   # Use a video file instead of webcam
  python main.py --no-display        # Headless mode (no windows)
"""

import cv2
import asyncio
import time
import argparse
import sys
import platform

# Use DirectShow on Windows to avoid MSMF driver crashes
CAM_BACKEND = cv2.CAP_DSHOW if platform.system() == 'Windows' else cv2.CAP_ANY

from object_detector import ObjectDetector
from driver_monitor   import DriverMonitor
from lane_detector    import LaneDetector
from risk_engine      import RiskEngine
from telemetry_client import TelemetryClient


def parse_args():
    parser = argparse.ArgumentParser(description="RoadSoS X AI Vision Engine")
    parser.add_argument("--road-cam",    type=int, default=0,    help="Road camera index (default: 0)")
    parser.add_argument("--driver-cam",  type=int, default=0,    help="Driver camera index (default: 0, same as road for dev)")
    parser.add_argument("--road-video",  type=str, default=None, help="Path to dashcam video file (overrides --road-cam)")
    parser.add_argument("--driver-video",type=str, default=None, help="Path to driver-facing video file")
    parser.add_argument("--backend-url", type=str, default="ws://localhost:8000/ws/telemetry", help="Backend WebSocket URL")
    parser.add_argument("--no-display",  action="store_true",    help="Disable OpenCV preview windows")
    parser.add_argument("--fps-limit",   type=int, default=15,   help="Max frames per second to send (default: 15)")
    parser.add_argument("--yolo-model",  type=str, default="yolov8n.pt", help="YOLOv8 model size (default: yolov8n.pt)")
    return parser.parse_args()


async def main():
    args = parse_args()

    print("=" * 55)
    print("  RoadSoS X — AI & Computer Vision Engine")
    print("  Version 1.0.0  |  'Predict. Prevent. Protect.'")
    print("=" * 55)

    # ── Initialize all modules ──────────────────────────────
    detector = ObjectDetector(model_path=args.yolo_model)
    driver   = DriverMonitor()
    lane     = LaneDetector(departure_threshold_px=60)
    risk     = RiskEngine()
    client   = TelemetryClient(uri=args.backend_url)

    # ── Open camera / video streams ─────────────────────────
    road_source   = args.road_video   or args.road_cam
    driver_source = args.driver_video or args.driver_cam

    def open_camera(source):
        """Open camera with DirectShow on Windows for stability."""
        if isinstance(source, int):
            cap = cv2.VideoCapture(source, CAM_BACKEND)
        else:
            cap = cv2.VideoCapture(source)  # Video file — no backend flag needed
        if cap.isOpened():
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            cap.set(cv2.CAP_PROP_FPS, 30)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Minimize latency
        return cap

    road_cap = open_camera(road_source)

    if not road_cap.isOpened():
        print(f"[ERROR] Could not open road camera/video: {road_source}")
        print("[ERROR] Make sure no other app (Teams, Zoom, etc.) is using your webcam.")
        sys.exit(1)

    print(f"[Main] Road source:   {road_source}")
    print(f"[Main] Streaming to:  {args.backend_url}")
    print(f"[Main] Display:       {'OFF (headless)' if args.no_display else 'ON'}")
    print()

    # ── Connect to Backend ──────────────────────────────────
    await client.connect()

    frame_delay = 1.0 / args.fps_limit
    consecutive_failures = 0
    MAX_FAILURES = 10
    print(f"[Main] Starting pipeline at {args.fps_limit} FPS...\n")

    try:
        while True:
            t_start = time.perf_counter()

            # ── Capture frame ──────────────────────────────
            road_ok, road_frame = road_cap.read()

            if not road_ok:
                consecutive_failures += 1
                print(f"[Main] Frame grab failed ({consecutive_failures}/{MAX_FAILURES}). Retrying...")
                await asyncio.sleep(0.5)
                if consecutive_failures >= MAX_FAILURES:
                    print("[Main] Camera lost. Attempting reconnect...")
                    road_cap.release()
                    await asyncio.sleep(2)
                    road_cap = open_camera(road_source)
                    consecutive_failures = 0
                    if not road_cap.isOpened():
                        print("[Main] Reconnect failed. Exiting.")
                        break
                continue

            consecutive_failures = 0
            driver_frame = road_frame.copy()  # Single-cam dev setup

            # ── Run AI Modules ─────────────────────────────
            t_ai_start = time.perf_counter()

            detection_result = detector.detect(road_frame)
            lane_result      = lane.detect(road_frame)
            driver_result    = driver.analyze(driver_frame)

            t_ai_end         = time.perf_counter()
            processing_ms    = (t_ai_end - t_ai_start) * 1000

            # ── Fuse risk payload ──────────────────────────
            payload = risk.assess(
                detection_result=detection_result,
                lane_result=lane_result,
                driver_result=driver_result,
                processing_time_ms=processing_ms,
            )

            # ── Stream to backend ──────────────────────────
            await client.send(payload)

            # ── Console status ─────────────────────────────
            alert_msg = risk.get_alert_message(payload)
            status_line = (
                f"[AI] RISK: {payload['collision_risk']:<8} | "
                f"LANE: {payload['lane_status']:<18} | "
                f"DRIVER: {payload['driver_status']:<10} | "
                f"FPS: {1000/processing_ms:.1f} | "
                f"Objects: {sum(payload['detected_objects'].values())}"
            )
            print(status_line)
            if alert_msg:
                print(f"  >>> {alert_msg}")

            # ── Display annotated windows ──────────────────
            if not args.no_display:
                road_annotated   = detector.annotate_frame(road_frame, detection_result)
                road_annotated   = lane.annotate_frame(road_annotated, lane_result)
                driver_annotated = driver.annotate_frame(driver_frame, driver_result)

                cv2.imshow("RoadSoS X — Road View", road_annotated)
                cv2.imshow("RoadSoS X — Driver View", driver_annotated)

                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    print("[Main] Quit signal received.")
                    break

            # ── Frame rate limiter ─────────────────────────
            elapsed = time.perf_counter() - t_start
            sleep_time = max(0.0, frame_delay - elapsed)
            await asyncio.sleep(sleep_time)

    except KeyboardInterrupt:
        print("\n[Main] Interrupted by user. Shutting down...")

    finally:
        road_cap.release()
        driver_cap.release()
        cv2.destroyAllWindows()
        await client.close()
        driver.close()
        print("[Main] RoadSoS X AI Engine stopped.")


if __name__ == "__main__":
    asyncio.run(main())
