"""
Generate Synthetic & GIF-Harvested ISL Multi-Hand Datasets and Train Ensemble Classifiers.
Trains:
1. `backend/model/isl_dual_hand_classifier.pkl` (Two-Handed ISL Alphabets A-Z + Two-Handed Words)
2. `backend/model/isl_single_hand_classifier.pkl` (Single-Handed Alphabets A-Z, Numbers 1-10, Gestures)
"""

import argparse
import glob
import math
import os
from pathlib import Path
import pickle
import sys

import cv2
import numpy as np
from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

# Setup paths
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent
MODEL_DIR = BACKEND_DIR / "model"
HAND_MODEL_PATH = MODEL_DIR / "hand_landmarker.task"
GIFS_DIR = PROJECT_ROOT / "public" / "ISL_Gifs"

sys.path.insert(0, str(BACKEND_DIR))
from isl_feature_extractor import (
    extract_single_hand_features,
    extract_dual_hand_features,
    WRIST, THUMB_TIP, INDEX_TIP, MIDDLE_TIP, RING_TIP, PINKY_TIP,
    INDEX_MCP, MIDDLE_MCP, PINKY_MCP
)


# ==============================================================================
# 1. 3D Landmark Geometry Templates for Anatomical Hand Poses
# ==============================================================================

def create_base_hand(side="right"):
    """
    Creates canonical 21-landmark 3D hand mesh.
    side: 'right' or 'left'
    """
    sign = 1.0 if side == "right" else -1.0
    # Canonical neutral flat hand (21 landmarks)
    pts = np.array([
        [0.0, 0.0, 0.0],          # 0: Wrist
        [sign * 0.18, -0.15, -0.05], # 1: Thumb CMC
        [sign * 0.32, -0.32, -0.08], # 2: Thumb MCP
        [sign * 0.42, -0.48, -0.10], # 3: Thumb IP
        [sign * 0.50, -0.62, -0.12], # 4: Thumb Tip
        [sign * 0.16, -0.60, -0.02], # 5: Index MCP
        [sign * 0.18, -0.82, -0.03], # 6: Index PIP
        [sign * 0.19, -0.98, -0.04], # 7: Index DIP
        [sign * 0.20, -1.12, -0.05], # 8: Index Tip
        [0.00, -0.62, 0.00],        # 9: Middle MCP
        [0.00, -0.86, 0.00],        # 10: Middle PIP
        [0.00, -1.04, 0.00],        # 11: Middle DIP
        [0.00, -1.20, 0.00],        # 12: Middle Tip
        [-sign * 0.15, -0.58, -0.02], # 13: Ring MCP
        [-sign * 0.16, -0.80, -0.03], # 14: Ring PIP
        [-sign * 0.17, -0.96, -0.04], # 15: Ring DIP
        [-sign * 0.18, -1.10, -0.05], # 16: Ring Tip
        [-sign * 0.28, -0.50, -0.04], # 17: Pinky MCP
        [-sign * 0.30, -0.68, -0.05], # 18: Pinky PIP
        [-sign * 0.32, -0.82, -0.06], # 19: Pinky DIP
        [-sign * 0.34, -0.94, -0.07]  # 20: Pinky Tip
    ], dtype=np.float32)
    return pts


def set_finger_pose(hand, finger, state="extended", side="right"):
    """
    Adjusts specific finger landmarks for extended, curled (fist), half-curled, or spread.
    finger: 'thumb', 'index', 'middle', 'ring', 'pinky'
    state: 'extended', 'curled', 'half', 'touch'
    """
    sign = 1.0 if side == "right" else -1.0
    pts = hand.copy()

    if finger == "thumb":
        if state == "curled":
            pts[2] = [sign * 0.15, -0.30, 0.08]
            pts[3] = [sign * 0.05, -0.35, 0.12]
            pts[4] = [0.0, -0.40, 0.15] # tucked in palm
        elif state == "extended":
            pts[2] = [sign * 0.35, -0.35, -0.08]
            pts[3] = [sign * 0.48, -0.50, -0.10]
            pts[4] = [sign * 0.58, -0.65, -0.12] # extended outward
        elif state == "up":
            pts[2] = [sign * 0.25, -0.35, -0.05]
            pts[3] = [sign * 0.30, -0.65, -0.08]
            pts[4] = [sign * 0.35, -0.95, -0.10] # thumbs up

    elif finger == "index":
        mcp = pts[5]
        if state == "curled":
            pts[6] = [mcp[0], mcp[1] - 0.05, 0.12]
            pts[7] = [mcp[0], mcp[1] + 0.10, 0.10]
            pts[8] = [mcp[0], mcp[1] + 0.08, 0.02]
        elif state == "half":
            pts[6] = [mcp[0], mcp[1] - 0.15, 0.08]
            pts[7] = [mcp[0], mcp[1] - 0.25, 0.12]
            pts[8] = [mcp[0], mcp[1] - 0.20, 0.06]
        elif state == "extended":
            pts[6] = [mcp[0] + sign * 0.02, mcp[1] - 0.22, -0.01]
            pts[7] = [mcp[0] + sign * 0.03, mcp[1] - 0.38, -0.02]
            pts[8] = [mcp[0] + sign * 0.04, mcp[1] - 0.52, -0.03]

    elif finger == "middle":
        mcp = pts[9]
        if state == "curled":
            pts[10] = [mcp[0], mcp[1] - 0.05, 0.12]
            pts[11] = [mcp[0], mcp[1] + 0.10, 0.10]
            pts[12] = [mcp[0], mcp[1] + 0.08, 0.02]
        elif state == "half":
            pts[10] = [mcp[0], mcp[1] - 0.15, 0.08]
            pts[11] = [mcp[0], mcp[1] - 0.25, 0.12]
            pts[12] = [mcp[0], mcp[1] - 0.20, 0.06]
        elif state == "extended":
            pts[10] = [mcp[0], mcp[1] - 0.24, 0.00]
            pts[11] = [mcp[0], mcp[1] - 0.42, 0.00]
            pts[12] = [mcp[0], mcp[1] - 0.58, 0.00]

    elif finger == "ring":
        mcp = pts[13]
        if state == "curled":
            pts[14] = [mcp[0], mcp[1] - 0.05, 0.12]
            pts[15] = [mcp[0], mcp[1] + 0.10, 0.10]
            pts[16] = [mcp[0], mcp[1] + 0.08, 0.02]
        elif state == "half":
            pts[14] = [mcp[0], mcp[1] - 0.15, 0.08]
            pts[15] = [mcp[0], mcp[1] - 0.25, 0.12]
            pts[16] = [mcp[0], mcp[1] - 0.20, 0.06]
        elif state == "extended":
            pts[14] = [mcp[0] - sign * 0.01, mcp[1] - 0.22, -0.01]
            pts[15] = [mcp[0] - sign * 0.02, mcp[1] - 0.38, -0.02]
            pts[16] = [mcp[0] - sign * 0.03, mcp[1] - 0.52, -0.03]

    elif finger == "pinky":
        mcp = pts[17]
        if state == "curled":
            pts[18] = [mcp[0], mcp[1] - 0.05, 0.12]
            pts[19] = [mcp[0], mcp[1] + 0.10, 0.10]
            pts[20] = [mcp[0], mcp[1] + 0.08, 0.02]
        elif state == "half":
            pts[18] = [mcp[0], mcp[1] - 0.15, 0.08]
            pts[19] = [mcp[0], mcp[1] - 0.25, 0.12]
            pts[20] = [mcp[0], mcp[1] - 0.20, 0.06]
        elif state == "extended":
            pts[18] = [mcp[0] - sign * 0.02, mcp[1] - 0.18, -0.01]
            pts[19] = [mcp[0] - sign * 0.03, mcp[1] - 0.32, -0.02]
            pts[20] = [mcp[0] - sign * 0.04, mcp[1] - 0.44, -0.03]

    return pts


