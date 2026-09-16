import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

import main
import gesture_recognizer
from training.generate_and_train import create_isl_2hand_pose, create_isl_1hand_pose

dual_clf = main.get_dual_classifier()
single_clf = main.get_single_classifier()

tests = []
# Add all 26 ISL 2-Handed Letters
for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
    tests.append(('2H', letter, f"ISL 2-Hand {letter}"))

# Add common 2-Hand signs
for sign in ["NAMASTE", "HELP", "BOOK", "HOUSE"]:
    tests.append(('2H', sign, f"ISL 2-Hand {sign}"))

# Add 1-Hand Gestures
for sign in ["HELLO", "GOOD", "BAD", "OK", "I LOVE YOU", "V", "L", "Y"]:
    tests.append(('1H', sign, f"Single-Hand {sign}"))

correct = 0
for mode, label, desc in tests:
    if mode == '2H':
        h_l, h_r = create_isl_2hand_pose(label)
        l1 = [{'x': float(p[0]), 'y': float(p[1]), 'z': float(p[2])} for p in h_r]
        l2 = [{'x': float(p[0]), 'y': float(p[1]), 'z': float(p[2])} for p in h_l]
        pred, conf, is_2h, _, _ = gesture_recognizer.classify_signs([l1, l2], ['Right', 'Left'], dual_clf, single_clf)
    else:
        h_s = create_isl_1hand_pose(label)
        l1 = [{'x': float(p[0]), 'y': float(p[1]), 'z': float(p[2])} for p in h_s]
        pred, conf, is_2h, _, _ = gesture_recognizer.classify_signs([l1], ['Right'], dual_clf, single_clf)
    
    is_match = (pred == label) or (label in ['NAMASTE', 'PLEASE', 'WELCOME'] and pred == 'NAMASTE')
    if is_match:
        correct += 1
    print(f"[{mode}] {desc:24} => Pred: {pred:12} | Conf: {conf*100:5.1f}% | 2H: {str(is_2h):5} | {'[PASS]' if is_match else '[FAIL]'}")

print(f"\nTotal Tested: {len(tests)}, Correct: {correct}, Overall Test Accuracy: {correct/len(tests)*100:.1f}%\n")
