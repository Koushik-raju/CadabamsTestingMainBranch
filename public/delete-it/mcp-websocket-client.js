/**
 * MCP WebSocket Client Library
 * Provides real-time communication with MCP backend via WebSocket
 */

class MCPWebSocketClient {
  constructor(options = {}) {
    const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    this.url = options.url || (isDev ? 'ws://localhost:3009/ws' : 'wss://api-ai-mcp.mindtalkbuddy.com/ws');
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.autoReconnect = options.autoReconnect !== false;

    this.ws = null;
    this.isConnected = false;
    this.pendingRequests = new Map();
    this.statusCallbacks = [];
    this.errorCallbacks = [];
    this.messageCallbacks = [];

    this.requestId = 0;

    console.log('🔧 [WebSocket Client] Client initialized with options:', options);
  }

  // Connect to WebSocket server
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🔌 [WebSocket Client] Connecting to ${this.url}`);
        console.log(`🔌 [WebSocket Client] Auto-reconnect: ${this.autoReconnect}`);
        console.log(`🔌 [WebSocket Client] Max reconnect attempts: ${this.maxReconnectAttempts}`);

        this.ws = new WebSocket(this.url);
        console.log('🔌 [WebSocket Client] WebSocket instance created');

        this.ws.onopen = () => {
          console.log('✅ [WebSocket Client] WebSocket connection opened');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.notifyStatus('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          console.log('📥 [WebSocket Client] Message received:', event.data);
          try {
            const data = JSON.parse(event.data);
            console.log('📥 [WebSocket Client] Parsed message:', data);
            this.handleMessage(data);
          } catch (error) {
            console.error('❌ [WebSocket Client] Error parsing WebSocket message:', error);
            console.error('❌ [WebSocket Client] Raw message:', event.data);
            this.notifyError('Failed to parse message');
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 [WebSocket Client] WebSocket disconnected:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          this.isConnected = false;
          this.notifyStatus('disconnected');

          if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log('🔄 [WebSocket Client] Auto-reconnect enabled, scheduling reconnection...');
            this.scheduleReconnect();
          } else {
            console.log('🛑 [WebSocket Client] Auto-reconnect disabled or max attempts reached');
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ [WebSocket Client] WebSocket error:', error);
          console.error('❌ [WebSocket Client] Error details:', {
            type: error.type,
            target: error.target,
            timeStamp: error.timeStamp
          });
          this.notifyError('WebSocket connection error');
          reject(error);
        };

      } catch (error) {
        console.error('❌ [WebSocket Client] Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  // Disconnect from WebSocket server
  disconnect() {
    console.log('🔌 [WebSocket Client] Disconnecting...');
    if (this.ws) {
      this.autoReconnect = false;
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      console.log('✅ [WebSocket Client] Disconnected successfully');
    } else {
      console.log('⚠️ [WebSocket Client] No WebSocket connection to disconnect');
    }
  }

  // Send AI query with real-time progress updates
  async sendAIQuery(query, context = {}) {
    return new Promise((resolve, reject) => {
      console.log('🚀 [WebSocket Client] Preparing to send AI query...');
      console.log('🚀 [WebSocket Client] Query:', query);
      console.log('🚀 [WebSocket Client] Context:', context);
      console.log('🚀 [WebSocket Client] Connection status:', this.isConnected);

      if (!this.isConnected) {
        const error = 'WebSocket not connected';
        console.error('❌ [WebSocket Client]', error);
        reject(new Error(error));
        return;
      }

      const requestId = ++this.requestId;
      const request = {
        type: 'ai_query',
        id: requestId,
        query: query,
        context: context
      };

      console.log('📤 [WebSocket Client] Sending request:', request);

      // Store pending request
      this.pendingRequests.set(requestId, { resolve, reject });
      console.log('📋 [WebSocket Client] Pending requests count:', this.pendingRequests.size);

      // Send request
      try {
        const message = JSON.stringify(request);
        console.log('📤 [WebSocket Client] Sending JSON message:', message);
        this.ws.send(message);
        console.log('✅ [WebSocket Client] Message sent successfully');
      } catch (error) {
        console.error('❌ [WebSocket Client] Failed to send message:', error);
        this.pendingRequests.delete(requestId);
        reject(error);
      }
    });
  }

  // Handle incoming messages
  handleMessage(data) {
    console.log('📥 [WebSocket Client] Handling message:', data);

    const { type, id, status, progress, result, error } = data;

    switch (type) {
      case 'status_update':
        console.log('📡 [WebSocket Client] Status update received:', data);
        this.handleStatusUpdate(data);
        break;

      case 'progress_update':
        console.log('📊 [WebSocket Client] Progress update received:', data);
        this.handleProgressUpdate(data);
        break;

      case 'ai_response':
        console.log('🤖 [WebSocket Client] AI response received:', data);
        this.handleAIResponse(data);
        break;

      case 'error':
        console.error('❌ [WebSocket Client] Error message received:', data);
        this.handleError(data);
        break;

      default:
        console.log('❓ [WebSocket Client] Unknown message type:', type, data);
        this.notifyMessage(data);
    }
  }

  // Handle status updates
  handleStatusUpdate(data) {
    const { status, message, timestamp } = data;
    console.log('📡 [WebSocket Client] Processing status update:', { status, message, timestamp });

    this.notifyStatus(status, message, timestamp);
  }

  // Handle progress updates
  handleProgressUpdate(data) {
    const { requestId, progress, stage, message, timestamp } = data;
    console.log('📊 [WebSocket Client] Processing progress update:', { requestId, progress, stage, message, timestamp });

    // Update pending request with progress
    const pendingRequest = this.pendingRequests.get(requestId);
    if (pendingRequest) {
      pendingRequest.progress = { progress, stage, message, timestamp };
      console.log('📋 [WebSocket Client] Updated pending request with progress');
    } else {
      console.warn('⚠️ [WebSocket Client] Progress update for unknown request ID:', requestId);
    }

    this.notifyStatus('progress', message, timestamp, { progress, stage });
  }

  // Handle AI response
  handleAIResponse(data) {
    const { requestId, result, success, error, formatted_message, query } = data;
    console.log('🤖 [WebSocket Client] Processing AI response:', { requestId, success, error, formatted_message, query });

    const pendingRequest = this.pendingRequests.get(requestId);
    if (pendingRequest) {
      this.pendingRequests.delete(requestId);
      console.log('📋 [WebSocket Client] Removed pending request, remaining:', this.pendingRequests.size);

      if (success) {
        console.log('✅ [WebSocket Client] AI query successful, resolving promise');
        // Pass through the entire response structure, including formatted_message
        const responseData = {
          type: 'ai_response',
          success: true,
          query: query,
          result: result,
          formatted_message: formatted_message,
          timestamp: new Date().toISOString()
        };
        console.log('📤 [WebSocket Client] Resolving with response data:', responseData);
        pendingRequest.resolve(responseData);
      } else {
        console.error('❌ [WebSocket Client] AI query failed, rejecting promise');
        pendingRequest.reject(new Error(error || 'AI query failed'));
      }
    } else {
      console.warn('⚠️ [WebSocket Client] AI response for unknown request ID:', requestId);
    }
  }

  // Handle errors
  handleError(data) {
    const { requestId, error, message } = data;
    console.error('❌ [WebSocket Client] Processing error:', { requestId, error, message });

    if (requestId) {
      const pendingRequest = this.pendingRequests.get(requestId);
      if (pendingRequest) {
        this.pendingRequests.delete(requestId);
        console.log('📋 [WebSocket Client] Removed pending request due to error, remaining:', this.pendingRequests.size);
        pendingRequest.reject(new Error(message || error));
      } else {
        console.warn('⚠️ [WebSocket Client] Error for unknown request ID:', requestId);
      }
    }

    this.notifyError(message || error);
  }

  // Schedule reconnection with exponential backoff
  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`🔄 [WebSocket Client] Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    this.notifyStatus('reconnecting', `Reconnecting in ${delay}ms...`);