def rotate_3d(pts, pitch=0.0, yaw=0.0, roll=0.0):
    """Applies 3D rotation matrix to landmarks."""
    # Pitch (around X)
    Rx = np.array([
        [1, 0, 0],
        [0, math.cos(pitch), -math.sin(pitch)],
        [0, math.sin(pitch), math.cos(pitch)]
    ], dtype=np.float32)
    # Yaw (around Y)
    Ry = np.array([
        [math.cos(yaw), 0, math.sin(yaw)],
        [0, 1, 0],
        [-math.sin(yaw), 0, math.cos(yaw)]
    ], dtype=np.float32)
    # Roll (around Z)
    Rz = np.array([
        [math.cos(roll), -math.sin(roll), 0],
        [math.sin(roll), math.cos(roll), 0],
        [0, 0, 1]
    ], dtype=np.float32)
    R = Rz @ Ry @ Rx
    return pts @ R.T


def augment_single_hand(pts, rng):
    """3D rotation, scaling, jitter on single hand."""
    pts_aug = pts.copy()
    pitch = rng.uniform(-0.15, 0.15)
    yaw = rng.uniform(-0.15, 0.15)
    roll = rng.uniform(-0.25, 0.25)
    pts_aug = rotate_3d(pts_aug, pitch, yaw, roll)
    scale = rng.uniform(0.88, 1.12)
    pts_aug *= scale
    noise = rng.normal(0, 0.012, pts_aug.shape).astype(np.float32)
    pts_aug += noise
    return pts_aug


def augment_dual_hands(h1, h2, rng):
    """3D rotations, relative inter-hand distance shifts, scaling, noise."""
    h1_aug = h1.copy()
    h2_aug = h2.copy()

    # Common global rotation
    pitch = rng.uniform(-0.15, 0.15)
    yaw = rng.uniform(-0.15, 0.15)
    roll = rng.uniform(-0.20, 0.20)
    h1_aug = rotate_3d(h1_aug, pitch, yaw, roll)
    h2_aug = rotate_3d(h2_aug, pitch, yaw, roll)

    # Minor independent hand rotations
    h1_aug = rotate_3d(h1_aug, rng.uniform(-0.06, 0.06), rng.uniform(-0.06, 0.06), rng.uniform(-0.08, 0.08))
    h2_aug = rotate_3d(h2_aug, rng.uniform(-0.06, 0.06), rng.uniform(-0.06, 0.06), rng.uniform(-0.08, 0.08))

    # Inter-hand distance jitter
    offset = rng.normal(0, 0.025, (1, 3)).astype(np.float32)
    h2_aug += offset

    scale = rng.uniform(0.88, 1.12)
    h1_aug *= scale
    h2_aug *= scale

    h1_aug += rng.normal(0, 0.01, h1_aug.shape).astype(np.float32)
    h2_aug += rng.normal(0, 0.01, h2_aug.shape).astype(np.float32)

    return h1_aug, h2_aug


# ==============================================================================
# 2. ISL 2-Handed Alphabet and Words Synthetic Pose Synthesizer
# ==============================================================================

