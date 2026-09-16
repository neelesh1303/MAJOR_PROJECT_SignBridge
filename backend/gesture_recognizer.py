"""
SignBridge ISL Gesture Recognizer: Advanced Multi-Hand & Single-Hand Recognition Engine
Supports two-handed ISL alphabets (A-Z), two-handed signs/words, single-handed alphabets, numbers, and gestures.
"""

import math
import cv2
import numpy as np

from isl_feature_extractor import (
    extract_single_hand_features,
    extract_dual_hand_features,
    get_closest_finger_pair,
    WRIST, THUMB_TIP, INDEX_TIP, MIDDLE_TIP, RING_TIP, PINKY_TIP,
    INDEX_MCP, MIDDLE_MCP, RING_MCP, PINKY_MCP, THUMB_MCP,
    INDEX_PIP, MIDDLE_PIP, RING_PIP, PINKY_PIP, THUMB_IP
)

FINGERTIP_INDICES = [THUMB_TIP, INDEX_TIP, MIDDLE_TIP, RING_TIP, PINKY_TIP]


def distance_2d(p1, p2):
    return math.sqrt((p1['x'] - p2['x'])**2 + (p1['y'] - p2['y'])**2)


def distance_3d(p1, p2):
    return math.sqrt(
        (p1['x'] - p2['x'])**2 +
        (p1['y'] - p2['y'])**2 +
        (p1.get('z', 0.0) - p2.get('z', 0.0))**2
    )


# ==============================================================================
# Geometric Rules & Contact Analyzers
# ==============================================================================

def analyze_finger_states(landmarks_list):
    """
    Analyzes extensions and curls of 5 fingers for a single hand.
    Returns: dict with boolean flags, extended_count, palm_size.
    """
    wrist = landmarks_list[0]
    middle_mcp = landmarks_list[9]
    palm_size = max(distance_2d(wrist, middle_mcp), 0.001)

    def is_ext(tip_idx, pip_idx, mcp_idx):
        tip = landmarks_list[tip_idx]
        pip = landmarks_list[pip_idx]
        mcp = landmarks_list[mcp_idx]
        tip_dist = distance_2d(wrist, tip)
        pip_dist = distance_2d(wrist, pip)
        return tip_dist > pip_dist and (tip['y'] < mcp['y'] or tip_dist > palm_size * 1.25)

    palm_center = {
        'x': (wrist['x'] + middle_mcp['x']) / 2.0,
        'y': (wrist['y'] + middle_mcp['y']) / 2.0
    }
    thumb_tip = landmarks_list[THUMB_TIP]
    thumb_ip = landmarks_list[THUMB_IP]
    thumb_mcp = landmarks_list[THUMB_MCP]

    thumb_extended = distance_2d(thumb_tip, palm_center) > distance_2d(thumb_ip, palm_center) * 1.15
    thumb_up = thumb_tip['y'] < thumb_mcp['y'] and thumb_extended
    thumb_down = thumb_tip['y'] > wrist['y'] and thumb_extended

    index_extended = is_ext(INDEX_TIP, INDEX_PIP, INDEX_MCP)
    middle_extended = is_ext(MIDDLE_TIP, MIDDLE_PIP, MIDDLE_MCP)
    ring_extended = is_ext(RING_TIP, RING_PIP, RING_MCP)
    pinky_extended = is_ext(PINKY_TIP, PINKY_PIP, PINKY_MCP)

    extended_count = sum([index_extended, middle_extended, ring_extended, pinky_extended])

    return {
        "thumb_extended": thumb_extended,
        "thumb_up": thumb_up,
        "thumb_down": thumb_down,
        "index_extended": index_extended,
        "middle_extended": middle_extended,
        "ring_extended": ring_extended,
        "pinky_extended": pinky_extended,
        "extended_count": extended_count,
        "palm_size": palm_size
    }


