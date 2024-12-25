# AjaxClient Library

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight, feature-rich AJAX client library that provides jQuery-like functionality with broad browser compatibility and modern features. This library offers a robust solution for handling HTTP requests in JavaScript applications.

## Support Me

This software is developed during my free time and I will be glad if somebody will support me.

Everyone's time should be valuable, so please consider donating.

[https://buymeacoffee.com/oxcakmak](https://buymeacoffee.com/oxcakmak)

## Features

- 🚀 **High Performance**: Optimized request handling and caching system
- 🔄 **Request/Response Interceptors**: Transform requests and responses globally
- 💾 **Smart Caching**: Built-in caching system for GET requests
- 🔁 **Automatic Retry**: Configurable retry mechanism for failed requests
- 🌐 **Cross-Browser Support**: Works in all major browsers, including legacy versions
- ⚡ **Promise-based API**: Modern async/await support
- 📊 **Progress Tracking**: Monitor upload and download progress
- ❌ **Request Cancellation**: Cancel pending requests using AbortController
- 🔄 **Multiple Data Formats**: Handles JSON, FormData, and URL-encoded data
- 🛡️ **Type Safety**: Written in JavaScript with JSDoc annotations for better IDE support

## Installation

```bash
npm install ajaxclientjs
# or
yarn add ajaxclientjs
```

For direct browser usage, include the script:

```html
<script src="dist/AjaxClient.js"></script>
```

## Quick Start

```javascript
// Create an instance
const ajax = new AjaxClient({
  baseURL: 'https://api.example.com',
  headers: {
    'Authorization': 'Bearer your-token'
  }
});

// Make a GET request
ajax.get('/users')
  .then(response => console.log(response.data))
  .catch(error => console.error(error));

// Make a POST request
ajax.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
})
  .then(response => console.log(response.data));
```

## Advanced Usage

### Configuration Options

```javascript
const ajax = new AjaxClient({
  baseURL: 'https://api.example.com',
  headers: {
    'Authorization': 'Bearer token123'
  },
  timeout: 5000,           // 5 seconds
  retryAttempts: 3,        // Retry failed requests 3 times
  retryDelay: 1000,        // Wait 1 second between retries
  cache: true              // Enable caching for GET requests
});
```

### Using Interceptors

```javascript
// Request interceptor
ajax.addRequestInterceptor(options => {
  options.headers['X-Custom-Header'] = 'value';
  return options;
});

// Response interceptor
ajax.addResponseInterceptor(response => {
  response.data.timestamp = Date.now();
  return response;
});
```

### Progress Tracking

```javascript
ajax.post('/upload', formData, {
  onProgress: (event) => {
    const percent = (event.loaded / event.total) * 100;
    console.log(`Upload progress: ${percent}%`);
  }
});
```

### Request Cancellation

```javascript
const controller = new AbortController();

ajax.get('/large-data', {
  signal: controller.signal
});

// Cancel the request
controller.abort();
```

### Caching

```javascript
// Enable caching for specific request
ajax.get('/users', { cache: true });

// Clear cache
ajax.clearCache();
```

### Multiple Data Formats

```javascript
// JSON (default)
ajax.post('/api/data', { key: 'value' });

// FormData
const formData = new FormData();
formData.append('file', fileInput.files[0]);
ajax.post('/api/upload', formData);

// URL-encoded
ajax.post('/api/form', data, {
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
});
```

## API Reference

### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| baseURL | string | '' | Base URL for all requests |
| headers | object | {} | Default headers |
| timeout | number | 30000 | Request timeout in milliseconds |
| retryAttempts | number | 0 | Number of retry attempts |
| retryDelay | number | 1000 | Delay between retries in milliseconds |

### Methods

#### Core Methods

- `request(url, options)`: Make a custom request
- `get(url, options)`: Make a GET request
- `post(url, data, options)`: Make a POST request
- `put(url, data, options)`: Make a PUT request
- `patch(url, data, options)`: Make a PATCH request
- `delete(url, options)`: Make a DELETE request

#### Utility Methods

- `addRequestInterceptor(interceptor)`: Add a request interceptor
- `addResponseInterceptor(interceptor)`: Add a response interceptor
- `abortAll()`: Abort all pending requests
- `clearCache()`: Clear the request cache

### Request Options

| Option | Type | Description |
|--------|------|-------------|
| method | string | HTTP method |
| data | any | Request payload |
| params | object | URL parameters |
| headers | object | Request headers |
| timeout | number | Request timeout |
| cache | boolean | Enable caching |
| signal | AbortSignal | For request cancellation |
| onProgress | function | Progress callback |

## Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ IE11 and above
- ✅ Opera (latest)

## Contributing

We welcome contributions!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: info@oxcakmak.com
- 💬 Issues: [GitHub Issues](https://github.com/oxcakmak/AjaxClient/issues)