def create_isl_2hand_pose(letter_or_sign):
    """
    Constructs standard two-handed Indian Sign Language (ISL) hand poses.
    Left hand (h_left) + Right hand (h_right) in 3D coordinates.
    """
    sign = letter_or_sign.upper().strip()

    # Left Hand Base: standard open palm facing right/front
    h_left = create_base_hand("left")
    h_left[:, 0] -= 0.55

    # Right Hand Base:
    h_right = create_base_hand("right")
    h_right[:, 0] += 0.55

    # --- ISL 2-Handed Vowels (A, E, I, O, U) ---
    # Right index touches Left respective fingertip
    if sign in ["A", "E", "I", "O", "U"]:
        for f in ["thumb", "index", "middle", "ring", "pinky"]:
            h_left = set_finger_pose(h_left, f, "extended", "left")

        h_right = set_finger_pose(h_right, "thumb", "curled", "right")
        h_right = set_finger_pose(h_right, "index", "extended", "right")
        for f in ["middle", "ring", "pinky"]:
            h_right = set_finger_pose(h_right, f, "curled", "right")

        h_right = rotate_3d(h_right, pitch=0.0, yaw=0.2, roll=-math.pi / 2.2)

        target_idx = {
            "A": THUMB_TIP,   # Right index touches Left Thumb
            "E": INDEX_TIP,   # Right index touches Left Index
            "I": MIDDLE_TIP,  # Right index touches Left Middle
            "O": RING_TIP,    # Right index touches Left Ring
            "U": PINKY_TIP    # Right index touches Left Pinky
        }[sign]

        target_pt = h_left[target_idx]
        shift = target_pt - h_right[INDEX_TIP]
        h_right += shift
        return h_left, h_right

    # --- ISL 2-Handed Consonants (B, C, D, F, G, H, J, K, L, M, N, P, Q, R, S, T, V, W, X, Y, Z) ---
    if sign == "B":
        # Both hands form curved loops touching at thumbs and index fingertips
        for f in ["thumb", "index", "middle", "ring", "pinky"]:
            h_left = set_finger_pose(h_left, f, "half", "left")
            h_right = set_finger_pose(h_right, f, "half", "right")
        h_right[INDEX_TIP] = h_left[INDEX_TIP] + np.array([0.02, 0.0, 0.0])
        h_right[THUMB_TIP] = h_left[THUMB_TIP] + np.array([0.02, 0.0, 0.0])

    elif sign == "C":
        # Left open flat palm, Right hand curved C-shape facing left palm
        for f in ["thumb", "index", "middle", "ring", "pinky"]:
            h_left = set_finger_pose(h_left, f, "extended", "left")
            h_right = set_finger_pose(h_right, f, "half", "right")
        h_right = set_finger_pose(h_right, "thumb", "extended", "right")
        h_right[:, 0] = h_left[:, 0] + 0.25

    elif sign == "D":
        # Left index pointing up with thumb making loop; Right index touching left index tip
        h_left = set_finger_pose(h_left, "index", "extended", "left")
        h_left = set_finger_pose(h_left, "thumb", "extended", "left")
        for f in ["middle", "ring", "pinky"]:
            h_left = set_finger_pose(h_left, f, "curled", "left")

        h_right = set_finger_pose(h_right, "index", "extended", "right")
        for f in ["thumb", "middle", "ring", "pinky"]:
            h_right = set_finger_pose(h_right, f, "curled", "right")
        h_right[INDEX_TIP] = h_left[INDEX_TIP] + np.array([0.02, 0.04, 0.0])

    elif sign == "F":
        # Left 2 fingers (index, middle) horizontal, Right 2 fingers crossed across them
        h_left = set_finger_pose(h_left, "index", "extended", "left")
        h_left = set_finger_pose(h_left, "middle", "extended", "left")
        for f in ["thumb", "ring", "pinky"]:
            h_left = set_finger_pose(h_left, f, "curled", "left")

        h_right = set_finger_pose(h_right, "index", "extended", "right")
        h_right = set_finger_pose(h_right, "middle", "extended", "right")
        for f in ["thumb", "ring", "pinky"]:
            h_right = set_finger_pose(h_right, f, "curled", "right")

        h_left = rotate_3d(h_left, roll=-math.pi / 2)
        h_right = rotate_3d(h_right, roll=0.0)
        h_right[INDEX_TIP] = h_left[INDEX_TIP]

    elif sign == "G":
        # Both fists touching with thumbs upright
        for f in ["index", "middle", "ring", "pinky"]:
            h_left = set_finger_pose(h_left, f, "curled", "left")
            h_right = set_finger_pose(h_right, f, "curled", "right")
        h_left = set_finger_pose(h_left, "thumb", "up", "left")
        h_right = set_finger_pose(h_right, "thumb", "up", "right")
        h_right[:, 0] = h_left[:, 0] + 0.15

    elif sign == "H":
        # Left palm open horizontal flat facing up, Right flat hand (4 fingers) placed across left palm
        for f in ["thumb", "index", "middle", "ring", "pinky"]:
            h_left = set_finger_pose(h_left, f, "extended", "left")
            h_right = set_finger_pose(h_right, f, "extended", "right")
        h_left = rotate_3d(h_left, roll=-math.pi / 2, pitch=0.2)
        h_right[MIDDLE_TIP] = h_left[MIDDLE_MCP]

    elif sign == "J":
        # Left open palm, Right index touching left middle finger and curving down center
        for f in ["thumb", "index", "middle", "ring", "pinky"]:
            h_left = set_finger_pose(h_left, f, "extended", "left")
        h_right = set_finger_pose(h_right, "index", "extended", "right")
        for f in ["thumb", "middle", "ring", "pinky"]:
            h_right = set_finger_pose(h_right, f, "curled", "right")
        h_right = rotate_3d(h_right, roll=-math.pi / 2.5, pitch=-0.2)
        h_right[INDEX_TIP] = h_left[WRIST] + np.array([0.0, -0.2, 0.0])

    elif sign == "K":
        # Left index vertical, Right index bent at knuckle touching middle of left index
        h_left = set_finger_pose(h_left, "index", "extended", "left")
        for f in ["thumb", "middle", "ring", "pinky"]:
            h_left = set_finger_pose(h_left, f, "curled", "left")
        h_right = set_finger_pose(h_right, "index", "half", "right")
        for f in ["thumb", "middle", "ring", "pinky"]:
            h_right = set_finger_pose(h_right, f, "curled", "right")
        h_right[INDEX_TIP] = h_left[INDEX_MCP]

    elif sign == "L":
        # Left open flat palm, Right index finger placed vertically on left palm
        for f in ["thumb", "index", "middle", "ring", "pinky"]:
            h_left = set_finger_pose(h_left, f, "extended", "left")
        h_right = set_finger_pose(h_right, "index", "extended", "right")
        h_right = set_finger_pose(h_right, "thumb", "extended", "right")
        for f in ["middle", "ring", "pinky"]:
            h_right = set_finger_pose(h_right, f, "curled", "right")
        h_right[INDEX_TIP] = h_left[MIDDLE_MCP]

    elif sign in ["M", "N"]:
        # Left hand flat facing down, Right 3 fingers (M) or 2 fingers (N) placed over left hand
        for f in ["thumb", "index", "middle", "ring", "pinky"]:
            h_left = set_finger_pose(h_left, f, "extended", "left")
        h_left = rotate_3d(h_left, pitch=math.pi / 2)

        count = 3 if sign == "M" else 2
        h_right = set_finger_pose(h_right, "thumb", "curled", "right")
        h_right = set_finger_pose(h_right, "index", "extended", "right")
        h_right = set_finger_pose(h_right, "middle", "extended", "right")
        h_right = set_finger_pose(h_right, "ring", "extended" if count == 3 else "curled", "right")
        h_right = set_finger_pose(h_right, "pinky", "curled", "right")
        h_right[:, 1] = h_left[:, 1] - 0.15
        h_right[:, 0] = h_left[:, 0]

    elif sign == "P":
        # Left index pointing up, Right index & thumb circle touching top of left index
        h_left = set_finger_pose(h_left, "index", "extended", "left")
        for f in ["thumb", "middle", "ring", "pinky"]:
            h_left = set_finger_pose(h_left, f, "curled", "left")
        h_right = set_finger_pose(h_right, "index", "half", "right")
        h_right = set_finger_pose(h_right, "thumb", "extended", "right")
        for f in ["middle", "ring", "pinky"]:
            h_right = set_finger_pose(h_right, f, "curled", "right")
        h_right[INDEX_TIP] = h_left[INDEX_TIP]

    elif sign == "Q":
        # Left hand circle (thumb and index touching), Right index hooking through
        h_left = set_finger_pose(h_left, "thumb", "half", "left")
        h_left = set_finger_pose(h_left, "index", "half", "left")
        for f in ["middle", "ring", "pinky"]:
            h_left = set_finger_pose(h_left, f, "curled", "left")
        h_left[THUMB_TIP] = h_left[INDEX_TIP]

        h_right = set_finger_pose(h_right, "index", "extended", "right")
        for f in ["thumb", "middle", "ring", "pinky"]:
            h_right = set_finger_pose(h_right, f, "curled", "right")
        h_right[INDEX_TIP] = h_left[INDEX_MCP]

    elif sign == "R":
        # Left flat palm, Right crossed index+middle fingers resting on left palm
        for f in ["thumb", "index", "middle", "ring", "pinky"]:
            h_left = set_finger_pose(h_left, f, "extended", "left")
        h_right = set_finger_pose(h_right, "index", "extended", "right")
        h_right = set_finger_pose(h_right, "middle", "extended", "right")
        for f in ["thumb", "ring", "pinky"]:
            h_right = set_finger_pose(h_right, f, "curled", "right")
        # Explicit crossed coordinates
        h_right[MIDDLE_TIP, 0] = h_right[INDEX_TIP, 0] - 0.08
        h_right[INDEX_TIP] = h_left[MIDDLE_MCP]

    elif sign == "S":
        # Left fist with thumb out, Right fist interlocking
        for f in ["index", "middle", "ring", "pinky"]:
            h_left = set_finger_pose(h_left, f, "curled", "left")
            h_right = set_finger_pose(h_right, f, "curled", "right")
        h_left = set_finger_pose(h_left, "thumb", "extended", "left")
        h_right = set_finger_pose(h_right, "thumb", "extended", "right")
        h_right[PINKY_TIP] = h_left[THUMB_TIP]

    elif sign == "T":
        # Left flat upright hand, Right index finger touching side/edge of left palm
        for f in ["thumb", "index", "middle", "ring", "pinky"]:
            h_left = set_finger_pose(h_left, f, "extended", "left")
        h_right = set_finger_pose(h_right, "index", "extended", "right")
        for f in ["thumb", "middle", "ring", "pinky"]:
            h_right = set_finger_pose(h_right, f, "curled", "right")
        h_right[INDEX_TIP] = h_left[PINKY_MCP]

    elif sign == "V":
        # Left flat palm, Right 'V' (wide index + middle) placed on left palm
        for f in ["thumb", "index", "middle", "ring", "pinky"]:
            h_left = set_finger_pose(h_left, f, "extended", "left")
        h_right = set_finger_pose(h_right, "index", "extended", "right")
        h_right = set_finger_pose(h_right, "middle", "extended", "right")
        for f in ["thumb", "ring", "pinky"]:
            h_right = set_finger_pose(h_right, f, "curled", "right")
        # Wide V separation
        h_right[INDEX_TIP, 0] += 0.08
        h_right[MIDDLE_TIP, 0] -= 0.08
        h_right[INDEX_TIP] = h_left[MIDDLE_MCP]

    elif sign == "W":
        # Both hands with 3 fingers (index, middle, ring) spread and interlacing
        for f in ["index", "middle", "ring"]:
            h_left = set_finger_pose(h_left, f, "extended", "left")
            h_right = set_finger_pose(h_right, f, "extended", "right")
        for f in ["thumb", "pinky"]:
            h_left = set_finger_pose(h_left, f, "curled", "left")
            h_right = set_finger_pose(h_right, f, "curled", "right")
        h_right[:, 0] = h_left[:, 0] + 0.15

    elif sign == "X":
        # Both index fingers extended and crossed over each other
        h_left = set_finger_pose(h_left, "index", "extended", "left")
        for f in ["thumb", "middle", "ring", "pinky"]:
            h_left = set_finger_pose(h_left, f, "curled", "left")
        h_right = set_finger_pose(h_right, "index", "extended", "right")
        for f in ["thumb", "middle", "ring", "pinky"]:
            h_right = set_finger_pose(h_right, f, "curled", "right")
        h_left = rotate_3d(h_left, roll=math.pi / 4)
        h_right = rotate_3d(h_right, roll=-math.pi / 4)
        h_right[INDEX_TIP] = h_left[INDEX_TIP]

    elif sign == "Y":
        # Left open palm, Right hand thumb-pinky Y resting in left palm
        for f in ["thumb", "index", "middle", "ring", "pinky"]:
            h_left = set_finger_pose(h_left, f, "extended", "left")
        h_right = set_finger_pose(h_right, "thumb", "extended", "right")
        h_right = set_finger_pose(h_right, "pinky", "extended", "right")
        for f in ["index", "middle", "ring"]:
            h_right = set_finger_pose(h_right, f, "curled", "right")
        h_right[THUMB_TIP] = h_left[MIDDLE_MCP]

    elif sign == "Z":
        # Left horizontal open palm, Right index fingertip resting on left palm center
        for f in ["thumb", "index", "middle", "ring", "pinky"]:
            h_left = set_finger_pose(h_left, f, "extended", "left")
        h_left = rotate_3d(h_left, roll=-math.pi / 2)
        h_right = set_finger_pose(h_right, "index", "extended", "right")
        for f in ["thumb", "middle", "ring", "pinky"]:
            h_right = set_finger_pose(h_right, f, "curled", "right")
        h_right[INDEX_TIP] = h_left[WRIST] + np.array([0.0, -0.3, 0.0])

    elif sign in ["NAMASTE", "WELCOME", "PLEASE"]:
        # Both flat palms touching in prayer position
        for f in ["thumb", "index", "middle", "ring", "pinky"]:
            h_left = set_finger_pose(h_left, f, "extended", "left")
            h_right = set_finger_pose(h_right, f, "extended", "right")
        h_right[:, 0] = h_left[:, 0] + 0.08
        h_right[:, 2] = h_left[:, 2]

    elif sign in ["HELP", "SUPPORT"]:
        # Left flat palm facing up, Right fist resting on left palm
        for f in ["thumb", "index", "middle", "ring", "pinky"]:
            h_left = set_finger_pose(h_left, f, "extended", "left")
        h_left = rotate_3d(h_left, pitch=math.pi / 2)
        for f in ["index", "middle", "ring", "pinky"]:
            h_right = set_finger_pose(h_right, f, "curled", "right")
        h_right = set_finger_pose(h_right, "thumb", "up", "right")
        h_right[:, 1] = h_left[:, 1] - 0.25
        h_right[:, 0] = h_left[:, 0]

    elif sign in ["BOOK", "READ"]:
        # Both palms flat facing up together like an open book
        for f in ["thumb", "index", "middle", "ring", "pinky"]:
            h_left = set_finger_pose(h_left, f, "extended", "left")
            h_right = set_finger_pose(h_right, f, "extended", "right")
        h_left = rotate_3d(h_left, roll=0.3, pitch=0.4)
        h_right = rotate_3d(h_right, roll=-0.3, pitch=0.4)
        h_right[:, 0] = h_left[:, 0] + 0.2

    elif sign in ["HOUSE", "HOME"]:
        # Fingertips touching at 45 degree angle forming roof
        for f in ["thumb", "index", "middle", "ring", "pinky"]:
            h_left = set_finger_pose(h_left, f, "extended", "left")
            h_right = set_finger_pose(h_right, f, "extended", "right")
        h_left = rotate_3d(h_left, roll=math.pi / 4)
        h_right = rotate_3d(h_right, roll=-math.pi / 4)
        h_right[MIDDLE_TIP] = h_left[MIDDLE_TIP]

    else:
        # Default dual-hand
        for f in ["thumb", "index", "middle", "ring", "pinky"]:
            h_left = set_finger_pose(h_left, f, "extended", "left")
            h_right = set_finger_pose(h_right, f, "extended", "right")

    return h_left, h_right


