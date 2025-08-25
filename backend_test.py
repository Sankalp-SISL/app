#!/usr/bin/env python3
"""
Backend Test Suite for Agentspace Chat Integration
Tests the FastAPI backend endpoints with focus on the new chat functionality.
"""

import requests
import json
import time
import uuid
from typing import Dict, Any, Optional

# Configuration
BACKEND_URL = "https://sleek-darkbot.preview.emergentagent.com/api"
TIMEOUT = 30  # seconds

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, message: str, details: Optional[Dict] = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")
    
    def test_basic_connectivity(self):
        """Test basic API connectivity"""
        try:
            response = self.session.get(f"{BACKEND_URL}/", timeout=TIMEOUT)
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Hello World":
                    self.log_test("Basic Connectivity", True, "Root endpoint accessible")
                    return True
                else:
                    self.log_test("Basic Connectivity", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("Basic Connectivity", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Basic Connectivity", False, f"Connection error: {str(e)}")
            return False
    
    def test_chat_endpoint_basic(self):
        """Test basic chat endpoint functionality"""
        try:
            payload = {
                "message": "Hello, I'm a new employee. Can you help me understand the company's vacation policy?",
                "sessionId": None
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/chat",
                json=payload,
                timeout=TIMEOUT,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                if "reply" in data and "sessionId" in data:
                    if data["reply"] and data["sessionId"]:
                        self.log_test(
                            "Chat Basic Functionality", 
                            True, 
                            "Chat endpoint returns proper response structure",
                            {"reply_length": len(data["reply"]), "session_id": data["sessionId"][:50] + "..."}
                        )
                        return data["sessionId"]  # Return session ID for follow-up tests
                    else:
                        self.log_test("Chat Basic Functionality", False, "Empty reply or sessionId in response")
                        return None
                else:
                    self.log_test("Chat Basic Functionality", False, f"Missing required fields in response: {data}")
                    return None
            else:
                self.log_test("Chat Basic Functionality", False, f"HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_test("Chat Basic Functionality", False, f"Request error: {str(e)}")
            return None
    
    def test_session_management(self, session_id: str):
        """Test session management and conversation context"""
        if not session_id:
            self.log_test("Session Management", False, "No session ID provided from previous test")
            return False
            
        try:
            # Send a follow-up message using the same session
            payload = {
                "message": "What about sick leave policies?",
                "sessionId": session_id
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/chat",
                json=payload,
                timeout=TIMEOUT,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if "reply" in data and "sessionId" in data:
                    # Check if session ID is maintained or updated appropriately
                    if data["sessionId"] and data["reply"]:
                        self.log_test(
                            "Session Management", 
                            True, 
                            "Follow-up message processed successfully with session context",
                            {"session_maintained": session_id in data["sessionId"], "reply_length": len(data["reply"])}
                        )
                        return True
                    else:
                        self.log_test("Session Management", False, "Empty reply or sessionId in follow-up response")
                        return False
                else:
                    self.log_test("Session Management", False, f"Missing required fields in follow-up response: {data}")
                    return False
            else:
                self.log_test("Session Management", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Session Management", False, f"Follow-up request error: {str(e)}")
            return False
    
    def test_error_handling(self):
        """Test error handling with invalid inputs"""
        test_cases = [
            {
                "name": "Empty Message",
                "payload": {"message": "", "sessionId": None},
                "expected_error": True
            },
            {
                "name": "Missing Message Field",
                "payload": {"sessionId": None},
                "expected_error": True
            },
            {
                "name": "Invalid JSON",
                "payload": "invalid json",
                "expected_error": True
            },
            {
                "name": "Very Long Message",
                "payload": {"message": "x" * 10000, "sessionId": None},
                "expected_error": False  # Should handle long messages
            }
        ]
        
        error_handling_success = True
        
        for test_case in test_cases:
            try:
                if isinstance(test_case["payload"], str):
                    # Test invalid JSON
                    response = self.session.post(
                        f"{BACKEND_URL}/chat",
                        data=test_case["payload"],
                        timeout=TIMEOUT,
                        headers={"Content-Type": "application/json"}
                    )
                else:
                    response = self.session.post(
                        f"{BACKEND_URL}/chat",
                        json=test_case["payload"],
                        timeout=TIMEOUT,
                        headers={"Content-Type": "application/json"}
                    )
                
                if test_case["expected_error"]:
                    if response.status_code >= 400:
                        self.log_test(f"Error Handling - {test_case['name']}", True, f"Properly rejected with HTTP {response.status_code}")
                    else:
                        self.log_test(f"Error Handling - {test_case['name']}", False, f"Should have failed but got HTTP {response.status_code}")
                        error_handling_success = False
                else:
                    if response.status_code == 200:
                        self.log_test(f"Error Handling - {test_case['name']}", True, "Handled edge case successfully")
                    else:
                        self.log_test(f"Error Handling - {test_case['name']}", False, f"Failed to handle edge case: HTTP {response.status_code}")
                        error_handling_success = False
                        
            except Exception as e:
                if test_case["expected_error"]:
                    self.log_test(f"Error Handling - {test_case['name']}", True, f"Properly rejected with exception: {str(e)}")
                else:
                    self.log_test(f"Error Handling - {test_case['name']}", False, f"Unexpected exception: {str(e)}")
                    error_handling_success = False
        
        return error_handling_success
    
    def test_authentication(self):
        """Test Google Cloud service account authentication"""
        try:
            # Test with an HR-related question that should work if authentication is proper
            payload = {
                "message": "What are the company's remote work policies?",
                "sessionId": None
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/chat",
                json=payload,
                timeout=TIMEOUT,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "reply" in data and data["reply"]:
                    # If we get a meaningful response, authentication is likely working
                    self.log_test(
                        "Authentication", 
                        True, 
                        "Google Cloud authentication appears to be working",
                        {"response_received": True, "reply_length": len(data["reply"])}
                    )
                    return True
                else:
                    self.log_test("Authentication", False, "Empty response suggests authentication issues")
                    return False
            elif response.status_code == 401:
                self.log_test("Authentication", False, "Authentication failed - HTTP 401")
                return False
            elif response.status_code == 500:
                # Check if it's an authentication-related 500 error
                error_text = response.text.lower()
                if "credential" in error_text or "authentication" in error_text or "permission" in error_text:
                    self.log_test("Authentication", False, f"Authentication error in 500 response: {response.text}")
                    return False
                else:
                    self.log_test("Authentication", False, f"Server error (may be auth-related): {response.text}")
                    return False
            else:
                self.log_test("Authentication", False, f"Unexpected HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Authentication", False, f"Authentication test error: {str(e)}")
            return False
    
    def test_response_format(self):
        """Test response format compliance"""
        try:
            payload = {
                "message": "Can you tell me about employee benefits?",
                "sessionId": None
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/chat",
                json=payload,
                timeout=TIMEOUT,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ["reply", "sessionId"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Response Format", False, f"Missing required fields: {missing_fields}")
                    return False
                
                # Check field types
                if not isinstance(data["reply"], str):
                    self.log_test("Response Format", False, f"'reply' should be string, got {type(data['reply'])}")
                    return False
                
                if not isinstance(data["sessionId"], str):
                    self.log_test("Response Format", False, f"'sessionId' should be string, got {type(data['sessionId'])}")
                    return False
                
                # Check content validity
                if len(data["reply"].strip()) == 0:
                    self.log_test("Response Format", False, "Reply field is empty")
                    return False
                
                if len(data["sessionId"].strip()) == 0:
                    self.log_test("Response Format", False, "SessionId field is empty")
                    return False
                
                self.log_test(
                    "Response Format", 
                    True, 
                    "Response format is compliant",
                    {
                        "reply_length": len(data["reply"]),
                        "sessionId_format": "valid",
                        "content_type": response.headers.get("content-type", "unknown")
                    }
                )
                return True
            else:
                self.log_test("Response Format", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Response Format", False, f"Format test error: {str(e)}")
            return False
    
    def test_hr_specific_queries(self):
        """Test HR-specific queries since this is an HR assistant agent"""
        hr_questions = [
            "What is the company's vacation policy?",
            "How do I request time off?",
            "What are the health insurance benefits?",
            "What is the process for reporting workplace issues?"
        ]
        
        hr_test_success = True
        
        for question in hr_questions:
            try:
                payload = {
                    "message": question,
                    "sessionId": None
                }
                
                response = self.session.post(
                    f"{BACKEND_URL}/chat",
                    json=payload,
                    timeout=TIMEOUT,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if "reply" in data and data["reply"] and len(data["reply"]) > 10:
                        self.log_test(f"HR Query - {question[:30]}...", True, "Received meaningful HR response")
                    else:
                        self.log_test(f"HR Query - {question[:30]}...", False, "Empty or too short HR response")
                        hr_test_success = False
                else:
                    self.log_test(f"HR Query - {question[:30]}...", False, f"HTTP {response.status_code}")
                    hr_test_success = False
                    
                # Small delay between requests to avoid rate limiting
                time.sleep(1)
                
            except Exception as e:
                self.log_test(f"HR Query - {question[:30]}...", False, f"Error: {str(e)}")
                hr_test_success = False
        
        return hr_test_success
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("=" * 60)
        print("BACKEND TEST SUITE - AGENTSPACE CHAT INTEGRATION")
        print("=" * 60)
        
        # Test 1: Basic connectivity
        connectivity_ok = self.test_basic_connectivity()
        
        if not connectivity_ok:
            print("\n❌ CRITICAL: Basic connectivity failed. Stopping tests.")
            return self.generate_summary()
        
        # Test 2: Basic chat functionality
        session_id = self.test_chat_endpoint_basic()
        
        # Test 3: Session management (if we got a session ID)
        if session_id:
            self.test_session_management(session_id)
        
        # Test 4: Error handling
        self.test_error_handling()
        
        # Test 5: Authentication
        self.test_authentication()
        
        # Test 6: Response format
        self.test_response_format()
        
        # Test 7: HR-specific queries
        self.test_hr_specific_queries()
        
        return self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%" if total_tests > 0 else "No tests run")
        
        if failed_tests > 0:
            print("\nFAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  ❌ {result['test']}: {result['message']}")
        
        print("\n" + "=" * 60)
        
        return {
            "total": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "success_rate": (passed_tests/total_tests)*100 if total_tests > 0 else 0,
            "results": self.test_results
        }

if __name__ == "__main__":
    tester = BackendTester()
    summary = tester.run_all_tests()