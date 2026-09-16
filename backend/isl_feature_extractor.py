"""
ISL Feature Extractor: Robust Single-Hand and Dual-Hand 3D Landmark & Spatial Geometry
Extracts translation-, scale-, and rotation-invariant features for both 1-hand and 2-hand ISL recognition.
"""

import math
import numpy as np

# Landmark indices for MediaPipe Hand
WRIST = 0
THUMB_CMC, THUMB_MCP, THUMB_IP, THUMB_TIP = 1, 2, 3, 4
INDEX_MCP, INDEX_PIP, INDEX_DIP, INDEX_TIP = 5, 6, 7, 8
MIDDLE_MCP, MIDDLE_PIP, MIDDLE_DIP, MIDDLE_TIP = 9, 10, 11, 12
RING_MCP, RING_PIP, RING_DIP, RING_TIP = 13, 14, 15, 16
PINKY_MCP, PINKY_PIP, PINKY_DIP, PINKY_TIP = 17, 18, 19, 20

FINGERTIP_INDICES = [THUMB_TIP, INDEX_TIP, MIDDLE_TIP, RING_TIP, PINKY_TIP]
MCP_INDICES = [THUMB_MCP, INDEX_MCP, MIDDLE_MCP, RING_MCP, PINKY_MCP]
PIP_INDICES = [THUMB_IP, INDEX_PIP, MIDDLE_PIP, RING_PIP, PINKY_PIP]
DIP_INDICES = [THUMB_IP, INDEX_DIP, MIDDLE_DIP, RING_DIP, PINKY_DIP]


def _to_numpy_points(landmarks):
    """Convert list of dicts [{'x', 'y', 'z'}] or numpy array into (21, 3) float32 array."""
    if isinstance(landmarks, np.ndarray):
        return landmarks.astype(np.float32)
    return np.asarray([
        [p.get('x', 0.0), p.get('y', 0.0), p.get('z', 0.0)]
        for p in landmarks[:21]
    ], dtype=np.float32)


def extract_single_hand_features(landmarks):
    """
    Extracts 88 invariant features from a single hand (21 3D landmarks):
    - 63 normalized 3D coordinates (wrist centered, palm scaled, canonical rotation)
    - 5 finger extension ratios (tip-to-wrist / mcp-to-wrist)
    - 10 pairwise fingertip distances
    - 5 finger curl angles (joint flexion)
    - 5 palm normal and orientation features
    """
    if landmarks is None or len(landmarks) < 21:
        return None

    raw_pts = _to_numpy_points(landmarks)
    pts = raw_pts.copy()

    # 1. Translate wrist (0) to origin
    wrist = pts[WRIST].copy()
    pts -= wrist

    # 2. Scale by distance between wrist and middle MCP
    palm_axis = pts[MIDDLE_MCP]
    scale = max(float(np.linalg.norm(palm_axis)), 1e-4)
    pts /= scale

    # 3. Canonical 2D rotation around Z-axis so palm axis aligns with +Y
    angle = math.atan2(float(palm_axis[1]), float(palm_axis[0]))
    target_angle = math.pi / 2.0  # Pointing upwards
    rot_angle = target_angle - angle
    cos_a = math.cos(rot_angle)
    sin_a = math.sin(rot_angle)
    rot_matrix = np.array([[cos_a, -sin_a], [sin_a, cos_a]], dtype=np.float32)
    pts[:, :2] = pts[:, :2] @ rot_matrix.T

    # Coordinate features: 63
    coords_flat = pts.reshape(-1)

    # 4. Finger extension ratios (tip-to-wrist vs mcp-to-wrist): 5 features
    extension_ratios = []
    for tip_idx, mcp_idx in zip(FINGERTIP_INDICES, MCP_INDICES):
        tip_dist = np.linalg.norm(pts[tip_idx])
        mcp_dist = max(float(np.linalg.norm(pts[mcp_idx])), 1e-3)
        extension_ratios.append(tip_dist / mcp_dist)
    extension_ratios = np.asarray(extension_ratios, dtype=np.float32)

    # 5. Pairwise Fingertip Euclidean Distances: 10 features
    fingertip_pts = pts[FINGERTIP_INDICES]
    pairwise_dists = []
    for i in range(5):
        for j in range(i + 1, 5):
            d = float(np.linalg.norm(fingertip_pts[i] - fingertip_pts[j]))
            pairwise_dists.append(d)
    pairwise_dists = np.asarray(pairwise_dists, dtype=np.float32)

    # 6. Finger Curl Angles (cosines of joint flexion): 5 features
    curl_angles = []
    for tip_idx, pip_idx, mcp_idx in zip(FINGERTIP_INDICES, PIP_INDICES, MCP_INDICES):
        v1 = pts[tip_idx] - pts[pip_idx]
        v2 = pts[mcp_idx] - pts[pip_idx]
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        if norm1 > 1e-4 and norm2 > 1e-4:
            cos_flex = float(np.dot(v1, v2) / (norm1 * norm2))
            curl_angles.append(max(-1.0, min(1.0, cos_flex)))
        else:
            curl_angles.append(0.0)
    curl_angles = np.asarray(curl_angles, dtype=np.float32)

    # 7. Palm Normal and Orientation Features: 5 features
    v_palm_x = pts[INDEX_MCP] - pts[PINKY_MCP]
    v_palm_y = pts[MIDDLE_MCP] - pts[WRIST]
    palm_normal = np.cross(v_palm_x, v_palm_y)
    norm_len = np.linalg.norm(palm_normal)
    if norm_len > 1e-4:
        palm_normal /= norm_len
    else:
        palm_normal = np.array([0.0, 0.0, 1.0], dtype=np.float32)

    orientation_features = np.array([
        palm_normal[0], palm_normal[1], palm_normal[2],
        float(pts[MIDDLE_MCP, 0]), float(pts[MIDDLE_MCP, 1])
    ], dtype=np.float32)

    features = np.concatenate([
        coords_flat,         # 63
        extension_ratios,    # 5
        pairwise_dists,      # 10
        curl_angles,         # 5
        orientation_features # 5
    ])
    return features.astype(np.float32)  # Total 88 features