# ==============================================================================
# 3. Single-Hand Alphabet and Gesture Synthesizer (A-Z, 1-10, Core Gestures)
# ==============================================================================

def create_isl_1hand_pose(sign_name):
    """
    Constructs distinct single-hand hand poses (A-Z, 1-10, HELLO, GOOD, etc.).
    """
    sign = sign_name.upper().strip()
    h = create_base_hand("right")

    if sign in ["A", "FIST"]:
        for f in ["index", "middle", "ring", "pinky"]:
            h = set_finger_pose(h, f, "curled", "right")
        h = set_finger_pose(h, "thumb", "extended", "right")

    elif sign == "B":
        for f in ["index", "middle", "ring", "pinky"]:
            h = set_finger_pose(h, f, "extended", "right")
        h = set_finger_pose(h, "thumb", "curled", "right")

    elif sign == "C":
        for f in ["index", "middle", "ring", "pinky"]:
            h = set_finger_pose(h, f, "half", "right")
        h = set_finger_pose(h, "thumb", "extended", "right")

    elif sign in ["D", "YOU", "POINTING", "1"]:
        h = set_finger_pose(h, "index", "extended", "right")
        for f in ["thumb", "middle", "ring", "pinky"]:
            h = set_finger_pose(h, f, "curled", "right")

    elif sign == "E":
        for f in ["index", "middle", "ring", "pinky"]:
            h = set_finger_pose(h, f, "half", "right")
        h = set_finger_pose(h, "thumb", "curled", "right")

    elif sign == "F":
        # Thumb & index touch forming circle, middle/ring/pinky upright spread (OK sign)
        h = set_finger_pose(h, "thumb", "half", "right")
        h = set_finger_pose(h, "index", "half", "right")
        for f in ["middle", "ring", "pinky"]:
            h = set_finger_pose(h, f, "extended", "right")
        h[THUMB_TIP] = h[INDEX_TIP]

    elif sign == "G":
        # Index pointing horizontally forward, thumb parallel
        h = set_finger_pose(h, "index", "extended", "right")
        h = set_finger_pose(h, "thumb", "extended", "right")
        for f in ["middle", "ring", "pinky"]:
            h = set_finger_pose(h, f, "curled", "right")
        h = rotate_3d(h, roll=-math.pi / 2)

    elif sign == "H":
        # Index and middle pointing horizontally forward together
        h = set_finger_pose(h, "index", "extended", "right")
        h = set_finger_pose(h, "middle", "extended", "right")
        for f in ["thumb", "ring", "pinky"]:
            h = set_finger_pose(h, f, "curled", "right")
        h = rotate_3d(h, roll=-math.pi / 2)

    elif sign in ["I"]:
        h = set_finger_pose(h, "pinky", "extended", "right")
        for f in ["thumb", "index", "middle", "ring"]:
            h = set_finger_pose(h, f, "curled", "right")

    elif sign == "J":
        h = set_finger_pose(h, "pinky", "extended", "right")
        for f in ["thumb", "index", "middle", "ring"]:
            h = set_finger_pose(h, f, "curled", "right")
        h = rotate_3d(h, roll=-0.4, pitch=-0.3)

    elif sign == "K":
        # Index up, middle forward, thumb between
        h = set_finger_pose(h, "index", "extended", "right")
        h = set_finger_pose(h, "middle", "extended", "right")
        h = set_finger_pose(h, "thumb", "up", "right")
        for f in ["ring", "pinky"]:
            h = set_finger_pose(h, f, "curled", "right")

    elif sign in ["L"]:
        h = set_finger_pose(h, "thumb", "extended", "right")
        h = set_finger_pose(h, "index", "extended", "right")
        for f in ["middle", "ring", "pinky"]:
            h = set_finger_pose(h, f, "curled", "right")

    elif sign == "M":
        # 3 fingers curled over thumb
        h = set_finger_pose(h, "thumb", "curled", "right")
        for f in ["index", "middle", "ring"]:
            h = set_finger_pose(h, f, "half", "right")
        h = set_finger_pose(h, "pinky", "curled", "right")

    elif sign == "N":
        # 2 fingers curled over thumb
        h = set_finger_pose(h, "thumb", "curled", "right")
        for f in ["index", "middle"]:
            h = set_finger_pose(h, f, "half", "right")
        for f in ["ring", "pinky"]:
            h = set_finger_pose(h, f, "curled", "right")

    elif sign in ["O", "OK"]:
        h = set_finger_pose(h, "thumb", "half", "right")
        h = set_finger_pose(h, "index", "half", "right")
        h = set_finger_pose(h, "middle", "half", "right")
        h = set_finger_pose(h, "ring", "half", "right")
        h = set_finger_pose(h, "pinky", "half", "right")
        h[THUMB_TIP] = h[INDEX_TIP]

    elif sign == "P":
        # K pointing down
        h = set_finger_pose(h, "index", "extended", "right")
        h = set_finger_pose(h, "middle", "extended", "right")
        h = set_finger_pose(h, "thumb", "up", "right")
        for f in ["ring", "pinky"]:
            h = set_finger_pose(h, f, "curled", "right")
        h = rotate_3d(h, roll=math.pi / 2)

    elif sign == "Q":
        # G pointing down
        h = set_finger_pose(h, "index", "extended", "right")
        h = set_finger_pose(h, "thumb", "extended", "right")
        for f in ["middle", "ring", "pinky"]:
            h = set_finger_pose(h, f, "curled", "right")
        h = rotate_3d(h, roll=math.pi / 2)

    elif sign == "R":
        # Index & middle crossed
        h = set_finger_pose(h, "index", "extended", "right")
        h = set_finger_pose(h, "middle", "extended", "right")
        for f in ["thumb", "ring", "pinky"]:
            h = set_finger_pose(h, f, "curled", "right")
        h[MIDDLE_TIP, 0] = h[INDEX_TIP, 0] - 0.05 # Crossed

    elif sign == "S":
        for f in ["index", "middle", "ring", "pinky"]:
            h = set_finger_pose(h, f, "curled", "right")
        h = set_finger_pose(h, "thumb", "curled", "right")

    elif sign == "T":
        h = set_finger_pose(h, "thumb", "curled", "right")
        h = set_finger_pose(h, "index", "half", "right")
        for f in ["middle", "ring", "pinky"]:
            h = set_finger_pose(h, f, "curled", "right")

    elif sign == "U":
        # Index and middle held upright together touching
        h = set_finger_pose(h, "index", "extended", "right")
        h = set_finger_pose(h, "middle", "extended", "right")
        for f in ["thumb", "ring", "pinky"]:
            h = set_finger_pose(h, f, "curled", "right")
        h[MIDDLE_TIP, 0] = h[INDEX_TIP, 0] - 0.02 # Touching

    elif sign in ["V", "PEACE", "VICTORY", "2"]:
        h = set_finger_pose(h, "index", "extended", "right")
        h = set_finger_pose(h, "middle", "extended", "right")
        for f in ["thumb", "ring", "pinky"]:
            h = set_finger_pose(h, f, "curled", "right")

    elif sign in ["W", "3"]:
        for f in ["index", "middle", "ring"]:
            h = set_finger_pose(h, f, "extended", "right")
        for f in ["thumb", "pinky"]:
            h = set_finger_pose(h, f, "curled", "right")

    elif sign == "X":
        h = set_finger_pose(h, "index", "half", "right")
        for f in ["thumb", "middle", "ring", "pinky"]:
            h = set_finger_pose(h, f, "curled", "right")

    elif sign in ["Y", "CALL_ME"]:
        h = set_finger_pose(h, "thumb", "extended", "right")
        h = set_finger_pose(h, "pinky", "extended", "right")
        for f in ["index", "middle", "ring"]:
            h = set_finger_pose(h, f, "curled", "right")

    elif sign == "Z":
        h = set_finger_pose(h, "index", "extended", "right")
        for f in ["thumb", "middle", "ring", "pinky"]:
            h = set_finger_pose(h, f, "curled", "right")
        h = rotate_3d(h, pitch=0.3)

    elif sign in ["HELLO", "5", "OPEN_PALM", "STOP"]:
        for f in ["thumb", "index", "middle", "ring", "pinky"]:
            h = set_finger_pose(h, f, "extended", "right")

    elif sign in ["GOOD", "THUMBS_UP", "YES"]:
        for f in ["index", "middle", "ring", "pinky"]:
            h = set_finger_pose(h, f, "curled", "right")
        h = set_finger_pose(h, "thumb", "up", "right")

    elif sign in ["BAD", "THUMBS_DOWN", "NO"]:
        for f in ["index", "middle", "ring", "pinky"]:
            h = set_finger_pose(h, f, "curled", "right")
        h = set_finger_pose(h, "thumb", "up", "right")
        h = rotate_3d(h, roll=math.pi)

    elif sign in ["I_LOVE_YOU", "I LOVE YOU", "ILY"]:
        h = set_finger_pose(h, "thumb", "extended", "right")
        h = set_finger_pose(h, "index", "extended", "right")
        h = set_finger_pose(h, "middle", "curled", "right")
        h = set_finger_pose(h, "ring", "curled", "right")
        h = set_finger_pose(h, "pinky", "extended", "right")

    elif sign in ["4"]:
        for f in ["index", "middle", "ring", "pinky"]:
            h = set_finger_pose(h, f, "extended", "right")
        h = set_finger_pose(h, "thumb", "curled", "right")

    elif sign in ["6"]:
        h = set_finger_pose(h, "thumb", "extended", "right")
        h = set_finger_pose(h, "pinky", "extended", "right")
        for f in ["index", "middle", "ring"]:
            h = set_finger_pose(h, f, "curled", "right")

    elif sign in ["7"]:
        h = set_finger_pose(h, "thumb", "extended", "right")
        h = set_finger_pose(h, "index", "extended", "right")
        for f in ["middle", "ring", "pinky"]:
            h = set_finger_pose(h, f, "curled", "right")

    elif sign in ["8"]:
        h = set_finger_pose(h, "thumb", "extended", "right")
        h = set_finger_pose(h, "index", "extended", "right")
        h = set_finger_pose(h, "middle", "extended", "right")
        for f in ["ring", "pinky"]:
            h = set_finger_pose(h, f, "curled", "right")

    elif sign in ["9"]:
        for f in ["thumb", "index", "middle", "ring"]:
            h = set_finger_pose(h, f, "extended", "right")
        h = set_finger_pose(h, "pinky", "curled", "right")

    elif sign in ["10"]:
        for f in ["index", "middle", "ring", "pinky"]:
            h = set_finger_pose(h, f, "curled", "right")
        h = set_finger_pose(h, "thumb", "up", "right")
        h = rotate_3d(h, roll=0.3)

    else:
        for f in ["thumb", "index", "middle", "ring", "pinky"]:
            h = set_finger_pose(h, f, "extended", "right")

    return h


