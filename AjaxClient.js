
class AjaxClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    this.defaultTimeout = options.timeout || 30000;
    this.retryAttempts = options.retryAttempts || 0;
    this.retryDelay = options.retryDelay || 1000;
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.interceptors = {
      request: [],
      response: []
    };
  }

  /**
   * Creates appropriate XMLHttpRequest object for browser
   * @private
   */
  _createXHR() {
    const XMLHttpFactories = [
      () => new XMLHttpRequest(),
      () => new ActiveXObject("Msxml3.XMLHTTP"),
      () => new ActiveXObject("Msxml2.XMLHTTP.6.0"),
      () => new ActiveXObject("Msxml2.XMLHTTP.3.0"),
      () => new ActiveXObject("Msxml2.XMLHTTP"),
      () => new ActiveXObject("Microsoft.XMLHTTP")
    ];

    for (let factory of XMLHttpFactories) {
      try {
        return factory();
      } catch (e) {
        continue;
      }
    }
    throw new Error("XMLHttpRequest is not supported");
  }

  /**
   * Adds request interceptor
   * @param {Function} interceptor
   */
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
  }

  /**
   * Adds response interceptor
   * @param {Function} interceptor
   */
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor);
  }

  /**
   * Serializes data based on content type
   * @private
   */
  _serializeData(data, contentType) {
    if (!data) return null;
    if (contentType.includes('application/json')) {
      return JSON.stringify(data);
    }
    if (contentType.includes('application/x-www-form-urlencoded')) {
      return Object.keys(data)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
        .join('&');
    }
    if (data instanceof FormData || typeof data === 'string') {
      return data;
    }
    return JSON.stringify(data);
  }

  /**
   * Generates cache key
   * @private
   */
  _getCacheKey(url, options) {
    return `${options.method || 'GET'}-${url}-${JSON.stringify(options.data || {})}-${JSON.stringify(options.params || {})}`;
  }

  /**
   * Handles response parsing
   * @private
   */
  _parseResponse(xhr) {
    const contentType = xhr.getResponseHeader('Content-Type');
    let data = xhr.responseText;

    try {
      if (contentType && contentType.includes('application/json')) {
        data = JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to parse JSON response', e);
    }

    return {
      status: xhr.status,
      statusText: xhr.statusText,
      data,
      headers: this._parseHeaders(xhr.getAllResponseHeaders()),
      xhr
    };
  }

  /**
   * Parses response headers
   * @private
   */
  _parseHeaders(headerStr) {
    return headerStr.split('\r\n')
      .reduce((headers, line) => {
        const [key, value] = line.split(': ');
        if (key) headers[key.toLowerCase()] = value;
        return headers;
      }, {});
  }

  /**
   * Aborts all pending requests
   */
  abortAll() {
    this.pendingRequests.forEach(xhr => xhr.abort());
    this.pendingRequests.clear();
  }

  /**
   * Clears cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Main request method with enhanced features
   * @param {string} url 
   * @param {Object} options
   */
  async request(url, options = {}) {
    // Apply request interceptors
    let finalOptions = { ...options };
    for (let interceptor of this.interceptors.request) {
      finalOptions = await interceptor(finalOptions);
    }

    const cacheKey = this._getCacheKey(url, finalOptions);
    
    // Check cache if method is GET and caching is enabled
    if (finalOptions.cache && finalOptions.method === 'GET' && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    return new Promise(async (resolve, reject) => {
      const makeRequest = async (attempt = 1) => {
        try {
          const xhr = this._createXHR();
          const method = (finalOptions.method || 'GET').toUpperCase();
          let finalURL = this.baseURL + url;

          // Handle query parameters
          if (finalOptions.params) {
            const queryString = new URLSearchParams(finalOptions.params).toString();
            finalURL += (finalURL.includes('?') ? '&' : '?') + queryString;
          }

          xhr.open(method, finalURL, true);

          // Set headers
          const headers = { ...this.defaultHeaders, ...finalOptions.headers };
          Object.entries(headers).forEach(([key, value]) => {
            if (value !== undefined) xhr.setRequestHeader(key, value);
          });

          // Setup timeout
          xhr.timeout = finalOptions.timeout || this.defaultTimeout;

          // Track request
          const requestId = Math.random().toString(36).substring(7);
          this.pendingRequests.set(requestId, xhr);

          // Setup handlers
          xhr.onreadystatechange = async () => {
            if (xhr.readyState === 4) {
              this.pendingRequests.delete(requestId);
              
              const response = this._parseResponse(xhr);

              // Apply response interceptors
              let finalResponse = response;
              for (let interceptor of this.interceptors.response) {
                finalResponse = await interceptor(finalResponse);
              }

              if (xhr.status >= 200 && xhr.status < 300) {
                // Cache successful GET requests if caching is enabled
                if (finalOptions.cache && method === 'GET') {
                  this.cache.set(cacheKey, finalResponse);
                }
                resolve(finalResponse);
              } else if (xhr.status !== 0) {
                // Retry logic
                if (attempt < this.retryAttempts + 1) {
                  await new Promise(r => setTimeout(r, this.retryDelay * attempt));
                  makeRequest(attempt + 1);
                } else {
                  reject(finalResponse);
                }
              }
            }
          };

          // Error handlers
          xhr.onerror = () => reject(new Error('Network Error'));
          xhr.ontimeout = () => reject(new Error('Request timeout'));

          // Progress tracking
          if (finalOptions.onProgress) {
            const progressHandler = finalOptions.onProgress;
            if (xhr.upload) xhr.upload.onprogress = progressHandler;
            xhr.onprogress = progressHandler;
          }

          // Handle request cancellation
          if (finalOptions.signal) {
            finalOptions.signal.addEventListener('abort', () => {
              xhr.abort();
              reject(new Error('Request aborted'));
            });
          }

          // Send request
          const body = this._serializeData(
            finalOptions.data,
            headers['Content-Type'] || 'application/json'
          );
          xhr.send(body);
        } catch (error) {
          reject(error);
        }
      };

      makeRequest();
    });
  }

  // Convenience methods
  get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  post(url, data, options = {}) {
    return this.request(url, { ...options, method: 'POST', data });
  }

  put(url, data, options = {}) {
    return this.request(url, { ...options, method: 'PUT', data });
  }

  patch(url, data, options = {}) {
    return this.request(url, { ...options, method: 'PATCH', data });
  }

  delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }
}
