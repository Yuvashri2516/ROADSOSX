import cv2, math
try:
    import mediapipe as mp
except Exception:
    mp = None

class DrowsinessDetector:
    def __init__(self):
        self.face_mesh = None
        self.closed_frames = 0
        self.LEFT_EYE = [33,160,158,133,153,144]
        self.RIGHT_EYE = [362,385,387,263,373,380]
        try:
            if mp is not None and hasattr(mp, 'solutions'):
                self.face_mesh = mp.solutions.face_mesh.FaceMesh(max_num_faces=1, refine_landmarks=True, min_detection_confidence=0.5, min_tracking_confidence=0.5)
        except Exception as e:
            print('MediaPipe disabled:', e)
            self.face_mesh = None
    def distance(self,p1,p2):
        return math.sqrt((p1.x-p2.x)**2 + (p1.y-p2.y)**2)
    def ear(self, landmarks, eye):
        v1 = self.distance(landmarks[eye[1]], landmarks[eye[5]])
        v2 = self.distance(landmarks[eye[2]], landmarks[eye[4]])
        h = self.distance(landmarks[eye[0]], landmarks[eye[3]])
        return 0 if h == 0 else (v1+v2)/(2*h)
    def detect(self, frame):
        if self.face_mesh is None:
            return 'DROWSINESS MODULE DISABLED', 0
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        res = self.face_mesh.process(rgb)
        status, val = 'DRIVER ACTIVE', 0
        if res.multi_face_landmarks:
            lm = res.multi_face_landmarks[0].landmark
            val = round((self.ear(lm,self.LEFT_EYE)+self.ear(lm,self.RIGHT_EYE))/2, 3)
            self.closed_frames = self.closed_frames + 1 if val < 0.21 else 0
            if self.closed_frames >= 12:
                status = 'DROWSINESS ALERT'
        return status, val