def extract_dual_hand_features(hand1_landmarks, hand2_landmarks, handedness1="Right", handedness2="Left"):
    """
    Extracts 220 rich spatial & cross-hand geometric interaction features for 2 hands:
    - 88 features for Hand 1 (e.g. Right hand or sorted primary)
    - 88 features for Hand 2 (e.g. Left hand or sorted secondary)
    - 44 cross-hand interaction features:
        * 3D vector and distance between wrists (4)
        * 3D vector and distance between palm centers (4)
        * 25 cross-hand fingertip-to-fingertip distances (5 tips x 5 tips = 25)
        * 10 cross-hand fingertip-to-opposite-palm-center distances (5 tips x 2 palms = 10)
        * Relative palm normal dot product (1)
        * Height difference (1)
    """
    if hand1_landmarks is None or hand2_landmarks is None:
        return None
    if len(hand1_landmarks) < 21 or len(hand2_landmarks) < 21:
        return None

    pts1 = _to_numpy_points(hand1_landmarks)
    pts2 = _to_numpy_points(hand2_landmarks)

    # Standardize hand order: Hand 1 = Right hand (or leftmost X), Hand 2 = Left hand
    # If handedness is provided, align Hand 1 as Right, Hand 2 as Left
    if handedness1 == "Left" and handedness2 == "Right":
        pts1, pts2 = pts2, pts1

    # Extract individual 88 hand features
    f1 = extract_single_hand_features(pts1)
    f2 = extract_single_hand_features(pts2)
    if f1 is None or f2 is None:
        return None

    # Global normalization for cross-hand features:
    # Scale based on average palm size of both hands
    palm1_size = max(float(np.linalg.norm(pts1[MIDDLE_MCP] - pts1[WRIST])), 1e-4)
    palm2_size = max(float(np.linalg.norm(pts2[MIDDLE_MCP] - pts2[WRIST])), 1e-4)
    avg_scale = (palm1_size + palm2_size) / 2.0

    # Cross-Hand Spatial Relations (normalized by avg_scale)
    # 1. Wrist-to-Wrist 3D Vector & Distance (4)
    wrist_diff = (pts2[WRIST] - pts1[WRIST]) / avg_scale
    wrist_dist = float(np.linalg.norm(wrist_diff))
    wrist_rel = np.array([wrist_diff[0], wrist_diff[1], wrist_diff[2], wrist_dist], dtype=np.float32)

    # 2. Palm Center-to-Palm Center 3D Vector & Distance (4)
    palm_c1 = (pts1[WRIST] + pts1[INDEX_MCP] + pts1[PINKY_MCP]) / 3.0
    palm_c2 = (pts2[WRIST] + pts2[INDEX_MCP] + pts2[PINKY_MCP]) / 3.0
    palm_diff = (palm_c2 - palm_c1) / avg_scale
    palm_dist = float(np.linalg.norm(palm_diff))
    palm_rel = np.array([palm_diff[0], palm_diff[1], palm_diff[2], palm_dist], dtype=np.float32)

    # 3. All 25 Cross-Hand Fingertip-to-Fingertip Distances (25)
    # (Crucial for ISL letters like A: Right index touching Left thumb, E: Left index, I: Left middle, etc.)
    tips1 = pts1[FINGERTIP_INDICES]
    tips2 = pts2[FINGERTIP_INDICES]
    cross_tip_dists = []
    for i in range(5):
        for j in range(5):
            d = float(np.linalg.norm(tips1[i] - tips2[j])) / avg_scale
            cross_tip_dists.append(d)
    cross_tip_dists = np.asarray(cross_tip_dists, dtype=np.float32)

    # 4. Cross-Hand Fingertip-to-Opposite Palm Center Distances (10)
    tip_to_palm_dists = []
    for i in range(5):
        d1 = float(np.linalg.norm(tips1[i] - palm_c2)) / avg_scale
        tip_to_palm_dists.append(d1)
    for j in range(5):
        d2 = float(np.linalg.norm(tips2[j] - palm_c1)) / avg_scale
        tip_to_palm_dists.append(d2)
    tip_to_palm_dists = np.asarray(tip_to_palm_dists, dtype=np.float32)

    # 5. Relative Palm Normal Dot Product & Relative Height (2)
    norm1 = np.cross(pts1[INDEX_MCP] - pts1[PINKY_MCP], pts1[MIDDLE_MCP] - pts1[WRIST])
    norm2 = np.cross(pts2[INDEX_MCP] - pts2[PINKY_MCP], pts2[MIDDLE_MCP] - pts2[WRIST])
    len1 = max(float(np.linalg.norm(norm1)), 1e-4)
    len2 = max(float(np.linalg.norm(norm2)), 1e-4)
    norm_dot = float(np.dot(norm1 / len1, norm2 / len2))
    height_diff = float((pts1[WRIST, 1] - pts2[WRIST, 1])) / avg_scale
    angles_rel = np.array([norm_dot, height_diff], dtype=np.float32)

    # Combine all: 88 + 88 + 4 + 4 + 25 + 10 + 2 = 221 features (approx 220)
    dual_features = np.concatenate([
        f1,                 # 88
        f2,                 # 88
        wrist_rel,          # 4
        palm_rel,           # 4
        cross_tip_dists,    # 25
        tip_to_palm_dists,  # 10
        angles_rel          # 2
    ])
    return dual_features.astype(np.float32)