    setTimeout(() => {
      if (this.autoReconnect && !this.isConnected) {
        console.log(`🔄 [WebSocket Client] Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.connect().catch(error => {
          console.error('❌ [WebSocket Client] Reconnection failed:', error);
          this.notifyError('Reconnection failed');
        });
      } else {
        console.log('🛑 [WebSocket Client] Reconnection cancelled - auto-reconnect disabled or already connected');
      }
    }, delay);
  }

  // Event listeners
  onStatus(callback) {
    console.log('📡 [WebSocket Client] Adding status callback');
    this.statusCallbacks.push(callback);
  }

  onError(callback) {
    console.log('❌ [WebSocket Client] Adding error callback');
    this.errorCallbacks.push(callback);
  }

  onMessage(callback) {
    console.log('📥 [WebSocket Client] Adding message callback');
    this.messageCallbacks.push(callback);
  }

  // Notify status callbacks
  notifyStatus(status, message = '', timestamp = null, data = {}) {
    const statusData = { status, message, timestamp, data };
    console.log('📡 [WebSocket Client] Notifying status callbacks:', statusData);
    this.statusCallbacks.forEach((callback, index) => {
      try {
        callback(statusData);
      } catch (error) {
        console.error(`❌ [WebSocket Client] Error in status callback ${index}:`, error);
      }
    });
  }

  // Notify error callbacks
  notifyError(error) {
    console.log('❌ [WebSocket Client] Notifying error callbacks:', error);
    this.errorCallbacks.forEach((callback, index) => {
      try {
        callback(error);
      } catch (error) {
        console.error(`❌ [WebSocket Client] Error in error callback ${index}:`, error);
      }
    });
  }

  // Notify message callbacks
  notifyMessage(message) {
    console.log('📥 [WebSocket Client] Notifying message callbacks:', message);
    this.messageCallbacks.forEach((callback, index) => {
      try {
        callback(message);
      } catch (error) {
        console.error(`❌ [WebSocket Client] Error in message callback ${index}:`, error);
      }
    });
  }

  // Get connection status
  getConnectionStatus() {
    const status = {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      pendingRequests: this.pendingRequests.size
    };
    console.log('📊 [WebSocket Client] Connection status:', status);
    return status;
  }

  // Get pending request progress
  getRequestProgress(requestId) {
    const pendingRequest = this.pendingRequests.get(requestId);
    const progress = pendingRequest ? pendingRequest.progress : null;
    console.log('📋 [WebSocket Client] Request progress for ID', requestId, ':', progress);
    return progress;
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MCPWebSocketClient;
}

// Make available globally for browser usage
if (typeof window !== 'undefined') {
  window.MCPWebSocketClient = MCPWebSocketClient;
  console.log('🌐 [WebSocket Client] MCPWebSocketClient made available globally');
} 