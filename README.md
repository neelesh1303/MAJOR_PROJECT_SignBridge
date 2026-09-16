# SignBridge — Inclusive Learning Through Indian Sign Language

## 1. Project Overview
SignBridge is an inclusive classroom platform designed to bridge the communication gap between hearing, Deaf, hard-of-hearing, and non-speaking students. The application provides real-time speech-to-text, text-to-ISL visual signs, and sign-to-text capabilities within a shared environment.

## 2. Problem Statement
Traditional classrooms can create communication barriers. When teachers speak, non-hearing students miss critical information. When non-speaking students communicate in sign language, hearing peers and teachers may not understand. 

## 3. Features
* **Inclusive Classroom**: 
  * Teacher Panel: Converts spoken English to text using Web Speech API, then translates text to Indian Sign Language GIFs.
  * Student Panel: Captures webcam video, predicts ISL gestures using MediaPipe + Scikit-Learn, and speaks the predicted text aloud using Speech Synthesis.
* **Learn ISL**: An interactive dictionary of commonly used Indian Sign Language words and phrases.
* **ISL Games**: Fun, educational games including an ISL Quiz and Caption Scramble to practice and reinforce learning.

## 4. Architecture
The system consists of a React frontend and a FastAPI Python backend.
- The frontend handles UI, Speech-to-Text, Text-to-Speech, and rendering ISL visuals.
- The backend processes webcam frames using MediaPipe to extract hand landmarks, and uses a RandomForestClassifier to predict the sign.

## 5. Tech Stack
* **Frontend**: React 19, Vite, Tailwind CSS, React Router
* **Backend**: Python, FastAPI, Uvicorn, python-multipart
* **Machine Learning**: OpenCV, MediaPipe, scikit-learn
* **Browser APIs**: `window.SpeechRecognition`, `window.speechSynthesis`

## 6. Project Structure
```
src/
├── components/     # Reusable components (Navbar, SignToText, Quiz, Scramble)
├── pages/          # Full page views (Home, Classroom, Learn, Games, About)
├── services/       # Browser API abstractions (speechService)
├── utils/          # Helper logic (textToSigns dictionary mapping)
├── App.jsx         # Routing configuration
└── main.jsx        # Entry point

backend/
├── main.py         # FastAPI endpoints (/health, /predict)
├── requirements.txt
└── training/
    └── train.py    # Training script for ML model
```

## 7. Installation & Setup

### Running the Frontend
Ensure you have Node.js installed.
```bash
npm install
npm run dev
```
The application will be available at `http://localhost:5173`.

### Running the Backend
Ensure you have Python 3.9+ installed.
```bash
cd backend
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```
The backend API will be available at `http://localhost:8000`.

## 8. Training the Sign Model
The bundled MediaPipe model detects up to two hands. The optional custom classifier improves the controlled vocabulary, but it requires labeled images; the repository does not include a sufficiently large licensed ISL dataset to claim high accuracy.

Use this layout, with at least 20-30 varied images per label as a starting point:
```
backend/dataset/
├── HELLO/
│   ├── image-001.jpg
│   └── ...
└── GOOD/
  ├── image-001.jpg
  └── ...
```

Capture different people, left/right hands, distances, rotations, lighting, and backgrounds. Then run:
```bash
cd backend
venv\Scripts\activate
python training\train.py --dataset dataset --augment 4
```

The script extracts rotation-, scale-, and translation-normalized 3D landmarks, splits images before augmentation, reports validation accuracy and a confusion matrix, and saves `backend/model/sign_classifier.pkl`. Restart the backend after training. The API automatically loads that file; if it is absent or incompatible, it uses the built-in heuristic classifier.

## 9. Supported Vocabulary
The prototype supports a controlled vocabulary defined in `public/ISL_Gifs.json`. This includes:
- A-Z alphabets
- Common greetings (hello, good morning)
- Daily words

## 10. Known Limitations
- "100% accurate ISL translation" is not claimed; this is a **controlled-vocabulary assistive communication platform**.
- The `window.SpeechRecognition` API works best in Google Chrome and Microsoft Edge.
- Webcam sign recognition requires good lighting and a plain background to perform optimally.

## 11. Future Scope
- **Larger ISL dataset**: Support for thousands of vocabulary words.
- **Continuous sentence recognition**: Temporal models (like LSTMs) instead of static frame classifiers.
- **Real-time collaborative classroom**: WebSockets for multi-user, multi-device synchronization.