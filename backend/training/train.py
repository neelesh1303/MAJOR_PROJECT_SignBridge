import os
import cv2
import numpy as np
import pickle
# import mediapipe as mp
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

print("=========================================")
print(" SignBridge Model Training Script")
print("=========================================")
print("This script demonstrates how to train a RandomForestClassifier")
print("using hand landmarks extracted via MediaPipe.")
print("\nTo actually run this, you need:")
print("1. A dataset folder with subfolders for each sign (e.g., dataset/hello, dataset/thanks)")
print("2. Images of hands performing those signs in each folder.")
print("\nUncomment the code in this script once your dataset is ready.")
print("=========================================")

# --- UNCOMMENT BELOW TO USE ---

'''
DATA_DIR = '../dataset'
MODEL_SAVE_PATH = '../model/sign_classifier.pkl'

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=True, min_detection_confidence=0.5)

data = []
labels = []

for dir_ in os.listdir(DATA_DIR):
    class_dir = os.path.join(DATA_DIR, dir_)
    if not os.path.isdir(class_dir):
        continue
        
    for img_path in os.listdir(class_dir):
        img_arr = cv2.imread(os.path.join(class_dir, img_path))
        if img_arr is None:
            continue
            
        img_rgb = cv2.cvtColor(img_arr, cv2.COLOR_BGR2RGB)
        results = hands.process(img_rgb)
        
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                landmarks = []
                for i in range(len(hand_landmarks.landmark)):
                    x = hand_landmarks.landmark[i].x
                    y = hand_landmarks.landmark[i].y
                    landmarks.extend([x, y])
                
                data.append(landmarks)
                labels.append(dir_)

if len(data) == 0:
    print("No hand landmarks found in the dataset.")
    exit()

X = np.asarray(data)
y = np.asarray(labels)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

print(f"Training on {len(X_train)} samples...")
clf = RandomForestClassifier()
clf.fit(X_train, y_train)

y_pred = clf.predict(X_test)
print(f"Model Accuracy: {accuracy_score(y_test, y_pred) * 100:.2f}%")

with open(MODEL_SAVE_PATH, 'wb') as f:
    pickle.dump(clf, f)
print(f"Model saved to {MODEL_SAVE_PATH}")
'''
