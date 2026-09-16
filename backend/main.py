from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import os
import pickle
import traceback

from gesture_recognizer import classify_signs, classify_hand_opencv

app = FastAPI(title="SignBridge ISL Gesture Recognition API")

# Allow CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

detector = None
dual_classifier = None
single_classifier = None

MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")
DETECTOR_PATH = os.path.join(MODEL_DIR, "hand_landmarker.task")
DUAL_CLASSIFIER_PATH = os.path.join(MODEL_DIR, "isl_dual_hand_classifier.pkl")
SINGLE_CLASSIFIER_PATH = os.path.join(MODEL_DIR, "isl_single_hand_classifier.pkl")
LEGACY_CLASSIFIER_PATH = os.path.join(MODEL_DIR, "sign_classifier.pkl")


def get_detector():
    global detector
    if detector is not None:
        return detector

    if os.path.exists(DETECTOR_PATH):
        try:
            import mediapipe as mp
            from mediapipe.tasks import python
            from mediapipe.tasks.python import vision

            base_options = python.BaseOptions(model_asset_path=DETECTOR_PATH)
            options = vision.HandLandmarkerOptions(
                base_options=base_options,
                num_hands=2,
                min_hand_detection_confidence=0.35,
                min_hand_presence_confidence=0.35,
                min_tracking_confidence=0.35
            )
            detector = vision.HandLandmarker.create_from_options(options)
            print("MediaPipe HandLandmarker (Dual-Hand Engine) initialized successfully.")
            return detector
        except Exception as e:
            print(f"Error loading MediaPipe HandLandmarker: {e}")
            return None
    else:
        print(f"Detector model file not found at {DETECTOR_PATH}")
        return None


def get_dual_classifier():
    global dual_classifier
    if dual_classifier is not None:
        return dual_classifier
    if os.path.exists(DUAL_CLASSIFIER_PATH):
        try:
            import joblib
            dual_classifier = joblib.load(DUAL_CLASSIFIER_PATH)
            print("Trained ISL Dual-Hand Classifier loaded.")
        except Exception as e:
            try:
                with open(DUAL_CLASSIFIER_PATH, "rb") as f:
                    dual_classifier = pickle.load(f)
                print("Trained ISL Dual-Hand Classifier loaded via pickle.")
            except Exception as e2:
                print(f"Error loading dual-hand classifier: {e2}")
    return dual_classifier


def get_single_classifier():
    global single_classifier
    if single_classifier is not None:
        return single_classifier
    
    path_to_load = SINGLE_CLASSIFIER_PATH if os.path.exists(SINGLE_CLASSIFIER_PATH) else LEGACY_CLASSIFIER_PATH
    if os.path.exists(path_to_load):
        try:
            import joblib
            single_classifier = joblib.load(path_to_load)
            print(f"Trained ISL Single-Hand Classifier loaded from {path_to_load}.")
        except Exception as e:
            try:
                with open(path_to_load, "rb") as f:
                    single_classifier = pickle.load(f)
                print(f"Trained ISL Single-Hand Classifier loaded via pickle from {path_to_load}.")
            except Exception as e2:
                print(f"Error loading single-hand classifier: {e2}")
    return single_classifier


# Initialization on startup
try:
    get_detector()
    get_dual_classifier()
    get_single_classifier()
except Exception:
    pass


@app.get("/")
def root():
    return {
        "service": "SignBridge ISL Gesture API",
        "status": "online",
        "endpoints": ["/health", "/predict"]
    }


@app.get("/health")
def health_check():
    det = get_detector()
    dual_clf = get_dual_classifier()
    single_clf = get_single_classifier()
    return {
        "status": "ok",
        "mediapipe_loaded": det is not None,
        "dual_classifier_loaded": dual_clf is not None,
        "single_classifier_loaded": single_clf is not None,
        "dual_classes_count": len(dual_clf.classes_) if dual_clf else 0,
        "single_classes_count": len(single_clf.classes_) if single_clf else 0,
        "mode": "MediaPipe Multi-Hand 3D Landmark & Spatial Geometry Engine" if det is not None else "OpenCV Fallback"
    }


@app.post("/predict")
async def predict_sign(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        if not contents:
            return {"prediction": None, "confidence": 0, "hand_detected": False, "message": "Empty frame"}

        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {"prediction": None, "confidence": 0, "hand_detected": False, "message": "Invalid image format"}

        det = get_detector()

        # 1. Primary: MediaPipe Multi-Hand Landmarker AI
        if det is not None:
            try:
                import mediapipe as mp
                img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)
                results = det.detect(mp_image)

                if results.hand_landmarks and len(results.hand_landmarks) > 0:
                    raw_landmarks_list = []
                    handedness_list = []

                    for hand_index, hand_lms in enumerate(results.hand_landmarks):
                        lms = [{"x": float(lm.x), "y": float(lm.y), "z": float(lm.z)} for lm in hand_lms]
                        raw_landmarks_list.append(lms)
                        
                        h_name = f"Hand {hand_index + 1}"
                        if results.handedness and hand_index < len(results.handedness):
                            h_name = results.handedness[hand_index][0].category_name
                        handedness_list.append(h_name)

                    prediction, confidence, is_two_handed, hands_detail, interaction = classify_signs(
                        raw_landmarks_list,
                        handedness_list,
                        get_dual_classifier(),
                        get_single_classifier()
                    )

                    return {
                        "prediction": prediction,
                        "confidence": float(confidence),
                        "gesture": prediction,
                        "is_two_handed": bool(is_two_handed),
                        "hand_detected": True,
                        "landmarks": hands_detail[0]["landmarks"] if hands_detail else [],
                        "hands": hands_detail,
                        "hand_count": len(hands_detail),
                        "interaction": interaction,
                        "engine": "MediaPipe Multi-Hand 3D AI"
                    }
            except Exception as mp_err:
                print(f"MediaPipe inference error: {mp_err}")
                traceback.print_exc()

        # 2. Secondary Fallback: OpenCV Skin & Convexity Defect Geometry
        gesture, confidence, landmarks_list = classify_hand_opencv(img)
        if gesture is not None and confidence >= 0.70:
            return {
                "prediction": gesture,
                "confidence": float(confidence),
                "gesture": gesture,
                "is_two_handed": False,
                "hand_detected": True,
                "landmarks": landmarks_list,
                "hands": [{
                    "hand_index": 0,
                    "prediction": gesture,
                    "confidence": float(confidence),
                    "landmarks": landmarks_list,
                    "handedness": "Detected Hand"
                }],
                "hand_count": 1,
                "interaction": None,
                "engine": "OpenCV Convexity Hull Fallback"
            }

        return {
            "prediction": None,
            "confidence": 0,
            "is_two_handed": False,
            "hand_detected": False,
            "message": "No hand detected. Position your hands clearly in camera view."
        }

    except Exception as e:
        traceback.print_exc()
        return {
            "prediction": None,
            "confidence": 0,
            "is_two_handed": False,
            "hand_detected": False,
            "error": str(e)
        }