# ==============================================================================
# 4. Harvest Real Landmarks from ISL GIFs
# ==============================================================================

def harvest_landmarks_from_gifs():
    """
    Extracts landmark frames from public/ISL_Gifs/*.gif.
    Returns:
        dual_samples: list of (features_220, label)
        single_samples: list of (features_88, label)
    """
    dual_samples = []
    single_samples = []

    if not HAND_MODEL_PATH.exists():
        print(f"Warning: MediaPipe hand landmarker model not found at {HAND_MODEL_PATH}")
        return dual_samples, single_samples

    import mediapipe as mp
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision

    base_options = python.BaseOptions(model_asset_path=str(HAND_MODEL_PATH))
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=2,
        min_hand_detection_confidence=0.20,
        min_hand_presence_confidence=0.20,
        min_tracking_confidence=0.20
    )
    detector = vision.HandLandmarker.create_from_options(options)

    gifs = sorted(glob.glob(str(GIFS_DIR / "*.gif")))
    print(f"Harvesting frames from {len(gifs)} ISL demonstration GIFs...")

    try:
        for gif_path in gifs:
            raw_name = Path(gif_path).stem
            # Clean label name (e.g. "are you busy" -> "ARE YOU BUSY")
            label = raw_name.upper().strip()

            cap = cv2.VideoCapture(gif_path)
            frame_idx = 0
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                frame_idx += 1
                # Sample every frame or every 2nd frame
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
                res = detector.detect(mp_img)

                if res.hand_landmarks:
                    if len(res.hand_landmarks) >= 2:
                        h1 = res.hand_landmarks[0]
                        h2 = res.hand_landmarks[1]
                        hand1_list = [{"x": p.x, "y": p.y, "z": p.z} for p in h1]
                        hand2_list = [{"x": p.x, "y": p.y, "z": p.z} for p in h2]
                        feat = extract_dual_hand_features(hand1_list, hand2_list)
                        if feat is not None:
                            dual_samples.append((feat, label))
                    elif len(res.hand_landmarks) == 1:
                        h1 = res.hand_landmarks[0]
                        hand1_list = [{"x": p.x, "y": p.y, "z": p.z} for p in h1]
                        feat = extract_single_hand_features(hand1_list)
                        if feat is not None:
                            single_samples.append((feat, label))
            cap.release()
    finally:
        detector.close()

    print(f"Harvested {len(dual_samples)} dual-hand frames, {len(single_samples)} single-hand frames from GIFs.")
    return dual_samples, single_samples


