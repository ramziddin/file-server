# File Server & Chat Application

A simple web application that combines file sharing and real-time chat functionality.

## Features

- File upload and download
- Real-time chat with message history
- Copy message functionality
- Clean and responsive UI
- Secure file handling

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the application:
   ```bash
   python main.py
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

## Project Structure

```
.
├── app/
│   ├── __init__.py
│   ├── config.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── chat.py
│   │   └── files.py
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       └── chat.js
│   ├── templates/
│   │   └── index.html
│   └── utils/
│       ├── chat_helpers.py
│       └── file_helpers.py
├── main.py
├── requirements.txt
└── README.md
```

## Security Considerations

- File uploads are restricted to allowed extensions
- Filenames are sanitized before saving
- Chat messages are limited to prevent memory issues
- Static files are served securely

## Contributing

Feel free to submit issues and enhancement requests! 