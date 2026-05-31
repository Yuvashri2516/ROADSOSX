package services

import "roadsos-emergency-engine/models"

func SelectBestHospital(hospitals []models.Hospital, severity string) models.Hospital {
	// Critical always goes to trauma center with lowest ETA
	if severity == "critical" {
		for _, h := range hospitals {
			if h.Type == "trauma" {
				return h
			}
		}
	}

	// Medium goes to general or trauma
	if severity == "medium" {
		best := hospitals[0]
		for _, h := range hospitals {
			if h.Type != "clinic" && h.ETAMinutes < best.ETAMinutes {
				best = h
			}
		}
		return best
	}

	// Low — just pick nearest by ETA
	best := hospitals[0]
	for _, h := range hospitals {
		if h.ETAMinutes < best.ETAMinutes {
			best = h
		}
	}
	return best
}

func GetEmergencyLevel(severity string) string {
	switch severity {
	case "critical":
		return "HIGH"
	case "medium":
		return "MEDIUM"
	default:
		return "LOW"
	}
}