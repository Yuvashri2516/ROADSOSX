def calculate_object_risk(det, frame_width):
    area = det.get('area', 0)
    center_x = det.get('center_x', frame_width//2)
    center_gap = abs(center_x - frame_width//2)
    if area > 70000 and center_gap < frame_width * 0.22:
        return 'HIGH'
    if area > 35000 and center_gap < frame_width * 0.34:
        return 'MEDIUM'
    return 'LOW'

def final_risk(object_risks, lane_status, drowsiness_status):
    if 'HIGH' in object_risks or 'DEPARTURE' in lane_status or 'DROWSINESS ALERT' in drowsiness_status:
        return 'HIGH'
    if 'MEDIUM' in object_risks:
        return 'MEDIUM'
    return 'LOW'