def get_closest_finger_pair(hand1_landmarks, hand2_landmarks):
    """
    Helper for visual UI: returns the closest pair of fingertips between Hand 1 and Hand 2.
    Useful for highlighting contact/touching points in 2-handed ISL alphabets.
    """
    if not hand1_landmarks or not hand2_landmarks:
        return None
    pts1 = _to_numpy_points(hand1_landmarks)
    pts2 = _to_numpy_points(hand2_landmarks)

    min_dist = float('inf')
    best_pair = None
    finger_names = ["Thumb", "Index", "Middle", "Ring", "Pinky"]

    for i, idx1 in enumerate(FINGERTIP_INDICES):
        for j, idx2 in enumerate(FINGERTIP_INDICES):
            d = float(np.linalg.norm(pts1[idx1] - pts2[idx2]))
            if d < min_dist:
                min_dist = d
                best_pair = {
                    "hand1_finger": finger_names[i],
                    "hand2_finger": finger_names[j],
                    "hand1_idx": idx1,
                    "hand2_idx": idx2,
                    "distance": min_dist,
                    "hand1_point": {"x": float(pts1[idx1, 0]), "y": float(pts1[idx1, 1])},
                    "hand2_point": {"x": float(pts2[idx2, 0]), "y": float(pts2[idx2, 1])}
                }
    return best_pair
