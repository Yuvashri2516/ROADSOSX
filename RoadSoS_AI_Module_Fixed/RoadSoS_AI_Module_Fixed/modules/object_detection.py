import cv2

class ObjectDetector:
    def __init__(self, model_path='yolov8n.pt'):
        self.model = None
        self.names = {}
        try:
            from ultralytics import YOLO
            self.model = YOLO(model_path)
            self.names = self.model.names
        except Exception as e:
            print('YOLO disabled:', e)

    def detect(self, frame):
        if self.model is None:
            return []
        results = self.model(frame, verbose=False)
        detections = []
        allowed = {'car','motorcycle','bus','truck','person','bicycle'}
        for r in results:
            for box in r.boxes:
                cls = int(box.cls[0])
                label = self.names.get(cls, str(cls))
                if label not in allowed:
                    continue
                x1,y1,x2,y2 = map(int, box.xyxy[0])
                conf = float(box.conf[0])
                area = max(0, x2-x1)*max(0, y2-y1)
                detections.append({'label': label, 'box': [x1,y1,x2,y2], 'confidence': round(conf,2), 'area': area, 'center_x': (x1+x2)//2})
        return detections

    def draw(self, frame, detections, risks):
        for det, risk in zip(detections, risks):
            x1,y1,x2,y2 = det['box']
            color = (0,255,0) if risk == 'LOW' else (0,255,255) if risk == 'MEDIUM' else (0,0,255)
            cv2.rectangle(frame, (x1,y1), (x2,y2), color, 2)
            cv2.putText(frame, f"{det['label']} {det['confidence']} | {risk}", (x1, max(25,y1-8)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2)
        return frame
