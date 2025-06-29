# 🔄 Backend Implementation Context - PitSnap Performance Optimization

**Date**: December 2024  
**Status**: Ready for Phase 1 Implementation  
**Location**: `paddock-ai-backend/`  

---

## 🎯 Immediate Implementation Tasks

### Phase 1 (This Week) - Backend Fast Queries
**Target**: Reduce basic query response time from 5-8s to 1-2s

#### 1. Query Classification (`main.py`)
```python
# Add this to main.py
from enum import Enum

class QueryType(Enum):
    BASIC = "basic"
    COMPLEX = "complex"

def classify_query(question: str) -> QueryType:
    basic_keywords = ["standings", "winner", "leader", "next race", "points"]
    if any(keyword in question.lower() for keyword in basic_keywords):
        return QueryType.BASIC
    return QueryType.COMPLEX
```

#### 2. Fast Endpoint (`main.py`)
```python
# Add this new endpoint
@app.post("/ask-fast", response_model=AnswerResponse)
def ask_basic_fast(request: QuestionRequest):
    """Fast endpoint for basic F1 queries - bypasses RAG"""
    query_type = classify_query(request.question)
    
    if query_type == QueryType.BASIC:
        return handle_basic_query(request.question)
    else:
        return ask_paddock_full(request)  # Fallback to full RAG
```

#### 3. Basic Data Caching (`f1_api_client.py`)
```python
# Add caching to F1APIClient class
def __init__(self):
    self.basic_data_cache = {}
    self.cache_ttl = 30  # 30 seconds

def get_basic_f1_data(self) -> dict:
    # Check cache first, then fetch if needed
    # Return: leader, winner, next_race, top_3
```

---

## 🔧 Current File Structure

```
paddock-ai-backend/
├── main.py                    # Add /ask-fast endpoint here
├── f1_api_client.py          # Add basic data caching here
├── f1_service.py             # Current F1 data logic
├── requirements.txt          # Dependencies
├── Performance-Optimization-Plan.md  # Full implementation guide
└── Implementation-Context.md  # This quick reference
```

---

## 🚀 Quick Test Commands

```bash
# Start server
python main.py

# Test new fast endpoint
curl -X POST "http://localhost:8000/ask-fast" \
  -H "Content-Type: application/json" \
  -d '{"question": "current championship standings"}'

# Compare with regular endpoint
time curl -X POST "http://localhost:8000/ask" \
  -H "Content-Type: application/json" \
  -d '{"question": "current championship standings"}'
```

---

## 📊 Expected Results

| Query Type | Before | After | Improvement |
|------------|--------|-------|-------------|
| "current standings" | 5-8s | 1-2s | **4x faster** |
| "latest winner" | 5-8s | 1-2s | **4x faster** |
| "next race" | 5-8s | 1-2s | **4x faster** |

---

## 🎯 Success Criteria

- ✅ `/ask-fast` endpoint responds in < 2 seconds
- ✅ Basic queries bypass RAG pipeline
- ✅ Fallback to full RAG works for complex queries
- ✅ No breaking changes to existing `/ask` endpoint

---

## 🔍 Next Steps After Phase 1

1. **Frontend Integration** - Update `paddockAiService.ts`
2. **Performance Monitoring** - Add metrics tracking
3. **Cache Optimization** - Fine-tune cache TTL values
4. **Load Testing** - Validate performance under load

---

**Quick Start**: Begin with `main.py` - add query classification and `/ask-fast` endpoint 