# ==============================================================================
# 5. Build Complete Synthetic & Augmented Training Sets
# ==============================================================================

def build_dual_hand_dataset(gif_dual_samples, samples_per_class=220):
    """
    Combines GIF dual-hand samples + full ISL 2-handed alphabet (A-Z) + ISL phrases
    with comprehensive 3D spatial augmentation.
    """
    rng = np.random.default_rng(42)
    X = []
    y = []

    # 1. Official ISL 2-Handed Alphabet (A-Z) and Core Signs
    isl_letters = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    common_signs = [
        "NAMASTE", "HELP", "BOOK", "HOUSE", "PLAY", "ALL", 
        "AUGUST", "BANANA", "BE CAREFUL", "CHRISTMAS", "CHURCH", 
        "DASARA", "DECEMBER", "THANK YOU", "STOP"
    ]
    dual_classes = isl_letters + common_signs

    print("Synthesizing and augmenting ISL two-handed alphabets (A-Z) & core phrases...")
    for label in dual_classes:
        h_left, h_right = create_isl_2hand_pose(label)
        base_feat = extract_dual_hand_features(h_right, h_left)
        if base_feat is not None:
            X.append(base_feat)
            y.append(label)

        # Generate augmented variations
        for _ in range(samples_per_class):
            h_l_aug, h_r_aug = augment_dual_hands(h_left, h_right, rng)
            aug_feat = extract_dual_hand_features(h_r_aug, h_l_aug)
            if aug_feat is not None:
                X.append(aug_feat)
                y.append(label)

    # 2. Add GIF harvested dual-hand samples with augmentation
    if gif_dual_samples:
        for feat, label in gif_dual_samples:
            X.append(feat)
            y.append(label)
            # Add augmented versions of real GIF samples
            for _ in range(25):
                noise = rng.normal(0, 0.010, feat.shape).astype(np.float32)
                X.append(feat + noise)
                y.append(label)

    X = np.asarray(X, dtype=np.float32)
    y = np.asarray(y)
    unique_cls, counts = np.unique(y, return_counts=True)
    valid_classes = set(unique_cls[counts >= 10])
    mask = np.isin(y, list(valid_classes))
    return X[mask], y[mask]


