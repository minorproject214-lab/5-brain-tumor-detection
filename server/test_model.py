import os
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import warnings
warnings.filterwarnings('ignore')

import numpy as np
from tensorflow.keras.models import load_model
from PIL import Image

# 1) Load the model
model = load_model("brain-tumor-model.h5")
print("Model loaded successfully!")

# 2) Load and preprocess image
img_path = "./sample.jpg"  # replace with your test image
img = Image.open(img_path).convert("L")
img = img.resize((300, 300))
img_array = np.array(img) / 255.0
img_array = img_array.reshape(1, 300, 300, 1)

# 3) Run prediction
pred = model.predict(img_array)

print("Raw prediction:", pred)
predicted_class = np.argmax(pred[0])
classes = ["Glioma", "Meningioma", "No Tumor", "Pituitary Tumor"]
print("Predicted:", classes[predicted_class])