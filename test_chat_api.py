#!/usr/bin/env python3
"""
Test script for Chat API endpoints
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000/v1"
CHAT_ID = "1762484684044M2NPX9DP4JMM3A87"

def test_search_chats():
    """Test searching for chats"""
    print("1. Testing search API for chats...")
    response = requests.get(f"{BASE_URL}/search", params={"type": "chat"})
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Found {data['count']} chats")
    return response.status_code == 200

def test_get_chat_content():
    """Test getting chat content"""
    print("\n2. Testing get chat content API...")
    response = requests.get(f"{BASE_URL}/simple/chats/{CHAT_ID}/content")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Chat title: {data['content']['title']}")
    print(f"Messages: {len(data['content']['messages'])}")
    return response.status_code == 200

def test_get_chat_timeline():
    """Test getting chat timeline"""
    print("\n3. Testing get chat timeline API...")
    response = requests.get(f"{BASE_URL}/simple/chats/{CHAT_ID}/timeline")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Timeline items: {len(data['timeline'])}")
    return response.status_code == 200

def test_save_chat_draft():
    """Test saving chat draft"""
    print("\n4. Testing save chat draft API...")

    chat_data = {
        "content": {
            "id": CHAT_ID,
            "title": "讨论代码重构方案 (Updated via API)",
            "description": "与 AI 讨论如何重构一个复杂的 Python 模块 - 已更新",
            "tags": ["重构", "Python", "架构设计", "测试"],
            "created_at": "2025-11-07T11:04:44.044862",
            "updated_at": "2025-11-07T11:04:44.044875",
            "messages": [
                {
                    "role": "user",
                    "content": "测试消息",
                    "timestamp": "2025-11-07T11:10:00Z"
                }
            ]
        },
        "message": "Update chat via API test"
    }

    response = requests.post(
        f"{BASE_URL}/simple/chats/{CHAT_ID}/save",
        json=chat_data
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        data = response.json()
        print(f"Saved! SHA: {data.get('sha', 'N/A')[:8]}")
        print(f"UI Branch: {data.get('ui_branch', 'N/A')}")
    else:
        print(f"Error: {response.text}")
    return response.status_code == 201

def test_detail_api():
    """Test detail API endpoints"""
    print("\n5. Testing detail API - get chat history...")
    response = requests.get(f"{BASE_URL}/detail/chats/{CHAT_ID}/history")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"History count: {data['count']}")
    return response.status_code == 200

def main():
    print("=" * 60)
    print("Testing Chat API Endpoints")
    print("=" * 60)

    results = []

    results.append(("Search Chats", test_search_chats()))
    results.append(("Get Chat Content", test_get_chat_content()))
    results.append(("Get Chat Timeline", test_get_chat_timeline()))
    results.append(("Save Chat Draft", test_save_chat_draft()))
    results.append(("Get Chat History", test_detail_api()))

    print("\n" + "=" * 60)
    print("Test Results Summary")
    print("=" * 60)

    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")

    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)
    print(f"\nPassed: {passed_count}/{total_count}")

    if passed_count == total_count:
        print("\n🎉 All tests passed!")
    else:
        print(f"\n⚠️  {total_count - passed_count} test(s) failed")

if __name__ == "__main__":
    main()