def build_single_hand_dataset(gif_single_samples, samples_per_class=220):
    """
    Combines GIF single-hand samples + distinct 1-handed alphabets (A-Z), numbers (1-10), gestures
    with 3D augmentation.
    """
    rng = np.random.default_rng(42)
    X = []
    y = []

    # Distinct primary classes (A-Z, Core Gestures, Numbers)
    single_classes = [
        "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", 
        "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
        "HELLO", "GOOD", "BAD", "OK", "I LOVE YOU", "PEACE", "YOU"
    ]

    print("Synthesizing and augmenting single-handed signs, alphabets & gestures...")
    for label in single_classes:
        h_base = create_isl_1hand_pose(label)
        base_feat = extract_single_hand_features(h_base)
        if base_feat is not None:
            X.append(base_feat)
            y.append(label)

        for _ in range(samples_per_class):
            h_aug = augment_single_hand(h_base, rng)
            aug_feat = extract_single_hand_features(h_aug)
            if aug_feat is not None:
                X.append(aug_feat)
                y.append(label)

    if gif_single_samples:
        for feat, label in gif_single_samples:
            X.append(feat)
            y.append(label)
            for _ in range(20):
                noise = rng.normal(0, 0.010, feat.shape).astype(np.float32)
                X.append(feat + noise)
                y.append(label)

    X = np.asarray(X, dtype=np.float32)
    y = np.asarray(y)
    unique_cls, counts = np.unique(y, return_counts=True)
    valid_classes = set(unique_cls[counts >= 10])
    mask = np.isin(y, list(valid_classes))
    return X[mask], y[mask]