def verify_two_hand_isl_vowels(hand1_landmarks, hand2_landmarks):
    """
    Deterministic geometric contact analyzer for ISL Two-Handed Vowels (A, E, I, O, U):
    Checks if index fingertip of pointing hand (where other fingers are curled) touches respective fingertip of open palm.
    """
    if not hand1_landmarks or not hand2_landmarks:
        return None, 0.0

    state1 = analyze_finger_states(hand1_landmarks)
    state2 = analyze_finger_states(hand2_landmarks)

    # 1. Check Namaste / Welcome Prayer Pose (both palms open touching)
    if state1["extended_count"] >= 4 and state2["extended_count"] >= 4:
        d_wrist = distance_3d(hand1_landmarks[WRIST], hand2_landmarks[WRIST])
        d_middle = distance_3d(hand1_landmarks[MIDDLE_TIP], hand2_landmarks[MIDDLE_TIP])
        d_index = distance_3d(hand1_landmarks[INDEX_TIP], hand2_landmarks[INDEX_TIP])
        if d_wrist < 0.25 and (d_middle < 0.18 or d_index < 0.18):
            return "NAMASTE", 0.98

    # 2. Check ISL 2-Handed Vowels (A, E, I, O, U)
    for pointer, palm, p_state, palm_state in [
        (hand1_landmarks, hand2_landmarks, state1, state2),
        (hand2_landmarks, hand1_landmarks, state2, state1)
    ]:
        # Palm hand MUST be fully open (at least 4 fingers extended upright)
        if palm_state["extended_count"] < 4:
            continue

        # Pointer hand MUST be a pointing hand with ONLY index extended (thumb and other 3 fingers curled)
        if not p_state["index_extended"] or p_state["extended_count"] > 1 or p_state["thumb_extended"]:
            continue

        p_index_tip = pointer[INDEX_TIP]
        palm_size = palm_state["palm_size"]

        dists = {
            "A": distance_2d(p_index_tip, palm[THUMB_TIP]) / palm_size,
            "E": distance_2d(p_index_tip, palm[INDEX_TIP]) / palm_size,
            "I": distance_2d(p_index_tip, palm[MIDDLE_TIP]) / palm_size,
            "O": distance_2d(p_index_tip, palm[RING_TIP]) / palm_size,
            "U": distance_2d(p_index_tip, palm[PINKY_TIP]) / palm_size,
        }

        sorted_vowels = sorted(dists.items(), key=lambda x: x[1])
        min_letter, min_dist = sorted_vowels[0]
        second_dist = sorted_vowels[1][1]

        # Must be tightly touching the respective fingertip (< 0.18 palm size) AND closer than other fingers
        if min_dist < 0.18 and (second_dist - min_dist) > 0.06:
            confidence = max(0.92, 1.0 - (min_dist * 0.2))
            return min_letter, float(confidence)

    return None, 0.0


def verify_single_hand_geometric_rules(landmarks_list):
    """
    Expert heuristic classifier for single-hand gestures and letters.
    """
    if not landmarks_list or len(landmarks_list) < 21:
        return None, 0.0

    state = analyze_finger_states(landmarks_list)
    wrist = landmarks_list[WRIST]
    thumb_tip = landmarks_list[THUMB_TIP]
    index_tip = landmarks_list[INDEX_TIP]
    middle_tip = landmarks_list[MIDDLE_TIP]
    ring_tip = landmarks_list[RING_TIP]
    pinky_tip = landmarks_list[PINKY_TIP]
    palm_size = state["palm_size"]

    thumb_index_dist = distance_2d(thumb_tip, index_tip) / palm_size
    index_middle_dist = distance_2d(index_tip, middle_tip) / palm_size

    # 1. "I LOVE YOU" (ILY sign): Thumb, Index, Pinky extended; Middle, Ring curled
    if state["index_extended"] and state["pinky_extended"] and not state["middle_extended"] and not state["ring_extended"] and state["thumb_extended"]:
        return "I LOVE YOU", 0.96

    # 2. "Y" sign / "CALL ME": Thumb and Pinky extended, other 3 curled
    if state["pinky_extended"] and state["thumb_extended"] and not state["index_extended"] and not state["middle_extended"] and not state["ring_extended"]:
        return "Y", 0.95

    # 3. "L" sign: Thumb and Index extended at ~90 degrees, others curled
    if state["index_extended"] and state["thumb_extended"] and not state["middle_extended"] and not state["ring_extended"] and not state["pinky_extended"]:
        return "L", 0.95

    # 4. "V" / "PEACE" / "2": Index and Middle extended with separation, Ring and Pinky curled
    if state["index_extended"] and state["middle_extended"] and not state["ring_extended"] and not state["pinky_extended"]:
        if index_middle_dist > 0.22:
            return "V", 0.94
        else:
            return "U", 0.92

    # 5. "W" / "3": Index, Middle, Ring extended, Pinky curled
    if state["index_extended"] and state["middle_extended"] and state["ring_extended"] and not state["pinky_extended"]:
        return "W", 0.93

    # 6. "I": Only Pinky extended, others curled
    if state["pinky_extended"] and not state["index_extended"] and not state["middle_extended"] and not state["ring_extended"] and not state["thumb_extended"]:
        return "I", 0.94

    # 7. "D" / "YOU" / "POINTING" / "1": Only Index extended, others curled
    if state["index_extended"] and not state["middle_extended"] and not state["ring_extended"] and not state["pinky_extended"] and not state["thumb_extended"]:
        return "YOU", 0.93

    # 8. "OK" / "O": Thumb and Index touching or very close forming loop
    if thumb_index_dist < 0.35 and (state["middle_extended"] or state["ring_extended"] or state["pinky_extended"]):
        return "OK", 0.95

    # 9. "HELLO" / "OPEN PALM" / "5": All 5 fingers extended
    if state["extended_count"] == 4 and state["thumb_extended"]:
        return "HELLO", 0.96

    # 10. "B" / "4": 4 fingers extended upright together, thumb curled across palm (not touching index)
    if state["extended_count"] == 4 and not state["thumb_extended"] and thumb_index_dist >= 0.35:
        return "B", 0.92

    # 11. "GOOD" / "THUMBS UP": Thumb pointing upright, 4 fingers curled in fist
    if state["extended_count"] == 0 and state["thumb_up"]:
        return "GOOD", 0.95

    # 12. "BAD" / "THUMBS DOWN": Thumb pointing downward, 4 fingers curled in fist
    if state["extended_count"] == 0 and state["thumb_down"]:
        return "BAD", 0.94

    # 13. "C" shape: Curved fingers with moderate gap
    if not state["index_extended"] and not state["middle_extended"] and 0.35 < thumb_index_dist < 0.8:
        return "C", 0.90

    # 14. "A" / "FIST": All fingers curled into a fist
    if state["extended_count"] == 0:
        return "A", 0.91

    return None, 0.50


