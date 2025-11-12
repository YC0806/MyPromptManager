#!/bin/bash

# Test script for browser extension API integration

API_URL="http://localhost:8000/v1"

echo "Testing MyPromptManager Browser Extension API Integration"
echo "=========================================================="
echo ""

# Test 1: Health check
echo "1. Testing health endpoint..."
curl -s -X GET "${API_URL}/health" | python3 -m json.tool
echo ""
echo ""

# Test 2: Create Chat (from browser extension)
echo "2. Testing POST /chats (Create Chat from Browser Extension)..."
RESPONSE=$(curl -s -X POST "${API_URL}/chats" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "ChatGPT",
    "conversation_id": "test-conv-123",
    "title": "Test Conversation from Browser Extension",
    "messages": [
      {
        "role": "user",
        "content": "Hello, this is a test message",
        "timestamp": null,
        "index": 0
      },
      {
        "role": "assistant",
        "content": "Hi! This is a test response.",
        "timestamp": null,
        "index": 1
      }
    ],
    "metadata": {
      "url": "https://chat.openai.com/c/test-conv-123",
      "extracted_at": "2024-01-10T10:00:00Z",
      "messageCount": 2
    }
  }')

echo "$RESPONSE" | python3 -m json.tool
CHAT_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)
echo ""
echo "Created chat ID: $CHAT_ID"
echo ""
echo ""

# Test 3: Get Chats list
echo "3. Testing GET /chats (List Chats)..."
curl -s -X GET "${API_URL}/chats" | python3 -m json.tool
echo ""
echo ""

# Test 4: Get specific Chat (if ID was captured)
if [ ! -z "$CHAT_ID" ]; then
  echo "4. Testing GET /chats/$CHAT_ID (Get specific chat)..."
  curl -s -X GET "${API_URL}/chats/${CHAT_ID}" | python3 -m json.tool
  echo ""
  echo ""

  # Test 5: Update Chat
  echo "5. Testing PUT /chats/$CHAT_ID (Update chat)..."
  curl -s -X PUT "${API_URL}/chats/${CHAT_ID}" \
    -H "Content-Type: application/json" \
    -d '{
      "provider": "ChatGPT",
      "conversation_id": "test-conv-123",
      "title": "Updated Test Conversation",
      "messages": [
        {
          "role": "user",
          "content": "Hello, this is a test message",
          "timestamp": null,
          "index": 0
        },
        {
          "role": "assistant",
          "content": "Hi! This is a test response.",
          "timestamp": null,
          "index": 1
        },
        {
          "role": "user",
          "content": "Another message added",
          "timestamp": null,
          "index": 2
        }
      ],
      "metadata": {
        "url": "https://chat.openai.com/c/test-conv-123",
        "extracted_at": "2024-01-10T10:00:00Z",
        "messageCount": 3
      }
    }' | python3 -m json.tool
  echo ""
  echo ""
fi

# Test 6: Test duplicate conversation_id (should update existing)
echo "6. Testing duplicate conversation_id (should update existing)..."
RESPONSE2=$(curl -s -X POST "${API_URL}/chats" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "ChatGPT",
    "conversation_id": "test-conv-123",
    "title": "Same Conversation ID Test",
    "messages": [
      {
        "role": "user",
        "content": "Testing duplicate handling",
        "timestamp": null,
        "index": 0
      }
    ],
    "metadata": {
      "url": "https://chat.openai.com/c/test-conv-123",
      "extracted_at": "2024-01-10T11:00:00Z",
      "messageCount": 1
    }
  }')

echo "$RESPONSE2" | python3 -m json.tool
echo ""
echo ""

# Test 7: Filter by provider
echo "7. Testing GET /chats?provider=ChatGPT (Filter by provider)..."
curl -s -X GET "${API_URL}/chats?provider=ChatGPT" | python3 -m json.tool
echo ""
echo ""

echo "=========================================================="
echo "Testing complete!"
echo ""
echo "To clean up test data, you can delete the chat:"
if [ ! -z "$CHAT_ID" ]; then
  echo "  curl -X DELETE ${API_URL}/chats/${CHAT_ID}"
fi
