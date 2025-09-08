"""
Pydantic AI History Processors for Context Window Management

Implements native Pydantic AI patterns for:
- Token estimation and context window calculation
- Message summarization when approaching limits
- Tool call preservation (critical for agent functionality)
"""

import logging
import asyncio
from typing import List, Dict, Any
from pydantic_ai.messages import ModelMessage
from pydantic_ai._utils import now_utc

logger = logging.getLogger(__name__)

# Model context windows (tokens)
MODEL_CONTEXT_WINDOWS = {
    'gemini-2.5-flash': 1000000,
    'gemini-2.5-pro': 2000000,
    'openai:gpt-4o-mini': 128000,
    'openai:gpt-4o': 128000,
    'anthropic:claude-3-5-sonnet-20241022': 200000,
    'anthropic:claude-3-haiku-20240307': 200000,
    'deepseek:deepseek-chat': 32000,
    'test': 4000  # Small for testing
}

# Summarization thresholds
CONTEXT_USAGE_THRESHOLD = 0.7  # Summarize when 70% of context used
RECENT_MESSAGES_TO_KEEP = 10   # Always keep last 10 messages
MIN_MESSAGES_TO_SUMMARIZE = 5  # Need at least 5 messages to summarize


def estimate_tokens(text: str) -> int:
    """
    Simple token estimation (rough approximation).
    Real implementation would use tiktoken or model-specific tokenizers.
    """
    if not text:
        return 0
    
    # Rough estimation: ~4 characters per token on average
    return max(1, len(text) // 4)


def calculate_message_tokens(messages: List[ModelMessage]) -> int:
    """Calculate total tokens in message history"""
    total_tokens = 0
    
    for message in messages:
        # Handle different message part types
        for part in message:
            content = ""
            if hasattr(part, 'content'):
                content = str(part.content)
            elif hasattr(part, 'args'):  # Tool call
                content = str(part.args)
            
            if content:
                total_tokens += estimate_tokens(content)
        
        # Add overhead for message structure
        total_tokens += 10  # Overhead per message
    
    return total_tokens


def get_context_window_size(model: str) -> int:
    """Get context window size for model"""
    return MODEL_CONTEXT_WINDOWS.get(model, 4000)


def should_summarize(messages: List[ModelMessage], model: str) -> bool:
    """Determine if messages need summarization"""
    if len(messages) <= RECENT_MESSAGES_TO_KEEP:
        return False
    
    total_tokens = calculate_message_tokens(messages)
    context_window = get_context_window_size(model)
    usage_ratio = total_tokens / context_window
    
    logger.info(f"📊 Context usage: {total_tokens}/{context_window} tokens ({usage_ratio:.2%})")
    
    return usage_ratio > CONTEXT_USAGE_THRESHOLD


def separate_tool_calls(messages: List[ModelMessage]) -> tuple[List[ModelMessage], List[ModelMessage]]:
    """
    Separate messages into summarizable and recent (preserving tool call pairs).
    
    Critical: Tool calls and returns must stay paired to avoid LLM errors.
    """
    if len(messages) <= RECENT_MESSAGES_TO_KEEP:
        return [], messages
    
    # Find split point that doesn't break tool call pairs
    split_index = len(messages) - RECENT_MESSAGES_TO_KEEP
    
    # Walk backward to find a safe split point
    for i in range(split_index, max(0, split_index - 20), -1):
        if i < len(messages):
            current_msg = messages[i]
            
            # Check if message contains tool calls or returns
            has_tool_interaction = False
            for part in current_msg:
                if hasattr(part, 'part_kind'):
                    if part.part_kind in ['tool-call', 'tool-return']:
                        has_tool_interaction = True
                        break
            
            # Don't split in the middle of tool interactions
            if has_tool_interaction:
                continue
                
            # Safe to split after user/system messages
            old_messages = messages[:i]
            recent_messages = messages[i:]
            
            logger.info(f"📂 Split messages: {len(old_messages)} to summarize, {len(recent_messages)} to keep")
            return old_messages, recent_messages
    
    # Fallback: keep more messages if we can't find safe split
    logger.warning("⚠️ Could not find safe split point, keeping more messages")
    return [], messages


async def create_summary_message(messages: List[ModelMessage]) -> str:
    """
    Create a summary of old messages using a lightweight model.
    
    Uses OpenAI GPT-4o-mini for cost-effective summarization.
    """
    try:
        from pydantic_ai import Agent
        
        # Create lightweight summarizer
        summarizer = Agent('openai:gpt-4o-mini', retries=1)
        
        # Prepare conversation text for summarization
        conversation_text = ""
        for msg in messages:
            for part in msg:
                if hasattr(part, 'content') and part.content:
                    part_type = getattr(part, 'part_kind', 'unknown')
                    conversation_text += f"{part_type}: {part.content}\n\n"
        
        if not conversation_text.strip():
            # Fallback for empty conversation
            return f"[CONVERSATION SUMMARY] Previous conversation with {len(messages)} messages. Context preserved for continuation."
        
        # Summarize with specific instructions
        result = await summarizer.run(
            f"Summarize this conversation preserving:\n"
            f"- Key decisions and conclusions\n"
            f"- Important context for ongoing discussion\n"
            f"- User preferences and persona interactions\n"
            f"- Coordinate references and tool usage results\n\n"
            f"Omit small talk and repetitive content. Be concise but preserve meaning:\n\n"
            f"{conversation_text}"
        )
        
        summary_content = f"[CONVERSATION SUMMARY] {result.data}"
        
        logger.info(f"📝 Created summary: {len(summary_content)} chars from {len(messages)} messages")
        
        return summary_content
        
    except Exception as e:
        logger.error(f"❌ Summarization failed: {e}")
        # Fallback: create simple summary
        return (f"[CONVERSATION SUMMARY] Previous conversation with {len(messages)} messages. "
                f"Context preserved for continuation.")


async def context_window_processor(messages: List[ModelMessage], model: str = 'test') -> List[ModelMessage]:
    """
    Main context window processor for Pydantic AI history_processors.
    
    Automatically summarizes old messages when approaching context limits.
    """
    try:
        if not should_summarize(messages, model):
            logger.info("📏 Context window within limits, no summarization needed")
            return messages
        
        logger.info("🔄 Context window approaching limit, starting summarization...")
        
        # Separate messages safely
        old_messages, recent_messages = separate_tool_calls(messages)
        
        if not old_messages or len(old_messages) < MIN_MESSAGES_TO_SUMMARIZE:
            logger.info("📏 Not enough old messages to summarize")
            return messages
        
        # Create summary
        summary_message = await create_summary_message(old_messages)
        
        # Combine summary + recent messages
        processed_messages = [summary_message] + recent_messages
        
        # Log savings
        original_tokens = calculate_message_tokens(messages)
        processed_tokens = calculate_message_tokens(processed_messages)
        savings = original_tokens - processed_tokens
        
        logger.info(f"✅ Context window processed: {original_tokens} → {processed_tokens} tokens (saved {savings})")
        
        return processed_messages
        
    except Exception as e:
        logger.error(f"❌ Context window processing failed: {e}")
        # Return original messages on error
        return messages


# Factory function for easy integration
def create_context_processor(model: str):
    """Create a context processor for a specific model"""
    async def processor(messages: List[ModelMessage]) -> List[ModelMessage]:
        return await context_window_processor(messages, model)
    
    return processor


# Test functions
def create_test_messages(count: int) -> List[ModelMessage]:
    """Create test messages for validation"""
    messages = []
    
    for i in range(count):
        if i % 3 == 0:
            messages.append(UserMessage(content=f"User message {i}: " + "test content " * 20))
        elif i % 3 == 1:
            messages.append(SystemMessage(content=f"Assistant response {i}: " + "response content " * 15))
        else:
            # Add some tool calls occasionally
            messages.append(SystemMessage(content=f"System message {i}: coordinate resolved"))
    
    return messages


async def test_context_processor():
    """Test the context window processor with simulated data"""
    logger.info("🧪 Starting context window processor test...")
    
    # Test with small context window (test model)
    test_messages = create_test_messages(30)  # Create 30 messages
    
    logger.info(f"📊 Created {len(test_messages)} test messages")
    original_tokens = calculate_message_tokens(test_messages)
    logger.info(f"📊 Original token count: {original_tokens}")
    
    # Process messages
    processed_messages = await context_window_processor(test_messages, 'test')
    
    processed_tokens = calculate_message_tokens(processed_messages)
    logger.info(f"📊 Processed token count: {processed_tokens}")
    
    # Validate results
    assert len(processed_messages) < len(test_messages), "Should have fewer messages after processing"
    assert processed_tokens < original_tokens, "Should have fewer tokens after processing"
    
    # Check for summary message
    has_summary = any("CONVERSATION SUMMARY" in str(msg.content) for msg in processed_messages if hasattr(msg, 'content'))
    assert has_summary, "Should contain a summary message"
    
    logger.info("✅ Context window processor test passed!")
    
    return {
        'original_messages': len(test_messages),
        'processed_messages': len(processed_messages),
        'original_tokens': original_tokens,
        'processed_tokens': processed_tokens,
        'savings': original_tokens - processed_tokens
    }


if __name__ == "__main__":
    # Run tests
    asyncio.run(test_context_processor())