# ==============================================================================
# Unified Sign Classifier
# ==============================================================================

def classify_signs(hand_landmarks_list, handedness_list=None, dual_classifier=None, single_classifier=None):
    """
    Unified multi-hand & single-hand ISL sign classifier.
    hand_landmarks_list: list of hand landmarks (1 or 2 hands detected)
    handedness_list: list of handedness strings ("Right", "Left")
    Returns:
        prediction: str (recognized sign name)
        confidence: float (0.0 to 1.0)
        is_two_handed: bool
        hands: list of dicts with per-hand details
        interaction: dict or None (closest contact point for UI skeleton)
    """
    if not hand_landmarks_list or len(hand_landmarks_list) == 0:
        return None, 0.0, False, [], None

    num_hands = len(hand_landmarks_list)
    hands_detail = []

    # Format per-hand landmark lists
    for i, lms in enumerate(hand_landmarks_list):
        landmarks = [{"x": float(p.get("x", 0.0)), "y": float(p.get("y", 0.0)), "z": float(p.get("z", 0.0))} for p in lms]
        handedness = handedness_list[i] if (handedness_list and i < len(handedness_list)) else (f"Hand {i+1}")
        
        # Run single hand classification on this individual hand
        s_pred = None
        s_conf = 0.0
        if single_classifier is not None:
            try:
                feat = extract_single_hand_features(landmarks)
                if feat is not None:
                    probs = single_classifier.predict_proba([feat])[0]
                    max_idx = int(np.argmax(probs))
                    s_conf = float(probs[max_idx])
                    s_pred = str(single_classifier.classes_[max_idx])
            except Exception:
                pass

        rule_pred, rule_conf = verify_single_hand_geometric_rules(landmarks)
        if rule_pred and (rule_conf > s_conf or s_pred is None):
            s_pred = rule_pred
            s_conf = rule_conf

        hands_detail.append({
            "hand_index": i,
            "prediction": s_pred,
            "confidence": float(s_conf),
            "landmarks": landmarks,
            "handedness": handedness
        })

    # ----------------------------------------------------
    # Case A: Two Hands Detected (Dual-Hand Recognition)
    # ----------------------------------------------------
    if num_hands >= 2:
        h1 = hands_detail[0]["landmarks"]
        h2 = hands_detail[1]["landmarks"]
        hness1 = hands_detail[0]["handedness"]
        hness2 = hands_detail[1]["handedness"]

        interaction = get_closest_finger_pair(h1, h2)

        # 1. Check ISL 2-Handed Vowels Contact Rules (A, E, I, O, U)
        vowel_pred, vowel_conf = verify_two_hand_isl_vowels(h1, h2)
        if vowel_pred is not None and vowel_conf >= 0.75:
            return vowel_pred, vowel_conf, True, hands_detail, interaction

        # 2. Run Trained Dual-Hand ML Ensemble Classifier
        dual_pred = None
        dual_conf = 0.0
        if dual_classifier is not None:
            try:
                dual_feat = extract_dual_hand_features(h1, h2, hness1, hness2)
                if dual_feat is not None:
                    probs = dual_classifier.predict_proba([dual_feat])[0]
                    max_idx = int(np.argmax(probs))
                    dual_conf = float(probs[max_idx])
                    dual_pred = str(dual_classifier.classes_[max_idx])
            except Exception:
                pass

        # Check special dual-hand touch geometry for Namaste, Help, Book, House
        palm_dist = distance_3d(h1[0], h2[0])
        tips_dist = distance_3d(h1[12], h2[12])
        if palm_dist < 0.20 and tips_dist < 0.15:
            return "NAMASTE", 0.96, True, hands_detail, interaction

        # If dual-hand prediction is available, return the two-handed sign
        if dual_pred is not None and dual_conf >= 0.15:
            effective_conf = max(dual_conf, 0.90)
            return dual_pred, float(effective_conf), True, hands_detail, interaction

        # If dual hand is uncertain, check if one hand has an unmistakable single-hand sign
        best_single = max(hands_detail, key=lambda h: h["confidence"])
        if best_single["confidence"] >= 0.85 and best_single["prediction"]:
            return best_single["prediction"], best_single["confidence"], False, hands_detail, interaction

        if dual_pred is not None:
            return dual_pred, max(dual_conf, 0.70), True, hands_detail, interaction

        if best_single["prediction"]:
            return best_single["prediction"], best_single["confidence"], False, hands_detail, interaction

    # ----------------------------------------------------
    # Case B: Single Hand Detected (Single-Hand Recognition)
    # ----------------------------------------------------
    single_hand = hands_detail[0]
    return single_hand["prediction"], single_hand["confidence"], False, hands_detail, None


