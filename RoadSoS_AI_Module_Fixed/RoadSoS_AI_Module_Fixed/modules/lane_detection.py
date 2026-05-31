import cv2
import numpy as np

class LaneDetector:
    def detect(self, frame):
        h, w = frame.shape[:2]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5,5), 0)
        edges = cv2.Canny(blur, 50, 150)
        mask = np.zeros_like(edges)
        polygon = np.array([[(0,h),(w,h),(int(w*0.62),int(h*0.58)),(int(w*0.38),int(h*0.58))]], np.int32)
        cv2.fillPoly(mask, polygon, 255)
        cropped = cv2.bitwise_and(edges, mask)
        lines = cv2.HoughLinesP(cropped, 1, np.pi/180, threshold=50, minLineLength=45, maxLineGap=120)
        lane_frame = frame.copy()
        status = 'LANE STABLE'
        line_count = 0
        if lines is not None:
            for line in lines[:12]:
                x1,y1,x2,y2 = line[0]
                if abs(x2-x1) < 20:
                    continue
                slope = (y2-y1)/(x2-x1)
                if abs(slope) < 0.35:
                    continue
                line_count += 1
                cv2.line(lane_frame, (x1,y1), (x2,y2), (255,0,0), 3)
        if line_count < 2:
            status = 'LANE NOT CLEAR'
        return lane_frame, status
