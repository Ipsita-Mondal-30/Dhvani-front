# Currency Detection Setup

## ✅ Fixed Currency Detection

### **Problem Solved:**
- **Before**: Random fake detection showing wrong denominations
- **After**: Real currency detection using Google Vision API via backend

### **How It Works Now:**
1. **Camera Capture**: Takes photo of currency note
2. **Backend Processing**: Sends image to backend API at `localhost:3000`
3. **Google Vision API**: Backend uses Google Cloud Vision to extract text
4. **Smart Analysis**: Analyzes text to identify Indian currency denominations
5. **Accurate Results**: Returns actual detected denomination with confidence

## 🚀 Backend Setup Required

### **Start the Backend Server:**
```bash
# Navigate to backend directory
cd dhwani/dhvani-backend

# Install dependencies (if not done)
npm install

# Start the development server
npm run dev
```

### **Backend Should Run On:**
- **URL**: `http://localhost:3000`
- **API Endpoint**: `/api/currency`
- **Method**: POST with base64 image

### **Environment Variables Needed:**
Make sure your backend `.env` file has:
```env
GCP_API_KEY=your-google-cloud-api-key
```

## 🧪 Testing Currency Detection

### **With Backend Running:**
1. Start backend: `npm run dev` in `dhwani/dhvani-backend`
2. Open currency detection in app
3. Take photo of Indian currency note
4. **Expected**: Accurate detection of actual denomination
5. **Expected**: Confidence percentage based on text clarity

### **Without Backend Running:**
1. Take photo of currency
2. **Expected**: Clear error message about backend connection
3. **Expected**: Instructions to start backend server

## 🎯 Supported Indian Currency

### **Denominations Detected:**
- ₹10 (Ten Rupees)
- ₹20 (Twenty Rupees)  
- ₹50 (Fifty Rupees)
- ₹100 (One Hundred Rupees)
- ₹200 (Two Hundred Rupees)
- ₹500 (Five Hundred Rupees)
- ₹2000 (Two Thousand Rupees)

### **Detection Methods:**
1. **Number Recognition**: Looks for "100", "500", etc.
2. **Text Analysis**: Searches for "One Hundred", "Five Hundred"
3. **Context Clues**: Identifies "Rupee", "Reserve Bank", "India"
4. **Confidence Scoring**: Based on multiple text indicators

## 🔧 API Configuration

### **Frontend API Client:**
- **File**: `lib/currency-api.ts`
- **Base URL**: `http://localhost:3000`
- **Timeout**: Automatic error handling for connection issues

### **Backend API:**
- **File**: `src/app/api/currency/route.ts`
- **Google Vision**: Uses Cloud Vision API for OCR
- **Smart Parsing**: Extracts denomination from detected text
- **Error Handling**: Comprehensive error messages

## 🎤 Voice Feedback

### **Success Cases:**
- "This is a 100 rupee note"
- "This is a 500 rupee note"

### **Error Cases:**
- "Unable to connect to the currency detection service"
- "No text was detected in the image"
- "This does not appear to be an Indian currency note"

## 🚨 Troubleshooting

### **"Backend Connection Error":**
1. Check if backend is running: `http://localhost:3000`
2. Start backend: `npm run dev` in backend directory
3. Check network connectivity

### **"No Text Detected":**
1. Ensure good lighting
2. Keep currency note flat and clear
3. Fill most of camera frame with the note
4. Ensure camera is focused

### **"Not Indian Currency":**
1. Use only Indian rupee notes
2. Ensure the note has clear "Reserve Bank of India" text
3. Try with a different note

## 📱 User Experience

### **Processing Flow:**
1. **Camera View**: Point at currency note
2. **Capture**: Tap capture button
3. **Processing**: Shows loading animation
4. **Analysis**: Backend processes with Google Vision
5. **Result**: Shows actual detected denomination
6. **Voice**: Announces the result

### **Expected Results:**
- **Accurate Detection**: Shows actual denomination of the note
- **Confidence Score**: Percentage based on text clarity
- **Fast Processing**: Usually 2-3 seconds
- **Error Handling**: Clear messages for any issues

The currency detection now uses real AI-powered OCR to accurately identify Indian currency notes!