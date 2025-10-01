// Simple script to generate a static OG image
const fs = require('fs');
const https = require('https');

// Create a simple HTML that can be converted to image
const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            width: 600px;
            height: 400px;
            background: linear-gradient(135deg, #111 0%, #333 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
        }
        .title {
            font-size: 48px;
            font-weight: bold;
            background: linear-gradient(90deg, #00ff00, #00ffff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 20px;
            text-align: center;
        }
        .subtitle {
            font-size: 24px;
            color: #888;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="title">world-world</div>
    <div class="subtitle">Edit GitHub repos on the go</div>
</body>
</html>
`;

console.log('Generated static HTML for OG image');
console.log('To use this, you would need a service like htmlcsstoimage.com or similar to convert HTML to PNG');
console.log('Then upload the PNG to your GitHub repo using your existing API');