# ==============================================================================
# 6. Train Ensemble Classifiers and Save
# ==============================================================================

def train_and_save_model(X, y, output_path, model_name="Classifier"):
    print(f"\n--- Training {model_name} ---")
    print(f"Total dataset size: {len(X)} samples, Feature dim: {X.shape[1]}")
    classes, counts = np.unique(y, return_counts=True)
    print(f"Total unique classes: {len(classes)}")

    # Stratified split
    train_x, test_x, train_y, test_y = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )

    clf = ExtraTreesClassifier(
        n_estimators=200,
        max_depth=35,
        max_features="sqrt",
        min_samples_split=2,
        min_samples_leaf=1,
        bootstrap=False,
        n_jobs=-1,
        random_state=42
    )

    clf.fit(train_x, train_y)
    predictions = clf.predict(test_x)
    acc = accuracy_score(test_y, predictions) * 100.0
    print(f"*** {model_name} Test Accuracy: {acc:.2f}% ***")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    import joblib
    joblib.dump(clf, output_path, compress=3)
    print(f"Saved trained model (compressed) to {output_path}")
    return clf, acc


def main():
    parser = argparse.ArgumentParser(description="Train ISL Dual-Hand and Single-Hand Recognition Models")
    parser.add_argument("--skip-gifs", action="store_true", help="Skip scanning GIF files")
    args = parser.parse_args()

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    gif_dual, gif_single = [], []
    if not args.skip_gifs and GIFS_DIR.exists():
        gif_dual, gif_single = harvest_landmarks_from_gifs()

    # 1. Train Dual-Hand Classifier
    X_dual, y_dual = build_dual_hand_dataset(gif_dual, samples_per_class=140)
    dual_output = MODEL_DIR / "isl_dual_hand_classifier.pkl"
    train_and_save_model(X_dual, y_dual, dual_output, "ISL Dual-Hand Ensemble Classifier")

    # 2. Train Single-Hand Classifier
    X_single, y_single = build_single_hand_dataset(gif_single, samples_per_class=140)
    single_output = MODEL_DIR / "isl_single_hand_classifier.pkl"
    train_and_save_model(X_single, y_single, single_output, "ISL Single-Hand Ensemble Classifier")

    # Also save legacy path for compatibility
    legacy_output = MODEL_DIR / "sign_classifier.pkl"
    import shutil
    shutil.copy(single_output, legacy_output)

    print("\n========================================================")
    print("SUCCESS: All ISL Multi-Hand and Single-Hand Models Trained!")
    print(f"1. Dual-Hand Model: {dual_output}")
    print(f"2. Single-Hand Model: {single_output}")
    print("========================================================\n")


if __name__ == "__main__":
    main()