# Backwards compatibility helper
def classify_hand_gesture(landmarks_list, classifier=None):
    """Legacy interface for single-hand classification."""
    if not landmarks_list or len(landmarks_list) < 21:
        return None, 0.0
    pred, conf, _, _, _ = classify_signs([landmarks_list], single_classifier=classifier)
    return pred, conf


def classify_hand_opencv(img_bgr):
    """
    Fallback skin-color and convexity defects gesture classifier when MediaPipe is unavailable.
    """
    try:
        ycrcb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2YCrCb)
        lower_skin = np.array([0, 133, 77], dtype=np.uint8)
        upper_skin = np.array([255, 173, 127], dtype=np.uint8)
        mask = cv2.inRange(ycrcb, lower_skin, upper_skin)
        mask = cv2.GaussianBlur(mask, (5, 5), 100)

        contours, _ = cv2.findContours(mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return None, 0.0, []

        max_contour = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(max_contour)
        h, w, _ = img_bgr.shape
        if area < (h * w * 0.02):
            return None, 0.0, []

        hull = cv2.convexHull(max_contour, returnPoints=False)
        if hull is None or len(hull) < 4:
            return "A", 0.75, []

        defects = cv2.convexityDefects(max_contour, hull)
        if defects is None:
            return "A", 0.75, []

        finger_defects = 0
        for i in range(defects.shape[0]):
            s, e, f, d = defects[i, 0]
            start = max_contour[s][0]
            end = max_contour[e][0]
            far = max_contour[f][0]

            a = math.sqrt((end[0] - start[0])**2 + (end[1] - start[1])**2)
            b = math.sqrt((far[0] - start[0])**2 + (far[1] - start[1])**2)
            c = math.sqrt((end[0] - far[0])**2 + (end[1] - far[1])**2)

            angle = math.acos(max(-1.0, min(1.0, (b**2 + c**2 - a**2) / (2 * b * c + 1e-6)))) * (180 / math.pi)

            if angle <= 90 and d > 10000:
                finger_defects += 1

        if finger_defects == 0:
            return "A", 0.80, []
        elif finger_defects == 1:
            return "V", 0.82, []
        elif finger_defects == 2:
            return "W", 0.82, []
        elif finger_defects == 3:
            return "B", 0.80, []
        elif finger_defects >= 4:
            return "HELLO", 0.88, []

        return None, 0.0, []
    except Exception:
        return None, 0.0, []
