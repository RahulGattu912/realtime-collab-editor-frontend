import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

let onMessageCallback = null;
let onCursorUpdateCallback = null;
let onErrorCallback = null;
let pendingDocumentId = null;
let currentSubscriptions = new Set();

export function setOnMessageCallback(callback) {
  onMessageCallback = callback;
}

export function setOnCursorUpdate(callback) {
  onCursorUpdateCallback = callback;
}

export function setOnError(callback) {
  onErrorCallback = callback;
}

const stompClient = new Client({
  webSocketFactory: () =>
    new SockJS("https://realtime-collab-editor-backend.onrender.com"),
  reconnectDelay: 5000,
  heartbeatIncoming: 4000,
  heartbeatOutgoing: 4000,
  onConnect: () => {
    console.log("Connected to WebSocket");

    // Subscribe to general topics
    stompClient.subscribe("/topic/code", (message) => {
      console.log("Received code update:", message.body);
      const body = JSON.parse(message.body);
      if (onMessageCallback) {
        onMessageCallback(body);
      }
    });

    stompClient.subscribe("/topic/cursor", (message) => {
      console.log("Received cursor update:", message.body);
      const body = JSON.parse(message.body);
      if (onCursorUpdateCallback) {
        onCursorUpdateCallback(body);
      }
    });

    stompClient.subscribe("/user/queue/errors", (message) => {
      console.log("Received error:", message.body);
      if (onErrorCallback) {
        onErrorCallback(message.body);
      }
    });

    // If there was a pending document subscription, handle it now
    if (pendingDocumentId) {
      console.log(
        "Processing pending document subscription:",
        pendingDocumentId
      );
      subscribeToDocument(pendingDocumentId);
      pendingDocumentId = null;
    }
  },
  onStompError: (frame) => {
    console.error("STOMP Error:", frame.headers["message"]);
    if (onErrorCallback) {
      onErrorCallback(frame.headers["message"]);
    }
  },
});

export function connect() {
  console.log("Attempting to connect to WebSocket...");
  stompClient.activate();
}

export function disconnect() {
  if (stompClient.connected) {
    console.log("Disconnecting from WebSocket...");
    // Unsubscribe from all topics
    currentSubscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    currentSubscriptions.clear();
    stompClient.deactivate();
  }
}

export function sendCodeUpdate(content, sender, documentId, language) {
  if (stompClient.connected) {
    const message = {
      content,
      sender,
      documentId,
      language,
      timestamp: new Date().toISOString(),
    };
    console.log("Sending code update:", message);
    stompClient.publish({
      destination: "/app/code",
      body: JSON.stringify(message),
    });
  } else {
    console.warn("Cannot send code update: WebSocket not connected");
  }
}

export function sendCursorUpdate(lineNumber, column, sender, documentId) {
  if (stompClient.connected) {
    const message = {
      line: lineNumber,
      column: column,
      sender,
      documentId,
      timestamp: new Date().toISOString(),
    };
    console.log("Sending cursor update:", message);
    stompClient.publish({
      destination: "/app/cursor",
      body: JSON.stringify(message),
    });
  } else {
    console.warn("Cannot send cursor update: WebSocket not connected");
  }
}

export function subscribeToDocument(documentId) {
  if (stompClient.connected) {
    console.log("Subscribing to document:", documentId);

    const subscription = stompClient.subscribe(
      `/app/document/${documentId}`, // IMPORTANT: Not /topic
      (message) => {
        console.log("Initial document snapshot:", message.body);
        if (onMessageCallback) {
          onMessageCallback(JSON.parse(message.body));
        }

        // After initial snapshot, subscribe to live updates
        stompClient.subscribe(`/topic/document/${documentId}`, (updateMsg) => {
          console.log("Realtime update:", updateMsg.body);
          if (onMessageCallback) {
            onMessageCallback(JSON.parse(updateMsg.body));
          }
        });
      }
    );

    currentSubscriptions.add(subscription);
  } else {
    console.log("WS not connected, storing docID for later");
    pendingDocumentId = documentId;
  }
}

// export function subscribeToDocument(documentId) {
//   if (stompClient.connected) {
//     console.log("Subscribing to document:", documentId);

//     // Subscribe to document-specific topic
//     const subscription = stompClient.subscribe(
//       `/topic/document/${documentId}`,
//       (message) => {
//         console.log("Received document update:", message.body);
//         if (onMessageCallback) {
//           onMessageCallback(JSON.parse(message.body));
//         }
//       }
//     );

//     currentSubscriptions.add(subscription);

//     // Request initial document content
//     stompClient.publish({
//       destination: `/app/document/${documentId}`,
//       body: JSON.stringify({ documentId }),
//     });
//   } else {
//     console.log(
//       "WebSocket not connected, storing document ID for later subscription"
//     );
//     pendingDocumentId = documentId;
//   }
// }
